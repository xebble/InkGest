'use client';

import { ReactNode, useEffect, useState } from 'react';

interface React19CompatProviderProps {
  children: ReactNode;
}

/**
 * Compatibility provider for React 19 with Next.js 15
 * Delays rendering until after hydration to prevent useContext issues
 */
export function React19CompatProvider({ children }: React19CompatProviderProps): JSX.Element {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client flag after mount to ensure we're on the client
    setIsClient(true);
  }, []);

  // During SSR and initial hydration, render a minimal loading state
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // After hydration, render the actual content
  return <>{children}</>;
}