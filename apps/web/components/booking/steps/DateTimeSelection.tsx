'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingProvider';
import type { Service, Artist } from '@/types';

interface DateTimeSelectionProps {
  storeId: string;
  selectedService: Service | null;
  selectedArtist: Artist | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  datetime: Date;
}

export function DateTimeSelection({ 
  storeId, 
  selectedService, 
  selectedArtist 
}: DateTimeSelectionProps) {
  const { state, dispatch } = useBooking();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Generate next 30 days for date selection
  const availableDates = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, []);

  // Fetch available time slots when date, service, or artist changes
  useEffect(() => {
    if (selectedDate && selectedService && selectedArtist) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService, selectedArtist]);

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedArtist || !selectedDate) return;

    setIsLoadingSlots(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const params = new URLSearchParams();
      params.append('storeId', storeId);
      params.append('serviceId', selectedService.id);
      params.append('artistId', selectedArtist.id);
      params.append('date', selectedDate.toISOString().split('T')[0]!);

      const response = await fetch(`/api/booking/availability?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.data.slots || []);
      } else {
        throw new Error(data.error || 'Failed to fetch available slots');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load available times'
      });
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    dispatch({ type: 'SET_DATETIME', payload: null as any }); // Reset selected time
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available) {
      dispatch({ type: 'SET_DATETIME', payload: slot.datetime });
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (time: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(`2000-01-01T${time}`));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pick Date & Time
        </h2>
        <p className="text-gray-600">
          Choose your preferred date and time for the appointment
        </p>
      </div>

      {/* Selected Service and Artist Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Service</h3>
              <p className="text-sm text-gray-600">{selectedService?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Artist</h3>
              <p className="text-sm text-gray-600">
                {selectedArtist?.id === 'any' ? 'Any Available Artist' : (selectedArtist as any)?.user?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
        <div className="grid grid-cols-7 gap-2">
          {availableDates.slice(0, 14).map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className={`p-3 text-center rounded-lg border transition-all duration-200 ${
                isSelected(date)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs font-medium">
                {isToday(date) ? 'Today' : formatDate(date).split(' ')[0]}
              </div>
              <div className="text-sm font-bold">
                {date.getDate()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Times for {formatDate(selectedDate)}
        </h3>
        
        {isLoadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading available times...</span>
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleTimeSelect(slot)}
                disabled={!slot.available}
                className={`p-3 text-center rounded-lg border transition-all duration-200 ${
                  state.selectedDateTime?.getTime() === slot.datetime.getTime()
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : slot.available
                    ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-sm font-medium">
                  {formatTime(slot.time)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No Available Times
            </h4>
            <p className="text-gray-600">
              No appointment slots are available for the selected date. Please choose a different date.
            </p>
          </div>
        )}
      </div>

      {/* Duration and Price Info */}
      {selectedService && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Duration: {Math.floor(selectedService.duration / 60)}h {selectedService.duration % 60}min
              </span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
              }).format(selectedService.price)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}