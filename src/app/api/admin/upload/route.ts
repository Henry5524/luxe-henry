import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

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

        // Sanitize and save filename
        const ext = file.name.split('.').pop() ?? 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error('[upload POST]', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
