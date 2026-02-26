'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { localize } from '@/lib/utils';
import type { Category } from '@/db/schema';

interface CategoryCardProps {
    category: Category;
    index?: number;
    locale: string;
}

export function CategoryCard({ category, index = 0, locale }: CategoryCardProps) {
    const t = useTranslations('home');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <Link
                href={`/catalog?categoryId=${category.id}`}
                className="group relative block overflow-hidden rounded-sm"
            >
                <div className="aspect-[3/4] overflow-hidden">
                    <img
                        src={category.imageUrl}
                        alt={localize(category.name, locale)}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-xl font-semibold tracking-wide text-primary-foreground">
                        {localize(category.name, locale)}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-gold-light opacity-0 transition-opacity group-hover:opacity-100">
                        {t('shopNow')}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
