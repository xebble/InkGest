import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector, LanguageSelectorButton } from '@/components/ui/LanguageSelector';
import { LocaleProvider, useLocale } from '@/components/providers/LocaleProvider';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('LanguageSelector (Select)', () => {
    it('should render language options', () => {
      render(
        <LocaleProvider locale="es">
          <LanguageSelector />
        </LocaleProvider>
      );

      expect(screen.getByDisplayValue('🇪🇸 Español')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '🇪🇸 Español' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '🏴󠁥󠁳󠁣󠁴󠁿 Català' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '🇬🇧 English' })).toBeInTheDocument();
    });

    it('should change language when option is selected', () => {
      render(
        <LocaleProvider locale="es">
          <LanguageSelector />
        </LocaleProvider>
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ca' } });

      expect(mockPush).toHaveBeenCalledWith('/ca/dashboard');
    });

    it('should show current language as selected', () => {
      render(
        <LocaleProvider locale="ca">
          <LanguageSelector />
        </LocaleProvider>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('ca');
    });

    it('should apply custom className', () => {
      render(
        <LocaleProvider locale="es">
          <LanguageSelector className="custom-class" />
        </LocaleProvider>
      );

      const container = screen.getByRole('combobox').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('LanguageSelectorButton', () => {
    it('should render current language', () => {
      render(
        <LocaleProvider locale="es">
          <LanguageSelectorButton />
        </LocaleProvider>
      );

      expect(screen.getByText('🇪🇸')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
    });

    it('should cycle through languages when clicked', () => {
      const TestWrapper = (): JSX.Element => {
        const { locale } = useLocale();
        return (
          <div>
            <div data-testid="current-locale">{locale}</div>
            <LanguageSelectorButton />
          </div>
        );
      };

      render(
        <LocaleProvider locale="es">
          <TestWrapper />
        </LocaleProvider>
      );

      expect(screen.getByTestId('current-locale')).toHaveTextContent('es');

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/ca/dashboard');
    });

    it('should show correct next language in title', () => {
      render(
        <LocaleProvider locale="es">
          <LanguageSelectorButton />
        </LocaleProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Current: Español, Click to switch to Català');
      expect(button).toHaveAttribute('aria-label', 'Switch to Català');
    });

    it('should cycle from last to first language', () => {
      render(
        <LocaleProvider locale="en">
          <LanguageSelectorButton />
        </LocaleProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to Español');
      
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/es/dashboard');
    });

    it('should handle different locales correctly', () => {
      const { rerender } = render(
        <LocaleProvider locale="ca">
          <LanguageSelectorButton />
        </LocaleProvider>
      );

      expect(screen.getByText('🏴󠁥󠁳󠁣󠁴󠁿')).toBeInTheDocument();
      expect(screen.getByText('Català')).toBeInTheDocument();

      rerender(
        <LocaleProvider locale="en">
          <LanguageSelectorButton />
        </LocaleProvider>
      );

      expect(screen.getByText('🇬🇧')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <LocaleProvider locale="es">
          <LanguageSelectorButton className="custom-class" />
        </LocaleProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});