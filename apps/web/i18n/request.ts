import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;

  return {
    locale: locale || 'es',
    messages: (await import(`../messages/${locale || 'es'}.json`)).default,
  };
});