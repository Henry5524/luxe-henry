import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { ProductsClient } from '@/components/admin/ProductsClient';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    const t = await getTranslations('admin');

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">{t('products')}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{allProducts.length} {t('totalProducts')}</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="inline-block bg-gradient-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110"
                >
                    + {t('newProduct')}
                </Link>
            </div>
            <ProductsClient initialProducts={allProducts} />
        </div>
    );
}
