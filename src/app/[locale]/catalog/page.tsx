import { db } from '@/db';
import { storeConfig, categories, brands } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import { CatalogClient } from '@/components/store/CatalogClient';

export const dynamic = 'force-dynamic';

async function getPageData() {
    const [config] = await db.select().from(storeConfig).limit(1);
    const allCats = await db.select().from(categories).orderBy(categories.sortOrder);
    const allBrands = await db.select().from(brands).orderBy(sql`${brands.name}->>'en' ASC`);
    return { config, allCats, allBrands };
}

export default async function CatalogPage({ params: { locale } }: { params: { locale: string } }) {
    const { config, allCats, allBrands } = await getPageData();

    return (
        <div className="min-h-screen bg-background">
            <Navbar storeConfig={config} topCategories={allCats.filter((c) => !c.parentId)} />
            <CatalogClient
                categories={allCats}
                brands={allBrands}
                currency={config?.currency ?? 'USD'}
                locale={locale}
            />
            <Footer config={config} locale={locale} />
        </div>
    );
}
