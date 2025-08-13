'use client';

import { ReactNode } from 'react';
import { SessionProvider } from './SessionProvider';
import { ThemeProvider } from './ThemeProvider';
import { LocaleProvider } from './LocaleProvider';
import { Locale } from '../../types';

interface ProvidersProps {
  children: ReactNode;
  locale: Locale;
}

export function Providers({ children, locale }: ProvidersProps): JSX.Element {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LocaleProvider locale={locale}>
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}