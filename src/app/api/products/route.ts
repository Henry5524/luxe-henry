import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { and, eq, inArray, asc, desc, count, sql } from 'drizzle-orm';
import { localize } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const categoryId = searchParams.get('categoryId');
        const brandId = searchParams.get('brandId');
        const sortBy = searchParams.get('sortBy') ?? 'newest';
        const search = searchParams.get('search') ?? '';
        const featured = searchParams.get('featured');
        const locale = searchParams.get('locale') ?? 'en';
        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const limit = parseInt(searchParams.get('limit') ?? '12', 10);
        const offset = (page - 1) * limit;

        const conditions = [];

        if (categoryId) {
            const childCats = await db
                .select({ id: categories.id })
                .from(categories)
                .where(eq(categories.parentId, categoryId));
            const childIds = childCats.map((c) => c.id);
            const catIds = [categoryId, ...childIds];
            conditions.push(inArray(products.categoryId, catIds));
        }

        if (brandId) {
            conditions.push(eq(products.brandId, brandId));
        }

        if (search) {
            conditions.push(
                sql`(${products.name}->>'en' ILIKE ${'%' + search + '%'} OR ${products.name}->>'uz' ILIKE ${'%' + search + '%'} OR ${products.name}->>'ru' ILIKE ${'%' + search + '%'} OR ${products.description}->>'en' ILIKE ${'%' + search + '%'})`,
            );
        }

        if (featured === 'true') {
            conditions.push(eq(products.featured, true));
        }

        let orderBy;
        switch (sortBy) {
            case 'price-asc':
                orderBy = asc(products.price);
                break;
            case 'price-desc':
                orderBy = desc(products.price);
                break;
            case 'name':
                orderBy = sql`${products.name}->>'en' ASC`;
                break;
            case 'newest':
            default:
                orderBy = desc(products.createdAt);
                break;
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
            .select({ count: count() })
            .from(products)
            .where(whereClause);

        const totalCount = totalResult.count;
        const totalPages = Math.ceil(totalCount / limit);

        const rows = await db
            .select()
            .from(products)
            .where(whereClause)
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        const localizedProducts = rows.map((p) => ({
            ...p,
            name: localize(p.name, locale),
            description: localize(p.description, locale),
            material: localize(p.material, locale),
        }));

        return NextResponse.json({
            products: localizedProducts,
            page,
            limit,
            totalCount,
            totalPages,
        });
    } catch (error) {
        console.error('[products GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
