import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '../components/providers/SessionProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InkGest - Gestión Integral para Centros de Tatuaje',
  description: 'Sistema completo de gestión para centros de tatuaje y arte corporal',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}