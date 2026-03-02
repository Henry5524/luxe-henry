/**
 * GCP Cloud Storage: upload, delete, public URL.
 *
 * Auth (in order of precedence):
 * 1. GCP_SERVICE_ACCOUNT_KEY — JSON string or base64 (local, Vercel with key)
 * 2. OIDC — GCP_PROJECT_NUMBER + pool + provider + service account (Vercel Workload Identity)
 * 3. GCP_PROJECT_ID + GCP_SERVICE_ACCOUNT_EMAIL + GCP_PRIVATE_KEY
 * 4. Application Default Credentials (gcloud auth application-default login)
 */

import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCP_BUCKET_NAME;
const OBJECT_PREFIX = 'uploads/';

// Env aliases (GCP_* and GOOGLE_* for Vercel OIDC)
const projectId = process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_PROJECT_ID;
const projectNumber = process.env.GCP_PROJECT_NUMBER ?? process.env.GOOGLE_PROJECT_NUMBER;
const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID ?? process.env.GOOGLE_WORKLOAD_IDENTITY_POOL;
const providerId =
    process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID ?? process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER;
const serviceAccountEmail =
    process.env.GCP_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_SERVICE_ACCOUNT;

type StorageOptions = ConstructorParameters<typeof Storage>[0];

function parseServiceAccountKey(keyJson: string): StorageOptions | null {
    try {
        const parsed =
            keyJson.trim().startsWith('{')
                ? JSON.parse(keyJson)
                : JSON.parse(Buffer.from(keyJson, 'base64').toString('utf-8'));
        if (parsed.client_email && parsed.private_key) {
            return {
                credentials: {
                    client_email: parsed.client_email,
                    private_key: parsed.private_key.replace(/\\n/g, '\n'),
                },
                projectId: parsed.project_id || projectId || undefined,
            };
        }
    } catch (e) {
        console.error('[gcp-storage] Invalid GCP_SERVICE_ACCOUNT_KEY:', (e as Error).message);
    }
    return null;
}

async function getOidcCredentials(): Promise<StorageOptions | null> {
    if (!projectNumber || !poolId || !providerId || !serviceAccountEmail) return null;
    try {
        const { getVercelOidcToken } = await import('@vercel/oidc');
        return {
            credentials: {
                type: 'external_account',
                audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
                subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
                token_url: 'https://sts.googleapis.com/v1/token',
                service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
                subject_token_supplier: {
                    getSubjectToken: () => getVercelOidcToken(),
                },
            },
            projectId: projectId ?? undefined,
        };
    } catch (e) {
        console.error('[gcp-storage] OIDC setup failed:', (e as Error).message);
        return null;
    }
}

function getStorageOptionsSync(): StorageOptions {
    // 1. JSON key (most common for local + Vercel with key)
    const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (keyJson) {
        const opts = parseServiceAccountKey(keyJson);
        if (opts) return opts;
    }

    // 2. Separate vars
    const email = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY;
    if (email && privateKey && projectId) {
        return {
            credentials: {
                client_email: email,
                private_key: privateKey.replace(/\\n/g, '\n'),
            },
            projectId,
        };
    }

    // 3. ADC (gcloud auth application-default login or GOOGLE_APPLICATION_CREDENTIALS)
    return {};
}

let storageInstance: Storage | null = null;
let storageInitPromise: Promise<Storage | null> | null = null;

async function getStorage(): Promise<Storage | null> {
    if (!BUCKET_NAME) return null;

    if (storageInstance) return storageInstance;

    if (storageInitPromise) return storageInitPromise;

    storageInitPromise = (async () => {
        // Try OIDC first (async)
        const oidcOpts = await getOidcCredentials();
        const opts = oidcOpts ?? getStorageOptionsSync() ?? {};
        const authMethod = oidcOpts ? 'OIDC' : (opts.credentials ? 'service-account-key' : 'ADC');
        console.log(`[gcp-storage] Initialised with auth="${authMethod}", bucket="${BUCKET_NAME}"`);
        storageInstance = new Storage(opts);
        return storageInstance;
    })();

    return storageInitPromise;
}

/**
 * Upload buffer to GCP. Returns public URL or throws on failure.
 * The caller (upload route) is responsible for catching and falling back.
 */
export async function uploadToGcp(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<string | null> {
    const storage = await getStorage();
    if (!storage) return null;

    const bucket = storage.bucket(BUCKET_NAME!);
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `${OBJECT_PREFIX}${safeName}`;
    const file = bucket.file(objectName);

    try {
        await file.save(buffer, {
            metadata: { contentType },
            resumable: false,
        });
    } catch (err: unknown) {
        const code = (err as { code?: number }).code;
        if (code === 403) {
            console.error(
                `[gcp-storage] 403 Forbidden — the service account does not have permission on bucket "${BUCKET_NAME}".\n` +
                `  → Fix in GCP Console: grant "Storage Object Admin" role to the service account on this bucket.`
            );
        }
        throw err; // re-throw so the upload route can catch and fall back to local
    }

    return getPublicUrl(objectName);
}

/**
 * Delete object by path or full URL.
 * - "uploads/123.jpg" or "https://storage.googleapis.com/bucket/uploads/123.jpg"
 * - Local "/uploads/..." returns false (handled by upload API).
 */
export async function deleteFromGcp(pathOrUrl: string): Promise<boolean> {
    const storage = await getStorage();
    if (!storage) return false;
    if (!pathOrUrl.startsWith('http') && pathOrUrl.startsWith('/uploads/')) return false;

    let objectName = pathOrUrl;
    if (pathOrUrl.startsWith('http')) {
        try {
            const url = new URL(pathOrUrl);
            const pathname = url.pathname.replace(/^\/+/, '');
            const prefix = `${BUCKET_NAME}/`;
            if (!pathname.startsWith(prefix)) return false;
            objectName = pathname.slice(prefix.length);
        } catch {
            return false;
        }
    } else if (objectName.startsWith('/')) {
        objectName = objectName.replace(/^\/+/, '');
    }

    if (!objectName) return false;

    try {
        const bucket = storage.bucket(BUCKET_NAME!);
        await bucket.file(objectName).delete();
        return true;
    } catch (err) {
        console.error('[gcp-storage] delete failed:', err);
        return false;
    }
}

/**
 * Public URL for object. Bucket must be public or use signed URLs.
 */
export function getPublicUrl(objectName: string): string {
    if (!BUCKET_NAME) return '';
    const base = `https://storage.googleapis.com/${BUCKET_NAME}`;
    const path = objectName.startsWith('/') ? objectName.slice(1) : objectName;
    return `${base}/${path}`;
}

/** Whether GCP upload is enabled (bucket name set). */
export function isGcpUploadEnabled(): boolean {
    return Boolean(BUCKET_NAME);
}
