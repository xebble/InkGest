import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { ThemeToggle, ThemeToggleButton } from '@/components/ui/ThemeToggle';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

const mockUseTranslations = useTranslations as jest.MockedFunction<typeof useTranslations>;

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

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    document.documentElement.className = '';
    
    mockUseTranslations.mockReturnValue(((key: string) => {
      const translations: Record<string, string> = {
        light: 'Light Mode',
        dark: 'Dark Mode',
        system: 'System',
      };
      return translations[key] || key;
    }) as any);
  });

  describe('ThemeToggle (Select)', () => {
    it('should render theme options', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      expect(screen.getByDisplayValue('💻 System')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '☀️ Light Mode' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '🌙 Dark Mode' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '💻 System' })).toBeInTheDocument();
    });

    it('should change theme when option is selected', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'dark' } });

      expect(select).toHaveValue('dark');
    });

    it('should show current theme as selected', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('dark');
    });
  });

  describe('ThemeToggleButton', () => {
    it('should render light mode icon when theme is light', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggleButton />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
      expect(button).toHaveAttribute('title', 'Dark Mode');
    });

    it('should render dark mode icon when theme is dark', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggleButton />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light theme');
      expect(button).toHaveAttribute('title', 'Light Mode');
    });

    it('should toggle between light and dark themes', () => {
      const TestWrapper = (): JSX.Element => {
        const { theme } = useTheme();
        return (
          <div>
            <div data-testid="current-theme">{theme}</div>
            <ThemeToggleButton />
          </div>
        );
      };

      render(
        <ThemeProvider defaultTheme="light">
          <TestWrapper />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should handle system theme correctly', () => {
      // Mock system preference for dark mode
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const TestWrapper = (): JSX.Element => {
        const { theme, resolvedTheme } = useTheme();
        return (
          <div>
            <div data-testid="current-theme">{theme}</div>
            <div data-testid="resolved-theme">{resolvedTheme}</div>
            <ThemeToggleButton />
          </div>
        );
      };

      render(
        <ThemeProvider defaultTheme="system">
          <TestWrapper />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should switch from system (dark) to light
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    it('should apply custom className', () => {
      render(
        <ThemeProvider>
          <ThemeToggleButton className="custom-class" />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});