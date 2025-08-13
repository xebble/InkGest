'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, addMinutes, isBefore, isAfter } from 'date-fns';
import { Calendar, Clock, User, Briefcase, MapPin, Euro, FileText } from 'lucide-react';

import type { 
  AppointmentFormProps, 
  AppointmentFormData,
  ValidationError,
  AppointmentValidation 
} from './types';
import type { AppointmentStatus } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';


const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'SCHEDULED',
  'CONFIRMED', 
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
];

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  artists,
  services,
  rooms,
  clients,
  isOpen,
  onClose,
  onSubmit,
  defaultDate,
  defaultArtist,
  defaultRoom,
}) => {
  const t = useTranslations('appointments.form');
  
  // Form state
  const [formData, setFormData] = useState<AppointmentFormData>({
    clientId: '',
    artistId: defaultArtist || '',
    serviceId: '',
    roomId: defaultRoom || '',
    startTime: defaultDate || new Date(),
    endTime: defaultDate ? addMinutes(defaultDate, 60) : addMinutes(new Date(), 60),
    notes: '',
    price: 0,
    deposit: 0,
  });

  const [status, setStatus] = useState<AppointmentStatus>('SCHEDULED');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showClientSearch, setShowClientSearch] = useState<boolean>(false);

  // Initialize form data when appointment changes
  useEffect(() => {
    if (appointment) {
      setFormData({
        clientId: appointment.clientId,
        artistId: appointment.artistId,
        serviceId: appointment.serviceId,
        roomId: appointment.roomId || '',
        startTime: new Date(appointment.startTime),
        endTime: new Date(appointment.endTime),
        notes: appointment.notes || '',
        price: appointment.price,
        deposit: appointment.deposit || 0,
      });
      setStatus(appointment.status as AppointmentStatus);
    } else {
      // Reset form for new appointment
      setFormData({
        clientId: '',
        artistId: defaultArtist || '',
        serviceId: '',
        roomId: defaultRoom || '',
        startTime: defaultDate || new Date(),
        endTime: defaultDate ? addMinutes(defaultDate, 60) : addMinutes(new Date(), 60),
        notes: '',
        price: 0,
        deposit: 0,
      });
      setStatus('SCHEDULED');
    }
    setErrors([]);
  }, [appointment, defaultDate, defaultArtist, defaultRoom]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    
    const searchTerm = clientSearch.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      client.phone.toLowerCase().includes(searchTerm)
    );
  }, [clients, clientSearch]);

  // Get selected service details
  const selectedService = useMemo(() => {
    return services.find(service => service.id === formData.serviceId);
  }, [services, formData.serviceId]);

  // Calculate end time based on service duration
  useEffect(() => {
    if (selectedService && formData.startTime) {
      const endTime = addMinutes(formData.startTime, selectedService.duration);
      setFormData(prev => ({ ...prev, endTime, price: selectedService.price }));
    }
  }, [selectedService, formData.startTime]);

  // Validate form data
  const validateForm = useCallback((): AppointmentValidation => {
    const validationErrors: ValidationError[] = [];

    // Required fields
    if (!formData.clientId) {
      validationErrors.push({ field: 'clientId', message: t('validation.clientRequired') });
    }
    if (!formData.artistId) {
      validationErrors.push({ field: 'artistId', message: t('validation.artistRequired') });
    }
    if (!formData.serviceId) {
      validationErrors.push({ field: 'serviceId', message: t('validation.serviceRequired') });
    }

    // Date validation
    if (!formData.startTime) {
      validationErrors.push({ field: 'startTime', message: t('validation.startTimeRequired') });
    }
    if (!formData.endTime) {
      validationErrors.push({ field: 'endTime', message: t('validation.endTimeRequired') });
    }

    if (formData.startTime && formData.endTime) {
      if (isAfter(formData.startTime, formData.endTime)) {
        validationErrors.push({ field: 'endTime', message: t('validation.endTimeAfterStart') });
      }
      
      if (isBefore(formData.startTime, new Date())) {
        validationErrors.push({ field: 'startTime', message: t('validation.startTimeInFuture') });
      }
    }

    // Price validation
    if (formData.price < 0) {
      validationErrors.push({ field: 'price', message: t('validation.pricePositive') });
    }

    if (formData.deposit && formData.deposit > formData.price) {
      validationErrors.push({ field: 'deposit', message: t('validation.depositLessThanPrice') });
    }

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
    };
  }, [formData, t]);

  // Handle form field changes
  const handleFieldChange = useCallback(<K extends keyof AppointmentFormData>(
    field: K,
    value: AppointmentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  // Handle date/time changes
  const handleDateTimeChange = useCallback((field: 'startTime' | 'endTime', value: string) => {
    const newDate = new Date(value);
    handleFieldChange(field, newDate);
  }, [handleFieldChange]);

  // Handle client selection
  const handleClientSelect = useCallback((clientId: string) => {
    handleFieldChange('clientId', clientId);
    setShowClientSearch(false);
    setClientSearch('');
  }, [handleFieldChange]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = appointment 
        ? { ...formData, status }
        : formData;
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting appointment:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, status, appointment, validateForm, onSubmit]);

  // Get error for field
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  // Get selected client
  const selectedClient = useMemo(() => {
    return clients.find(client => client.id === formData.clientId);
  }, [clients, formData.clientId]);

  // Get selected artist
  const selectedArtist = useMemo(() => {
    return artists.find(artist => artist.id === formData.artistId);
  }, [artists, formData.artistId]);

  // Get selected room
  const selectedRoom = useMemo(() => {
    return rooms.find(room => room.id === formData.roomId);
  }, [rooms, formData.roomId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={appointment ? t('editAppointment') : t('newAppointment')}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            <span>{t('client')}</span>
          </label>
          
          {selectedClient ? (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedClient.name}</p>
                  <p className="text-sm text-gray-600">{selectedClient.email}</p>
                  <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleFieldChange('clientId', '');
                    setShowClientSearch(true);
                  }}
                >
                  {t('changeClient')}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('searchClient')}
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onFocus={() => setShowClientSearch(true)}
                />
                {showClientSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client.id)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                            <p className="text-sm text-gray-600">{client.phone}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        {t('noClientsFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {getFieldError('clientId') && (
            <p className="text-sm text-red-600">{getFieldError('clientId')}</p>
          )}
        </div>

        {/* Artist Selection */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            <span>{t('artist')}</span>
          </label>
          <Select
            value={formData.artistId}
            onChange={(e) => handleFieldChange('artistId', e.target.value)}
            placeholder={t('selectArtist')}
          >
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.user?.name || 'Unknown Artist'}
              </option>
            ))}
          </Select>
          {getFieldError('artistId') && (
            <p className="text-sm text-red-600">{getFieldError('artistId')}</p>
          )}
        </div>

        {/* Service Selection */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Briefcase className="h-4 w-4" />
            <span>{t('service')}</span>
          </label>
          <Select
            value={formData.serviceId}
            onChange={(e) => handleFieldChange('serviceId', e.target.value)}
            placeholder={t('selectService')}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.duration}min - €{service.price}
              </option>
            ))}
          </Select>
          {getFieldError('serviceId') && (
            <p className="text-sm text-red-600">{getFieldError('serviceId')}</p>
          )}
        </div>

        {/* Room Selection */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            <span>{t('room')}</span>
          </label>
          <Select
            value={formData.roomId}
            onChange={(e) => handleFieldChange('roomId', e.target.value)}
            placeholder={t('selectRoom')}
          >
            <option value="">{t('noRoom')}</option>
            {rooms.filter(room => room.isAvailable).map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              <span>{t('startDateTime')}</span>
            </label>
            <Input
              type="datetime-local"
              value={format(formData.startTime, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
            />
            {getFieldError('startTime') && (
              <p className="text-sm text-red-600">{getFieldError('startTime')}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4" />
              <span>{t('endDateTime')}</span>
            </label>
            <Input
              type="datetime-local"
              value={format(formData.endTime, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
            />
            {getFieldError('endTime') && (
              <p className="text-sm text-red-600">{getFieldError('endTime')}</p>
            )}
          </div>
        </div>

        {/* Price and Deposit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Euro className="h-4 w-4" />
              <span>{t('price')}</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
            />
            {getFieldError('price') && (
              <p className="text-sm text-red-600">{getFieldError('price')}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Euro className="h-4 w-4" />
              <span>{t('deposit')}</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.deposit}
              onChange={(e) => handleFieldChange('deposit', parseFloat(e.target.value) || 0)}
            />
            {getFieldError('deposit') && (
              <p className="text-sm text-red-600">{getFieldError('deposit')}</p>
            )}
          </div>
        </div>

        {/* Status (only for existing appointments) */}
        {appointment && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t('status')}
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
            >
              {APPOINTMENT_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {t(`status.${statusOption.toLowerCase()}`)}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <FileText className="h-4 w-4" />
            <span>{t('notes')}</span>
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows={3}
          />
        </div>

        {/* Summary */}
        {selectedService && (
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">{t('summary')}</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">{t('duration')}:</span> {selectedService.duration} {t('minutes')}</p>
              <p><span className="font-medium">{t('price')}:</span> €{formData.price}</p>
              {(formData.deposit || 0) > 0 && (
                <p><span className="font-medium">{t('deposit')}:</span> €{formData.deposit}</p>
              )}
              {selectedArtist && (
                <p><span className="font-medium">{t('artist')}:</span> {selectedArtist.user?.name || 'Unknown Artist'}</p>
              )}
              {selectedRoom && (
                <p><span className="font-medium">{t('room')}:</span> {selectedRoom.name}</p>
              )}
            </div>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : null}
            <span>{appointment ? t('updateAppointment') : t('createAppointment')}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { AppointmentForm };