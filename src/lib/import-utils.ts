import Papa from 'papaparse';
import type { LocalizedField } from './utils';
import { generateSlug, generateId } from './utils';

export type EntityType = 'categories' | 'brands' | 'products';

export interface ImportError {
    row: number;
    message: string;
}

export interface ParseResult {
    entities: Record<string, unknown>[];
    errors: ImportError[];
}

const LOCALES = ['en', 'uz', 'ru'] as const;

function buildLocalized(row: Record<string, string>, prefix: string): LocalizedField {
    return {
        en: row[`${prefix}_en`]?.trim() ?? '',
        uz: row[`${prefix}_uz`]?.trim() ?? '',
        ru: row[`${prefix}_ru`]?.trim() ?? '',
    };
}

function toBool(val: string | undefined): boolean {
    if (!val) return false;
    return val.trim().toLowerCase() === 'true' || val.trim() === '1';
}

// ─── CSV Parsing ────────────────────────────────────────────────────────────

function parseCSVRows(csv: string): Record<string, string>[] {
    const result = Papa.parse<Record<string, string>>(csv.trim(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
    });
    return result.data;
}

function csvRowToCategory(row: Record<string, string>, idx: number): { entity: Record<string, unknown> | null; error: ImportError | null } {
    const name = buildLocalized(row, 'name');
    if (!name.en) return { entity: null, error: { row: idx + 1, message: 'name_en is required' } };
    const slug = row.slug?.trim() || generateSlug(name.en);
    const id = row.id?.trim() || slug;
    return {
        entity: {
            id,
            name,
            slug,
            imageUrl: row.imageUrl?.trim() || '/placeholder.svg',
            parentId: row.parentId?.trim() || null,
            sortOrder: parseInt(row.sortOrder ?? '0', 10) || 0,
        },
        error: null,
    };
}

function csvRowToBrand(row: Record<string, string>, idx: number): { entity: Record<string, unknown> | null; error: ImportError | null } {
    const name = buildLocalized(row, 'name');
    if (!name.en) return { entity: null, error: { row: idx + 1, message: 'name_en is required' } };
    const slug = row.slug?.trim() || generateSlug(name.en);
    const id = row.id?.trim() || slug;
    return { entity: { id, name, slug }, error: null };
}

function csvRowToProduct(row: Record<string, string>, idx: number): { entity: Record<string, unknown> | null; error: ImportError | null } {
    const name = buildLocalized(row, 'name');
    if (!name.en) return { entity: null, error: { row: idx + 1, message: 'name_en is required' } };
    const price = row.price?.trim();
    if (!price || isNaN(Number(price))) return { entity: null, error: { row: idx + 1, message: 'valid price is required' } };
    if (!row.categoryId?.trim()) return { entity: null, error: { row: idx + 1, message: 'categoryId is required' } };
    if (!row.brandId?.trim()) return { entity: null, error: { row: idx + 1, message: 'brandId is required' } };

    const slug = row.slug?.trim() || generateSlug(name.en);
    const id = row.id?.trim() || generateId();
    const images = row.images?.trim() ? row.images.trim().split('|').map((u) => u.trim()).filter(Boolean) : [];

    return {
        entity: {
            id,
            name,
            slug,
            description: buildLocalized(row, 'description'),
            price,
            compareAtPrice: row.compareAtPrice?.trim() || null,
            images,
            categoryId: row.categoryId.trim(),
            brandId: row.brandId.trim(),
            material: buildLocalized(row, 'material'),
            weight: row.weight?.trim() || null,
            inStock: toBool(row.inStock ?? 'true'),
            featured: toBool(row.featured),
        },
        error: null,
    };
}

export function parseCSVToEntities(csv: string, entityType: EntityType): ParseResult {
    const rows = parseCSVRows(csv);
    const entities: Record<string, unknown>[] = [];
    const errors: ImportError[] = [];

    const converter = entityType === 'categories' ? csvRowToCategory : entityType === 'brands' ? csvRowToBrand : csvRowToProduct;

    rows.forEach((row, idx) => {
        const { entity, error } = converter(row, idx);
        if (error) errors.push(error);
        if (entity) entities.push(entity);
    });

    return { entities, errors };
}

// ─── JSON Parsing ───────────────────────────────────────────────────────────

function ensureLocalized(val: unknown): LocalizedField {
    if (!val) return { en: '', uz: '', ru: '' };
    if (typeof val === 'string') return { en: val, uz: '', ru: '' };
    const obj = val as Record<string, string>;
    return { en: obj.en ?? '', uz: obj.uz ?? '', ru: obj.ru ?? '' };
}

function validateCategoryJSON(item: Record<string, unknown>, idx: number): ImportError | null {
    const name = ensureLocalized(item.name);
    if (!name.en) return { row: idx + 1, message: 'name.en is required' };
    return null;
}

function validateBrandJSON(item: Record<string, unknown>, idx: number): ImportError | null {
    const name = ensureLocalized(item.name);
    if (!name.en) return { row: idx + 1, message: 'name.en is required' };
    return null;
}

function validateProductJSON(item: Record<string, unknown>, idx: number): ImportError | null {
    const name = ensureLocalized(item.name);
    if (!name.en) return { row: idx + 1, message: 'name.en is required' };
    if (!item.price || isNaN(Number(item.price))) return { row: idx + 1, message: 'valid price is required' };
    if (!item.categoryId) return { row: idx + 1, message: 'categoryId is required' };
    if (!item.brandId) return { row: idx + 1, message: 'brandId is required' };
    return null;
}

export function parseJSONToEntities(json: string, entityType: EntityType): ParseResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return { entities: [], errors: [{ row: 0, message: 'Invalid JSON' }] };
    }
    if (!Array.isArray(parsed)) {
        return { entities: [], errors: [{ row: 0, message: 'JSON must be an array' }] };
    }

    const validator = entityType === 'categories' ? validateCategoryJSON : entityType === 'brands' ? validateBrandJSON : validateProductJSON;
    const entities: Record<string, unknown>[] = [];
    const errors: ImportError[] = [];

    parsed.forEach((item: Record<string, unknown>, idx: number) => {
        const error = validator(item, idx);
        if (error) {
            errors.push(error);
            return;
        }

        const name = ensureLocalized(item.name);
        const slug = (item.slug as string)?.trim() || generateSlug(name.en);
        const id = (item.id as string)?.trim() || (entityType === 'products' ? generateId() : slug);

        if (entityType === 'categories') {
            entities.push({
                id,
                name,
                slug,
                imageUrl: (item.imageUrl as string) || '/placeholder.svg',
                parentId: (item.parentId as string) || null,
                sortOrder: Number(item.sortOrder) || 0,
            });
        } else if (entityType === 'brands') {
            entities.push({ id, name, slug });
        } else {
            entities.push({
                id,
                name,
                slug,
                description: ensureLocalized(item.description),
                price: String(item.price),
                compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : null,
                images: Array.isArray(item.images) ? item.images : [],
                categoryId: item.categoryId,
                brandId: item.brandId,
                material: ensureLocalized(item.material),
                weight: (item.weight as string) || null,
                inStock: item.inStock !== false,
                featured: item.featured === true,
            });
        }
    });

    return { entities, errors };
}

// ─── Auto-detect format ─────────────────────────────────────────────────────

export function parseFileContent(content: string, format: 'csv' | 'json', entityType: EntityType): ParseResult {
    return format === 'json'
        ? parseJSONToEntities(content, entityType)
        : parseCSVToEntities(content, entityType);
}

// ─── CSV Export (flatten DB records) ────────────────────────────────────────

function flatLocalized(field: unknown, prefix: string): Record<string, string> {
    const f = ensureLocalized(field);
    const out: Record<string, string> = {};
    for (const l of LOCALES) out[`${prefix}_${l}`] = f[l];
    return out;
}

export function flattenCategoriesForCSV(rows: Record<string, unknown>[]): Record<string, string>[] {
    return rows.map((r) => ({
        id: String(r.id ?? ''),
        ...flatLocalized(r.name, 'name'),
        slug: String(r.slug ?? ''),
        imageUrl: String(r.imageUrl ?? ''),
        parentId: String(r.parentId ?? ''),
        sortOrder: String(r.sortOrder ?? '0'),
    }));
}

export function flattenBrandsForCSV(rows: Record<string, unknown>[]): Record<string, string>[] {
    return rows.map((r) => ({
        id: String(r.id ?? ''),
        ...flatLocalized(r.name, 'name'),
        slug: String(r.slug ?? ''),
    }));
}

export function flattenProductsForCSV(rows: Record<string, unknown>[]): Record<string, string>[] {
    return rows.map((r) => ({
        id: String(r.id ?? ''),
        ...flatLocalized(r.name, 'name'),
        slug: String(r.slug ?? ''),
        ...flatLocalized(r.description, 'description'),
        price: String(r.price ?? ''),
        compareAtPrice: String(r.compareAtPrice ?? ''),
        images: Array.isArray(r.images) ? (r.images as string[]).join('|') : '',
        categoryId: String(r.categoryId ?? ''),
        brandId: String(r.brandId ?? ''),
        ...flatLocalized(r.material, 'material'),
        weight: String(r.weight ?? ''),
        inStock: String(r.inStock ?? 'true'),
        featured: String(r.featured ?? 'false'),
    }));
}

export function entitiesToCSV(rows: Record<string, string>[]): string {
    return Papa.unparse(rows);
}

// ─── CSV Templates ──────────────────────────────────────────────────────────

export const CATEGORY_HEADERS = ['id', 'name_en', 'name_uz', 'name_ru', 'slug', 'imageUrl', 'parentId', 'sortOrder'];
export const BRAND_HEADERS = ['id', 'name_en', 'name_uz', 'name_ru', 'slug'];
export const PRODUCT_HEADERS = [
    'id', 'name_en', 'name_uz', 'name_ru', 'slug',
    'description_en', 'description_uz', 'description_ru',
    'price', 'compareAtPrice', 'images',
    'categoryId', 'brandId',
    'material_en', 'material_uz', 'material_ru',
    'weight', 'inStock', 'featured',
];

const CATEGORY_EXAMPLE: Record<string, string>[] = [
    { id: 'rings', name_en: 'Rings', name_uz: 'Uzuklar', name_ru: 'Кольца', slug: 'rings', imageUrl: '/uploads/rings.jpg', parentId: '', sortOrder: '0' },
    { id: 'engagement', name_en: 'Engagement', name_uz: 'Unashtiruv', name_ru: 'Помолвка', slug: 'engagement', imageUrl: '', parentId: 'rings', sortOrder: '1' },
];

const BRAND_EXAMPLE: Record<string, string>[] = [
    { id: 'aurum', name_en: 'Aurum', name_uz: 'Aurum', name_ru: 'Аурум', slug: 'aurum' },
];

const PRODUCT_EXAMPLE: Record<string, string>[] = [
    {
        id: 'ring-001', name_en: 'Diamond Ring', name_uz: 'Olmos uzuk', name_ru: 'Бриллиантовое кольцо',
        slug: 'diamond-ring', description_en: 'A beautiful diamond ring', description_uz: 'Chiroyli olmos uzuk', description_ru: 'Красивое бриллиантовое кольцо',
        price: '4250', compareAtPrice: '5000', images: '/uploads/ring1.jpg|/uploads/ring2.jpg',
        categoryId: 'rings', brandId: 'aurum',
        material_en: '18K Gold', material_uz: '18K Oltin', material_ru: '18К Золото',
        weight: '3.2g', inStock: 'true', featured: 'true',
    },
];

export function getTemplate(entityType: EntityType): string {
    const headers = entityType === 'categories' ? CATEGORY_HEADERS : entityType === 'brands' ? BRAND_HEADERS : PRODUCT_HEADERS;
    const examples = entityType === 'categories' ? CATEGORY_EXAMPLE : entityType === 'brands' ? BRAND_EXAMPLE : PRODUCT_EXAMPLE;
    return Papa.unparse({ fields: headers, data: examples });
}
