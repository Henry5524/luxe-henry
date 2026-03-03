'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import type { EntityType, ImportError } from '@/lib/import-utils';

interface BulkImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityType: EntityType;
    onImportComplete: () => void;
}

type Step = 'upload' | 'preview' | 'result';

interface PreviewData {
    rows: Record<string, unknown>[];
    format: 'csv' | 'json';
    rawContent: string;
}

interface ImportResult {
    success: number;
    errors: ImportError[];
}

export function BulkImportModal({ open, onOpenChange, entityType, onImportComplete }: BulkImportModalProps) {
    const t = useTranslations('admin');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>('upload');
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [importing, setImporting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    function reset() {
        setStep('upload');
        setPreview(null);
        setResult(null);
        setImporting(false);
        setDragOver(false);
        setParseError(null);
    }

    function handleOpenChange(value: boolean) {
        if (!value) reset();
        onOpenChange(value);
    }

    const processFile = useCallback((file: File) => {
        setParseError(null);
        const ext = file.name.split('.').pop()?.toLowerCase();
        const format: 'csv' | 'json' = ext === 'json' ? 'json' : 'csv';

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content?.trim()) {
                setParseError(t('importFileEmpty'));
                return;
            }

            try {
                let rows: Record<string, unknown>[];
                if (format === 'json') {
                    const parsed = JSON.parse(content);
                    if (!Array.isArray(parsed)) {
                        setParseError(t('importJsonMustBeArray'));
                        return;
                    }
                    rows = parsed;
                } else {
                    const lines = content.trim().split('\n');
                    if (lines.length < 2) {
                        setParseError(t('importCsvNoData'));
                        return;
                    }
                    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
                    rows = lines.slice(1).filter((l) => l.trim()).map((line) => {
                        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
                        const obj: Record<string, unknown> = {};
                        headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
                        return obj;
                    });
                }

                setPreview({ rows, format, rawContent: content });
                setStep('preview');
            } catch {
                setParseError(t('importParseError'));
            }
        };
        reader.readAsText(file);
    }, [t]);

    function handleFileDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    }

    async function handleImport() {
        if (!preview) return;
        setImporting(true);
        try {
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType,
                    format: preview.format,
                    data: preview.rawContent,
                }),
            });
            const data = await res.json();
            setResult({ success: data.success ?? 0, errors: data.errors ?? [] });
            setStep('result');
            if (data.success > 0) onImportComplete();
        } catch {
            setResult({ success: 0, errors: [{ row: 0, message: 'Network error' }] });
            setStep('result');
        } finally {
            setImporting(false);
        }
    }

    const previewHeaders = preview?.rows[0] ? Object.keys(preview.rows[0]) : [];
    const previewRows = preview?.rows.slice(0, 20) ?? [];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display">{t('bulkImport')}</DialogTitle>
                    <DialogDescription>{t('bulkImportDesc')}</DialogDescription>
                </DialogHeader>

                {/* Upload Step */}
                {step === 'upload' && (
                    <div className="space-y-4">
                        <div
                            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleFileDrop}
                        >
                            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                            <p className="mb-1 text-sm font-medium text-foreground">{t('dragOrClick')}</p>
                            <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-3 rounded-sm border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                {t('chooseFile')}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.json"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>

                        {parseError && (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {parseError}
                            </div>
                        )}

                        <a
                            href={`/api/admin/import/template?type=${entityType}`}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            download
                        >
                            <Download className="h-3.5 w-3.5" />
                            {t('downloadTemplate')}
                        </a>
                    </div>
                )}

                {/* Preview Step */}
                {step === 'preview' && preview && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            {t('rowsFound', { count: preview.rows.length })}
                            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs uppercase">
                                {preview.format}
                            </span>
                        </div>

                        <div className="overflow-auto rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        {previewHeaders.slice(0, 6).map((h) => (
                                            <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                                                {h}
                                            </th>
                                        ))}
                                        {previewHeaders.length > 6 && (
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">...</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, i) => (
                                        <tr key={i} className="border-b border-border last:border-b-0">
                                            {previewHeaders.slice(0, 6).map((h) => (
                                                <td key={h} className="max-w-[150px] truncate px-3 py-1.5 text-foreground">
                                                    {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h] ?? '')}
                                                </td>
                                            ))}
                                            {previewHeaders.length > 6 && (
                                                <td className="px-3 py-1.5 text-muted-foreground">...</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {preview.rows.length > 20 && (
                            <p className="text-xs text-muted-foreground">
                                {t('showingPreview', { shown: 20, total: preview.rows.length })}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={reset}
                                className="rounded-sm border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                {t('back')}
                            </button>
                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={importing}
                                className="flex items-center gap-2 bg-gradient-gold px-5 py-2 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110 disabled:opacity-60"
                            >
                                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                                {importing ? t('importing') : t('import')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Result Step */}
                {step === 'result' && result && (
                    <div className="space-y-4">
                        {result.success > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {t('importSuccess', { count: result.success })}
                            </div>
                        )}

                        {result.errors.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {t('importErrors', { count: result.errors.length })}
                                </div>
                                <div className="max-h-40 overflow-auto rounded-lg border border-border p-3">
                                    {result.errors.slice(0, 20).map((err, i) => (
                                        <p key={i} className="text-xs text-muted-foreground">
                                            {err.row > 0 ? `Row ${err.row}: ` : ''}{err.message}
                                        </p>
                                    ))}
                                    {result.errors.length > 20 && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            ...and {result.errors.length - 20} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="bg-gradient-gold px-5 py-2 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110"
                            >
                                {t('done')}
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
