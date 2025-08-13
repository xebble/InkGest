'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, X, Calendar, User, Briefcase, MapPin } from 'lucide-react';

import type { AppointmentFiltersProps } from './types';
import type { AppointmentStatus } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'SCHEDULED',
  'CONFIRMED', 
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
];

const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  filters,
  artists,
  services,
  rooms,
  onFiltersChange,
  onReset,
}) => {
  const t = useTranslations('appointments.filters');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(filters.clientSearch || '');

  // Handle client search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ clientSearch: value });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [onFiltersChange]);

  // Handle artist selection
  const handleArtistToggle = useCallback((artistId: string) => {
    const newArtistIds = filters.artistIds.includes(artistId)
      ? filters.artistIds.filter(id => id !== artistId)
      : [...filters.artistIds, artistId];
    
    onFiltersChange({ artistIds: newArtistIds });
  }, [filters.artistIds, onFiltersChange]);

  // Handle service selection
  const handleServiceToggle = useCallback((serviceId: string) => {
    const newServiceIds = filters.serviceIds.includes(serviceId)
      ? filters.serviceIds.filter(id => id !== serviceId)
      : [...filters.serviceIds, serviceId];
    
    onFiltersChange({ serviceIds: newServiceIds });
  }, [filters.serviceIds, onFiltersChange]);

  // Handle status selection
  const handleStatusToggle = useCallback((status: AppointmentStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    
    onFiltersChange({ statuses: newStatuses });
  }, [filters.statuses, onFiltersChange]);

  // Handle room selection
  const handleRoomToggle = useCallback((roomId: string) => {
    const newRoomIds = filters.roomIds.includes(roomId)
      ? filters.roomIds.filter(id => id !== roomId)
      : [...filters.roomIds, roomId];
    
    onFiltersChange({ roomIds: newRoomIds });
  }, [filters.roomIds, onFiltersChange]);

  // Handle date range change
  const handleDateRangeChange = useCallback((field: 'start' | 'end', date: string) => {
    const newDate = new Date(date);
    const newDateRange = {
      ...filters.dateRange,
      [field]: newDate,
    };
    
    onFiltersChange({ dateRange: newDateRange });
  }, [filters.dateRange, onFiltersChange]);

  // Get status display name
  const getStatusDisplayName = (status: AppointmentStatus): string => {
    const statusMap: Record<AppointmentStatus, string> = {
      SCHEDULED: t('status.scheduled'),
      CONFIRMED: t('status.confirmed'),
      IN_PROGRESS: t('status.inProgress'),
      COMPLETED: t('status.completed'),
      CANCELLED: t('status.cancelled'),
      NO_SHOW: t('status.noShow'),
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status: AppointmentStatus): string => {
    const colorMap: Record<AppointmentStatus, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-purple-100 text-purple-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Count active filters
  const activeFiltersCount = 
    filters.artistIds.length + 
    filters.serviceIds.length + 
    filters.statuses.length + 
    filters.roomIds.length + 
    (filters.clientSearch ? 1 : 0);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with search and toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Client Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={t('searchClients')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    onFiltersChange({ clientSearch: '' });
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                value={filters.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-auto"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="date"
                value={filters.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          {/* Filter toggle and reset */}
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} {t('activeFilters')}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>{t('filters')}</span>
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>{t('reset')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Artists Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  {t('artists')}
                </label>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {artists.map((artist) => (
                  <label
                    key={artist.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.artistIds.includes(artist.id)}
                      onChange={() => handleArtistToggle(artist.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {artist.user?.name || 'Unknown Artist'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Services Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  {t('services')}
                </label>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {service.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('status')}
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {APPOINTMENT_STATUSES.map((status) => (
                  <label
                    key={status}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                      {getStatusDisplayName(status)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rooms Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  {t('rooms')}
                </label>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {rooms.map((room) => (
                  <label
                    key={room.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.roomIds.includes(room.id)}
                      onChange={() => handleRoomToggle(room.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {room.name}
                    </span>
                    {!room.isAvailable && (
                      <Badge variant="secondary" className="text-xs">
                        {t('unavailable')}
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filters summary */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.artistIds.map((artistId) => {
              const artist = artists.find(a => a.id === artistId);
              return artist ? (
                <Badge
                  key={artistId}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <User className="h-3 w-3" />
                  <span>{artist.user?.name || 'Unknown Artist'}</span>
                  <button
                    onClick={() => handleArtistToggle(artistId)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}

            {filters.serviceIds.map((serviceId) => {
              const service = services.find(s => s.id === serviceId);
              return service ? (
                <Badge
                  key={serviceId}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Briefcase className="h-3 w-3" />
                  <span>{service.name}</span>
                  <button
                    onClick={() => handleServiceToggle(serviceId)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}

            {filters.statuses.map((status) => (
              <Badge
                key={status}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{getStatusDisplayName(status)}</span>
                <button
                  onClick={() => handleStatusToggle(status)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.roomIds.map((roomId) => {
              const room = rooms.find(r => r.id === roomId);
              return room ? (
                <Badge
                  key={roomId}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{room.name}</span>
                  <button
                    onClick={() => handleRoomToggle(roomId)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export { AppointmentFilters };