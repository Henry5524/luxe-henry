'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { localize } from '@/lib/utils';
import type { StoreConfig } from '@/db/schema';

interface FooterProps {
    config: StoreConfig | undefined;
    locale: string;
}

export function Footer({ config, locale }: FooterProps) {
    const t = useTranslations('footer');

    return (
        <footer className="border-t border-border bg-muted/50">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Link href="/" className="font-display text-xl font-bold tracking-widest text-foreground">
                        {config?.storeName ?? 'Luxe'}
                    </Link>
                    <p className="max-w-md text-sm text-muted-foreground">
                        {localize(config?.footerText, locale) || 'Premium products crafted with passion and precision.'}
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} {config?.storeName ?? 'Luxe'}. {t('allRightsReserved')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
