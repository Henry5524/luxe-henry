'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, X, Upload, Download, Loader2 } from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';
import { generateSlug, localize, emptyLocalized } from '@/lib/utils';
import type { LocalizedField } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { Brand } from '@/db/schema';

interface BrandsClientProps {
    initialBrands: Brand[];
}

function toLocalized(value: any): LocalizedField {
    if (!value) return emptyLocalized();
    if (typeof value === 'string') return { en: value, uz: '', ru: '' };
    return { en: value.en ?? '', uz: value.uz ?? '', ru: value.ru ?? '' };
}

interface FormState {
    name: LocalizedField;
    slug: string;
}

export function BrandsClient({ initialBrands }: BrandsClientProps) {
    const router = useRouter();
    const t = useTranslations('admin');
    const [brandsList, setBrandsList] = useState(initialBrands);
    const [editing, setEditing] = useState<Brand | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingJSON, setExportingJSON] = useState(false);
    const [form, setForm] = useState<FormState>({ name: emptyLocalized(), slug: '' });

    function setLocalized(lang: string, value: string) {
        setForm((f) => ({ ...f, name: { ...f.name, [lang]: value } }));
    }

    function openNew() {
        setEditing(null);
        setForm({ name: emptyLocalized(), slug: '' });
        setShowForm(true);
    }

    function openEdit(brand: Brand) {
        setEditing(brand);
        setForm({ name: toLocalized(brand.name), slug: brand.slug });
        setShowForm(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                slug: form.slug || generateSlug(form.name.en),
            };
            if (editing) {
                await fetch(`/api/admin/brands/${editing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch('/api/admin/brands', {
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
            await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
            setBrandsList((prev) => prev.filter((b) => b.id !== id));
        } catch {
            alert('Failed to delete');
        }
    }

    async function handleExport(format: 'csv' | 'json') {
        const setter = format === 'csv' ? setExportingCSV : setExportingJSON;
        setter(true);
        try {
            const res = await fetch(`/api/admin/import/export?type=brands&format=${format}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `brands-export.${format}`;
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
                    <Plus className="h-4 w-4" /> {t('newBrand')}
                </button>
            </div>

            <BulkImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                entityType="brands"
                onImportComplete={() => { router.refresh(); window.location.reload(); }}
            />

            {brandsList.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    {t('noBrandsYet')}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('name')}</th>
                                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">{t('slug')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brandsList.map((brand) => {
                                const name = localize(brand.name, 'en');
                                return (
                                    <tr key={brand.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                                        <td className="px-6 py-4 text-sm font-medium text-foreground">{name}</td>
                                        <td className="hidden px-6 py-4 text-sm text-muted-foreground md:table-cell">{brand.slug}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(brand)} className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(brand.id, name)}
                                                    className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
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
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-luxury">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-lg font-semibold text-foreground">
                                {editing ? t('editBrand') : t('newBrand')}
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
                                                placeholder={`Brand name (${lang.toUpperCase()})`}
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
