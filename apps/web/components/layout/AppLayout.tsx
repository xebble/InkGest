'use client';

import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
  title?: string | undefined;
  className?: string;
}

export function AppLayout({ children, title, className = '' }: AppLayoutProps): JSX.Element {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <AppHeader title={title} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}