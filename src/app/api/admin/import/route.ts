import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, brands, products } from '@/db/schema';
import { auth } from '@/lib/auth';
import { parseFileContent, type EntityType, type ImportError } from '@/lib/import-utils';
import { generateSlug, generateId } from '@/lib/utils';

async function guard() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return null;
}

export async function POST(request: NextRequest) {
    const err = await guard();
    if (err) return err;

    try {
        const body = await request.json();
        const { entityType, format, data } = body as {
            entityType: EntityType;
            format: 'csv' | 'json';
            data: string;
        };

        if (!entityType || !format || !data) {
            return NextResponse.json({ error: 'entityType, format, and data are required' }, { status: 400 });
        }

        const { entities, errors } = parseFileContent(data, format, entityType);

        if (entities.length === 0) {
            return NextResponse.json({ success: 0, errors: errors.length ? errors : [{ row: 0, message: 'No valid rows found' }] });
        }

        let success = 0;
        const importErrors: ImportError[] = [...errors];

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            try {
                if (entityType === 'categories') {
                    await db.insert(categories).values({
                        id: entity.id as string,
                        name: entity.name as any,
                        slug: (entity.slug as string) || generateSlug((entity.name as any).en),
                        imageUrl: (entity.imageUrl as string) || '/placeholder.svg',
                        parentId: (entity.parentId as string) || null,
                        sortOrder: (entity.sortOrder as number) || 0,
                    }).onConflictDoUpdate({
                        target: categories.id,
                        set: {
                            name: entity.name as any,
                            slug: (entity.slug as string) || generateSlug((entity.name as any).en),
                            imageUrl: (entity.imageUrl as string) || '/placeholder.svg',
                            parentId: (entity.parentId as string) || null,
                            sortOrder: (entity.sortOrder as number) || 0,
                        },
                    });
                } else if (entityType === 'brands') {
                    await db.insert(brands).values({
                        id: entity.id as string,
                        name: entity.name as any,
                        slug: (entity.slug as string) || generateSlug((entity.name as any).en),
                    }).onConflictDoUpdate({
                        target: brands.id,
                        set: {
                            name: entity.name as any,
                            slug: (entity.slug as string) || generateSlug((entity.name as any).en),
                        },
                    });
                } else {
                    await db.insert(products).values({
                        id: (entity.id as string) || generateId(),
                        name: entity.name as any,
                        slug: (entity.slug as string) || generateSlug((entity.name as any).en),
                        description: entity.description as any,
                        price: entity.price as string,
                        compareAtPrice: (entity.compareAtPrice as string) || null,
                        images: (entity.images as string[]) || [],
                        categoryId: entity.categoryId as string,
                        brandId: entity.brandId as string,
                        material: entity.material as any,
                        weight: (entity.weight as string) || null,
                        inStock: entity.inStock as boolean,
                        featured: entity.featured as boolean,
                    }).onConflictDoUpdate({
                        target: products.id,
                        set: {
                            name: entity.name as any,
                            slug: (entity.slug as string) || generateSlug((entity.name as any).en),
                            description: entity.description as any,
                            price: entity.price as string,
                            compareAtPrice: (entity.compareAtPrice as string) || null,
                            images: (entity.images as string[]) || [],
                            categoryId: entity.categoryId as string,
                            brandId: entity.brandId as string,
                            material: entity.material as any,
                            weight: (entity.weight as string) || null,
                            inStock: entity.inStock as boolean,
                            featured: entity.featured as boolean,
                        },
                    });
                }
                success++;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                importErrors.push({ row: i + 1, message: msg });
            }
        }

        return NextResponse.json({ success, errors: importErrors });
    } catch (error) {
        console.error('[admin/import POST]', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
