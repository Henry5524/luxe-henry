'use client';

import { Heart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '@/hooks/use-favorites';
import { formatPrice, localize, getImageUrl } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { Product, Category, Brand } from '@/db/schema';

interface ProductDetailClientProps {
    product: Product;
    category: Category | null;
    ancestors: Category[];
    brand: Brand | null;
    related: Product[];
    currency?: string;
    locale?: string;
}

export function ProductDetailClient({
    product,
    category,
    ancestors,
    brand,
    related,
    currency = 'USD',
    locale = 'en',
}: ProductDetailClientProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const liked = isFavorite(product.id);
    const t = useTranslations('product');

    const price = parseFloat(product.price as unknown as string);
    const compareAtPrice = product.compareAtPrice ? parseFloat(product.compareAtPrice as unknown as string) : null;
    const discount = compareAtPrice
        ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        : null;

    const name = localize(product.name, locale);
    const description = localize(product.description, locale);
    const material = localize(product.material, locale);

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
            <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground">{t('home')}</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/catalog" className="hover:text-foreground">{t('catalog')}</Link>
                {ancestors.map((a) => (
                    <span key={a.id} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        <Link href={`/catalog?categoryId=${a.id}`} className="hover:text-foreground">{localize(a.name, locale)}</Link>
                    </span>
                ))}
                {category && (
                    <>
                        <ChevronRight className="h-3 w-3" />
                        <Link href={`/catalog?categoryId=${category.id}`} className="hover:text-foreground">{localize(category.name, locale)}</Link>
                    </>
                )}
            </nav>

            <div className="grid gap-10 md:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden rounded-sm bg-muted"
                >
                    <img
                        src={getImageUrl((product.images as string[])?.[0])}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col justify-center"
                >
                    {brand && (
                        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                            {localize(brand.name, locale)}
                        </p>
                    )}
                    <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{name}</h1>

                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">{formatPrice(price, currency, locale)}</span>
                        {compareAtPrice && (
                            <>
                                <span className="text-lg text-muted-foreground line-through">
                                    {formatPrice(compareAtPrice, currency, locale)}
                                </span>
                                <span className="rounded-sm bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                                    -{discount}%
                                </span>
                            </>
                        )}
                    </div>

                    <p className="mt-6 leading-relaxed text-muted-foreground">{description}</p>

                    <div className="mt-8 space-y-3 border-t border-border pt-6">
                        {material && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('material')}</span>
                                <span className="font-medium text-foreground">{material}</span>
                            </div>
                        )}
                        {product.weight && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('weight')}</span>
                                <span className="font-medium text-foreground">{product.weight}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('availability')}</span>
                            <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-destructive'}`}>
                                {product.inStock ? t('inStock') : t('outOfStock')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={() => toggleFavorite(product.id)}
                            className={`flex items-center gap-2 rounded-sm border px-6 py-3 text-sm font-medium transition-colors ${liked
                                ? 'border-rose bg-rose/10 text-rose'
                                : 'border-border text-foreground hover:bg-muted'
                                }`}
                        >
                            <Heart className={`h-4 w-4 ${liked ? 'fill-rose' : ''}`} />
                            {liked ? t('saved') : t('save')}
                        </button>
                    </div>
                </motion.div>
            </div>

            {related.length > 0 && (
                <section className="mt-20">
                    <h2 className="mb-8 font-display text-2xl font-bold text-foreground">{t('relatedProducts')}</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                        {related.map((p, i) => (
                            <ProductCard key={p.id} product={p} index={i} currency={currency} locale={locale} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
