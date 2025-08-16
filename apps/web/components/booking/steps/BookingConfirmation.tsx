'use client';

import { useState } from 'react';
import { useBooking } from '../BookingProvider';
import type { Store, Service, Artist } from '@/types';

interface BookingConfirmationProps {
  store: Store & {
    company: { id: string; name: string };
  };
  service: Service | null;
  artist: Artist | null;
  dateTime: Date | null;
  clientData: any;
}

export function BookingConfirmation({
  store,
  service,
  artist,
  dateTime,
  clientData,
}: BookingConfirmationProps) {
  const { dispatch, resetBooking } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const handleConfirmBooking = async () => {
    if (!service || !artist || !dateTime) {
      dispatch({ type: 'SET_ERROR', payload: 'Missing required booking information' });
      return;
    }

    setIsSubmitting(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const bookingData = {
        storeId: store.id,
        serviceId: service.id,
        artistId: artist.id === 'any' ? null : artist.id, // Let system assign if 'any'
        startTime: dateTime.toISOString(),
        endTime: new Date(dateTime.getTime() + service.duration * 60000).toISOString(),
        price: service.price,
        clientData: {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          birthDate: clientData.birthDate?.toISOString(),
          isMinor: clientData.isMinor,
          guardianInfo: clientData.guardianInfo ? JSON.stringify(clientData.guardianInfo) : null,
          medicalInfo: clientData.medicalInfo ? JSON.stringify(clientData.medicalInfo) : null,
          imageRights: clientData.imageRights,
          source: 'online_booking',
        },
        notes: clientData.notes,
      };

      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      if (result.success) {
        setAppointmentId(result.data.appointmentId);
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600">
            Your appointment has been successfully booked.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">
            Appointment Details
          </h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Appointment ID:</strong> {appointmentId}</p>
            <p><strong>Service:</strong> {service?.name}</p>
            <p><strong>Artist:</strong> {artist?.id === 'any' ? 'To be assigned' : (artist as any)?.user?.name}</p>
            <p><strong>Date & Time:</strong> {dateTime ? formatDateTime(dateTime) : ''}</p>
            <p><strong>Duration:</strong> {service ? formatDuration(service.duration) : ''}</p>
            <p><strong>Price:</strong> {service ? formatPrice(service.price) : ''}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What's Next?</p>
              <ul className="space-y-1">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• We'll send you reminders 24 hours and 2 hours before your appointment</li>
                <li>• If you need to reschedule or cancel, please contact us at least 24 hours in advance</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={resetBooking}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Book Another Appointment
          </button>
          
          <div className="text-sm text-gray-600">
            <p>Need help? Contact us:</p>
            <p className="font-medium">{store.name}</p>
            {/* Add store contact information here if available */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm Your Booking
        </h2>
        <p className="text-gray-600">
          Please review your appointment details before confirming
        </p>
      </div>

      {/* Appointment Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Appointment Summary
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">Service</h4>
              <p className="text-gray-600">{service?.name}</p>
              {service?.description && (
                <p className="text-sm text-gray-500 mt-1">{service.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">{service ? formatPrice(service.price) : ''}</div>
              <div className="text-sm text-gray-500">{service ? formatDuration(service.duration) : ''}</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Artist</h4>
                <p className="text-gray-600">
                  {artist?.id === 'any' ? 'Any Available Artist' : (artist as any)?.user?.name}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Date & Time</h4>
                <p className="text-gray-600">
                  {dateTime ? formatDateTime(dateTime) : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900">Location</h4>
            <p className="text-gray-600">{store.name}</p>
            <p className="text-sm text-gray-500">{store.company.name}</p>
          </div>
        </div>
      </div>

      {/* Client Information Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Information
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900">Contact Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{clientData.name}</p>
              <p>{clientData.email}</p>
              <p>{clientData.phone}</p>
            </div>
          </div>

          {clientData.isMinor && clientData.guardianInfo && (
            <div>
              <h4 className="font-medium text-gray-900">Guardian Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{clientData.guardianInfo.name}</p>
                <p>{clientData.guardianInfo.email}</p>
                <p>{clientData.guardianInfo.phone}</p>
                <p className="capitalize">{clientData.guardianInfo.relationship}</p>
              </div>
            </div>
          )}
        </div>

        {clientData.notes && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-gray-900">Additional Notes</h4>
            <p className="text-sm text-gray-600 mt-1">{clientData.notes}</p>
          </div>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Information</p>
            <ul className="space-y-1">
              <li>• Please arrive 10 minutes before your appointment</li>
              <li>• Cancellations must be made at least 24 hours in advance</li>
              <li>• A deposit may be required for certain services</li>
              <li>• Please bring a valid ID and guardian consent if you're under 18</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Button */}
      <div className="pt-4">
        <button
          onClick={handleConfirmBooking}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Confirming Booking...</span>
            </>
          ) : (
            <span>Confirm Booking</span>
          )}
        </button>
      </div>
    </div>
  );
}