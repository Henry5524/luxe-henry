import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations('notFound');

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center">
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-primary">404</p>
                <h1 className="font-display text-4xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-4 text-muted-foreground">{t('description')}</p>
                <Link
                    href="/"
                    className="mt-8 inline-block bg-gradient-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-charcoal transition-all hover:brightness-110"
                >
                    {t('goHome')}
                </Link>
            </div>
        </div>
    );
}
