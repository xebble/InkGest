'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArtistWithUser, ArtistSchedule } from '@/types';

interface ArtistListProps {
  artists: ArtistWithUser[];
  onSelectArtist: (artist: ArtistWithUser) => void;
  onCreateArtist: () => void;
  onEditArtist: (artist: ArtistWithUser) => void;
  isLoading?: boolean;
}

const ArtistList: React.FC<ArtistListProps> = ({
  artists,
  onSelectArtist,
  onCreateArtist,
  onEditArtist,
  isLoading = false
}) => {
  const t = useTranslations('artists');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'commission' | 'specialties'>('name');

  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    artists.forEach(artist => {
      artist.specialties.forEach((specialty: string) => specialties.add(specialty));
    });
    return Array.from(specialties).sort();
  }, [artists]);

  const filteredAndSortedArtists = useMemo(() => {
    const filtered = artists.filter(artist => {
      const matchesSearch = artist.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           artist.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecialty = !filterSpecialty || 
                              artist.specialties.includes(filterSpecialty);
      
      return matchesSearch && matchesSpecialty;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.user.name.localeCompare(b.user.name);
        case 'commission':
          return b.commission - a.commission;
        case 'specialties':
          return a.specialties.length - b.specialties.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [artists, searchTerm, filterSpecialty, sortBy]);

  const getWorkingDaysCount = (schedule: ArtistSchedule): number => {
    return Object.values(schedule).filter(day => day.isWorking).length;
  };

  const getWorkingHours = (schedule: ArtistSchedule): string => {
    const workingDays = Object.entries(schedule)
      .filter(([_, daySchedule]) => daySchedule.isWorking)
      .map(([day, daySchedule]) => {
        const dayName = t(`days.${day.slice(0, 3)}`);
        return `${dayName}: ${daySchedule.startTime}-${daySchedule.endTime}`;
      });
    
    return workingDays.length > 0 ? workingDays.slice(0, 2).join(', ') + 
           (workingDays.length > 2 ? ` +${workingDays.length - 2}` : '') : t('noWorkingDays');
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('artistManagement')}</h2>
        <button
          onClick={onCreateArtist}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('createArtist')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('search')}
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Specialty Filter */}
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
              {t('specialty')}
            </label>
            <select
              id="specialty"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allSpecialties')}</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              {t('sortBy')}
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'commission' | 'specialties')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">{t('name')}</option>
              <option value="commission">{t('commission')}</option>
              <option value="specialties">{t('specialtiesCount')}</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              {t('artistsFound', { count: filteredAndSortedArtists.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Artists List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {filteredAndSortedArtists.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedArtists.map((artist) => (
              <div
                key={artist.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectArtist(artist)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-lg">
                            {artist.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {artist.user.name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {artist.user.role}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">{artist.user.email}</p>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{t('commission')}: {Math.round(artist.commission * 100)}%</span>
                          <span>{t('workingDays')}: {getWorkingDaysCount(artist.schedule)}</span>
                          <span>{t('specialties')}: {artist.specialties.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {artist.specialties.slice(0, 3).map((specialty: string) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {specialty}
                        </span>
                      ))}
                      {artist.specialties.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          +{artist.specialties.length - 3} {t('more')}
                        </span>
                      )}
                    </div>

                    {/* Schedule Summary */}
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">{t('schedule')}: </span>
                      {getWorkingHours(artist.schedule)}
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditArtist(artist);
                      }}
                      className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {t('edit')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noArtists')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('noArtistsDescription')}</p>
            <div className="mt-6">
              <button
                onClick={onCreateArtist}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('createFirstArtist')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistList;