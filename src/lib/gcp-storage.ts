/**
 * GCP Cloud Storage: upload, delete, public URL.
 *
 * Env vars:
 *   GCP_BUCKET_NAME          — bucket name
 *   GCP_SERVICE_ACCOUNT_KEY  — service account JSON (string or base64)
 */

import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCP_BUCKET_NAME;
const OBJECT_PREFIX = 'uploads/';

type StorageOptions = ConstructorParameters<typeof Storage>[0];

function buildStorageOptions(): StorageOptions {
    const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (!keyJson) return {};

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
                projectId: parsed.project_id || undefined,
            };
        }
    } catch (e) {
        console.error('[gcp-storage] Invalid GCP_SERVICE_ACCOUNT_KEY:', (e as Error).message);
    }

    return {};
}

let storageInstance: Storage | null = null;

function getStorage(): Storage | null {
    if (!BUCKET_NAME) return null;
    if (storageInstance) return storageInstance;

    const opts = buildStorageOptions();
    const authMethod = opts?.credentials ? 'service-account-key' : 'ADC';
    console.log(`[gcp-storage] Initialised with auth="${authMethod}", bucket="${BUCKET_NAME}"`);
    storageInstance = new Storage(opts);
    return storageInstance;
}

/**
 * Upload buffer to GCP. Returns public URL or throws on failure.
 */
export async function uploadToGcp(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<string | null> {
    const storage = getStorage();
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
                `[gcp-storage] 403 Forbidden — service account lacks permission on bucket "${BUCKET_NAME}".\n` +
                `  → Fix: grant "Storage Object Admin" role in GCP Console.`
            );
        }
        throw err;
    }

    return getPublicUrl(objectName);
}

/**
 * Delete object by path or full URL.
 */
export async function deleteFromGcp(pathOrUrl: string): Promise<boolean> {
    const storage = getStorage();
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
 * Public URL for object.
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
