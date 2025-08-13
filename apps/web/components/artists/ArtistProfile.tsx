'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArtistWithUser, ArtistAbsence, CreateAbsenceData } from '@/types';

interface ArtistProfileProps {
  artist: ArtistWithUser;
  absences?: ArtistAbsence[];
  onUpdateArtist: (artistId: string) => void;
  onCreateAbsence: (data: CreateAbsenceData) => Promise<void>;
  onDeleteArtist: (artistId: string) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ArtistProfile: React.FC<ArtistProfileProps> = ({
  artist,
  absences = [],
  onUpdateArtist,
  onCreateAbsence,
  onDeleteArtist,
  canEdit = true,
  canDelete = false
}) => {
  const t = useTranslations('artists');
  const [showAbsenceForm, setShowAbsenceForm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [absenceForm, setAbsenceForm] = useState<{
    startDate: string;
    endDate: string;
    type: 'vacation' | 'sick' | 'personal' | 'training';
    reason: string;
  }>({
    startDate: '',
    endDate: '',
    type: 'vacation',
    reason: ''
  });

  const handleCreateAbsence = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedReason = absenceForm.reason.trim();
      const absenceData: CreateAbsenceData = {
        artistId: artist.id,
        startDate: new Date(absenceForm.startDate),
        endDate: new Date(absenceForm.endDate),
        type: absenceForm.type,
        ...(trimmedReason && { reason: trimmedReason })
      };
      await onCreateAbsence(absenceData);

      setShowAbsenceForm(false);
      setAbsenceForm({
        startDate: '',
        endDate: '',
        type: 'vacation',
        reason: ''
      });
    } catch (error) {
      console.error('Error creating absence:', error);
    } finally {
      setIsLoading(false);
    }
  }, [absenceForm, artist.id, onCreateAbsence]);

  const handleDeleteArtist = useCallback(async () => {
    setIsLoading(true);
    try {
      await onDeleteArtist(artist.id);
    } catch (error) {
      console.error('Error deleting artist:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [artist.id, onDeleteArtist]);



  const getAbsenceTypeColor = (type: string): string => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'personal': return 'bg-yellow-100 text-yellow-800';
      case 'training': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Artist Information */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{artist.user.name}</h2>
            <p className="text-gray-600">{artist.user.email}</p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <button
                onClick={() => onUpdateArtist(artist.id)}
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {t('delete')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{t('basicInformation')}</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('role')}</dt>
                <dd className="text-sm text-gray-900">{artist.user.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('commission')}</dt>
                <dd className="text-sm text-gray-900">{Math.round(artist.commission * 100)}%</dd>
              </div>
              {artist.googleCalendarId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('googleCalendarId')}</dt>
                  <dd className="text-sm text-gray-900 font-mono">{artist.googleCalendarId}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{t('specialties')}</h3>
            <div className="flex flex-wrap gap-2">
              {artist.specialties.map((specialty: string) => (
                <span
                  key={specialty}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">{t('schedule')}</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(artist.schedule).map(([day, daySchedule]) => (
                <div key={day} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {t(`days.${day}`)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {daySchedule.isWorking 
                      ? `${daySchedule.startTime} - ${daySchedule.endTime}`
                      : t('notWorking')
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Absences and Permissions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{t('absencesAndPermissions')}</h3>
          <button
            onClick={() => setShowAbsenceForm(true)}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('requestAbsence')}
          </button>
        </div>

        {absences.length > 0 ? (
          <div className="space-y-3">
            {absences.map((absence) => (
              <div key={absence.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAbsenceTypeColor(absence.type)}`}>
                    {t(`absenceTypes.${absence.type}`)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {absence.startDate.toLocaleDateString()} - {absence.endDate.toLocaleDateString()}
                    </p>
                    {absence.reason && (
                      <p className="text-sm text-gray-600">{absence.reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    absence.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {absence.approved ? t('approved') : t('pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">{t('noAbsences')}</p>
        )}
      </div>

      {/* Absence Form Modal */}
      {showAbsenceForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('requestAbsence')}</h3>
            
            <form onSubmit={handleCreateAbsence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('absenceType')}
                </label>
                <select
                  value={absenceForm.type}
                  onChange={(e) => setAbsenceForm(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'vacation' | 'sick' | 'personal' | 'training'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="vacation">{t('absenceTypes.vacation')}</option>
                  <option value="sick">{t('absenceTypes.sick')}</option>
                  <option value="personal">{t('absenceTypes.personal')}</option>
                  <option value="training">{t('absenceTypes.training')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('startDate')}
                </label>
                <input
                  type="date"
                  value={absenceForm.startDate}
                  onChange={(e) => setAbsenceForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('endDate')}
                </label>
                <input
                  type="date"
                  value={absenceForm.endDate}
                  onChange={(e) => setAbsenceForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reason')} ({t('optional')})
                </label>
                <textarea
                  value={absenceForm.reason}
                  onChange={(e) => setAbsenceForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAbsenceForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isLoading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? t('requesting') : t('requestAbsence')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('confirmDelete')}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('deleteArtistWarning', { name: artist.user.name })}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteArtist}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistProfile;