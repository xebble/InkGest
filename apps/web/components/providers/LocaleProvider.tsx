'use client';

import React, { createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '../../types';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: readonly Locale[];
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
  locale: Locale;
}

export function LocaleProvider({ children, locale }: LocaleProviderProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  
  const availableLocales: readonly Locale[] = ['es', 'ca', 'en'] as const;

  const setLocale = (newLocale: Locale): void => {
    // Extract the current path without the locale prefix
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    
    // Navigate to the new locale path
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath as any);
  };

  const value: LocaleContextType = {
    locale,
    setLocale,
    availableLocales,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}