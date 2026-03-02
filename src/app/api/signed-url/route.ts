import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl, isGcpBucketUrl } from '@/lib/gcp-storage';

/**
 * GET /api/signed-url?url=...
 * Redirects to a signed GCP Storage URL so private bucket objects can be displayed (e.g. img src).
 * Only allows URLs from the configured GCP bucket.
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url || !url.trim()) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const decoded = decodeURIComponent(url.trim());
    if (!isGcpBucketUrl(decoded)) {
        return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    const signed = await getSignedUrl(decoded);
    if (!signed) {
        return NextResponse.json({ error: 'Could not generate signed url' }, { status: 500 });
    }

    return NextResponse.redirect(signed, 302);
}
