/**
 * GCP Cloud Storage helpers: upload, delete, and public URL.
 * Requires: GCP_BUCKET_NAME and GOOGLE_APPLICATION_CREDENTIALS (or default ADC).
 */

import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCP_BUCKET_NAME;
const storage = bucketName ? new Storage() : null;

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
