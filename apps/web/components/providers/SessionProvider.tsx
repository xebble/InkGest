'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps): JSX.Element {
  // Always render NextAuth provider without hydration checks
  // Let NextAuth handle its own hydration internally
  return (
    <NextAuthSessionProvider
      // Prevent session refetch on window focus during hydration
      refetchOnWindowFocus={false}
      // Reduce refetch interval to prevent hydration conflicts
      refetchInterval={0} // Disable automatic refetching
      // Prevent initial session fetch during hydration
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}