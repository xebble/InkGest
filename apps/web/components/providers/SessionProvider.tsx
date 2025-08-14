'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps): JSX.Element {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure we're fully hydrated before initializing NextAuth
    setIsMounted(true);
  }, []);

  // During SSR and initial hydration, render children without NextAuth context
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <NextAuthSessionProvider
      // Prevent session refetch on window focus during hydration
      refetchOnWindowFocus={false}
      // Reduce refetch interval to prevent hydration conflicts
      refetchInterval={5 * 60} // 5 minutes
    >
      {children}
    </NextAuthSessionProvider>
  );
}