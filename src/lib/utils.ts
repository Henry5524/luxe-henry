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
