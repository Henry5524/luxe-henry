import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTemplate, type EntityType } from '@/lib/import-utils';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function GET(request: NextRequest) {
    const err = await guard();
    if (err) return err;

    const type = request.nextUrl.searchParams.get('type') as EntityType | null;
    if (!type || !['categories', 'brands', 'products'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const csv = getTemplate(type);
    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${type}-template.csv"`,
        },
    });
}
