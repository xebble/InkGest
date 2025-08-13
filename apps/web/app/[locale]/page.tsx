import Link from 'next/link';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps): Promise<JSX.Element> {
  const { locale } = await params;

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
        <div className="mt-8 text-center space-y-4">
          <div>
            <Link
              href="/signin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium inline-block"
            >
              Iniciar Sesión
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            <p>Credenciales de demo:</p>
            <p>Admin: admin@inkgest.demo / admin123</p>
            <p>Artista: artist@inkgest.demo / artist123</p>
          </div>
        </div>
      </div>
    </main>
  );
}