import { db } from '@/db';
import { storeConfig, categories, brands, products } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import { ProductDetailClient } from '@/components/store/ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getPageData(slug: string) {
    const [config] = await db.select().from(storeConfig).limit(1);
    const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!product) return { config, product: null, category: null, ancestors: [], brand: null, related: [], topCats: [] };

    const allCats = await db.select().from(categories);
    const topCats = allCats.filter((c) => !c.parentId);
    const category = allCats.find((c) => c.id === product.categoryId) ?? null;
    const brand = await db.select().from(brands).where(eq(brands.id, product.brandId)).limit(1);

    const ancestors: typeof allCats = [];
    let current = category;
    while (current?.parentId) {
        const parent = allCats.find((c) => c.id === current!.parentId);
        if (parent) { ancestors.unshift(parent); current = parent; } else break;
    }

    const related = await db
        .select()
        .from(products)
        .where(and(eq(products.categoryId, product.categoryId), ne(products.id, product.id)))
        .limit(4);

    return { config, product, category, ancestors, brand: brand[0] ?? null, related, topCats };
}

export default async function ProductDetailPage({
    params: { slug, locale },
}: {
    params: { slug: string; locale: string };
}) {
    const { config, product, category, ancestors, brand, related, topCats } = await getPageData(slug);

    if (!product) notFound();

    return (
        <div className="min-h-screen bg-background">
            <Navbar storeConfig={config} topCategories={topCats ?? []} />
            <ProductDetailClient
                product={product}
                category={category}
                ancestors={ancestors}
                brand={brand}
                related={related}
                currency={config?.currency ?? 'USD'}
                locale={locale}
            />
            <Footer config={config} locale={locale} />
        </div>
    );
}
