'use client';

import { X } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatPrice, localize, getImageUrl } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import type { Product } from '@/db/schema';

interface FavoritesModalProps {
    open: boolean;
    onClose: () => void;
}

export function FavoritesModal({ open, onClose }: FavoritesModalProps) {
    const { favorites, toggleFavorite } = useFavorites();
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
    const t = useTranslations('favorites');
    const locale = useLocale();

    useEffect(() => {
        if (!open || favorites.length === 0) {
            setFavoriteProducts([]);
            return;
        }

        const fetchFavorites = async () => {
            try {
                const res = await fetch(`/api/products?limit=200&locale=${locale}`);
                const data = await res.json();
                const favSet = new Set(favorites);
                setFavoriteProducts((data.products ?? []).filter((p: Product) => favSet.has(p.id)));
            } catch {
                setFavoriteProducts([]);
            }
        };

        fetchFavorites();
    }, [open, favorites, locale]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md border-l border-border bg-background"
                    >
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
                                <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {favorites.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <p className="text-muted-foreground">{t('empty')}</p>
                                        <Link
                                            href="/catalog"
                                            onClick={onClose}
                                            className="mt-4 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                                        >
                                            {t('browse')}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {favoriteProducts.map((product) => {
                                            const price = parseFloat(product.price as unknown as string);
                                            const name = localize(product.name, locale);
                                            return (
                                                <div key={product.id} className="flex gap-4 rounded-sm border border-border p-3">
                                                    <Link href={`/product/${product.slug}`} onClick={onClose} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                                                        <img
                                                            src={getImageUrl((product.images as string[])?.[0])}
                                                            alt={name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </Link>
                                                    <div className="flex flex-1 flex-col justify-between">
                                                        <div>
                                                            <Link href={`/product/${product.slug}`} onClick={onClose} className="text-sm font-medium text-foreground hover:text-primary">
                                                                {name}
                                                            </Link>
                                                            <p className="mt-0.5 text-sm font-semibold text-foreground">{formatPrice(price)}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleFavorite(product.id)}
                                                            className="self-start text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                                                        >
                                                            {t('remove')}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
