import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'InkGest - Gestión Integral para Centros de Tatuaje',
  description: 'Sistema completo de gestión para centros de tatuaje y arte corporal',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return children as JSX.Element;
}