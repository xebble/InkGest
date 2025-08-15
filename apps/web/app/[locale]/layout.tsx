import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { locales, type Locale } from '@/i18n/config';
import { Providers } from '@/components/providers/Providers';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

async function getMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    // Fallback to Spanish if locale messages fail to load
    try {
      return (await import(`@/messages/es.json`)).default;
    } catch (fallbackError) {
      // Return minimal messages if even fallback fails
      return {
        auth: {
          signIn: 'Sign In',
          email: 'Email',
          password: 'Password',
          signingIn: 'Signing in...',
          invalidCredentials: 'Invalid credentials',
          loginError: 'Login error'
        }
      };
    }
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<JSX.Element> {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Load messages for the locale
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preload critical resources to prevent chunk loading issues */}
        <link rel="preload" href="/_next/static/chunks/webpack.js" as="script" />
        <link rel="preload" href="/_next/static/chunks/main.js" as="script" />
        <link rel="preload" href="/_next/static/chunks/pages/_app.js" as="script" />
        {/* Add meta tag to help with chunk loading in Next.js 15 */}
        <meta name="next-chunk-loading" content="enabled" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers locale={locale as Locale}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}