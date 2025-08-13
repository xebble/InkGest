'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  CalendarAppointment, 
  AppointmentFiltersType,
  CalendarViewType
} from '../components/appointments/types';
import type { 
  Room, 
  Service, 
  Client, 
  CreateAppointmentData,
  UpdateAppointmentData,
  ArtistWithUser
} from '../types';

interface UseAppointmentsOptions {
  storeId: string;
  initialFilters?: Partial<AppointmentFiltersType>;
}

interface UseAppointmentsReturn {
  // Data
  appointments: CalendarAppointment[];
  artists: ArtistWithUser[];
  rooms: Room[];
  services: Service[];
  clients: Client[];
  
  // State
  loading: boolean;
  error: string | null;
  view: CalendarViewType;
  filters: AppointmentFiltersType;
  
  // Actions
  setView: (view: CalendarViewType) => void;
  setFilters: (filters: Partial<AppointmentFiltersType>) => void;
  setDateRange: (start: Date, end: Date) => void;
  createAppointment: (data: CreateAppointmentData) => Promise<void>;
  updateAppointment: (id: string, data: UpdateAppointmentData) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const useAppointments = ({ 
  storeId, 
  initialFilters = {} 
}: UseAppointmentsOptions): UseAppointmentsReturn => {
  // State
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [artists, setArtists] = useState<ArtistWithUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarViewType>('week');
  
  // Default filters
  const defaultFilters: AppointmentFiltersType = {
    artistIds: [],
    serviceIds: [],
    statuses: [],
    roomIds: [],
    dateRange: {
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setDate(new Date().getDate() + 30)),
    },
    clientSearch: '',
    ...initialFilters,
  };
  
  const [filters, setFiltersState] = useState<AppointmentFiltersType>(defaultFilters);

  // API functions
  const fetchAppointments = useCallback(async (): Promise<CalendarAppointment[]> => {
    const params = new URLSearchParams({
      storeId,
      startDate: filters.dateRange.start.toISOString(),
      endDate: filters.dateRange.end.toISOString(),
    });

    if (filters.artistIds.length > 0) {
      params.append('artistIds', filters.artistIds.join(','));
    }
    if (filters.serviceIds.length > 0) {
      params.append('serviceIds', filters.serviceIds.join(','));
    }
    if (filters.statuses.length > 0) {
      params.append('statuses', filters.statuses.join(','));
    }
    if (filters.roomIds.length > 0) {
      params.append('roomIds', filters.roomIds.join(','));
    }
    if (filters.clientSearch) {
      params.append('clientSearch', filters.clientSearch);
    }

    const response = await fetch(`/api/appointments?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }
    
    const data = await response.json();
    return data.appointments || [];
  }, [storeId, filters]);

  const fetchArtists = useCallback(async (): Promise<ArtistWithUser[]> => {
    const response = await fetch(`/api/artists?storeId=${storeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch artists');
    }
    
    const data = await response.json();
    return data.artists || [];
  }, [storeId]);

  const fetchRooms = useCallback(async (): Promise<Room[]> => {
    const response = await fetch(`/api/rooms?storeId=${storeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    const data = await response.json();
    return data.rooms || [];
  }, [storeId]);

  const fetchServices = useCallback(async (): Promise<Service[]> => {
    const response = await fetch(`/api/services?storeId=${storeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    
    const data = await response.json();
    return data.services || [];
  }, [storeId]);

  const fetchClients = useCallback(async (): Promise<Client[]> => {
    const response = await fetch(`/api/clients?storeId=${storeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }
    
    const data = await response.json();
    return data.clients || [];
  }, [storeId]);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        appointmentsData,
        artistsData,
        roomsData,
        servicesData,
        clientsData,
      ] = await Promise.all([
        fetchAppointments(),
        fetchArtists(),
        fetchRooms(),
        fetchServices(),
        fetchClients(),
      ]);

      setAppointments(appointmentsData);
      setArtists(artistsData);
      setRooms(roomsData);
      setServices(servicesData);
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments, fetchArtists, fetchRooms, fetchServices, fetchClients]);

  // Refresh appointments only
  const refreshAppointments = useCallback(async () => {
    try {
      const appointmentsData = await fetchAppointments();
      setAppointments(appointmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh appointments');
    }
  }, [fetchAppointments]);

  // CRUD operations
  const createAppointment = useCallback(async (data: CreateAppointmentData): Promise<void> => {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, storeId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create appointment');
    }

    // Refresh appointments after creation
    await refreshAppointments();
  }, [storeId, refreshAppointments]);

  const updateAppointment = useCallback(async (
    id: string, 
    data: UpdateAppointmentData
  ): Promise<void> => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update appointment');
    }

    // Refresh appointments after update
    await refreshAppointments();
  }, [refreshAppointments]);

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete appointment');
    }

    // Refresh appointments after deletion
    await refreshAppointments();
  }, [refreshAppointments]);

  // Filter management
  const setFilters = useCallback((newFilters: Partial<AppointmentFiltersType>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setFilters({ dateRange: { start, end } });
  }, [setFilters]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload appointments when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        refreshAppointments();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, refreshAppointments, loading]);

  return {
    // Data
    appointments,
    artists,
    rooms,
    services,
    clients,
    
    // State
    loading,
    error,
    view,
    filters,
    
    // Actions
    setView,
    setFilters,
    setDateRange,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refreshAppointments,
  };
};

export { useAppointments };
export type { UseAppointmentsOptions, UseAppointmentsReturn };