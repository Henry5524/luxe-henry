/**
 * GCP Cloud Storage helpers: upload, delete, and public URL.
 * Auth: only via GCP keyfile.
 * - GOOGLE_APPLICATION_CREDENTIALS — path to service account JSON key file
 * - or GCP_SERVICE_ACCOUNT_KEY — full JSON key string (or base64)
 */

import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCP_BUCKET_NAME;
const projectId = process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_PROJECT_ID;

function getStorageOptions(): ConstructorParameters<typeof Storage>[0] {
    // Option 1: Path to key file (GOOGLE_APPLICATION_CREDENTIALS)
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyFilePath) {
        return {
            keyFilename: keyFilePath,
            projectId: projectId ?? undefined,
        };
    }

    // Option 2: Key as JSON string or base64 in env (GCP_SERVICE_ACCOUNT_KEY)
    const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (keyJson) {
        try {
            const parsed = keyJson.trim().startsWith('{')
                ? JSON.parse(keyJson)
                : JSON.parse(Buffer.from(keyJson, 'base64').toString('utf-8'));
            if (parsed.client_email && parsed.private_key) {
                return {
                    credentials: {
                        client_email: parsed.client_email,
                        private_key: parsed.private_key.replace(/\\n/g, '\n'),
                    },
                    projectId: (parsed.project_id || projectId) ?? '',
                };
            }
        } catch (e) {
            console.error('[gcp-storage] Invalid GCP_SERVICE_ACCOUNT_KEY:', (e as Error).message);
        }
    }

    // No keyfile configured — ADC may still work if gcloud is set up
    return { projectId: projectId ?? undefined };
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
 * Public URL for an object. Bucket must be public or use signed URLs for private buckets.
 */
export function getPublicUrl(objectName: string): string {
    if (!bucketName) return '';
    const base = `https://storage.googleapis.com/${bucketName}`;
    const path = objectName.startsWith('/') ? objectName.slice(1) : objectName;
    return `${base}/${path}`;
}

/** Default expiry for signed URLs (1 hour). */
const SIGNED_URL_EXPIRY_MINUTES = 60;

/**
 * Get a signed read URL for an object. Use when the bucket is private.
 * @param pathOrUrl - Object path (e.g. "uploads/xxx.png") or full GCP URL
 * @returns Signed URL or null if not configured / invalid
 */
export async function getSignedUrl(pathOrUrl: string): Promise<string | null> {
    const bucket = getBucket();
    if (!bucket) return null;

    let objectName = pathOrUrl;
    if (pathOrUrl.startsWith('http')) {
        try {
            const url = new URL(pathOrUrl);
            const pathname = url.pathname.replace(/^\/+/, '');
            const prefix = `${bucketName}/`;
            if (!pathname.startsWith(prefix)) return null;
            objectName = pathname.slice(prefix.length);
        } catch {
            return null;
        }
    } else if (objectName.startsWith('/')) {
        objectName = objectName.replace(/^\/+/, '');
    }
    if (!objectName) return null;

    try {
        const [signedUrl] = await bucket.file(objectName).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
        });
        return signedUrl;
    } catch (err) {
        console.error('[gcp-storage] getSignedUrl failed:', err);
        return null;
    }
}

/** Whether the given URL is from our GCP bucket (for using signed URL proxy). */
export function isGcpBucketUrl(url: string): boolean {
    if (!bucketName || !url?.startsWith('http')) return false;
    try {
        const u = new URL(url);
        return u.hostname === 'storage.googleapis.com' && u.pathname.startsWith(`/${bucketName}/`);
    } catch {
        return false;
    }
}

/** Whether GCP upload is enabled (bucket name set). */
export function isGcpUploadEnabled(): boolean {
    return Boolean(bucketName);
}
