'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Store } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function AdminLoginPage() {
    const locale = useLocale();
    const t = useTranslations('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError(t('loginError'));
            } else {
                window.location.href = `/${locale}/admin`;
            }
        } catch {
            setError(t('loginGenericError'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Store className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-foreground">{t('loginTitle')}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                            {t('email')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                            {t('password')}
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-gold py-3 text-sm font-semibold uppercase tracking-wide text-charcoal transition-all hover:brightness-110 disabled:opacity-60"
                    >
                        {loading ? t('signingIn') : t('signIn')}
                    </button>
                </form>
            </div>
        </div>
    );
}
