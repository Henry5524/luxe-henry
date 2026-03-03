import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, brands, products } from '@/db/schema';
import { auth } from '@/lib/auth';
import { asc, desc, sql } from 'drizzle-orm';
import {
    flattenCategoriesForCSV,
    flattenBrandsForCSV,
    flattenProductsForCSV,
    entitiesToCSV,
    type EntityType,
} from '@/lib/import-utils';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function GET(request: NextRequest) {
    const err = await guard();
    if (err) return err;

    const type = request.nextUrl.searchParams.get('type') as EntityType | null;
    const format = request.nextUrl.searchParams.get('format') ?? 'csv';

    if (!type || !['categories', 'brands', 'products'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    let rows: Record<string, unknown>[];

    if (type === 'categories') {
        rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    } else if (type === 'brands') {
        rows = await db.select().from(brands).orderBy(sql`${brands.name}->>'en' ASC`);
    } else {
        rows = await db.select().from(products).orderBy(desc(products.createdAt));
    }

    if (format === 'json') {
        return new NextResponse(JSON.stringify(rows, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="${type}-export.json"`,
            },
        });
    }

    const flattened =
        type === 'categories' ? flattenCategoriesForCSV(rows) :
        type === 'brands' ? flattenBrandsForCSV(rows) :
        flattenProductsForCSV(rows);

    const csv = entitiesToCSV(flattened);
    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${type}-export.csv"`,
        },
    });
}
