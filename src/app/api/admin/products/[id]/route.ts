import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    const [product] = await db.select().from(products).where(eq(products.id, params.id)).limit(1);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    try {
        const body = await request.json();
        const [updated] = await db
            .update(products)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(products.id, params.id))
            .returning();
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const err = await guard(); if (err) return err;
    await db.delete(products).where(eq(products.id, params.id));
    return NextResponse.json({ success: true });
}
