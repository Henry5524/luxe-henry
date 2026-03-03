'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { formatPrice, localize, getImageUrl } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { Product } from '@/db/schema';

interface ProductCardProps {
    product: Product;
    index?: number;
    currency?: string;
    locale?: string;
}

export function ProductCard({ product, index = 0, currency = 'USD', locale = 'en' }: ProductCardProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const liked = isFavorite(product.id);
    const t = useTranslations('product');

    const price = parseFloat(product.price as unknown as string);
    const compareAtPrice = product.compareAtPrice ? parseFloat(product.compareAtPrice as unknown as string) : null;
    const name = localize(product.name, locale);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="group relative"
        >
            <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-sm bg-muted">
                <div className="aspect-square overflow-hidden">
                    <img
                        src={getImageUrl((product.images as string[])?.[0])}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800';
                        }}
                    />
                </div>
            </Link>

            <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background"
                aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
            >
                <Heart className={`h-4 w-4 transition-colors ${liked ? 'fill-rose text-rose' : 'text-muted-foreground'}`} />
            </button>

            {compareAtPrice && (
                <span className="absolute left-3 top-3 bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    {t('sale')}
                </span>
            )}

            <div className="mt-3 space-y-1">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {name}
                    </h3>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{formatPrice(price, currency, locale)}</span>
                    {compareAtPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(compareAtPrice, currency, locale)}
                        </span>
                    )}
                </div>
                {!product.inStock && (
                    <p className="text-xs font-medium text-muted-foreground">{t('outOfStock')}</p>
                )}
            </div>
        </motion.div>
    );
}
