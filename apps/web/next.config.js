const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TEMPORARY: Disabling React Strict Mode to isolate hydration issue
  // Will re-enable once the root cause is identified and fixed
  // See: .kiro/specs/fix-login-hydration-error/
  reactStrictMode: false,
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