'use client';

import React, { Component, ReactNode } from 'react';

interface ChunkLoadErrorBoundaryState {
  hasError: boolean;
  error: Error | undefined;
  retryCount: number;
}

interface ChunkLoadErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
}

/**
 * Error boundary specifically designed to handle chunk loading errors
 * in Next.js 15 with React 19. Provides automatic retry mechanism
 * for failed module loads.
 */
export class ChunkLoadErrorBoundary extends Component<
  ChunkLoadErrorBoundaryProps,
  ChunkLoadErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ChunkLoadErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkLoadErrorBoundaryState> {
    // Check if this is a chunk loading error
    const isChunkLoadError = 
      error.message.includes('Loading chunk') ||
      error.message.includes('Cannot find module') ||
      error.message.includes('Loading CSS chunk') ||
      error.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      return {
        hasError: true,
        error,
      };
    }

    // Re-throw non-chunk errors
    throw error;
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log chunk loading errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Chunk loading error caught:', error, errorInfo);
    }

    // Attempt automatic retry for chunk loading errors
    this.attemptRetry();
  }

  private attemptRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      // Clear any existing timeout
      if (this.retryTimeoutId) {
        clearTimeout(this.retryTimeoutId);
      }

      // Retry after a short delay
      this.retryTimeoutId = setTimeout(() => {
        this.setState({
          hasError: false,
          error: undefined,
          retryCount: this.state.retryCount + 1,
        });
      }, 1000 * (retryCount + 1)); // Exponential backoff
    }
  };

  private handleManualRetry = (): void => {
    // Force a page reload as last resort
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  override componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  override render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      // Show custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Show retry UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-2">
              Loading Error
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {retryCount < maxRetries
                ? `Retrying... (${retryCount}/${maxRetries})`
                : 'Failed to load application resources. This may be due to a network issue or outdated cached files.'
              }
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {error.message}
                </pre>
              </details>
            )}

            {retryCount >= maxRetries && (
              <button
                onClick={this.handleManualRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}