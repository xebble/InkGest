'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

interface ProviderErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ProviderErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ProviderErrorBoundary extends Component<
  ProviderErrorBoundaryProps,
  ProviderErrorBoundaryState
> {
  constructor(props: ProviderErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ProviderErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    this.logError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    // Enhanced error logging for provider failures
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Provider Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Uncomment and configure your error reporting service
      // errorReportingService.captureException(error, {
      //   extra: errorDetails,
      //   tags: {
      //     component: 'ProviderErrorBoundary',
      //     type: 'provider_failure',
      //   },
      // });
      
      // For now, just log to console in production too
      console.error('Provider Error:', errorDetails);
    }
  }

  private handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Application Error
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Something went wrong while initializing the application. This might be a temporary issue.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}