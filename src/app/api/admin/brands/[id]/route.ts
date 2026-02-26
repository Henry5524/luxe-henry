import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    const body = await request.json();
    const [updated] = await db.update(brands).set(body).where(eq(brands.id, params.id)).returning();
    return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    await db.delete(brands).where(eq(brands.id, params.id));
    return NextResponse.json({ success: true });
}
