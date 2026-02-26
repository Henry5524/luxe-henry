import { NextResponse } from 'next/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
    try {
        const allBrands = await db.select().from(brands).orderBy(asc(brands.name));
        return NextResponse.json({ brands: allBrands });
    } catch (error) {
        console.error('[brands GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
