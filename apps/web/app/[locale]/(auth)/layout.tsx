import { getTranslations } from 'next-intl/server';

interface AuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AuthLayout({ 
  children, 
  params 
}: AuthLayoutProps): Promise<JSX.Element> {
  const { locale: _ } = await params;
  const t = await getTranslations('auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            InkGest
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}