import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type LocalizedField = { en: string; uz: string; ru: string };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function localize(
  field: LocalizedField | string | null | undefined,
  locale: string,
): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return (
    (field as Record<string, string>)[locale] ||
    field.en ||
    Object.values(field).find((v) => v) ||
    ''
  );
}

export function emptyLocalized(): LocalizedField {
  return { en: '', uz: '', ru: '' };
}

export function formatPrice(price: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateId(prefix = ''): string {
  const id = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${id}` : id;
}

/** URL for display: GCS (via signed-url proxy when private), /uploads/..., or placeholder when empty. */
export const PLACEHOLDER_IMAGE = '/placeholder.svg';

/** GCP Storage host so we can route those URLs through the signed-url API (private buckets). */
const GCS_HOST = 'https://storage.googleapis.com/';

export function getImageUrl(url: string | null | undefined): string {
  const u = (url && url.trim()) ? url.trim() : '';
  if (!u) return PLACEHOLDER_IMAGE;
  // Route GCP Storage URLs through our API to get a signed URL (fixes 403 on private buckets).
  if (u.startsWith(GCS_HOST)) {
    return `/api/signed-url?url=${encodeURIComponent(u)}`;
  }
  return u;
}
