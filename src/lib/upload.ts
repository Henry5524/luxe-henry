/**
 * Client helper: delete an uploaded image from storage (GCP or local).
 * Call when user removes an image or replaces it with a new upload.
 */
export async function deleteUploadedImage(url: string): Promise<void> {
    if (!url || url.startsWith('data:')) return;
    try {
        await fetch('/api/admin/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
    } catch {
        // ignore
    }
}
