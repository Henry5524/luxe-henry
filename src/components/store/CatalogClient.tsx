'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/store/ProductCard';
import { FilterSidebar } from '@/components/store/FilterSidebar';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '@/components/ui/pagination';
import type { Category, Brand } from '@/db/schema';

interface CatalogClientProps {
    categories: Category[];
    brands: Brand[];
    currency?: string;
    locale?: string;
}

interface FilterState {
    categoryId: string | null;
    brandId: string | null;
    sortBy: 'newest' | 'price-asc' | 'price-desc' | 'name';
    search: string;
}

const PAGE_SIZE = 12;

export function CatalogClient({ categories, brands, currency = 'USD', locale = 'en' }: CatalogClientProps) {
    const searchParams = useSearchParams()!;
    const t = useTranslations('catalog');
    const tPag = useTranslations('pagination');

    const [filters, setFilters] = useState<FilterState>({
        categoryId: searchParams.get('categoryId'),
        brandId: null,
        sortBy: 'newest',
        search: '',
    });

    const [mobileFilters, setMobileFilters] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchProducts = useCallback(async (currentPage: number) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.categoryId) params.set('categoryId', filters.categoryId);
        if (filters.brandId) params.set('brandId', filters.brandId);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (filters.search) params.set('search', filters.search);
        params.set('page', String(currentPage));
        params.set('limit', String(PAGE_SIZE));
        params.set('locale', locale);

        try {
            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            setProducts(data.products ?? []);
            setTotalPages(data.totalPages ?? 1);
            setTotalCount(data.totalCount ?? 0);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [filters, locale]);

    useEffect(() => {
        setPage(1);
    }, [filters]);

    useEffect(() => {
        fetchProducts(page);
    }, [page, fetchProducts]);

    useEffect(() => {
        const categoryId = searchParams.get('categoryId');
        if (categoryId) {
            setFilters(f => ({ ...f, categoryId }));
        }
    }, [searchParams]);

    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, totalCount);

    function getPageNumbers() {
        const pages: (number | 'ellipsis')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('ellipsis');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('ellipsis');
            pages.push(totalPages);
        }
        return pages;
    }

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">{t('title')}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {loading ? '...' : totalCount > 0
                            ? t('showing', { from, to, total: totalCount })
                            : `0 ${t('products')}`
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="hidden rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring md:block md:w-64"
                    />
                    <button
                        onClick={() => setMobileFilters(true)}
                        className="flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm text-foreground md:hidden"
                    >
                        <SlidersHorizontal className="h-4 w-4" /> {t('filters')}
                    </button>
                </div>
            </div>

            <div className="flex gap-10">
                <div className="hidden w-56 flex-shrink-0 md:block">
                    <FilterSidebar filters={filters} onChange={setFilters} categories={categories} brands={brands} />
                </div>

                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-square rounded-sm bg-muted" />
                                    <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                                    <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <p className="text-muted-foreground">{t('noProducts')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                                {products.map((product, i) => (
                                    <ProductCard key={product.id} product={product} index={i} currency={currency} locale={locale} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-10">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                            {getPageNumbers().map((p, i) =>
                                                p === 'ellipsis' ? (
                                                    <PaginationItem key={`e-${i}`}>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                ) : (
                                                    <PaginationItem key={p}>
                                                        <PaginationLink
                                                            isActive={p === page}
                                                            onClick={() => setPage(p)}
                                                            className="cursor-pointer"
                                                        >
                                                            {p}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ),
                                            )}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <input
                type="text"
                placeholder={t('searchProducts')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="mt-4 w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring md:hidden"
            />

            {mobileFilters && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-charcoal/50" onClick={() => setMobileFilters(false)} />
                    <div className="relative ml-auto h-full w-80 max-w-full overflow-y-auto border-l border-border bg-background p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-display text-lg font-semibold">{t('filters')}</h2>
                            <button onClick={() => setMobileFilters(false)}>
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                        <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); }} categories={categories} brands={brands} />
                    </div>
                </div>
            )}
        </main>
    );
}
