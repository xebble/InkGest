/**
 * Hydration utilities for safe client-side operations
 * Provides error handling and recovery mechanisms for hydration issues
 */

export interface HydrationError extends Error {
  type: 'hydration' | 'dom_manipulation' | 'provider_initialization';
  component: string | undefined;
  recoverable: boolean;
}

/**
 * Creates a hydration-specific error with additional context
 */
export function createHydrationError(
  message: string,
  type: HydrationError['type'],
  component?: string,
  recoverable = true
): HydrationError {
  const error = new Error(message) as HydrationError;
  error.type = type;
  error.component = component;
  error.recoverable = recoverable;
  error.name = 'HydrationError';
  return error;
}

/**
 * Safe DOM manipulation wrapper that handles hydration-related errors
 */
export function safeDOMOperation<T>(
  operation: () => T,
  fallback?: T,
  component?: string
): T | undefined {
  try {
    return operation();
  } catch (error) {
    const hydrationError = createHydrationError(
      `DOM operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'dom_manipulation',
      component
    );

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Safe DOM operation failed:', hydrationError);
    }

    // Return fallback or undefined
    return fallback;
  }
}

/**
 * Safe localStorage access with hydration error handling
 */
export function safeLocalStorage() {
  return {
    getItem: (key: string, fallback?: string): string | null => {
      const result = safeDOMOperation(
        () => localStorage.getItem(key),
        fallback || null,
        'localStorage.getItem'
      );
      return result ?? null;
    },
    
    setItem: (key: string, value: string): boolean => {
      return safeDOMOperation(
        () => {
          localStorage.setItem(key, value);
          return true;
        },
        false,
        'localStorage.setItem'
      ) || false;
    },
    
    removeItem: (key: string): boolean => {
      return safeDOMOperation(
        () => {
          localStorage.removeItem(key);
          return true;
        },
        false,
        'localStorage.removeItem'
      ) || false;
    }
  };
}

/**
 * Safe class list manipulation for theme changes
 */
export function safeClassListOperation(
  element: Element,
  operation: 'add' | 'remove' | 'toggle',
  className: string,
  component?: string
): boolean {
  return safeDOMOperation(
    () => {
      switch (operation) {
        case 'add':
          element.classList.add(className);
          break;
        case 'remove':
          element.classList.remove(className);
          break;
        case 'toggle':
          element.classList.toggle(className);
          break;
      }
      return true;
    },
    false,
    component || 'classList'
  ) || false;
}

/**
 * Detects if we're in a hydration phase
 */
export function isHydrating(): boolean {
  return typeof window !== 'undefined' && !window.document?.body?.hasAttribute('data-hydrated');
}

/**
 * Marks the document as fully hydrated
 */
export function markAsHydrated(): void {
  safeDOMOperation(
    () => {
      if (typeof window !== 'undefined' && window.document?.body) {
        window.document.body.setAttribute('data-hydrated', 'true');
      }
    },
    undefined,
    'markAsHydrated'
  );
}

/**
 * Waits for hydration to complete before executing callback
 */
export function afterHydration(callback: () => void, timeout = 100): void {
  if (typeof window === 'undefined') return;

  const execute = () => {
    try {
      callback();
    } catch (error) {
      const hydrationError = createHydrationError(
        `Post-hydration callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'hydration',
        'afterHydration'
      );

      if (process.env.NODE_ENV === 'development') {
        console.warn('Post-hydration callback failed:', hydrationError);
      }
    }
  };

  if (isHydrating()) {
    setTimeout(execute, timeout);
  } else {
    execute();
  }
}

/**
 * React Strict Mode detection utility
 */
export function isStrictMode(): boolean {
  // In development with Strict Mode, effects run twice
  // This is a heuristic to detect if we're in Strict Mode
  if (process.env.NODE_ENV !== 'development') return false;
  
  // Check if we have the React DevTools extension which can indicate Strict Mode
  return typeof window !== 'undefined' && 
         (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
}

/**
 * Handles errors that might occur during Strict Mode double-rendering
 */
export function handleStrictModeError(error: Error, component?: string): void {
  if (isStrictMode() && error.message.includes('removeChild')) {
    // This is likely a Strict Mode related hydration issue
    const hydrationError = createHydrationError(
      `Strict Mode hydration issue: ${error.message}`,
      'hydration',
      component,
      true
    );

    if (process.env.NODE_ENV === 'development') {
      console.warn('Strict Mode hydration issue detected (this may be expected):', hydrationError);
    }
    
    return; // Don't throw, as this might be expected in Strict Mode
  }

  // Re-throw other errors
  throw error;
}