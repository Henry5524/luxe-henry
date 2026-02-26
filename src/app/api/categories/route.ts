import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
    try {
        const allCats = await db
            .select()
            .from(categories)
            .orderBy(asc(categories.sortOrder));

        // Build a tree structure
        const map = new Map<string, typeof allCats[0] & { children?: typeof allCats }>();
        allCats.forEach((c) => map.set(c.id, { ...c, children: [] }));

        const tree: typeof allCats = [];
        map.forEach((cat) => {
            if (cat.parentId) {
                const parent = map.get(cat.parentId);
                if (parent) {
                    parent.children = parent.children ?? [];
                    parent.children.push(cat);
                }
            } else {
                tree.push(cat);
            }
        });

        return NextResponse.json({ categories: allCats, tree });
    } catch (error) {
        console.error('[categories GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
