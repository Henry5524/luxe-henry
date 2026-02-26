import { db } from '@/db';
import { brands } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { BrandsClient } from '@/components/admin/BrandsClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
    const allBrands = await db.select().from(brands).orderBy(sql`${brands.name}->>'en' ASC`);
    const t = await getTranslations('admin');

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">{t('brands')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('brandsSub')}</p>
            </div>
            <BrandsClient initialBrands={allBrands} />
        </div>
    );
}
