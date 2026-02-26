import { db } from '@/db';
import { products, categories, brands } from '@/db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { localize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
    params: { id, locale },
}: {
    params: { id: string; locale: string };
}) {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) notFound();

    const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    const allBrands = await db.select().from(brands).orderBy(sql`${brands.name}->>'en' ASC`);
    const t = await getTranslations('admin');

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/products"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    &larr; {t('backToProducts')}
                </Link>
                <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
                    {t('editProduct')}: {localize(product.name, 'en')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('editProductSub')}</p>
            </div>
            <ProductForm product={product} categories={allCategories} brands={allBrands} />
        </div>
    );
}
