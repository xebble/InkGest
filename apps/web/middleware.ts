import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

// Simplified middleware for Next.js 15 - just handle internationalization
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default intlMiddleware;

export const config = {
  matcher: ['/', '/(ca|en|es)/:path*'],
};