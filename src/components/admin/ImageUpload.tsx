'use client';

import { useRef, useState } from 'react';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const previousUrl = value;
        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) {
                if (previousUrl && previousUrl.startsWith('http')) {
                    const { deleteUploadedImage } = await import('@/lib/upload');
                    deleteUploadedImage(previousUrl);
                }
                onChange(data.url);
            }
        } catch {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="mt-1 space-y-2">
            <div
                className="flex h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors hover:bg-muted/70"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                }}
            >
                {uploading ? (
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                ) : value ? (
                    <img src={value} alt="Preview" className="h-full w-full rounded-lg object-cover" />
                ) : (
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Drop an image or click to upload</p>
                        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP up to 10MB</p>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
                <input
                    type="text"
                    placeholder="Or paste image URL…"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}
