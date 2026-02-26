import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { auth } from '@/lib/auth';
import { asc, eq, sql } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function GET() {
    const err = await guard(); if (err) return err;
    const all = await db.select().from(brands).orderBy(sql`${brands.name}->>'en' ASC`);
    return NextResponse.json({ brands: all });
}

export async function POST(request: NextRequest) {
    const err = await guard(); if (err) return err;
    try {
        const body = await request.json();
        const nameForSlug = typeof body.name === 'string' ? body.name : body.name?.en ?? '';
        const id = body.id || generateSlug(nameForSlug);
        const slug = body.slug || generateSlug(nameForSlug);
        const [created] = await db.insert(brands).values({ ...body, id, slug }).returning();
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }
}
