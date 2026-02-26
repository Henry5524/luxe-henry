import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { storeConfig } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function guard() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

export async function GET() {
    const err = await guard(); if (err) return err;
    const [config] = await db.select().from(storeConfig).limit(1);
    return NextResponse.json(config ?? {});
}

export async function PUT(request: NextRequest) {
    const err = await guard(); if (err) return err;
    try {
        const body = await request.json();
        const [current] = await db.select().from(storeConfig).limit(1);
        if (!current) {
            const [created] = await db.insert(storeConfig).values(body).returning();
            return NextResponse.json(created);
        }
        const [updated] = await db
            .update(storeConfig)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(storeConfig.id, current.id))
            .returning();
        return NextResponse.json(updated);
    } catch (error) {
        console.error('[admin store-config PUT]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
