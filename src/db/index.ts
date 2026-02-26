import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Vercel/Neon uses POSTGRES_URL, local uses DATABASE_URL
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL!;

// Prevent multiple connections in development (hot-reload)
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(connectionString);

if (process.env.NODE_ENV !== 'production') {
    globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
