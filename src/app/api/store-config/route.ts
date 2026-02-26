import { NextResponse } from 'next/server';
import { db } from '@/db';
import { storeConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const [config] = await db.select().from(storeConfig).limit(1);
        if (!config) {
            return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }
        return NextResponse.json(config);
    } catch (error) {
        console.error('[store-config GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
