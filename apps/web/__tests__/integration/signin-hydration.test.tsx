import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import SignInPage from '@/app/[locale]/(auth)/signin/page';
import { Providers } from '@/components/providers/Providers';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  getSession: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

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

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(0);
  return 0;
});

// Sample messages for testing
const messages = {
  auth: {
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing In...',
    invalidCredentials: 'Invalid credentials',
    loginError: 'Login error occurred',
    subtitle: 'Manage your tattoo studio',
  },
  theme: {
    light: 'Light Mode',
    dark: 'Dark Mode',
    system: 'System',
  },
};

// Console error spy to detect DOM manipulation errors
let consoleErrorSpy: jest.SpyInstance;

describe('SignIn Page Hydration Tests', () => {
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
    mockUsePathname.mockReturnValue('/en/signin');

    // Spy on console.error to catch DOM manipulation errors
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Requirement 1.1: Page loads without removeChild errors', () => {
    it('should render signin page without DOM manipulation errors', async () => {
      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      // Wait for hydration to complete
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Check that no removeChild errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });

    it('should handle multiple renders without DOM errors', async () => {
      const { rerender } = render(
        <NextIntlClientProvider messages={messages} locale="en">
          <Providers locale="en">
            <SignInPage params={Promise.resolve({ locale: 'en' })} />
          </Providers>
        </NextIntlClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Rerender the component
      await act(async () => {
        rerender(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      // Check that no DOM manipulation errors occurred during rerender
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });
  });

  describe('Requirement 1.2: Form elements hydrate properly', () => {
    it('should render all form elements correctly after hydration', async () => {
      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      // Wait for hydration and verify all form elements are present
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });

      // Verify form elements are interactive
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });

    it('should handle form input changes without errors', async () => {
      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);

      // Test input changes
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');

      // Check no DOM errors occurred during input changes
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });
  });

  describe('Requirement 1.3: No console errors during rendering', () => {
    it('should not produce any React DOM operation errors', async () => {
      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Check that no React DOM errors were logged
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/Warning.*React|Error.*React|removeChild|appendChild/i)
      );
    });
  });

  describe('Theme switching without DOM errors', () => {
    it('should handle theme changes without causing DOM manipulation errors', async () => {
      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Simulate theme change by updating localStorage and triggering a re-render
      await act(async () => {
        localStorageMock.getItem.mockReturnValue('dark');
        // Trigger a theme change event
        window.dispatchEvent(new Event('storage'));
      });

      // Wait for theme change to be processed
      await waitFor(() => {
        // The theme should be applied without errors
        expect(document.documentElement.classList.contains('dark') || 
               document.documentElement.classList.contains('light')).toBe(true);
      });

      // Check that no removeChild errors occurred during theme switching
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });

    it('should handle system theme changes without errors', async () => {
      // Mock system preference for dark mode
      const mockMatchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') {
            // Simulate system theme change
            setTimeout(() => handler({ matches: true }), 100);
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      window.matchMedia = mockMatchMedia;

      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Wait for potential system theme change
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Check that no DOM manipulation errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });
  });

  describe('Form submission functionality', () => {
    it('should handle successful form submission correctly', async () => {
      mockSignIn.mockResolvedValue({ error: null, ok: true, status: 200, url: null });
      mockGetSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      });

      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill out the form
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      // Submit the form
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Wait for form submission to complete
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Check that no DOM errors occurred during form submission
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });

    it('should handle form submission errors gracefully', async () => {
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', ok: false, status: 401, url: null });

      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill out the form
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      });

      // Submit the form
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Check that no DOM errors occurred during error handling
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });

    it('should show loading state during form submission', async () => {
      // Mock a delayed response
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ error: null, ok: true, status: 200, url: null }), 100)
        )
      );
      mockGetSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      });

      await act(async () => {
        render(
          <NextIntlClientProvider messages={messages} locale="en">
            <Providers locale="en">
              <SignInPage params={Promise.resolve({ locale: 'en' })} />
            </Providers>
          </NextIntlClientProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill out the form
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      // Submit the form
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Check loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Check that no DOM errors occurred during loading state changes
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });
  });

  describe('Hydration stability with providers', () => {
    it('should maintain stable rendering with all providers', async () => {
      const { rerender } = render(
        <NextIntlClientProvider messages={messages} locale="en">
          <Providers locale="en">
            <SignInPage params={Promise.resolve({ locale: 'en' })} />
          </Providers>
        </NextIntlClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Simulate multiple re-renders that might happen during hydration
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          rerender(
            <NextIntlClientProvider messages={messages} locale="en">
              <Providers locale="en">
                <SignInPage params={Promise.resolve({ locale: 'en' })} />
              </Providers>
            </NextIntlClientProvider>
          );
        });
      }

      // Verify the form is still functional
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Check that no DOM manipulation errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|Failed to execute 'removeChild'/i)
      );
    });
  });
});