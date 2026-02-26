import {
    pgTable,
    text,
    boolean,
    integer,
    numeric,
    jsonb,
    timestamp,
    serial,
    varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { LocalizedField } from '@/lib/utils';

// ─── Store Configuration ────────────────────────────────────────────────────
export const storeConfig = pgTable('store_config', {
    id: serial('id').primaryKey(),
    storeName: varchar('store_name', { length: 255 }).notNull().default('Luxe Store'),
    heroEnabled: boolean('hero_enabled').notNull().default(true),
    heroTitle: jsonb('hero_title').$type<LocalizedField>().notNull().default({ en: 'Timeless Elegance', uz: '', ru: '' }),
    heroSubtitle: jsonb('hero_subtitle').$type<LocalizedField>().notNull().default({ en: 'Discover our curated collection.', uz: '', ru: '' }),
    heroCtaText: jsonb('hero_cta_text').$type<LocalizedField>().notNull().default({ en: 'Shop Collection', uz: '', ru: '' }),
    heroCtaLink: varchar('hero_cta_link', { length: 255 }).notNull().default('/catalog'),
    heroImageUrl: text('hero_image_url').notNull().default('/uploads/hero-jewelry.jpg'),
    footerText: jsonb('footer_text').$type<LocalizedField>().notNull().default({ en: 'Fine products crafted with passion.', uz: '', ru: '' }),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    locale: varchar('locale', { length: 20 }).notNull().default('en-US'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Categories ─────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: jsonb('name').$type<LocalizedField>().notNull().default({ en: '', uz: '', ru: '' }),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    imageUrl: text('image_url').notNull().default('/uploads/placeholder.jpg'),
    parentId: varchar('parent_id', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
    }),
    children: many(categories),
    products: many(products),
}));

// ─── Brands ─────────────────────────────────────────────────────────────────
export const brands = pgTable('brands', {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: jsonb('name').$type<LocalizedField>().notNull().default({ en: '', uz: '', ru: '' }),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
    products: many(products),
}));

// ─── Products ───────────────────────────────────────────────────────────────
export const products = pgTable('products', {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: jsonb('name').$type<LocalizedField>().notNull().default({ en: '', uz: '', ru: '' }),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: jsonb('description').$type<LocalizedField>().notNull().default({ en: '', uz: '', ru: '' }),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    categoryId: varchar('category_id', { length: 100 }).notNull(),
    brandId: varchar('brand_id', { length: 100 }).notNull(),
    material: jsonb('material').$type<LocalizedField>().default({ en: '', uz: '', ru: '' }),
    weight: varchar('weight', { length: 100 }),
    inStock: boolean('in_stock').notNull().default(true),
    featured: boolean('featured').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const productsRelations = relations(products, ({ one }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id],
    }),
}));

// ─── Admins ─────────────────────────────────────────────────────────────────
export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─── TypeScript types ────────────────────────────────────────────────────────
export type StoreConfig = typeof storeConfig.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Admin = typeof admins.$inferSelect;

export type InsertCategory = typeof categories.$inferInsert;
export type InsertBrand = typeof brands.$inferInsert;
export type InsertProduct = typeof products.$inferInsert;
