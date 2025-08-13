const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    domains: ['localhost'],
  },
};

module.exports = withNextIntl(nextConfig);