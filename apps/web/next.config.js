const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode re-enabled with comprehensive hydration safeguards
  // Hydration-safe components and error handling implemented to prevent
  // "removeChild" DOM errors. See: .kiro/specs/fix-login-hydration-error/
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
    domains: ['localhost'],
  },
};

module.exports = withNextIntl(nextConfig);