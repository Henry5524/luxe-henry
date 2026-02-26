'use client';

import { Heart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { FavoritesModal } from './FavoritesModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { localize } from '@/lib/utils';
import { useLocale } from 'next-intl';
import type { StoreConfig, Category } from '@/db/schema';

interface NavbarProps {
    storeConfig: StoreConfig | undefined;
    topCategories: Category[];
}

export function Navbar({ storeConfig, topCategories }: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [favOpen, setFavOpen] = useState(false);
    const { favorites } = useFavorites();
    const t = useTranslations('nav');
    const locale = useLocale();

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
                    <Link href="/" className="font-display text-2xl font-bold tracking-widest text-foreground">
                        {storeConfig?.storeName ?? 'Luxe'}
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {topCategories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/catalog?categoryId=${cat.id}`}
                                className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {localize(cat.name, locale)}
                            </Link>
                        ))}
                        <Link
                            href="/catalog"
                            className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {t('all')}
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <Link href="/catalog" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                            <Search className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={() => setFavOpen(true)}
                            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <Heart className="h-5 w-5" />
                            {favorites.length > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {favorites.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="rounded-full p-2 text-muted-foreground md:hidden"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <nav className="border-t border-border bg-background px-4 py-4 md:hidden">
                        <div className="flex flex-col gap-3">
                            {topCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/catalog?categoryId=${cat.id}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {localize(cat.name, locale)}
                                </Link>
                            ))}
                            <Link href="/catalog" onClick={() => setMobileOpen(false)} className="text-sm font-medium tracking-wide text-muted-foreground">
                                {t('allProducts')}
                            </Link>
                        </div>
                    </nav>
                )}
            </header>

            <FavoritesModal open={favOpen} onClose={() => setFavOpen(false)} />
        </>
    );
}
