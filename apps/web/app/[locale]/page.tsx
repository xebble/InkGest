import { getTranslations } from 'next-intl/server';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps): Promise<JSX.Element> {
  const { locale } = await params;
  const t = await getTranslations('common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          InkGest
        </h1>
        <p className="text-center text-lg mb-4">
          Sistema de Gestión Integral para Centros de Tatuaje
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Idioma actual: {locale}
        </p>
        <div className="mt-8 text-center">
          <p className="text-sm">{t('loading')}</p>
        </div>
      </div>
    </main>
  );
}