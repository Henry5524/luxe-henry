'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, X, ChevronRight, Upload, Download, Loader2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { BulkImportModal } from './BulkImportModal';
import { generateSlug, localize, emptyLocalized, getImageUrl, PLACEHOLDER_IMAGE } from '@/lib/utils';
import type { LocalizedField } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { Category } from '@/db/schema';

interface CategoriesClientProps {
    initialCategories: Category[];
}

function toLocalized(value: any): LocalizedField {
    if (!value) return emptyLocalized();
    if (typeof value === 'string') return { en: value, uz: '', ru: '' };
    return { en: value.en ?? '', uz: value.uz ?? '', ru: value.ru ?? '' };
}

interface FormState {
    name: LocalizedField;
    slug: string;
    imageUrl: string;
    parentId: string | null;
    sortOrder: number;
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
    const router = useRouter();
    const t = useTranslations('admin');
    const [cats, setCats] = useState(initialCategories);
    const [editing, setEditing] = useState<Category | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingJSON, setExportingJSON] = useState(false);
    const [form, setForm] = useState<FormState>({
        name: emptyLocalized(),
        slug: '',
        imageUrl: '',
        parentId: null,
        sortOrder: 0,
    });

    const topCats = cats.filter((c) => !c.parentId);
    const getChildren = (parentId: string) => cats.filter((c) => c.parentId === parentId);

    function openNew() {
        setEditing(null);
        setForm({ name: emptyLocalized(), slug: '', imageUrl: '', parentId: null, sortOrder: 0 });
        setShowForm(true);
    }

    function openEdit(cat: Category) {
        setEditing(cat);
        setForm({
            name: toLocalized(cat.name),
            slug: cat.slug,
            imageUrl: cat.imageUrl,
            parentId: cat.parentId,
            sortOrder: cat.sortOrder,
        });
        setShowForm(true);
    }

    function setLocalized(lang: string, value: string) {
        setForm((f) => ({ ...f, name: { ...f.name, [lang]: value } }));
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                slug: form.slug || generateSlug(form.name.en),
                imageUrl: form.imageUrl || PLACEHOLDER_IMAGE,
                parentId: form.parentId || null,
                sortOrder: form.sortOrder,
            };

            if (editing) {
                await fetch(`/api/admin/categories/${editing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            router.refresh();
            window.location.reload();
        } catch {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"?`)) return;
        try {
            await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            setCats((prev) => prev.filter((c) => c.id !== id));
        } catch {
            alert('Failed to delete');
        }
    }

    async function handleExport(format: 'csv' | 'json') {
        const setter = format === 'csv' ? setExportingCSV : setExportingJSON;
        setter(true);
        try {
            const res = await fetch(`/api/admin/import/export?type=categories&format=${format}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `categories-export.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Export failed'); }
        finally { setter(false); }
    }

    const langTabs = ['en', 'uz', 'ru'] as const;

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                <button onClick={() => handleExport('csv')} disabled={exportingCSV}
                    className="flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60">
                    {exportingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t('exportCSV')}
                </button>
                <button onClick={() => handleExport('json')} disabled={exportingJSON}
                    className="flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60">
                    {exportingJSON ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t('exportJSON')}
                </button>
                <button onClick={() => setImportOpen(true)}
                    className="flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                    <Upload className="h-4 w-4" /> {t('import')}
                </button>
                <button onClick={openNew}
                    className="flex items-center gap-1 bg-gradient-gold px-5 py-2 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110">
                    <Plus className="h-4 w-4" /> {t('newCategory')}
                </button>
            </div>

            <BulkImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                entityType="categories"
                onImportComplete={() => { router.refresh(); window.location.reload(); }}
            />

            {topCats.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    {t('noCategoriesYet')}
                </div>
            ) : (
                <div className="space-y-2">
                    {topCats.map((cat) => {
                        const children = getChildren(cat.id);
                        return (
                            <div key={cat.id} className="rounded-lg border border-border bg-card">
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={getImageUrl(cat.imageUrl)} alt={localize(cat.name, 'en')} className="h-10 w-10 rounded-sm object-cover" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{localize(cat.name, 'en')}</p>
                                            {children.length > 0 && (
                                                <p className="text-xs text-muted-foreground">{children.length} {t('sub')}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(cat)} className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id, localize(cat.name, 'en'))}
                                            className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                {children.length > 0 && (
                                    <div className="border-t border-border px-6 py-2">
                                        {children.map((child) => (
                                            <div key={child.id} className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2 pl-6">
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">{localize(child.name, 'en')}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEdit(child)} className="rounded-sm p-1 text-muted-foreground hover:bg-muted">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(child.id, localize(child.name, 'en'))}
                                                        className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-luxury">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-lg font-semibold text-foreground">
                                {editing ? t('editCategory') : t('newCategory')}
                            </h2>
                            <button onClick={() => setShowForm(false)}>
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <Tabs defaultValue="en">
                                <TabsList className="mb-3">
                                    {langTabs.map((l) => (
                                        <TabsTrigger key={l} value={l} className="uppercase">{l}</TabsTrigger>
                                    ))}
                                </TabsList>
                                {langTabs.map((lang) => (
                                    <TabsContent key={lang} value={lang}>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground">
                                                {t('name')} ({lang.toUpperCase()}) {lang === 'en' && '*'}
                                            </label>
                                            <input
                                                className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                                value={form.name[lang]}
                                                onChange={(e) => {
                                                    setLocalized(lang, e.target.value);
                                                    if (lang === 'en' && !editing) setForm((f) => ({ ...f, slug: generateSlug(e.target.value) }));
                                                }}
                                                placeholder={`Category name (${lang.toUpperCase()})`}
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">{t('slug')}</label>
                                <input className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                    value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">{t('parentCategory')}</label>
                                <select className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                    value={form.parentId ?? ''}
                                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}>
                                    <option value="">{t('noneTopLevel')}</option>
                                    {topCats.filter((c) => c.id !== editing?.id).map((c) => (
                                        <option key={c.id} value={c.id}>{localize(c.name, 'en')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">{t('image')}</label>
                                <ImageUpload value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">{t('sortOrder')}</label>
                                <input type="number" className="w-full rounded-sm border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                    value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="rounded-sm border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">{t('cancel')}</button>
                                <button type="submit" disabled={saving}
                                    className="bg-gradient-gold px-5 py-2 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110 disabled:opacity-60">
                                    {saving ? t('saving') : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
