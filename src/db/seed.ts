// Seed script - run with: npm run db:seed
// NOTE: Run AFTER db:push or db:migrate
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const sql = postgres((process.env.DATABASE_URL ?? process.env.POSTGRES_URL)!);
const db = drizzle(sql, { schema });

const l = (en: string) => ({ en, uz: '', ru: '' });

async function seed() {
    console.log('Seeding database...');

    await db.insert(schema.storeConfig).values({
        storeName: 'AURUM',
        heroEnabled: true,
        heroTitle: l('Timeless Elegance'),
        heroSubtitle: l('Discover our curated collection of fine jewelry, crafted with passion and precision.'),
        heroCtaText: l('Shop Collection'),
        heroCtaLink: '/catalog',
        heroImageUrl: '/uploads/hero-jewelry.jpg',
        footerText: l('Fine jewelry crafted with passion and precision. Each piece tells a story of timeless elegance.'),
        currency: 'USD',
        locale: 'en-US',
    }).onConflictDoNothing();

    const cats = [
        { id: 'rings', name: l('Rings'), slug: 'rings', imageUrl: '/uploads/cat-rings.jpg', parentId: null, sortOrder: 0 },
        { id: 'necklaces', name: l('Necklaces'), slug: 'necklaces', imageUrl: '/uploads/cat-necklaces.jpg', parentId: null, sortOrder: 1 },
        { id: 'earrings', name: l('Earrings'), slug: 'earrings', imageUrl: '/uploads/cat-earrings.jpg', parentId: null, sortOrder: 2 },
        { id: 'bracelets', name: l('Bracelets'), slug: 'bracelets', imageUrl: '/uploads/cat-bracelets.jpg', parentId: null, sortOrder: 3 },
        { id: 'engagement-rings', name: l('Engagement'), slug: 'engagement-rings', imageUrl: '/uploads/cat-rings.jpg', parentId: 'rings', sortOrder: 0 },
        { id: 'wedding-bands', name: l('Wedding Bands'), slug: 'wedding-bands', imageUrl: '/uploads/cat-rings.jpg', parentId: 'rings', sortOrder: 1 },
        { id: 'pendant-necklaces', name: l('Pendants'), slug: 'pendant-necklaces', imageUrl: '/uploads/cat-necklaces.jpg', parentId: 'necklaces', sortOrder: 0 },
        { id: 'chain-necklaces', name: l('Chains'), slug: 'chain-necklaces', imageUrl: '/uploads/cat-necklaces.jpg', parentId: 'necklaces', sortOrder: 1 },
        { id: 'stud-earrings', name: l('Studs'), slug: 'stud-earrings', imageUrl: '/uploads/cat-earrings.jpg', parentId: 'earrings', sortOrder: 0 },
        { id: 'drop-earrings', name: l('Drop Earrings'), slug: 'drop-earrings', imageUrl: '/uploads/cat-earrings.jpg', parentId: 'earrings', sortOrder: 1 },
    ];
    for (const cat of cats) {
        await db.insert(schema.categories).values(cat).onConflictDoNothing();
    }

    const brnds = [
        { id: 'aurum', name: l('Aurum'), slug: 'aurum' },
        { id: 'celestine', name: l('Celestine'), slug: 'celestine' },
        { id: 'maison-lumiere', name: l('Maison Lumière'), slug: 'maison-lumiere' },
        { id: 'oro-fino', name: l('Oro Fino'), slug: 'oro-fino' },
    ];
    for (const b of brnds) {
        await db.insert(schema.brands).values(b).onConflictDoNothing();
    }

    const prods: schema.InsertProduct[] = [
        {
            id: '1', name: l('Soleil Diamond Ring'), slug: 'soleil-diamond-ring',
            description: l('A stunning solitaire diamond ring set in 18k yellow gold.'),
            price: '4250', compareAtPrice: '5000',
            images: ['/uploads/cat-rings.jpg'],
            categoryId: 'engagement-rings', brandId: 'aurum',
            material: l('18k Yellow Gold, Diamond'), weight: '3.2g',
            inStock: true, featured: true,
        },
        {
            id: '2', name: l('Luna Pendant Necklace'), slug: 'luna-pendant-necklace',
            description: l('An elegant teardrop pendant suspended on a delicate gold chain.'),
            price: '1850', compareAtPrice: null,
            images: ['/uploads/cat-necklaces.jpg'],
            categoryId: 'pendant-necklaces', brandId: 'celestine',
            material: l('14k Gold'), weight: '5.8g',
            inStock: true, featured: true,
        },
        {
            id: '3', name: l('Étoile Diamond Earrings'), slug: 'etoile-diamond-earrings',
            description: l('Exquisite drop earrings featuring round brilliant diamonds.'),
            price: '3600', compareAtPrice: '4200',
            images: ['/uploads/cat-earrings.jpg'],
            categoryId: 'drop-earrings', brandId: 'maison-lumiere',
            material: l('18k Rose Gold, Diamonds'), weight: '4.1g',
            inStock: true, featured: true,
        },
        {
            id: '4', name: l('Catena Gold Bracelet'), slug: 'catena-gold-bracelet',
            description: l('A bold Cuban link bracelet crafted in solid 18k gold.'),
            price: '6800', compareAtPrice: null,
            images: ['/uploads/cat-bracelets.jpg'],
            categoryId: 'bracelets', brandId: 'oro-fino',
            material: l('18k Yellow Gold'), weight: '28g',
            inStock: true, featured: true,
        },
        {
            id: '5', name: l('Aria Wedding Band'), slug: 'aria-wedding-band',
            description: l('A classic wedding band with a modern twist.'),
            price: '2200', compareAtPrice: null,
            images: ['/uploads/cat-rings.jpg'],
            categoryId: 'wedding-bands', brandId: 'aurum',
            material: l('Platinum, Diamonds'), weight: '4.5g',
            inStock: true, featured: false,
        },
        {
            id: '6', name: l('Serpentine Chain Necklace'), slug: 'serpentine-chain-necklace',
            description: l('A sleek serpentine chain necklace in polished gold.'),
            price: '1200', compareAtPrice: null,
            images: ['/uploads/cat-necklaces.jpg'],
            categoryId: 'chain-necklaces', brandId: 'oro-fino',
            material: l('14k Yellow Gold'), weight: '8.2g',
            inStock: true, featured: false,
        },
        {
            id: '7', name: l('Brilliance Stud Earrings'), slug: 'brilliance-stud-earrings',
            description: l('Classic diamond stud earrings featuring perfectly matched round brilliant diamonds.'),
            price: '2800', compareAtPrice: null,
            images: ['/uploads/cat-earrings.jpg'],
            categoryId: 'stud-earrings', brandId: 'celestine',
            material: l('18k White Gold, Diamonds'), weight: '2.4g',
            inStock: true, featured: false,
        },
        {
            id: '8', name: l('Regale Signet Ring'), slug: 'regale-signet-ring',
            description: l('A modern take on the classic signet ring.'),
            price: '1950', compareAtPrice: null,
            images: ['/uploads/cat-rings.jpg'],
            categoryId: 'rings', brandId: 'maison-lumiere',
            material: l('18k Yellow Gold'), weight: '12g',
            inStock: false, featured: false,
        },
    ];
    for (const p of prods) {
        await db.insert(schema.products).values(p).onConflictDoNothing();
    }

    console.log('Seeding complete!');
    await sql.end();
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
