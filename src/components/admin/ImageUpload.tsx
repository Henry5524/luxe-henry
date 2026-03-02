'use client';

import { useRef, useState } from 'react';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setUploading(true);

        try {
            const formData = new FormData();
            formData.set('file', file);

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }
            if (data.url) {
                onChange(data.url);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    return (
        <div className="mt-1 space-y-2">
            <div
                onClick={() => !uploading && inputRef.current?.click()}
                className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors hover:bg-muted/60 ${value ? 'border-primary/30' : ''}`}
            >
                {value ? (
                    <img
                        src={value}
                        alt="Preview"
                        className="h-full w-full rounded-lg object-cover object-center"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {uploading ? 'Uploading…' : 'Click to select file'}
                    </p>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <input
                type="text"
                placeholder="Or paste image URL or path"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 w-full rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
        </div>
    );
}
