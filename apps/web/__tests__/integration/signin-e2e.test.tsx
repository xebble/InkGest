import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import SignInPage from '@/app/[locale]/(auth)/signin/page';
// import AuthLayout from '@/app/[locale]/(auth)/layout';
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

// Mock next-intl server functions
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      subtitle: 'Manage your tattoo studio',
    };
    return translations[key] || key;
  }),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

// Mock localStorage with more realistic behavior
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
};

const localStorageMock = createLocalStorageMock();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia with more realistic behavior
const createMatchMediaMock = (prefersDark = false) => {
  return jest.fn().mockImplementation((query) => {
    const matches = query === '(prefers-color-scheme: dark)' ? prefersDark : false;
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    
    return {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners.push(handler);
        }
      }),
      removeEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          const index = listeners.indexOf(handler);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      }),
      dispatchEvent: jest.fn(),
      // Helper to simulate theme change
      _triggerChange: (newMatches: boolean) => {
        listeners.forEach(handler => {
          handler({ matches: newMatches } as MediaQueryListEvent);
        });
      },
    };
  });
};

// Mock requestAnimationFrame to execute immediately
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
};

// Full page component that simulates the complete signin page
function FullSignInPage() {
  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <Providers locale="en">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h1 className="text-center text-3xl font-extrabold text-gray-900">
                InkGest
              </h1>
              <p className="mt-2 text-center text-sm text-gray-600">
                Manage your tattoo studio
              </p>
            </div>
            <SignInPage params={Promise.resolve({ locale: 'en' })} />
          </div>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}

describe('SignIn Page End-to-End Tests', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
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

    // Set up realistic matchMedia mock
    window.matchMedia = createMatchMediaMock(false);

    // Spy on console methods to catch any errors or warnings
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Complete page rendering without hydration errors', () => {
    it('should render the complete signin page with layout without any DOM errors', async () => {
      await act(async () => {
        render(<FullSignInPage />);
      });

      // Wait for all components to hydrate
      await waitFor(() => {
        expect(screen.getByText('InkGest')).toBeInTheDocument();
        expect(screen.getByText('Manage your tattoo studio')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });

      // Verify no hydration or DOM manipulation errors (excluding expected test warnings)
      const errorCalls = consoleErrorSpy.mock.calls.filter(call => 
        !call[0]?.includes?.('ReactDOMTestUtils.act') && 
        /removeChild|appendChild|insertBefore|replaceChild|Hydration|Warning.*React/i.test(call[0])
      );
      expect(errorCalls).toHaveLength(0);
      
      const warnCalls = consoleWarnSpy.mock.calls.filter(call => 
        !call[0]?.includes?.('ReactDOMTestUtils.act') && 
        /removeChild|appendChild|insertBefore|replaceChild|Hydration|Warning.*React/i.test(call[0])
      );
      expect(warnCalls).toHaveLength(0);
    });

    it('should handle rapid theme switching without DOM errors', async () => {
      await act(async () => {
        render(<FullSignInPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Simulate rapid theme changes
      const themes = ['light', 'dark', 'system', 'light', 'dark'];
      
      for (const theme of themes) {
        await act(async () => {
          localStorageMock.setItem('inkgest-theme', theme);
          // Trigger a custom event to simulate theme change (StorageEvent doesn't work well in jsdom)
          window.dispatchEvent(new CustomEvent('themechange', {
            detail: { key: 'inkgest-theme', newValue: theme }
          }));
        });

        // Small delay to allow theme processing
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      // Verify no DOM manipulation errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|appendChild|insertBefore|replaceChild/i)
      );
    });

    it('should handle system theme changes during form interaction', async () => {
      const matchMediaMock = createMatchMediaMock(false);
      window.matchMedia = matchMediaMock;

      await act(async () => {
        render(<FullSignInPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);

      // Start filling out the form
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      });

      // Simulate system theme change while user is typing
      await act(async () => {
        const mockMatchMedia = window.matchMedia as jest.MockedFunction<typeof window.matchMedia>;
        const mediaQueryList = mockMatchMedia('(prefers-color-scheme: dark)');
        if ((mediaQueryList as any)._triggerChange) {
          (mediaQueryList as any)._triggerChange(true);
        }
      });

      // Continue form interaction
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      // Verify form still works and no DOM errors occurred
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|appendChild|insertBefore|replaceChild/i)
      );
    });
  });

  describe('Form submission with theme and locale providers', () => {
    it('should handle complete login flow without DOM errors', async () => {
      mockSignIn.mockResolvedValue({ error: null, ok: true, status: 200, url: null });
      mockGetSession.mockResolvedValue({
        user: { 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User',
          role: 'ADMIN' as const,
          companyId: 'company-1',
          storeIds: ['store-1']
        },
        expires: '2024-12-31',
      });

      await act(async () => {
        render(<FullSignInPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill out and submit the form
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Wait for the complete authentication flow
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });

      await waitFor(() => {
        expect(mockGetSession).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Verify no DOM errors occurred during the entire flow
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|appendChild|insertBefore|replaceChild/i)
      );
    });

    it('should handle authentication errors without DOM issues', async () => {
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', ok: false, status: 401, url: null });

      await act(async () => {
        render(<FullSignInPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit with invalid credentials
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);
      });

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Verify form is still functional after error
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();

      // Verify no DOM errors occurred during error handling
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|appendChild|insertBefore|replaceChild/i)
      );
    });
  });

  describe('Stress testing for hydration stability', () => {
    it('should handle multiple rapid re-renders without DOM errors', async () => {
      const { rerender } = render(<FullSignInPage />);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      // Perform multiple rapid re-renders to stress test hydration
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          rerender(<FullSignInPage />);
        });
      }

      // Verify the page is still functional
      expect(screen.getByText('InkGest')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Verify no DOM manipulation errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|appendChild|insertBefore|replaceChild/i)
      );
    });

    it('should handle concurrent theme changes and form interactions', async () => {
      await act(async () => {
        render(<FullSignInPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);

      // Simulate concurrent operations
      const operations = [
        // Theme changes
        () => localStorageMock.setItem('inkgest-theme', 'dark'),
        () => localStorageMock.setItem('inkgest-theme', 'light'),
        () => localStorageMock.setItem('inkgest-theme', 'system'),
        // Form interactions
        () => fireEvent.change(emailInput, { target: { value: 'test1@example.com' } }),
        () => fireEvent.change(passwordInput, { target: { value: 'pass1' } }),
        () => fireEvent.change(emailInput, { target: { value: 'test2@example.com' } }),
        () => fireEvent.change(passwordInput, { target: { value: 'pass2' } }),
      ];

      // Execute operations rapidly
      await act(async () => {
        operations.forEach(op => op());
      });

      // Allow time for all operations to process
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify final state is consistent
      expect(emailInput).toHaveValue('test2@example.com');
      expect(passwordInput).toHaveValue('pass2');

      // Verify no DOM errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/removeChild|appendChild|insertBefore|replaceChild/i)
      );
    });
  });
});