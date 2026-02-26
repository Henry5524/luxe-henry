import { db } from '@/db';
import { storeConfig, products, categories, brands } from '@/db/schema';
import { count } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { localize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ params: { locale } }: { params: { locale: string } }) {
    const [productCount] = await db.select({ count: count() }).from(products);
    const [categoryCount] = await db.select({ count: count() }).from(categories);
    const [brandCount] = await db.select({ count: count() }).from(brands);
    const [config] = await db.select().from(storeConfig).limit(1);
    const t = await getTranslations('admin');

    const stats = [
        { label: t('products'), value: productCount.count, href: '/admin/products' as const, color: 'from-gold/20 to-gold/5' },
        { label: t('categories'), value: categoryCount.count, href: '/admin/categories' as const, color: 'from-primary/20 to-primary/5' },
        { label: t('brands'), value: brandCount.count, href: '/admin/brands' as const, color: 'from-accent/20 to-accent/5' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">{t('dashboard')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('welcomeMessage', { storeName: localize(config?.storeName, locale) || 'Luxe' })}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className={`rounded-lg border border-border bg-gradient-to-br ${stat.color} p-6 transition-all hover:shadow-luxury`}
                    >
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="mt-2 font-display text-4xl font-bold text-foreground">{stat.value}</p>
                    </Link>
                ))}
            </div>

            <div className="mt-10 rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('quickActions')}</h2>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/products/new" className="inline-block bg-gradient-gold px-5 py-2 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110">
                        + {t('addProduct')}
                    </Link>
                    <Link href="/admin/categories" className="inline-block rounded-sm border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">
                        {t('manageCategories')}
                    </Link>
                    <Link href="/admin/store-config" className="inline-block rounded-sm border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">
                        {t('storeSettings')}
                    </Link>
                    <a href="/" target="_blank" className="inline-block rounded-sm border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">
                        {t('viewStorefront')} ↗
                    </a>
                </div>
            </div>
        </div>
    );
}
