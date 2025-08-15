'use client';

import React from 'react';
import { SessionProvider } from './SessionProvider';
import { ThemeProvider } from './ThemeProvider';
import { LocaleProvider } from './LocaleProvider';
import { ProviderErrorBoundary } from './ProviderErrorBoundary';
import { HydrationMonitor } from './HydrationMonitor';
import { ClientOnly } from '../ui/ClientOnly';
import { Locale } from '../../types';

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
}

export function Providers({ children, locale }: ProvidersProps): JSX.Element {
  return (
    <ProviderErrorBoundary>
      <HydrationMonitor />
      <SessionProvider>
        <ClientOnly fallback={<div className="min-h-screen bg-white dark:bg-gray-900" />}>
          <ThemeProvider>
            <LocaleProvider locale={locale}>
              {children}
            </LocaleProvider>
          </ThemeProvider>
        </ClientOnly>
      </SessionProvider>
    </ProviderErrorBoundary>
  );
}