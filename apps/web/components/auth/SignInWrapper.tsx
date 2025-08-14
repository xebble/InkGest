'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { HydrationSafeSignIn } from './HydrationSafeSignIn';

export function SignInWrapper(): JSX.Element {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure NextAuth is fully loaded before using it
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    if (!isHydrated) {
      return { error: 'Not ready' };
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { error: result.error };
      }

      // Verify session was created
      const session = await getSession();
      if (!session?.user) {
        return { error: 'Session creation failed' };
      }

      return {}; // Success
    } catch (error) {
      return { error: 'Login failed' };
    }
  };

  return <HydrationSafeSignIn onSignIn={isHydrated ? handleSignIn : undefined} />;
}