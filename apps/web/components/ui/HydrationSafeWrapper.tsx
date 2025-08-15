'use client';

import { ReactNode, useEffect, useState } from 'react';

interface HydrationSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that ensures safe hydration with React 19 and Next.js 15
 * Prevents useContext and other hydration-related errors
 */
export function HydrationSafeWrapper({ 
  children, 
  fallback = <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div> 
}: HydrationSafeWrapperProps): JSX.Element {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after the component mounts
    setIsHydrated(true);
  }, []);

  // Show fallback during server-side rendering and initial hydration
  if (!isHydrated) {
    return fallback as JSX.Element;
  }

  // Render children after hydration is complete
  return <>{children}</>;
}