import { db } from '@/db';
import { storeConfig } from '@/db/schema';
import { StoreConfigForm } from '@/components/admin/StoreConfigForm';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function StoreConfigPage() {
    const [config] = await db.select().from(storeConfig).limit(1);
    const t = await getTranslations('admin');

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">{t('storeSettings')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('storeSettingsSub')}</p>
            </div>
            <StoreConfigForm config={config} />
        </div>
    );
}
