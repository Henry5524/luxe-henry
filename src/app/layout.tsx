import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Luxe Store',
    description: 'Premium products curated for the discerning buyer.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning>
            <body>{children}</body>
        </html>
    );
}
