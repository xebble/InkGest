'use client';

import { ReactNode } from 'react';
import { ClientOnly } from '../ui/ClientOnly';
import { ThemeLoader } from '../ui/ThemeLoader';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { Theme } from '../../types';

interface HydrationSafeThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * Inner component that uses the theme context to show loading state
 */
function ThemeAwareChildren({ children }: { children: ReactNode }): JSX.Element {
  const { isLoading, isHydrated } = useTheme();
  
  return (
    <ThemeLoader 
      isLoading={!isHydrated || isLoading}
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      {children}
    </ThemeLoader>
  );
}

/**
 * HydrationSafeThemeProvider combines ClientOnly rendering with proper theme loading states
 * to prevent hydration mismatches and provide smooth theme transitions.
 */
export function HydrationSafeThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'inkgest-theme',
}: HydrationSafeThemeProviderProps): JSX.Element {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      <ThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
        <ThemeAwareChildren>
          {children}
        </ThemeAwareChildren>
      </ThemeProvider>
    </ClientOnly>
  );
}