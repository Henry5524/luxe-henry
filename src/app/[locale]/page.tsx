import { db } from '@/db';
import { storeConfig, categories, products } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Navbar } from '@/components/store/Navbar';
import { HeroSection } from '@/components/store/HeroSection';
import { CategoryCard } from '@/components/store/CategoryCard';
import { ProductCard } from '@/components/store/ProductCard';
import { Footer } from '@/components/store/Footer';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { localize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getPageData() {
    const [config] = await db.select().from(storeConfig).limit(1);
    const topCats = await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, null as unknown as string));
    const featuredProducts = await db
        .select()
        .from(products)
        .where(eq(products.featured, true))
        .orderBy(desc(products.createdAt))
        .limit(8);

    return { config, topCats, featuredProducts };
}

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
    const { config, topCats, featuredProducts } = await getPageData();
    const t = await getTranslations('home');

    return (
        <div className="min-h-screen bg-background">
            <Navbar storeConfig={config} topCategories={topCats} />

            <main>
                <HeroSection hero={config} locale={locale} />

                <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
                    <div className="mb-10 text-center">
                        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                            {t('shopByCategory')}
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {t('shopByCategorySub')}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                        {topCats.map((cat, i) => (
                            <CategoryCard key={cat.id} category={cat} index={i} locale={locale} />
                        ))}
                    </div>
                </section>

                {featuredProducts.length > 0 && (
                    <section className="bg-muted/30">
                        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
                            <div className="mb-10 flex items-end justify-between">
                                <div>
                                    <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                                        {t('featured')}
                                    </h2>
                                    <p className="mt-2 text-muted-foreground">{t('featuredSub')}</p>
                                </div>
                                <Link
                                    href="/catalog"
                                    className="hidden text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 md:block"
                                >
                                    {t('viewAll')}
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                                {featuredProducts.map((product, i) => (
                                    <ProductCard key={product.id} product={product} index={i} locale={locale} />
                                ))}
                            </div>
                            <div className="mt-8 text-center md:hidden">
                                <Link
                                    href="/catalog"
                                    className="text-sm font-medium text-primary underline underline-offset-4"
                                >
                                    {t('viewAllProducts')}
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer config={config} locale={locale} />
        </div>
    );
}
