import { db } from '@/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { CategoriesClient } from '@/components/admin/CategoriesClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
    const allCats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    const t = await getTranslations('admin');

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">{t('categories')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('categoriesSub')}</p>
            </div>
            <CategoriesClient initialCategories={allCats} />
        </div>
    );
}
