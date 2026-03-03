'use client';

import { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { emptyLocalized } from '@/lib/utils';
import type { LocalizedField } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import type { StoreConfig } from '@/db/schema';

function toLocalized(value: any): LocalizedField {
    if (!value) return emptyLocalized();
    if (typeof value === 'string') return { en: value, uz: '', ru: '' };
    return { en: value.en ?? '', uz: value.uz ?? '', ru: value.ru ?? '' };
}

interface FormState {
    storeName: string;
    heroEnabled: boolean;
    heroTitle: LocalizedField;
    heroSubtitle: LocalizedField;
    heroCtaText: LocalizedField;
    heroCtaLink: string;
    heroImageUrl: string;
    footerText: LocalizedField;
    currency: string;
    locale: string;
}

export function StoreConfigForm({ config }: { config: StoreConfig | undefined }) {
    const t = useTranslations('admin');
    const [form, setForm] = useState<FormState>({
        storeName: config?.storeName ?? '',
        heroEnabled: config?.heroEnabled ?? true,
        heroTitle: toLocalized(config?.heroTitle),
        heroSubtitle: toLocalized(config?.heroSubtitle),
        heroCtaText: toLocalized(config?.heroCtaText),
        heroCtaLink: config?.heroCtaLink ?? '/catalog',
        heroImageUrl: config?.heroImageUrl ?? '',
        footerText: toLocalized(config?.footerText),
        currency: config?.currency ?? 'USD',
        locale: config?.locale ?? 'en-US',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const setStr = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

    function setLocalized(key: 'heroTitle' | 'heroSubtitle' | 'heroCtaText' | 'footerText', lang: string, value: string) {
        setForm((f) => ({ ...f, [key]: { ...f[key], [lang]: value } }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch('/api/admin/store-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) setSaved(true);
        } catch {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    }

    const langTabs = ['en', 'uz', 'ru'] as const;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Settings */}
            <section className="rounded-xl border border-border bg-card shadow-card">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="font-display text-base font-semibold text-foreground">{t('general')}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Basic store identity and regional settings</p>
                </div>
                <div className="space-y-5 p-6">
                    <div className="space-y-1.5">
                        <label className="label">{t('storeName')}</label>
                        <input
                            className="input"
                            value={form.storeName}
                            onChange={(e) => setStr('storeName', e.target.value)}
                            placeholder="My Store"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">{t('currency')}</label>
                            <input
                                className="input"
                                value={form.currency}
                                onChange={(e) => setStr('currency', e.target.value)}
                                placeholder="USD"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">{t('locale')}</label>
                            <input
                                className="input"
                                value={form.locale}
                                onChange={(e) => setStr('locale', e.target.value)}
                                placeholder="en-US"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="label">{t('footerText')}</label>
                        <Tabs defaultValue="en">
                            <TabsList className="mb-2">
                                {langTabs.map((l) => (
                                    <TabsTrigger key={l} value={l} className="uppercase">{l}</TabsTrigger>
                                ))}
                            </TabsList>
                            {langTabs.map((lang) => (
                                <TabsContent key={lang} value={lang}>
                                    <textarea
                                        className="input h-20 w-full resize-none"
                                        value={form.footerText[lang]}
                                        onChange={(e) => setLocalized('footerText', lang, e.target.value)}
                                        placeholder={`Footer text (${lang.toUpperCase()})...`}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h2 className="font-display text-base font-semibold text-foreground">{t('heroSection')}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">Homepage banner content and image</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2.5">
                        <span className="text-xs font-medium text-muted-foreground">{t('enabled')}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.heroEnabled}
                            onClick={() => setStr('heroEnabled', !form.heroEnabled)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${form.heroEnabled ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.heroEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </label>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <label className="label">Localized Content</label>
                        <Tabs defaultValue="en">
                            <TabsList className="mb-4">
                                {langTabs.map((l) => (
                                    <TabsTrigger key={l} value={l} className="uppercase">{l}</TabsTrigger>
                                ))}
                            </TabsList>
                            {langTabs.map((lang) => (
                                <TabsContent key={lang} value={lang}>
                                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="label">{t('title')}</label>
                                            <input
                                                className="input"
                                                value={form.heroTitle[lang]}
                                                onChange={(e) => setLocalized('heroTitle', lang, e.target.value)}
                                                placeholder={`Hero title (${lang.toUpperCase()})`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="label">{t('subtitle')}</label>
                                            <textarea
                                                className="input h-24 w-full resize-none"
                                                value={form.heroSubtitle[lang]}
                                                onChange={(e) => setLocalized('heroSubtitle', lang, e.target.value)}
                                                placeholder={`Hero subtitle (${lang.toUpperCase()})...`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="label">{t('ctaText')}</label>
                                            <input
                                                className="input"
                                                value={form.heroCtaText[lang]}
                                                onChange={(e) => setLocalized('heroCtaText', lang, e.target.value)}
                                                placeholder={`CTA text (${lang.toUpperCase()})`}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">{t('ctaLink')}</label>
                            <input
                                className="input"
                                value={form.heroCtaLink}
                                onChange={(e) => setStr('heroCtaLink', e.target.value)}
                                placeholder="/catalog"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="label">{t('heroImage')}</label>
                        <ImageUpload value={form.heroImageUrl} onChange={(url) => setStr('heroImageUrl', url)} />
                    </div>
                </div>
            </section>

            <div className="flex items-center gap-4 pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-gradient-gold px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110 disabled:opacity-60"
                >
                    {saving ? t('saving') : t('saveChanges')}
                </button>
                {saved && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t('savedSuccessfully')}
                    </span>
                )}
            </div>
        </form>
    );
}
