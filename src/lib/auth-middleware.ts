/**
 * Minimal NextAuth config for Edge middleware only.
 * No Credentials provider, db, or bcrypt — safe for Edge Runtime.
 * Shares session/secret with full auth so req.auth works.
 */
import NextAuth from 'next-auth';

export const { auth } = NextAuth({
    providers: [],
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
