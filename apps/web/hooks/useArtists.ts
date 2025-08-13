'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArtistWithUser, 
  CreateArtistData, 
  UpdateArtistData, 
  CreateAbsenceData,
  ArtistAbsence,
  User,
  ApiResponse 
} from '@/types';

interface UseArtistsOptions {
  storeId: string;
}

interface UseArtistsReturn {
  artists: ArtistWithUser[];
  loading: boolean;
  error: string | null;
  createArtist: (data: CreateArtistData) => Promise<void>;
  updateArtist: (data: UpdateArtistData) => Promise<void>;
  deleteArtist: (id: string) => Promise<void>;
  getArtistById: (id: string) => Promise<ArtistWithUser | null>;
  createAbsence: (data: CreateAbsenceData) => Promise<void>;
  getAvailableUsers: () => Promise<User[]>;
  getSpecialties: () => Promise<string[]>;
  refreshArtists: () => Promise<void>;
}

export function useArtists({ storeId }: UseArtistsOptions): UseArtistsReturn {
  const [artists, setArtists] = useState<ArtistWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/artists?storeId=${storeId}`);
      const result: ApiResponse<ArtistWithUser[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch artists');
      }

      setArtists(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const createArtist = useCallback(async (data: CreateArtistData): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ArtistWithUser> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create artist');
      }

      // Refresh the artists list
      await fetchArtists();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [fetchArtists]);

  const updateArtist = useCallback(async (data: UpdateArtistData): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`/api/artists/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ArtistWithUser> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update artist');
      }

      // Update the artist in the local state
      setArtists(prev => prev.map(artist => 
        artist.id === data.id ? result.data : artist
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteArtist = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`/api/artists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result: ApiResponse<null> = await response.json();
        throw new Error(result.error || 'Failed to delete artist');
      }

      // Remove the artist from the local state
      setArtists(prev => prev.filter(artist => artist.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getArtistById = useCallback(async (id: string): Promise<ArtistWithUser | null> => {
    try {
      setError(null);

      const response = await fetch(`/api/artists/${id}`);
      const result: ApiResponse<ArtistWithUser> = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.error || 'Failed to fetch artist');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const createAbsence = useCallback(async (data: CreateAbsenceData): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/artists/absences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ArtistAbsence> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create absence');
      }

      // In a real implementation, you might want to update local state
      // or trigger a refresh of absences data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getAvailableUsers = useCallback(async (): Promise<User[]> => {
    try {
      setError(null);

      const response = await fetch(`/api/users?storeId=${storeId}&available=true`);
      const result: ApiResponse<User[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch available users');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [storeId]);

  const getSpecialties = useCallback(async (): Promise<string[]> => {
    try {
      setError(null);

      const response = await fetch('/api/artists/specialties');
      const result: ApiResponse<string[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch specialties');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshArtists = useCallback(async (): Promise<void> => {
    await fetchArtists();
  }, [fetchArtists]);

  // Initial fetch
  useEffect(() => {
    if (storeId) {
      fetchArtists();
    }
  }, [storeId, fetchArtists]);

  return {
    artists,
    loading,
    error,
    createArtist,
    updateArtist,
    deleteArtist,
    getArtistById,
    createAbsence,
    getAvailableUsers,
    getSpecialties,
    refreshArtists,
  };
}