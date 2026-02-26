'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Settings,
    Tag,
    Layers,
    Package,
    LogOut,
    Store,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitcher } from '@/components/store/LanguageSwitcher';

export function AdminSidebar() {
    const pathname = usePathname() ?? '';
    const t = useTranslations('admin');
    const locale = useLocale();

    const navItems = [
        { href: '/admin' as const, label: t('dashboard'), icon: LayoutDashboard },
        { href: '/admin/products' as const, label: t('products'), icon: Package },
        { href: '/admin/categories' as const, label: t('categories'), icon: Layers },
        { href: '/admin/brands' as const, label: t('brands'), icon: Tag },
        { href: '/admin/store-config' as const, label: t('storeSettings'), icon: Settings },
    ];

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
            <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
                <Store className="h-6 w-6 text-primary" />
                <span className="font-display text-lg font-semibold text-sidebar-foreground">{t('adminPanel')}</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const localizedHref = `/${locale}${href}`;
                    const isActive = pathname === localizedHref || (href !== '/admin' && pathname.startsWith(localizedHref));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-sidebar-border px-3 py-4">
                <div className="mb-2 flex items-center justify-between px-3">
                    <LanguageSwitcher />
                </div>
                <Link
                    href="/"
                    target="_blank"
                    className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
                >
                    <Store className="h-4 w-4" />
                    {t('viewStorefront')} ↗
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: `/${locale}/admin/login` })}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
                >
                    <LogOut className="h-4 w-4" />
                    {t('signOut')}
                </button>
            </div>
        </aside>
    );
}
