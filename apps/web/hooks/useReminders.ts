import { useState, useCallback } from 'react';
import type { ApiResponse } from '@/types';

export interface ReminderSchedule {
  id: string;
  appointmentId: string;
  type: '24h' | '2h' | 'confirmation';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderStats {
  totalScheduled: number;
  totalSent: number;
  totalFailed: number;
  successRate: number;
  byType: Record<'24h' | '2h' | 'confirmation', { 
    scheduled: number; 
    sent: number; 
    failed: number; 
  }>;
}

interface UseRemindersReturn {
  loading: boolean;
  error: string | null;
  scheduleReminders: (appointmentId: string) => Promise<ReminderSchedule[]>;
  cancelReminders: (appointmentId: string) => Promise<void>;
  getReminderStats: (storeId: string, startDate: Date, endDate: Date) => Promise<ReminderStats>;
  confirmAppointment: (token: string) => Promise<{ success: boolean; appointment?: any; error?: string }>;
  clearError: () => void;
}

export function useReminders(): UseRemindersReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const scheduleReminders = useCallback(async (appointmentId: string): Promise<ReminderSchedule[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      const result: ApiResponse<ReminderSchedule[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule reminders');
      }

      return result.data.map(reminder => ({
        ...reminder,
        scheduledFor: new Date(reminder.scheduledFor),
        sentAt: reminder.sentAt ? new Date(reminder.sentAt) : undefined,
        createdAt: new Date(reminder.createdAt),
        updatedAt: new Date(reminder.updatedAt)
      })) as ReminderSchedule[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule reminders';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelReminders = useCallback(async (appointmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reminders/${appointmentId}/cancel`, {
        method: 'POST',
      });

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel reminders');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reminders';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getReminderStats = useCallback(async (
    storeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ReminderStats> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        storeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/reminders/stats?${params}`);
      const result: ApiResponse<ReminderStats> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get reminder stats');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get reminder stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmAppointment = useCallback(async (
    token: string
  ): Promise<{ success: boolean; appointment?: any; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/confirm/${token}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to confirm appointment');
        return { success: false, error: result.error };
      }

      return { success: true, appointment: result.data.appointment };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm appointment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    scheduleReminders,
    cancelReminders,
    getReminderStats,
    confirmAppointment,
    clearError
  };
}