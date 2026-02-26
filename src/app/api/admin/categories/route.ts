import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { auth } from '@/lib/auth';
import { asc, eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function GET() {
    const err = await guard(); if (err) return err;
    const all = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return NextResponse.json({ categories: all });
}

export async function POST(request: NextRequest) {
    const err = await guard(); if (err) return err;
    try {
        const body = await request.json();
        const nameForSlug = typeof body.name === 'string' ? body.name : body.name?.en ?? '';
        const id = body.id || generateSlug(nameForSlug);
        const slug = body.slug || generateSlug(nameForSlug);
        const [created] = await db.insert(categories).values({ ...body, id, slug }).returning();
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('[admin/categories POST]', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
