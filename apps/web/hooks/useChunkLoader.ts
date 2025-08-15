'use client';

import { useEffect, useState } from 'react';

interface ChunkLoaderState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
}

interface UseChunkLoaderOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
}

/**
 * Hook to handle chunk loading errors in Next.js 15 with React 19
 * Provides automatic retry mechanism and error recovery
 */
export function useChunkLoader(options: UseChunkLoaderOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
  } = options;

  const [state, setState] = useState<ChunkLoaderState>({
    isLoading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    // Listen for chunk loading errors
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if this is a chunk loading error
      const isChunkError = 
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Cannot find module') ||
        error?.message?.includes('./') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError) {
        setState(prevState => ({
          ...prevState,
          error,
          isLoading: false,
        }));

        onError?.(error);
      }
    };

    // Listen for unhandled promise rejections (common with chunk loading)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (error instanceof Error) {
        const isChunkError = 
          error.message.includes('Loading chunk') ||
          error.message.includes('Cannot find module') ||
          error.message.includes('./');

        if (isChunkError) {
          setState(prevState => ({
            ...prevState,
            error,
            isLoading: false,
          }));

          onError?.(error);
          
          // Prevent the error from being logged to console
          event.preventDefault();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const retry = () => {
    if (state.retryCount >= maxRetries) {
      // Force page reload as last resort
      window.location.reload();
      return;
    }

    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    onRetry?.(state.retryCount + 1);

    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        retryCount: prevState.retryCount + 1,
      }));
    }, retryDelay * (state.retryCount + 1));
  };

  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
    });
  };

  return {
    ...state,
    retry,
    reset,
    canRetry: state.retryCount < maxRetries,
  };
}