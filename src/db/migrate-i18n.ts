/**
 * Migration script to convert string columns to JSONB for i18n support.
 *
 * Run with: npx dotenv -e .env.local -- tsx src/db/migrate-i18n.ts
 *   or:    DATABASE_URL="..." npx tsx src/db/migrate-i18n.ts
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!DATABASE_URL) {
    console.error('DATABASE_URL or POSTGRES_URL is required');
    process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function migrate() {
    console.log('Starting i18n migration...\n');

    // Products: name (varchar -> jsonb)
    try {
        const nameType = await sql`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'name'
        `;
        if (nameType[0]?.data_type !== 'jsonb') {
            console.log('  Migrating products.name...');
            await sql`ALTER TABLE products ALTER COLUMN name TYPE jsonb USING jsonb_build_object('en', name::text, 'uz', '', 'ru', '')`;
        }
    } catch (e) { console.log('  products.name already migrated or error:', (e as Error).message); }

    // Products: description (text -> jsonb)
    try {
        const descType = await sql`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'description'
        `;
        if (descType[0]?.data_type !== 'jsonb') {
            console.log('  Migrating products.description...');
            await sql`ALTER TABLE products ALTER COLUMN description TYPE jsonb USING jsonb_build_object('en', COALESCE(description::text, ''), 'uz', '', 'ru', '')`;
        }
    } catch (e) { console.log('  products.description already migrated or error:', (e as Error).message); }

    // Products: material (varchar -> jsonb)
    try {
        const matType = await sql`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'material'
        `;
        if (matType[0]?.data_type !== 'jsonb') {
            console.log('  Migrating products.material...');
            await sql`ALTER TABLE products ALTER COLUMN material TYPE jsonb USING jsonb_build_object('en', COALESCE(material::text, ''), 'uz', '', 'ru', '')`;
        }
    } catch (e) { console.log('  products.material already migrated or error:', (e as Error).message); }

    // Categories: name (varchar -> jsonb)
    try {
        const catType = await sql`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'categories' AND column_name = 'name'
        `;
        if (catType[0]?.data_type !== 'jsonb') {
            console.log('  Migrating categories.name...');
            await sql`ALTER TABLE categories ALTER COLUMN name TYPE jsonb USING jsonb_build_object('en', name::text, 'uz', '', 'ru', '')`;
        }
    } catch (e) { console.log('  categories.name already migrated or error:', (e as Error).message); }

    // Brands: name (varchar -> jsonb)
    try {
        const brandType = await sql`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'brands' AND column_name = 'name'
        `;
        if (brandType[0]?.data_type !== 'jsonb') {
            console.log('  Migrating brands.name...');
            await sql`ALTER TABLE brands ALTER COLUMN name TYPE jsonb USING jsonb_build_object('en', name::text, 'uz', '', 'ru', '')`;
        }
    } catch (e) { console.log('  brands.name already migrated or error:', (e as Error).message); }

    // StoreConfig: heroTitle, heroSubtitle, heroCtaText, footerText
    for (const col of ['hero_title', 'hero_subtitle', 'hero_cta_text', 'footer_text']) {
        try {
            const colType = await sql`
                SELECT data_type FROM information_schema.columns
                WHERE table_name = 'store_config' AND column_name = ${col}
            `;
            if (colType[0]?.data_type !== 'jsonb') {
                console.log(`  Migrating store_config.${col}...`);
                await sql.unsafe(
                    `ALTER TABLE store_config ALTER COLUMN "${col}" TYPE jsonb USING jsonb_build_object('en', COALESCE("${col}"::text, ''), 'uz', '', 'ru', '')`,
                );
            }
        } catch (e) { console.log(`  store_config.${col} already migrated or error:`, (e as Error).message); }
    }

    console.log('\nMigration complete!');
    await sql.end();
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
