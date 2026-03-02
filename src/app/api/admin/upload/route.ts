import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
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

        if (isGcpUploadEnabled()) {
            const url = await uploadToGcp(buffer, filename, file.type);
            if (url) {
                return NextResponse.json({ url });
            }
        }

        // Fallback: local disk
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error('[upload POST]', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

/** Delete file from GCP bucket by URL. No-op if GCP not used or URL not from our bucket. */
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
        await deleteFromGcp(url);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[upload DELETE]', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
