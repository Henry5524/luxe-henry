import { db } from '@/db';
import { categories, brands } from '@/db/schema';
import { asc, sql } from 'drizzle-orm';
import { ProductForm } from '@/components/admin/ProductForm';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
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
                <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{t('newProduct')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('newProductSub')}</p>
            </div>
            <ProductForm categories={allCategories} brands={allBrands} />
        </div>
    );
}
