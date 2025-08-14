'use client';

import { useEffect } from 'react';
import { markAsHydrated, isStrictMode } from '../../lib/utils/hydration';

/**
 * HydrationMonitor component that tracks hydration completion
 * and monitors for hydration-related errors in development
 */
export function HydrationMonitor(): null {
  useEffect(() => {
    // Mark document as hydrated
    markAsHydrated();

    // Set up error monitoring in development
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      const originalWarn = console.warn;

      // Monitor for hydration-related errors
      const monitorError = (level: 'error' | 'warn') => (...args: any[]) => {
        const message = args.join(' ');
        
        // Check for common hydration error patterns
        const hydrationPatterns = [
          'removeChild',
          'hydration',
          'server-rendered HTML',
          'client-side rendering',
          'suppressHydrationWarning'
        ];

        const isHydrationRelated = hydrationPatterns.some(pattern => 
          message.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isHydrationRelated) {
          const strictModeNote = isStrictMode() 
            ? ' (Note: React Strict Mode is enabled - some hydration warnings may be expected during development)'
            : '';

          if (level === 'error') {
            originalError(
              '🚨 Hydration Error Detected:',
              ...args,
              strictModeNote
            );
          } else {
            originalWarn(
              '⚠️ Hydration Warning Detected:',
              ...args,
              strictModeNote
            );
          }
        } else {
          // Call original function for non-hydration errors
          if (level === 'error') {
            originalError(...args);
          } else {
            originalWarn(...args);
          }
        }
      };

      // Override console methods
      console.error = monitorError('error');
      console.warn = monitorError('warn');

      // Cleanup on unmount
      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    }

    // Return undefined for non-development environments
    return undefined;
  }, []);

  // This component renders nothing
  return null;
}