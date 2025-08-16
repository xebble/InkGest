import { useState, useEffect, useCallback } from 'react';
import { CalendarProvider, CalendarConflict } from '../lib/services/calendar/types';

export interface CalendarIntegrationState {
  providers: CalendarProvider[];
  loading: boolean;
  error: string | null;
  syncInProgress: boolean;
}

export interface CalendarSyncResult {
  success: boolean;
  results: Record<string, any>;
  hasConflicts: boolean;
  message: string;
  conflicts?: Record<string, CalendarConflict[]>;
}

export interface CalendarAvailability {
  artistId: string;
  startDate: string;
  endDate: string;
  duration?: number;
  externalAvailability: Record<string, { start: Date; end: Date; available: boolean }[]>;
  localAvailability: { start: Date; end: Date; available: boolean; appointmentId?: string }[];
  availableSlots?: { start: Date; end: Date }[];
  providers: CalendarProvider[];
}

export interface ConflictCheckResult {
  available: boolean;
  conflicts: {
    external: Record<string, CalendarConflict[]>;
    local: any[];
    businessHours: boolean;
  };
  recommendations?: { start: Date; end: Date }[];
}

export function useCalendarIntegration() {
  const [state, setState] = useState<CalendarIntegrationState>({
    providers: [],
    loading: false,
    error: null,
    syncInProgress: false,
  });

  // Get authentication URL for a provider
  const getAuthUrl = useCallback(async (provider: 'google' | 'microsoft' | 'apple'): Promise<string> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/calendar/auth/${provider}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get authentication URL');
      }

      return data.authUrl || data.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Authenticate with a provider
  const authenticateProvider = useCallback(async (
    provider: 'google' | 'microsoft' | 'apple',
    credentials: any
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/calendar/auth/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Update provider status
      setState(prev => ({
        ...prev,
        providers: prev.providers.map(p =>
          p.name === provider
            ? { ...p, isConnected: true, lastSync: new Date() }
            : p
        ),
      }));

      return data.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Disconnect from a provider
  const disconnectProvider = useCallback(async (provider: 'google' | 'microsoft' | 'apple'): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/calendar/auth/${provider}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Disconnect failed');
      }

      // Update provider status
      setState(prev => ({
        ...prev,
        providers: prev.providers.map(p =>
          p.name === provider
            ? { ...p, isConnected: false, lastSync: undefined as Date | undefined }
            : p
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Sync appointment to calendars
  const syncAppointment = useCallback(async (
    appointmentId: string,
    action: 'create' | 'update' | 'delete',
    options?: {
      providers?: ('google' | 'microsoft' | 'apple')[];
      conflictResolution?: 'manual' | 'auto' | 'skip';
      updates?: any;
    }
  ): Promise<CalendarSyncResult> => {
    try {
      setState(prev => ({ ...prev, syncInProgress: true, error: null }));

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          action,
          ...options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict detected
          return {
            success: false,
            results: {},
            hasConflicts: true,
            message: data.error,
            conflicts: data.conflicts,
          };
        }
        throw new Error(data.error || 'Sync failed');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, syncInProgress: false }));
    }
  }, []);

  // Get sync status for an appointment
  const getSyncStatus = useCallback(async (appointmentId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/calendar/sync?appointmentId=${appointmentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get sync status');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get sync status';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Get artist availability
  const getAvailability = useCallback(async (
    artistId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      duration?: number;
      providers?: ('google' | 'microsoft' | 'apple')[];
    }
  ): Promise<CalendarAvailability> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams({
        artistId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (options?.duration) {
        params.append('duration', options.duration.toString());
      }

      if (options?.providers) {
        params.append('providers', options.providers.join(','));
      }

      const response = await fetch(`/api/calendar/availability?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get availability');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get availability';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Check for conflicts before scheduling
  const checkConflicts = useCallback(async (
    artistId: string,
    startTime: Date,
    endTime: Date,
    providers?: ('google' | 'microsoft' | 'apple')[]
  ): Promise<ConflictCheckResult> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/calendar/availability/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          providers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check conflicts');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check conflicts';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    getAuthUrl,
    authenticateProvider,
    disconnectProvider,
    syncAppointment,
    getSyncStatus,
    getAvailability,
    checkConflicts,
    clearError,
  };
}

// Hook for managing calendar providers
export function useCalendarProviders() {
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // This would typically load from an API endpoint
      // For now, we'll return a default set of providers
      const defaultProviders: CalendarProvider[] = [
        {
          name: 'google',
          displayName: 'Google Calendar',
          isConnected: false,
          syncEnabled: true,
        },
        {
          name: 'microsoft',
          displayName: 'Microsoft Outlook',
          isConnected: false,
          syncEnabled: true,
        },
        {
          name: 'apple',
          displayName: 'Apple Calendar',
          isConnected: false,
          syncEnabled: true,
        },
      ];

      setProviders(defaultProviders);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load providers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProvider = useCallback((providerName: string, updates: Partial<CalendarProvider>) => {
    setProviders(prev =>
      prev.map(provider =>
        provider.name === providerName
          ? { ...provider, ...updates }
          : provider
      )
    );
  }, []);

  const toggleProviderSync = useCallback((providerName: string) => {
    setProviders(prev =>
      prev.map(provider =>
        provider.name === providerName
          ? { ...provider, syncEnabled: !provider.syncEnabled }
          : provider
      )
    );
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    providers,
    loading,
    error,
    loadProviders,
    updateProvider,
    toggleProviderSync,
  };
}