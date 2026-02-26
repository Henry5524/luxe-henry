import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    try {
        const body = await request.json();
        const [updated] = await db
            .update(categories)
            .set(body)
            .where(eq(categories.id, params.id))
            .returning();
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    try {
        await db.delete(categories).where(eq(categories.id, params.id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
