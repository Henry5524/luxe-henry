import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, ne, and } from 'drizzle-orm';

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
            return NextResponse.json({ related: [] });
        }

        const related = await db
            .select()
            .from(products)
            .where(
                and(
                    eq(products.categoryId, product.categoryId),
                    ne(products.id, product.id)
                )
            )
            .limit(4);

        return NextResponse.json({ related });
    } catch (error) {
        console.error('[related GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
