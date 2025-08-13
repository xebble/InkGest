import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { LocaleProvider, useLocale } from '@/components/providers/LocaleProvider';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Test component that uses the locale context
function TestComponent(): JSX.Element {
  const { locale, setLocale, availableLocales } = useLocale();
  
  return (
    <div>
      <div data-testid="current-locale">{locale}</div>
      <div data-testid="available-locales">
        {availableLocales.join(',')}
      </div>
      <button onClick={() => setLocale('es')} data-testid="set-es">
        Set Spanish
      </button>
      <button onClick={() => setLocale('ca')} data-testid="set-ca">
        Set Catalan
      </button>
      <button onClick={() => setLocale('en')} data-testid="set-en">
        Set English
      </button>
    </div>
  );
}

describe('LocaleProvider', () => {
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

  it('should provide current locale', () => {
    render(
      <LocaleProvider locale="es">
        <TestComponent />
      </LocaleProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('es');
    expect(screen.getByTestId('available-locales')).toHaveTextContent('es,ca,en');
  });

  it('should change locale and navigate to new path', () => {
    mockUsePathname.mockReturnValue('/es/dashboard/clients');

    render(
      <LocaleProvider locale="es">
        <TestComponent />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByTestId('set-ca'));

    expect(mockPush).toHaveBeenCalledWith('/ca/dashboard/clients');
  });

  it('should handle root path correctly', () => {
    mockUsePathname.mockReturnValue('/es');

    render(
      <LocaleProvider locale="es">
        <TestComponent />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByTestId('set-en'));

    expect(mockPush).toHaveBeenCalledWith('/en');
  });

  it('should handle nested paths correctly', () => {
    mockUsePathname.mockReturnValue('/es/dashboard/appointments/create');

    render(
      <LocaleProvider locale="es">
        <TestComponent />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByTestId('set-ca'));

    expect(mockPush).toHaveBeenCalledWith('/ca/dashboard/appointments/create');
  });

  it('should provide all available locales', () => {
    render(
      <LocaleProvider locale="en">
        <TestComponent />
      </LocaleProvider>
    );

    const availableLocales = screen.getByTestId('available-locales').textContent;
    expect(availableLocales).toBe('es,ca,en');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLocale must be used within a LocaleProvider');

    consoleSpy.mockRestore();
  });

  it('should work with different initial locales', () => {
    const { rerender } = render(
      <LocaleProvider locale="ca">
        <TestComponent />
      </LocaleProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('ca');

    rerender(
      <LocaleProvider locale="en">
        <TestComponent />
      </LocaleProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
  });
});