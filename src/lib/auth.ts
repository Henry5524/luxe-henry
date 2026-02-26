import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Check env-based admin first (quick bootstrap)
                if (
                    email === process.env.ADMIN_EMAIL &&
                    password === process.env.ADMIN_PASSWORD
                ) {
                    return { id: '0', email, name: 'Admin' };
                }

                // Check DB-based admins
                const [admin] = await db
                    .select()
                    .from(admins)
                    .where(eq(admins.email, email))
                    .limit(1);

                if (!admin) return null;

                const valid = await bcrypt.compare(password, admin.passwordHash);
                if (!valid) return null;

                return { id: String(admin.id), email: admin.email, name: 'Admin' };
            },
        }),
    ],
    pages: {
        signIn: '/admin/login',
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        authorized() {
            return true;
        },
    },
});
