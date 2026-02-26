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
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t('general')}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="label">{t('storeName')}</label>
                        <input className="input mt-1" value={form.storeName} onChange={(e) => setStr('storeName', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">{t('currency')}</label>
                            <input className="input mt-1" value={form.currency} onChange={(e) => setStr('currency', e.target.value)} placeholder="USD" />
                        </div>
                        <div>
                            <label className="label">{t('locale')}</label>
                            <input className="input mt-1" value={form.locale} onChange={(e) => setStr('locale', e.target.value)} placeholder="en-US" />
                        </div>
                    </div>
                    <div>
                        <label className="label mb-2 block">{t('footerText')}</label>
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

            <section className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-foreground">{t('heroSection')}</h2>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{t('enabled')}</span>
                        <div
                            onClick={() => setStr('heroEnabled', !form.heroEnabled)}
                            className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${form.heroEnabled ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.heroEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                    </label>
                </div>

                <Tabs defaultValue="en">
                    <TabsList className="mb-3">
                        {langTabs.map((l) => (
                            <TabsTrigger key={l} value={l} className="uppercase">{l}</TabsTrigger>
                        ))}
                    </TabsList>
                    {langTabs.map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-4">
                            <div>
                                <label className="label">{t('title')} ({lang.toUpperCase()})</label>
                                <input className="input mt-1" value={form.heroTitle[lang]}
                                    onChange={(e) => setLocalized('heroTitle', lang, e.target.value)}
                                    placeholder={`Hero title (${lang.toUpperCase()})`} />
                            </div>
                            <div>
                                <label className="label">{t('subtitle')} ({lang.toUpperCase()})</label>
                                <textarea className="input mt-1 h-24 resize-none" value={form.heroSubtitle[lang]}
                                    onChange={(e) => setLocalized('heroSubtitle', lang, e.target.value)}
                                    placeholder={`Hero subtitle (${lang.toUpperCase()})...`} />
                            </div>
                            <div>
                                <label className="label">{t('ctaText')} ({lang.toUpperCase()})</label>
                                <input className="input mt-1" value={form.heroCtaText[lang]}
                                    onChange={(e) => setLocalized('heroCtaText', lang, e.target.value)}
                                    placeholder={`CTA text (${lang.toUpperCase()})`} />
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">{t('ctaLink')}</label>
                        <input className="input mt-1" value={form.heroCtaLink} onChange={(e) => setStr('heroCtaLink', e.target.value)} />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="label">{t('heroImage')}</label>
                    <ImageUpload value={form.heroImageUrl} onChange={(url) => setStr('heroImageUrl', url)} />
                </div>
            </section>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-block bg-gradient-gold px-8 py-3 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110 disabled:opacity-60"
                >
                    {saving ? t('saving') : t('saveChanges')}
                </button>
                {saved && <span className="text-sm font-medium text-green-600">{t('savedSuccessfully')}</span>}
            </div>
        </form>
    );
}
