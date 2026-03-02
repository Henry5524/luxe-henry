'use client';

import { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { generateSlug, localize, emptyLocalized } from '@/lib/utils';
import type { LocalizedField } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { Product, Category, Brand } from '@/db/schema';

interface ProductFormProps {
    product?: Product;
    categories: Category[];
    brands: Brand[];
}

function toLocalized(value: any): LocalizedField {
    if (!value) return emptyLocalized();
    if (typeof value === 'string') return { en: value, uz: '', ru: '' };
    return { en: value.en ?? '', uz: value.uz ?? '', ru: value.ru ?? '' };
}

interface FormState {
    name: LocalizedField;
    slug: string;
    description: LocalizedField;
    price: string;
    compareAtPrice: string;
    images: string[];
    categoryId: string;
    brandId: string;
    material: LocalizedField;
    weight: string;
    inStock: boolean;
    featured: boolean;
}

function buildInitialForm(product?: Product): FormState {
    if (product) {
        return {
            name: toLocalized(product.name),
            slug: product.slug,
            description: toLocalized(product.description),
            price: String(product.price),
            compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
            images: (product.images as string[]) ?? [],
            categoryId: product.categoryId,
            brandId: product.brandId,
            material: toLocalized(product.material),
            weight: product.weight ?? '',
            inStock: product.inStock,
            featured: product.featured,
        };
    }
    return {
        name: emptyLocalized(),
        slug: '',
        description: emptyLocalized(),
        price: '',
        compareAtPrice: '',
        images: [],
        categoryId: '',
        brandId: '',
        material: emptyLocalized(),
        weight: '',
        inStock: true,
        featured: false,
    };
}

export function ProductForm({ product, categories, brands }: ProductFormProps) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('admin');
    const isEditing = !!product;
    const [form, setForm] = useState<FormState>(() => buildInitialForm(product));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const topCategories = categories.filter((c) => !c.parentId);
    const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function setLocalized(key: 'name' | 'description' | 'material', lang: string, value: string) {
        setForm((f) => ({ ...f, [key]: { ...f[key], [lang]: value } }));
    }

    function addImageSlot() {
        setForm((f) => ({ ...f, images: [...f.images, ''] }));
    }

    function updateImage(index: number, url: string) {
        setForm((f) => {
            const next = [...f.images];
            next[index] = url;
            return { ...f, images: next };
        });
    }

    function removeImage(index: number) {
        setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!form.name.en.trim()) { setError('English name is required.'); return; }
        if (!form.price || parseFloat(form.price) < 0) { setError('Valid price is required.'); return; }
        if (!form.categoryId) { setError('Category is required.'); return; }
        if (!form.brandId) { setError('Brand is required.'); return; }

        setSaving(true);
        const payload = {
            name: form.name,
            slug: form.slug || generateSlug(form.name.en),
            description: form.description,
            price: form.price,
            compareAtPrice: form.compareAtPrice || null,
            images: form.images.filter((url) => url.trim() !== ''),
            categoryId: form.categoryId,
            brandId: form.brandId,
            material: form.material,
            weight: form.weight.trim() || null,
            inStock: form.inStock,
            featured: form.featured,
        };

        try {
            const url = isEditing ? `/api/admin/products/${product.id}` : '/api/admin/products';
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to save');
            }

            router.push('/admin/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save product');
        } finally {
            setSaving(false);
        }
    }

    const langTabs = ['en', 'uz', 'ru'] as const;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t('basicInfo')}</h2>
                <Tabs defaultValue="en">
                    <TabsList className="mb-4">
                        {langTabs.map((l) => (
                            <TabsTrigger key={l} value={l} className="uppercase">{l}</TabsTrigger>
                        ))}
                    </TabsList>
                    {langTabs.map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">
                                    {t('name')} ({lang.toUpperCase()}) {lang === 'en' && '*'}
                                </label>
                                <input
                                    className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                    value={form.name[lang]}
                                    onChange={(e) => {
                                        setLocalized('name', lang, e.target.value);
                                        if (lang === 'en' && !isEditing) set('slug', generateSlug(e.target.value));
                                    }}
                                    placeholder={`Product name (${lang.toUpperCase()})`}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">
                                    {t('description')} ({lang.toUpperCase()})
                                </label>
                                <textarea
                                    className="h-32 w-full resize-none rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                    value={form.description[lang]}
                                    onChange={(e) => setLocalized('description', lang, e.target.value)}
                                    placeholder={`Description (${lang.toUpperCase()})...`}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">
                                    {t('productDetails')} - {t('name') === 'Name' ? 'Material' : 'Material'} ({lang.toUpperCase()})
                                </label>
                                <input
                                    className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                    value={form.material[lang]}
                                    onChange={(e) => setLocalized('material', lang, e.target.value)}
                                    placeholder={t('materialPlaceholder')}
                                />
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
                <div className="mt-4">
                    <label className="mb-1 block text-sm font-medium text-foreground">{t('slug')}</label>
                    <input
                        className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                        value={form.slug}
                        onChange={(e) => set('slug', e.target.value)}
                        placeholder="auto-generated-from-name"
                    />
                </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t('pricing')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">{t('price')} *</label>
                        <input
                            type="number" step="0.01" min="0"
                            className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            value={form.price}
                            onChange={(e) => set('price', e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">{t('compareAtPrice')}</label>
                        <input
                            type="number" step="0.01" min="0"
                            className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            value={form.compareAtPrice}
                            onChange={(e) => set('compareAtPrice', e.target.value)}
                            placeholder="Original price"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t('organization')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">{t('categories')} *</label>
                        <select
                            className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            value={form.categoryId}
                            onChange={(e) => set('categoryId', e.target.value)}
                        >
                            <option value="">{t('selectCategory')}</option>
                            {topCategories.map((cat) => {
                                const children = getChildren(cat.id);
                                return (
                                    <optgroup key={cat.id} label={localize(cat.name, 'en')}>
                                        <option value={cat.id}>{localize(cat.name, 'en')}</option>
                                        {children.map((child) => (
                                            <option key={child.id} value={child.id}>
                                                &nbsp;&nbsp;{localize(child.name, 'en')}
                                            </option>
                                        ))}
                                    </optgroup>
                                );
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">{t('brands')} *</label>
                        <select
                            className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            value={form.brandId}
                            onChange={(e) => set('brandId', e.target.value)}
                        >
                            <option value="">{t('selectBrand')}</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>{localize(brand.name, 'en')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-foreground">{t('images')}</h2>
                    <button type="button" onClick={addImageSlot}
                        className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
                        <Plus className="h-3 w-3" /> {t('addImage')}
                    </button>
                </div>
                {form.images.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                        <p className="text-sm text-muted-foreground">{t('noImagesYet')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {form.images.map((url, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="flex-1">
                                    <ImageUpload value={url} onChange={(newUrl) => updateImage(i, newUrl)} />
                                </div>
                                <button type="button" onClick={() => removeImage(i)}
                                    className="mt-2 rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t('productDetails')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">{t('name') === 'Name' ? 'Weight' : 'Weight'}</label>
                        <input
                            className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            value={form.weight}
                            onChange={(e) => set('weight', e.target.value)}
                            placeholder={t('weightPlaceholder')}
                        />
                    </div>
                </div>
                <div className="mt-4 flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <div onClick={() => set('inStock', !form.inStock)}
                            className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${form.inStock ? 'bg-primary' : 'bg-muted'}`}>
                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.inStock ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-foreground">In Stock</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <div onClick={() => set('featured', !form.featured)}
                            className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${form.featured ? 'bg-primary' : 'bg-muted'}`}>
                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-foreground">{t('featured')}</span>
                    </label>
                </div>
            </section>

            <div className="flex items-center gap-4">
                <button type="submit" disabled={saving}
                    className="bg-gradient-gold px-8 py-3 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110 disabled:opacity-60">
                    {saving ? t('saving') : isEditing ? t('updateProduct') : t('createProduct')}
                </button>
                <button type="button" onClick={() => router.push('/admin/products')}
                    className="rounded-sm border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted">
                    {t('cancel')}
                </button>
            </div>
        </form>
    );
}
