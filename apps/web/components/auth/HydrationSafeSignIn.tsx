'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface HydrationSafeSignInProps {
  onSignIn: ((email: string, password: string) => Promise<{ error?: string }>) | undefined;
}

export function HydrationSafeSignIn({ onSignIn }: HydrationSafeSignInProps): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  const router = useRouter();
  const t = useTranslations('auth');

  useEffect(() => {
    // Mark as mounted after hydration
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100); // Small delay to ensure hydration is complete

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isMounted || !onSignIn) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await onSignIn(email, password);
      
      if (result?.error) {
        setError(t('invalidCredentials'));
      } else {
        // Redirect to dashboard on success
        router.push('/dashboard');
      }
    } catch (err) {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Show skeleton during hydration
  if (!isMounted) {
    return (
      <div className="mt-8 space-y-6" suppressHydrationWarning>
        <div className="rounded-md shadow-sm -space-y-px">
          <div className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-t-md h-10 animate-pulse" />
          <div className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-b-md h-10 animate-pulse" />
        </div>
        <div className="w-full h-10 bg-gray-300 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            {t('password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading || !isMounted}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('signingIn') : t('signIn')}
        </button>
      </div>
    </form>
  );
}