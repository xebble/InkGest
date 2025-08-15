'use client';

import React from 'react';
import { SessionProvider } from './SessionProvider';
import { ThemeProvider } from './ThemeProvider';
import { LocaleProvider } from './LocaleProvider';
import { ProviderErrorBoundary } from './ProviderErrorBoundary';
import { ChunkLoadErrorBoundary } from './ChunkLoadErrorBoundary';
import { React19CompatProvider } from './React19CompatProvider';
import { Locale } from '../../types';

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
}

export function Providers({ children, locale }: ProvidersProps): JSX.Element {
  return (
    <ChunkLoadErrorBoundary>
      <ProviderErrorBoundary>
        <React19CompatProvider>
          <SessionProvider>
            <ThemeProvider>
              <LocaleProvider locale={locale}>
                {children}
              </LocaleProvider>
            </ThemeProvider>
          </SessionProvider>
        </React19CompatProvider>
      </ProviderErrorBoundary>
    </ChunkLoadErrorBoundary>
  );
}