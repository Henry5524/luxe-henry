import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';
import { uploadToGcp, deleteFromGcp, isGcpUploadEnabled } from '@/lib/gcp-storage';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const maxSize = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop() ?? 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        // --- Try GCP upload first ---
        if (isGcpUploadEnabled()) {
            try {
                const url = await uploadToGcp(buffer, filename, file.type);
                if (url) return NextResponse.json({ url });
            } catch (gcpErr: unknown) {
                const code = (gcpErr as { code?: number }).code;
                console.error(
                    `[upload POST] GCP upload failed (code=${code ?? 'unknown'}), falling back to local storage.`,
                    code !== 403 ? gcpErr : '' // 403 details already logged by gcp-storage
                );
                // fall through to local storage ↓
            }
        }

        // --- Fallback: local disk ---
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error('[upload POST] Unexpected error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

/** Delete file from GCP bucket or local disk by URL. */
export async function DELETE(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const url = typeof body?.url === 'string' ? body.url.trim() : '';
        if (!url) {
            return NextResponse.json({ error: 'Missing url' }, { status: 400 });
        }

        // GCP: delete from bucket if URL is GCS or object path
        const deletedFromGcp = await deleteFromGcp(url);

        // Local: delete from public/uploads if path is /uploads/...
        if (!deletedFromGcp && url.startsWith('/uploads/')) {
            const filename = url.replace(/^\/uploads\/?/, '');
            if (filename && !filename.includes('..')) {
                const filePath = join(process.cwd(), 'public', 'uploads', filename);
                await unlink(filePath).catch(() => { });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[upload DELETE]', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
