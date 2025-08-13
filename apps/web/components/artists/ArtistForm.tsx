'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CreateArtistData, UpdateArtistData, ArtistSchedule, DaySchedule, User, ArtistWithUser } from '@/types';

interface ArtistFormProps {
  artist?: ArtistWithUser | undefined;
  users: User[];
  storeId: string;
  specialties: string[];
  onSubmit: (data: CreateArtistData | UpdateArtistData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultSchedule: ArtistSchedule = {
  monday: { isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
  tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
  wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
  thursday: { isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
  friday: { isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
  saturday: { isWorking: true, startTime: '10:00', endTime: '16:00', breaks: [] },
  sunday: { isWorking: false, breaks: [] },
};

const ArtistForm: React.FC<ArtistFormProps> = ({
  artist,
  users,
  storeId,
  specialties,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const t = useTranslations('artists');
  
  const [formData, setFormData] = useState<{
    userId: string;
    specialties: string[];
    schedule: ArtistSchedule;
    commission: number;
    googleCalendarId: string;
  }>({
    userId: artist?.user.id || '',
    specialties: artist?.specialties || [],
    schedule: artist?.schedule || defaultSchedule,
    commission: artist?.commission || 0.5,
    googleCalendarId: artist?.googleCalendarId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors['userId'] = t('validation.userRequired');
    }

    if (formData.specialties.length === 0) {
      newErrors['specialties'] = t('validation.specialtiesRequired');
    }

    if (formData.commission < 0 || formData.commission > 1) {
      newErrors['commission'] = t('validation.commissionRange');
    }

    // Validate schedule
    const workingDays = Object.entries(formData.schedule).filter(([_, daySchedule]) => daySchedule.isWorking);
    if (workingDays.length === 0) {
      newErrors['schedule'] = t('validation.atLeastOneWorkingDay');
    }

    for (const [day, daySchedule] of workingDays) {
      if (daySchedule.isWorking && (!daySchedule.startTime || !daySchedule.endTime)) {
        newErrors[`schedule.${day}`] = t('validation.workingHoursRequired');
      }
      if (daySchedule.startTime && daySchedule.endTime && daySchedule.startTime >= daySchedule.endTime) {
        newErrors[`schedule.${day}`] = t('validation.endTimeAfterStartTime');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (artist) {
        await onSubmit({
          id: artist.id,
          ...formData,
        } as UpdateArtistData);
      } else {
        await onSubmit({
          storeId,
          ...formData,
        } as CreateArtistData);
      }
    } catch (error) {
      console.error('Error submitting artist form:', error);
    }
  }, [formData, validateForm, onSubmit, artist, storeId]);

  const handleSpecialtyToggle = useCallback((specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  }, []);

  const handleScheduleChange = useCallback((day: keyof ArtistSchedule, field: keyof DaySchedule, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  }, []);

  const availableUsers = users.filter(user => 
    !artist || user.id === artist.user.id
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {artist ? t('editArtist') : t('createArtist')}
        </h3>

        {/* User Selection */}
        <div className="mb-4">
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
            {t('user')} *
          </label>
          <select
            id="userId"
            value={formData.userId}
            onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['userId'] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!!artist || isLoading}
          >
            <option value="">{t('selectUser')}</option>
            {availableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {errors['userId'] && (
            <p className="mt-1 text-sm text-red-600">{errors['userId']}</p>
          )}
        </div>

        {/* Commission */}
        <div className="mb-4">
          <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-2">
            {t('commission')} * (0-100%)
          </label>
          <input
            type="number"
            id="commission"
            min="0"
            max="100"
            step="1"
            value={Math.round(formData.commission * 100)}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              commission: parseInt(e.target.value) / 100 
            }))}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['commission'] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors['commission'] && (
            <p className="mt-1 text-sm text-red-600">{errors['commission']}</p>
          )}
        </div>

        {/* Google Calendar ID */}
        <div className="mb-4">
          <label htmlFor="googleCalendarId" className="block text-sm font-medium text-gray-700 mb-2">
            {t('googleCalendarId')}
          </label>
          <input
            type="text"
            id="googleCalendarId"
            value={formData.googleCalendarId}
            onChange={(e) => setFormData(prev => ({ ...prev, googleCalendarId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('googleCalendarIdPlaceholder')}
            disabled={isLoading}
          />
        </div>

        {/* Specialties */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('specialties')} *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {specialties.map(specialty => (
              <label key={specialty} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty)}
                  onChange={() => handleSpecialtyToggle(specialty)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">{specialty}</span>
              </label>
            ))}
          </div>
          {errors['specialties'] && (
            <p className="mt-1 text-sm text-red-600">{errors['specialties']}</p>
          )}
        </div>

        {/* Schedule */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {t('schedule')} *
          </label>
          <div className="space-y-4">
            {Object.entries(formData.schedule).map(([day, daySchedule]) => (
              <div key={day} className="flex items-center space-x-4 p-3 border rounded-md">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {t(`days.${day}`)}
                  </span>
                </div>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={daySchedule.isWorking}
                    onChange={(e) => handleScheduleChange(day as keyof ArtistSchedule, 'isWorking', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700">{t('working')}</span>
                </label>

                {daySchedule.isWorking && (
                  <>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">{t('from')}</label>
                      <input
                        type="time"
                        value={daySchedule.startTime || ''}
                        onChange={(e) => handleScheduleChange(day as keyof ArtistSchedule, 'startTime', e.target.value)}
                        className={`px-2 py-1 border rounded text-sm ${
                          errors[`schedule.${day}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">{t('to')}</label>
                      <input
                        type="time"
                        value={daySchedule.endTime || ''}
                        onChange={(e) => handleScheduleChange(day as keyof ArtistSchedule, 'endTime', e.target.value)}
                        className={`px-2 py-1 border rounded text-sm ${
                          errors[`schedule.${day}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
                
                {errors[`schedule.${day}`] && (
                  <p className="text-sm text-red-600">{errors[`schedule.${day}`]}</p>
                )}
              </div>
            ))}
          </div>
          {errors['schedule'] && (
            <p className="mt-1 text-sm text-red-600">{errors['schedule']}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? t('saving') : (artist ? t('updateArtist') : t('createArtist'))}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ArtistForm;