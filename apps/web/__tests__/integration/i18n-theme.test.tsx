import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Providers } from '@/components/providers/Providers';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useLocale } from '@/components/providers/LocaleProvider';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Sample messages for testing
const messages = {
  es: {
    theme: {
      light: 'Modo Claro',
      dark: 'Modo Oscuro',
      system: 'Sistema',
    },
    common: {
      loading: 'Cargando...',
    },
  },
  ca: {
    theme: {
      light: 'Mode Clar',
      dark: 'Mode Fosc',
      system: 'Sistema',
    },
    common: {
      loading: 'Carregant...',
    },
  },
  en: {
    theme: {
      light: 'Light Mode',
      dark: 'Dark Mode',
      system: 'System',
    },
    common: {
      loading: 'Loading...',
    },
  },
};

// Test component that uses both theme and locale
function TestApp(): JSX.Element {
  const { theme, resolvedTheme } = useTheme();
  const { locale } = useLocale();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="current-locale">{locale}</div>
      <ThemeToggle />
      <LanguageSelector />
    </div>
  );
}

describe('I18n and Theme Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    document.documentElement.className = '';
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockUsePathname.mockReturnValue('/es/dashboard');
  });

  it('should initialize with correct locale and theme', () => {
    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('es');
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
  });

  it('should change theme and persist to localStorage', async () => {
    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    const themeSelect = screen.getByRole('combobox', { name: /select theme/i });
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('inkgest-theme', 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should change language and navigate to new path', () => {
    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    const languageSelect = screen.getByRole('combobox', { name: /select language/i });
    fireEvent.change(languageSelect, { target: { value: 'ca' } });

    expect(mockPush).toHaveBeenCalledWith('/ca/dashboard');
  });

  it('should work with different initial locales', () => {
    const { rerender } = render(
      <NextIntlClientProvider messages={messages.ca} locale="ca">
        <Providers locale="ca">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('ca');

    rerender(
      <NextIntlClientProvider messages={messages.en} locale="en">
        <Providers locale="en">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
  });

  it('should maintain theme when changing languages', async () => {
    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    // Set dark theme
    const themeSelect = screen.getByRole('combobox', { name: /select theme/i });
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    // Change language
    const languageSelect = screen.getByRole('combobox', { name: /select language/i });
    fireEvent.change(languageSelect, { target: { value: 'ca' } });

    // Theme should still be dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should handle system theme changes', async () => {
    // Mock system preference for dark mode
    const mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    window.matchMedia = mockMatchMedia;

    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    // Should default to system theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should load saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
  });

  it('should handle invalid theme in localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');

    render(
      <NextIntlClientProvider messages={messages.es} locale="es">
        <Providers locale="es">
          <TestApp />
        </Providers>
      </NextIntlClientProvider>
    );

    // Should fall back to default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });
});