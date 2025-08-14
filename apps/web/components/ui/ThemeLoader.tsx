'use client';

import { ReactNode } from 'react';

interface ThemeLoaderProps {
  children: ReactNode;
  isLoading: boolean;
  fallback?: ReactNode;
}

/**
 * ThemeLoader component that shows a fallback while theme is being initialized
 * to prevent hydration mismatches and flash of unstyled content.
 */
export function ThemeLoader({ 
  children, 
  isLoading, 
  fallback = <div className="min-h-screen bg-white" /> 
}: ThemeLoaderProps): JSX.Element {
  if (isLoading) {
    return fallback as JSX.Element;
  }

  return <>{children}</>;
}