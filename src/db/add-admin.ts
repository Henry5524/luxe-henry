// Add admin script - run with: npm run db:add-admin
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

const sql = postgres((process.env.DATABASE_URL ?? process.env.POSTGRES_URL)!);
const db = drizzle(sql, { schema });

async function addAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
        process.exit(1);
    }

    console.log(`Adding admin: ${email}`);

    const passwordHash = await bcrypt.hash(password, 12);

    await db
        .insert(schema.admins)
        .values({ email, passwordHash })
        .onConflictDoUpdate({
            target: schema.admins.email,
            set: { passwordHash },
        });

    console.log('Admin added/updated successfully.');
    await sql.end();
}

addAdmin().catch((err) => {
    console.error('Failed to add admin:', err);
    process.exit(1);
});
