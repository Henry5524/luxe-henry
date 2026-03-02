'use client';

import { useState } from 'react';
import { Pencil, Trash2, Search } from 'lucide-react';
import { formatPrice, localize, getImageUrl } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { Product } from '@/db/schema';

interface ProductsClientProps {
    initialProducts: Product[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const router = useRouter();
    const t = useTranslations('admin');
    const locale = useLocale();
    const [products, setProducts] = useState(initialProducts);
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? products.filter((p) => {
            const name = localize(p.name, 'en');
            return name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
        })
        : products;

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch {
            alert('Failed to delete product');
        }
    }

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t('searchProducts')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-sm border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {t('products')}
                            </th>
                            <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                                {t('price')}
                            </th>
                            <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                                {t('status')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {t('actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                    {search ? t('noProductsMatch') : t('noProductsYet')}
                                </td>
                            </tr>
                        )}
                        {filtered.map((product) => {
                            const price = parseFloat(product.price as unknown as string);
                            const imageUrl = getImageUrl((product.images as string[])?.[0]);
                            const name = localize(product.name, 'en');
                            return (
                                <tr key={product.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={imageUrl} alt={name} className="h-10 w-10 rounded-sm object-cover" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{name}</p>
                                                <p className="text-xs text-muted-foreground">/{product.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-6 py-4 text-sm font-medium text-foreground md:table-cell">
                                        {formatPrice(price)}
                                    </td>
                                    <td className="hidden px-6 py-4 md:table-cell">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${product.inStock
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                        {product.featured && (
                                            <span className="ml-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                {t('featured')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/products/${product.id}/edit` as any)}
                                                className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, name)}
                                                className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
