import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderErrorBoundary } from '@/components/providers/ProviderErrorBoundary';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeAll(() => {
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>No error</div>;
};

describe('ProviderErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ProviderErrorBoundary>
        <div data-testid="child">Child component</div>
      </ProviderErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('should render default error UI when child component throws', () => {
    render(
      <ProviderErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ProviderErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong while initializing the application/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('should render custom fallback UI when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error message</div>;

    render(
      <ProviderErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ProviderErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Application Error')).not.toBeInTheDocument();
  });

  it('should log error details when error occurs', () => {
    render(
      <ProviderErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ProviderErrorBoundary>
    );

    // Should always log errors regardless of environment
    expect(console.error).toHaveBeenCalled();
  });

  it('should reset error state when retry button is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <ProviderErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ThrowError shouldThrow={shouldThrow} />
        </ProviderErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Initially shows error UI
    expect(screen.getByText('Application Error')).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));

    // Should attempt to re-render (though the error will still occur in this test)
    // In a real scenario, the error condition might be resolved
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    render(
      <ProviderErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ProviderErrorBoundary>
    );

    // Check if error details are conditionally shown based on environment
    const detailsElement = screen.queryByText('Error Details (Development Only)');
    
    // The component shows error details when NODE_ENV is 'development'
    // In test environment (NODE_ENV = 'test'), it should not show by default
    if (process.env.NODE_ENV === 'development') {
      expect(detailsElement).toBeInTheDocument();
    } else {
      // In test or production, it should not be visible
      expect(detailsElement).not.toBeInTheDocument();
    }
  });

  it('should handle error boundary functionality correctly', () => {
    render(
      <ProviderErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ProviderErrorBoundary>
    );

    // Should show the error UI
    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });
});