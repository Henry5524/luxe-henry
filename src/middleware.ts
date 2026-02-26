import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const intlMiddleware = createIntlMiddleware(routing);

const localePattern = routing.locales.join('|');
const adminRegex = new RegExp(`^/(${localePattern})/admin(?!/login)`);

export default auth((req) => {
    const { pathname } = req.nextUrl;

    const match = pathname.match(adminRegex);
    if (match && !req.auth?.user) {
        const locale = match[1];
        return NextResponse.redirect(
            new URL(`/${locale}/admin/login`, req.url),
        );
    }

    return intlMiddleware(req);
});

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
