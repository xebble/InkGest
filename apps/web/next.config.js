const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enabling React Strict Mode with Next.js 15 and React 19
  // These versions have better hydration handling
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils', 'hooks', 'services'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);