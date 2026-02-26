'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales, type Locale } from '@/i18n/routing';

const localeLabels: Record<Locale, string> = {
    en: 'English',
    uz: "O'zbek",
    ru: 'Русский',
};

export function LanguageSwitcher() {
    const locale = useLocale() as Locale;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams()!;
    const t = useTranslations('languages');

    function switchLocale(newLocale: Locale) {
        const search = searchParams.toString();
        const fullPath = search ? `${pathname}?${search}` : pathname;
        router.replace(fullPath as any, { locale: newLocale });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">{locale}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
                {locales.map((l) => (
                    <DropdownMenuItem
                        key={l}
                        onClick={() => switchLocale(l)}
                        className={`cursor-pointer ${l === locale ? 'font-semibold' : ''}`}
                    >
                        {localeLabels[l]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
