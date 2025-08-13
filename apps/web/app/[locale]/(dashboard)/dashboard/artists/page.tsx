'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArtistList, ArtistForm, ArtistProfile } from '@/components/artists';
import { useArtists } from '@/hooks/useArtists';
import { ArtistWithUser, CreateArtistData, UpdateArtistData, User } from '@/types';

type ViewMode = 'list' | 'create' | 'edit' | 'profile';

const ArtistsPage: React.FC = () => {
  const t = useTranslations('artists');
  
  // For now, we'll use a hardcoded store ID
  // In a real app, this would come from the user's session or context
  const storeId = 'store_1';
  
  const {
    artists,
    loading,
    error,
    createArtist,
    updateArtist,
    deleteArtist,
    createAbsence,
    getAvailableUsers,
    getSpecialties,
    refreshArtists
  } = useArtists({ storeId });

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithUser | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load available users and specialties
  useEffect(() => {
    const loadData = async () => {
      try {
        const [users, specs] = await Promise.all([
          getAvailableUsers(),
          getSpecialties()
        ]);
        setAvailableUsers(users);
        setSpecialties(specs);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, [getAvailableUsers, getSpecialties]);

  const handleCreateArtist = useCallback(() => {
    setSelectedArtist(null);
    setViewMode('create');
  }, []);

  const handleEditArtist = useCallback((artist: ArtistWithUser) => {
    setSelectedArtist(artist);
    setViewMode('edit');
  }, []);

  const handleSelectArtist = useCallback((artist: ArtistWithUser) => {
    setSelectedArtist(artist);
    setViewMode('profile');
  }, []);

  const handleSubmitArtist = useCallback(async (data: CreateArtistData | UpdateArtistData) => {
    setIsSubmitting(true);
    try {
      if ('id' in data) {
        await updateArtist(data);
      } else {
        await createArtist(data);
      }
      setViewMode('list');
      setSelectedArtist(null);
    } catch (err) {
      console.error('Error submitting artist:', err);
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [createArtist, updateArtist]);

  const handleDeleteArtist = useCallback(async (artistId: string) => {
    try {
      await deleteArtist(artistId);
      setViewMode('list');
      setSelectedArtist(null);
    } catch (err) {
      console.error('Error deleting artist:', err);
      // Error handling is done in the hook
    }
  }, [deleteArtist]);

  const handleCancel = useCallback(() => {
    setViewMode('list');
    setSelectedArtist(null);
  }, []);

  const handleUpdateArtist = useCallback((artistId: string) => {
    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      handleEditArtist(artist);
    }
  }, [artists, handleEditArtist]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('errorTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={refreshArtists}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {t('artists')}
                </button>
              </div>
            </li>
            {viewMode !== 'list' && (
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {viewMode === 'create' && t('createArtist')}
                    {viewMode === 'edit' && t('editArtist')}
                    {viewMode === 'profile' && selectedArtist?.user.name}
                  </span>
                </div>
              </li>
            )}
          </ol>
        </nav>

        {/* Content */}
        {viewMode === 'list' && (
          <ArtistList
            artists={artists}
            onSelectArtist={handleSelectArtist}
            onCreateArtist={handleCreateArtist}
            onEditArtist={handleEditArtist}
            isLoading={loading}
          />
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <ArtistForm
            artist={selectedArtist || undefined}
            users={availableUsers}
            storeId={storeId}
            specialties={specialties}
            onSubmit={handleSubmitArtist}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        )}

        {viewMode === 'profile' && selectedArtist && (
          <ArtistProfile
            artist={selectedArtist}
            onUpdateArtist={handleUpdateArtist}
            onCreateAbsence={createAbsence}
            onDeleteArtist={handleDeleteArtist}
            canEdit={true}
            canDelete={true}
          />
        )}
      </div>
    </div>
  );
};

export default ArtistsPage;