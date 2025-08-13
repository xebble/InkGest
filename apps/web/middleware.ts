import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './lib/i18n';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'always',
});

export default withAuth(
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.includes('/signin') || 
            req.nextUrl.pathname.includes('/auth')) {
          return true;
        }
        
        // Allow access to public pages
        if (req.nextUrl.pathname === '/' || 
            req.nextUrl.pathname.match(/^\/(ca|en|es)$/)) {
          return true;
        }
        
        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/', '/(ca|en|es)/:path*'],
};