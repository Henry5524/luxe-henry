import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { auth } from '@/lib/auth';
import { desc, sql } from 'drizzle-orm';
import { generateSlug, generateId } from '@/lib/utils';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function GET(request: NextRequest) {
    const err = await guard(); if (err) return err;
    const search = request.nextUrl.searchParams.get('search') ?? '';
    const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
    const offset = (page - 1) * limit;

    const whereClause = search
        ? sql`(${products.name}->>'en' ILIKE ${'%' + search + '%'} OR ${products.description}->>'en' ILIKE ${'%' + search + '%'} OR ${products.slug} ILIKE ${'%' + search + '%'})`
        : undefined;

    const rows = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);

    return NextResponse.json({ products: rows, page, limit });
}

export async function POST(request: NextRequest) {
    const err = await guard(); if (err) return err;
    try {
        const body = await request.json();
        const id = body.id || generateId();
        const nameForSlug = typeof body.name === 'string' ? body.name : body.name?.en ?? '';
        const slug = body.slug || generateSlug(nameForSlug);
        const [created] = await db.insert(products).values({ ...body, id, slug }).returning();
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('[admin/products POST]', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
