'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { localize, getImageUrl } from '@/lib/utils';
import type { StoreConfig } from '@/db/schema';

interface HeroSectionProps {
    hero: StoreConfig | undefined;
    locale: string;
}

export function HeroSection({ hero, locale }: HeroSectionProps) {
    const t = useTranslations('home');

    if (!hero?.heroEnabled) return null;

    return (
        <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-gradient-hero">
            <div className="absolute inset-0">
                <img
                    src={getImageUrl(hero.heroImageUrl)}
                    alt="Hero"
                    className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/60 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="max-w-2xl">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-gold-light"
                    >
                        {t('newCollection')}
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="mb-6 font-display text-5xl font-bold leading-tight text-primary-foreground md:text-7xl"
                    >
                        {localize(hero.heroTitle, locale)}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="mb-10 max-w-lg text-lg leading-relaxed text-primary-foreground/70"
                    >
                        {localize(hero.heroSubtitle, locale)}
                    </motion.p>
                    {localize(hero.heroCtaText, locale) && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                        >
                            <Link
                                href={hero.heroCtaLink as any}
                                className="inline-block bg-gradient-gold px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-charcoal transition-all hover:shadow-luxury hover:brightness-110"
                            >
                                {localize(hero.heroCtaText, locale)}
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
