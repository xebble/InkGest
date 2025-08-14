'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Theme } from '../../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'inkgest-theme',
}: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState<boolean>(false);

  // ✅ Prevent hydration mismatch - only run on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // ✅ Safe DOM access after mount
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, [storageKey, mounted]);

  useEffect(() => {
    if (!mounted) return;

    // ✅ Safe DOM manipulation after mount
    try {
      const root = document.documentElement;

      // Remove previous theme classes
      root.classList.remove('light', 'dark');

      let effectiveTheme: 'light' | 'dark';

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
        effectiveTheme = systemTheme;
      } else {
        effectiveTheme = theme;
      }

      // Apply theme class
      root.classList.add(effectiveTheme);
      setResolvedTheme(effectiveTheme);

      // Save to localStorage
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }, [theme, storageKey, mounted]);

  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    // ✅ Safe media query listener after mount
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent): void => {
        const systemTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);

        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      console.warn('Failed to setup media query listener:', error);
      return undefined;
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  // ✅ Prevent hydration mismatch by showing consistent content
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        <div suppressHydrationWarning>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
