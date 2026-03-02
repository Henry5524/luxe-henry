import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/gcp-storage';

export const runtime = 'nodejs';

/**
 * GET /api/signed-url?object=uploads/xxx.png
 * Pass object path (not full URL). Returns JSON { url: signedUrl } for use in img src or redirect.
 * For <img src="/api/signed-url?object=..."> we redirect so the image loads.
 */
export async function GET(request: NextRequest) {
    const object = request.nextUrl.searchParams.get('object');
    if (!object || !object.trim()) {
        return NextResponse.json({ error: 'Missing object=' }, { status: 400 });
    }

    const path = decodeURIComponent(object.trim());
    if (path.startsWith('/')) {
        return NextResponse.json({ error: 'Use object path without leading slash (e.g. uploads/xxx.png)' }, { status: 400 });
    }

    const signed = await getSignedUrl(path);
    if (!signed) {
        return NextResponse.json({ error: 'Could not generate signed url' }, { status: 500 });
    }

    const wantsRedirect = request.nextUrl.searchParams.get('redirect') === '1';
    if (wantsRedirect) {
        return NextResponse.redirect(signed, 302);
    }
    return NextResponse.json({ url: signed });
}
