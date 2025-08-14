import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { locales, type Locale } from '@/i18n/config';
import { Providers } from '@/components/providers/Providers';
import { ClientOnly } from '@/components/ui/ClientOnly';
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
    return (await import(`@/messages/es.json`)).default;
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
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
            <Providers locale={locale as Locale}>
              {children}
            </Providers>
          </ClientOnly>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}