'use client';

import { useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { localize } from '@/lib/utils';
import type { Category, Brand } from '@/db/schema';

interface FilterState {
    categoryId: string | null;
    brandId: string | null;
    sortBy: 'newest' | 'price-asc' | 'price-desc' | 'name';
    search: string;
}

interface FilterSidebarProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    categories: Category[];
    brands: Brand[];
}

export function FilterSidebar({ filters, onChange, categories, brands }: FilterSidebarProps) {
    const topCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
    const t = useTranslations('filter');
    const locale = useLocale();

    const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });
    const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

    return (
        <aside className="space-y-8">
            {(filters.categoryId || filters.brandId) && (
                <div className="flex flex-wrap gap-2">
                    {filters.categoryId && (
                        <button
                            onClick={() => set({ categoryId: null })}
                            className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
                        >
                            {t('category')} <X className="h-3 w-3" />
                        </button>
                    )}
                    {filters.brandId && (
                        <button
                            onClick={() => set({ brandId: null })}
                            className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
                        >
                            {t('brand')} <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            )}

            <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{t('category')}</h3>
                <div className="space-y-1">
                    {topCategories.map((cat) => {
                        const children = getChildren(cat.id);
                        const isActive = filters.categoryId === cat.id;
                        const childActive = children.some((c) => c.id === filters.categoryId);

                        return (
                            <div key={cat.id}>
                                <button
                                    onClick={() => set({ categoryId: isActive ? null : cat.id })}
                                    className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ${isActive || childActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                >
                                    {localize(cat.name, locale)}
                                    {children.length > 0 && (
                                        <ChevronDown className={`h-3 w-3 transition-transform ${isActive || childActive ? 'rotate-180' : ''}`} />
                                    )}
                                </button>
                                {(isActive || childActive) && children.length > 0 && (
                                    <div className="ml-4 mt-1 space-y-0.5">
                                        {children.map((child) => (
                                            <button
                                                key={child.id}
                                                onClick={() => set({ categoryId: child.id === filters.categoryId ? cat.id : child.id })}
                                                className={`block w-full rounded-sm px-2 py-1 text-left text-xs transition-colors ${filters.categoryId === child.id ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {localize(child.name, locale)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{t('brand')}</h3>
                <div className="space-y-1">
                    {brands.map((brand) => (
                        <button
                            key={brand.id}
                            onClick={() => set({ brandId: brand.id === filters.brandId ? null : brand.id })}
                            className={`block w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${filters.brandId === brand.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            {localize(brand.name, locale)}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{t('sortBy')}</h3>
                <select
                    value={filters.sortBy}
                    onChange={(e) => set({ sortBy: e.target.value as FilterState['sortBy'] })}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="newest">{t('newest')}</option>
                    <option value="price-asc">{t('priceAsc')}</option>
                    <option value="price-desc">{t('priceDesc')}</option>
                    <option value="name">{t('nameAz')}</option>
                </select>
            </div>
        </aside>
    );
}
