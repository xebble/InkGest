'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Theme } from '../../types';
import { 
  safeLocalStorage, 
  safeClassListOperation, 
  afterHydration,
  handleStrictModeError 
} from '../../lib/utils/hydration';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  isHydrated: boolean;
  isLoading: boolean;
}

interface ThemeContextType extends ThemeState {
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'inkgest-theme',
}: ThemeProviderProps): JSX.Element {
  const [themeState, setThemeState] = useState<ThemeState>({
    theme: defaultTheme,
    resolvedTheme: 'light',
    isHydrated: false,
    isLoading: true,
  });

  // Initialize theme after hydration
  useEffect(() => {
    let isMounted = true;

    const initializeTheme = async (): Promise<void> => {
      try {
        // Load saved theme from localStorage using safe wrapper
        let savedTheme = defaultTheme;
        const storage = safeLocalStorage();
        const stored = storage.getItem(storageKey) as Theme;
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          savedTheme = stored;
        }

        // Determine resolved theme
        let effectiveTheme: 'light' | 'dark';
        if (savedTheme === 'system') {
          effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        } else {
          effectiveTheme = savedTheme;
        }

        // Apply theme to DOM safely
        const root = document.documentElement;
        
        // Use afterHydration to ensure safe DOM manipulation
        afterHydration(() => {
          if (!isMounted) return;
          
          try {
            // Remove all theme classes first
            safeClassListOperation(root, 'remove', 'light', 'ThemeProvider');
            safeClassListOperation(root, 'remove', 'dark', 'ThemeProvider');
            // Add the new theme class
            safeClassListOperation(root, 'add', effectiveTheme, 'ThemeProvider');
          } catch (error) {
            handleStrictModeError(error as Error, 'ThemeProvider');
          }
        });

        // Update state if component is still mounted
        if (isMounted) {
          setThemeState({
            theme: savedTheme,
            resolvedTheme: effectiveTheme,
            isHydrated: true,
            isLoading: false,
          });
        }
      } catch (error) {
        // Silent error handling in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to initialize theme:', error);
        }
        if (isMounted) {
          setThemeState(prev => ({
            ...prev,
            isHydrated: true,
            isLoading: false,
          }));
        }
      }
    };

    // Small delay to ensure hydration is complete
    const timeoutId = setTimeout(initializeTheme, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [defaultTheme, storageKey]);

  // Handle theme changes after hydration
  useEffect(() => {
    if (!themeState.isHydrated) return;

    try {
      // Save to localStorage using safe wrapper
      const storage = safeLocalStorage();
      storage.setItem(storageKey, themeState.theme);

      // Update DOM
      const root = document.documentElement;
      let effectiveTheme: 'light' | 'dark';

      if (themeState.theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        effectiveTheme = themeState.theme;
      }

      // Use afterHydration for safe DOM manipulation
      afterHydration(() => {
        try {
          safeClassListOperation(root, 'remove', 'light', 'ThemeProvider');
          safeClassListOperation(root, 'remove', 'dark', 'ThemeProvider');
          safeClassListOperation(root, 'add', effectiveTheme, 'ThemeProvider');
        } catch (error) {
          handleStrictModeError(error as Error, 'ThemeProvider');
        }
      });

      // Update resolved theme if it changed
      if (effectiveTheme !== themeState.resolvedTheme) {
        setThemeState(prev => ({
          ...prev,
          resolvedTheme: effectiveTheme,
          isLoading: false,
        }));
      } else {
        // Mark as not loading even if theme didn't change
        setThemeState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      // Silent error handling in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to handle theme change:', error);
      }
      // Ensure loading state is cleared even on error
      setThemeState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [themeState.theme, themeState.isHydrated, themeState.resolvedTheme, storageKey]);

  // Handle system theme changes
  useEffect(() => {
    if (!themeState.isHydrated || themeState.theme !== 'system') return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
        const systemTheme = e.matches ? 'dark' : 'light';
        
        // Use afterHydration for safe DOM manipulation
        afterHydration(() => {
          try {
            const root = document.documentElement;
            safeClassListOperation(root, 'remove', 'light', 'ThemeProvider');
            safeClassListOperation(root, 'remove', 'dark', 'ThemeProvider');
            safeClassListOperation(root, 'add', systemTheme, 'ThemeProvider');
          } catch (error) {
            handleStrictModeError(error as Error, 'ThemeProvider');
          }
        });

        setThemeState(prev => ({
          ...prev,
          resolvedTheme: systemTheme,
        }));
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } catch (error) {
      // Silent error handling in production
      if (process.env.NODE_ENV === 'development') {
        
      }
      return undefined;
    }
  }, [themeState.isHydrated, themeState.theme]);

  const setTheme = (newTheme: Theme): void => {
    setThemeState(prev => ({
      ...prev,
      theme: newTheme,
      isLoading: true,
    }));
  };

  const value: ThemeContextType = {
    ...themeState,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
