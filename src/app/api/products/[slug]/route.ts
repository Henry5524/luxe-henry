import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    _request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const [product] = await db
            .select()
            .from(products)
            .where(eq(products.slug, params.slug))
            .limit(1);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('[product slug GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
