/**
 * GCP Cloud Storage helpers: upload, delete, and public URL.
 * Requires: GCP_BUCKET_NAME and one of:
 * - OIDC (Vercel): GCP_PROJECT_NUMBER, pool, provider, service account (GCP_* or GOOGLE_* env names)
 * - GCP_SERVICE_ACCOUNT_KEY: JSON string or base64 (when keys are allowed)
 * - GCP_PROJECT_ID + GCP_SERVICE_ACCOUNT_EMAIL + GCP_PRIVATE_KEY
 * - GOOGLE_APPLICATION_CREDENTIALS: path to key file (local dev only)
 */

import { Storage } from '@google-cloud/storage';
import { getVercelOidcToken } from '@vercel/oidc';

const bucketName = process.env.GCP_BUCKET_NAME;

// Support both GCP_* and GOOGLE_* env names (Vercel OIDC integration may use either)
const projectId = process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_PROJECT_ID;
const projectNumber = process.env.GCP_PROJECT_NUMBER ?? process.env.GOOGLE_PROJECT_NUMBER;
const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID ?? process.env.GOOGLE_WORKLOAD_IDENTITY_POOL;
const providerId =
    process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID ?? process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER;
const serviceAccountEmail =
    process.env.GCP_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_SERVICE_ACCOUNT;

function getStorageOptions(): ConstructorParameters<typeof Storage>[0] {
    // Option 1: OIDC / Workload Identity (Vercel integration, no keys)
    if (projectNumber && poolId && providerId && serviceAccountEmail) {
        try {
            // Pass external_account config so Storage uses it via Google Auth; no key file needed.
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
            console.error('[gcp-storage] OIDC auth setup failed:', (e as Error).message);
        }
    }

    // Option 2: Full JSON key (Vercel/serverless when keys are allowed)
    const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (keyJson) {
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
                    projectId: parsed.project_id || projectId || '',
                };
            }
        } catch (e) {
            console.error('[gcp-storage] Invalid GCP_SERVICE_ACCOUNT_KEY:', (e as Error).message);
        }
    }

    // Option 3: Separate vars (email + private key)
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

    // Option 4: Application Default Credentials (local dev: gcloud or GOOGLE_APPLICATION_CREDENTIALS file)
    return {};
}

const storageOptions = getStorageOptions();
const storage = bucketName ? new Storage(storageOptions) : null;

/** Prefix for object names in the bucket (e.g. "uploads/") */
const OBJECT_PREFIX = 'uploads/';

function getBucket() {
    if (!storage || !bucketName) return null;
    return storage.bucket(bucketName);
}

/**
 * Upload buffer to GCP bucket. Returns public URL or null if GCP not configured.
 */
export async function uploadToGcp(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<string | null> {
    const bucket = getBucket();
    if (!bucket) return null;

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `${OBJECT_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}`;
    const file = bucket.file(objectName);

    await file.save(buffer, {
        metadata: { contentType },
        resumable: false,
    });

    return getPublicUrl(objectName);
}

/**
 * Delete object from GCP bucket by path (object name or full URL).
 * Path can be: "uploads/123-abc.jpg" or "https://storage.googleapis.com/bucket/uploads/123-abc.jpg"
 * Local paths like "/uploads/..." are ignored (not stored in GCP).
 */
export async function deleteFromGcp(pathOrUrl: string): Promise<boolean> {
    const bucket = getBucket();
    if (!bucket) return false;
    if (!pathOrUrl.startsWith('http') && pathOrUrl.startsWith('/uploads/')) return false;

    let objectName = pathOrUrl;
    if (pathOrUrl.startsWith('http')) {
        try {
            const url = new URL(pathOrUrl);
            const pathname = url.pathname.replace(/^\/+/, '');
            const prefix = `${bucketName}/`;
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
        await bucket.file(objectName).delete();
        return true;
    } catch (err) {
        console.error('[gcp-storage] delete failed:', err);
        return false;
    }
}

/**
 * Public URL for an object. Bucket must be public or use signed URLs later.
 */
export function getPublicUrl(objectName: string): string {
    if (!bucketName) return '';
    const base = `https://storage.googleapis.com/${bucketName}`;
    const path = objectName.startsWith('/') ? objectName.slice(1) : objectName;
    return `${base}/${path}`;
}

/** Whether GCP upload is enabled (bucket name set). */
export function isGcpUploadEnabled(): boolean {
    return Boolean(bucketName);
}
