import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{ protocol: 'https', hostname: '**' }],
    },
    experimental: {
        optimizePackageImports: ['next-intl'],
    },
    async redirects() {
        return [
            { source: '/uploads/placeholder.jpg', destination: '/placeholder.svg', permanent: false },
        ];
    },
    webpack: (config) => {
        // Suppress next-intl extractor "import(t)" cache parsing warnings (library limitation)
        config.infrastructureLogging = { level: 'error' };
        return config;
    },
};

export default withNextIntl(nextConfig);
