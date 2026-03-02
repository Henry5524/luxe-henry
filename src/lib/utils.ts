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

/** URL for display: GCS (via signed-url API with object path), /uploads/..., or placeholder when empty. */
export const PLACEHOLDER_IMAGE = '/placeholder.svg';

const GCS_HOST = 'https://storage.googleapis.com/';

/** Extract object path from full GCP URL: https://storage.googleapis.com/bucket/uploads/xxx.png → uploads/xxx.png */
function getGcsObjectPath(fullUrl: string): string | null {
  if (!fullUrl.startsWith(GCS_HOST)) return null;
  try {
    const u = new URL(fullUrl);
    const segments = u.pathname.replace(/^\/+/, '').split('/');
    if (segments.length < 2) return null;
    return segments.slice(1).join('/');
  } catch {
    return null;
  }
}

export function getImageUrl(url: string | null | undefined): string {
  const u = (url && url.trim()) ? url.trim() : '';
  if (!u) return PLACEHOLDER_IMAGE;
  const objectPath = getGcsObjectPath(u);
  if (objectPath) {
    return `/api/signed-url?object=${encodeURIComponent(objectPath)}&redirect=1`;
  }
  return u;
}
