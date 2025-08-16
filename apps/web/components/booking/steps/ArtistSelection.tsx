'use client';

import React from 'react';
import { useBooking } from '../BookingProvider';
import type { Service, Artist } from '@/types';

interface ArtistSelectionProps {
  artists: (Artist & {
    user: { id: string; name: string };
  })[];
  selectedService: Service | null;
}

export function ArtistSelection({ artists, selectedService }: ArtistSelectionProps) {
  const { state, dispatch } = useBooking();

  const handleArtistSelect = (artist: Artist & { user: { id: string; name: string } }) => {
    dispatch({ type: 'SET_ARTIST', payload: artist });
  };

  // Filter artists based on selected service specialties
  const availableArtists = React.useMemo(() => {
    if (!selectedService) return artists;

    return artists.filter(artist => {
      const specialties = Array.isArray(artist.specialties) 
        ? artist.specialties 
        : JSON.parse(artist.specialties || '[]');
      
      // Check if artist has the required specialty for the service category
      return specialties.includes(selectedService.category.toLowerCase()) ||
             specialties.includes('all') ||
             specialties.length === 0; // If no specialties defined, assume they can do all
    });
  }, [artists, selectedService]);

  const getArtistInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSpecialtyBadges = (specialties: string[]) => {
    const specialtyLabels: Record<string, string> = {
      'tattoo': 'Tattoo',
      'piercing': 'Piercing',
      'laser': 'Laser',
      'microblading': 'Microblading',
      'all': 'All Services',
    };

    return specialties.map(specialty => 
      specialtyLabels[specialty] || specialty.charAt(0).toUpperCase() + specialty.slice(1)
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Artist
        </h2>
        <p className="text-gray-600">
          Select the artist you'd prefer for your {selectedService?.name}
        </p>
      </div>

      {selectedService && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Selected Service</h3>
              <p className="text-sm text-blue-700">{selectedService.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {availableArtists.map((artist) => {
          const specialties = Array.isArray(artist.specialties) 
            ? artist.specialties 
            : JSON.parse(artist.specialties || '[]');
          
          return (
            <div
              key={artist.id}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                state.selectedArtist?.id === artist.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => handleArtistSelect(artist)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getArtistInitials(artist.user.name)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">
                    {artist.user.name}
                  </h4>
                  
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {getSpecialtyBadges(specialties).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Available for booking</span>
                  </div>
                </div>

                {state.selectedArtist?.id === artist.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {availableArtists.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Artists Available
          </h3>
          <p className="text-gray-600">
            No artists are available for the selected service at the moment.
          </p>
        </div>
      )}

      {/* Option to select "Any Available Artist" */}
      {availableArtists.length > 1 && (
        <div className="border-t pt-6">
          <div
            className={`p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-gray-400 ${
              state.selectedArtist?.id === 'any'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50'
            }`}
            onClick={() => handleArtistSelect({ 
              id: 'any', 
              storeId: '', 
              userId: 'any', 
              specialties: [], 
              schedule: '{}', 
              commission: 0, 
              googleCalendarId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              user: { id: 'any', name: 'Any Available Artist' }
            } as any)}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Any Available Artist</h4>
              <p className="text-sm text-gray-600 mt-1">
                Let us assign the best available artist for your appointment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}