'use client';

import React, { useState } from 'react';
import { CalendarConflict } from '../../lib/services/calendar/types';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  conflicts: Record<string, CalendarConflict[]>;
  appointmentTitle: string;
  appointmentTime: { start: Date; end: Date };
  onResolve: (resolution: 'keep_local' | 'keep_remote' | 'reschedule', conflictIds?: string[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  isOpen,
  conflicts,
  appointmentTitle,
  appointmentTime,
  onResolve,
  onCancel,
  loading = false
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'keep_local' | 'keep_remote' | 'reschedule'>('keep_local');
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);

  if (!isOpen) return null;

  // const allConflicts = Object.entries(conflicts).flatMap(([provider, providerConflicts]) =>
  //   providerConflicts.map(conflict => ({ ...conflict, provider }))
  // );

  const handleResolve = () => {
    onResolve(selectedResolution, selectedConflicts);
  };

  const handleConflictToggle = (conflictId: string) => {
    setSelectedConflicts(prev =>
      prev.includes(conflictId)
        ? prev.filter(id => id !== conflictId)
        : [...prev, conflictId]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Calendar Conflicts Detected
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                The following conflicts were found when trying to sync your appointment
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* Current appointment info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Your Appointment</h3>
            <div className="text-sm text-blue-700">
              <p className="font-medium">{appointmentTitle}</p>
              <p>{formatTime(appointmentTime.start)} - {formatTime(appointmentTime.end)}</p>
            </div>
          </div>

          {/* Conflicts by provider */}
          <div className="space-y-4">
            {Object.entries(conflicts).map(([provider, providerConflicts]) => (
              <div key={provider} className="border border-gray-200 rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {provider} Calendar Conflicts ({providerConflicts.length})
                  </h3>
                </div>
                
                <div className="p-4 space-y-3">
                  {providerConflicts.map((conflict, index) => (
                    <div
                      key={`${provider}-${index}`}
                      className={`p-3 border rounded-lg ${getSeverityColor(conflict.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{conflict.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              conflict.severity === 'high' ? 'bg-red-100 text-red-700' :
                              conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {conflict.severity} priority
                            </span>
                          </div>
                          
                          <p className="text-sm mb-2">
                            {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}
                          </p>
                          
                          <p className="text-sm capitalize mb-2">
                            Conflict type: {conflict.conflictType.replace('_', ' ')}
                          </p>
                          
                          {conflict.suggestion && (
                            <p className="text-sm italic">
                              Suggestion: {conflict.suggestion}
                            </p>
                          )}
                        </div>
                        
                        <label className="flex items-center ml-4">
                          <input
                            type="checkbox"
                            checked={selectedConflicts.includes(conflict.eventId)}
                            onChange={() => handleConflictToggle(conflict.eventId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm">Select</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution options */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-4">How would you like to resolve these conflicts?</h3>
          
          <div className="space-y-3 mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="resolution"
                value="keep_local"
                checked={selectedResolution === 'keep_local'}
                onChange={(e) => setSelectedResolution(e.target.value as 'keep_local')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Keep InkGest appointment</div>
                <div className="text-sm text-gray-600">
                  Delete conflicting events from external calendars and proceed with sync
                </div>
              </div>
            </label>
            
            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="resolution"
                value="keep_remote"
                checked={selectedResolution === 'keep_remote'}
                onChange={(e) => setSelectedResolution(e.target.value as 'keep_remote')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Keep external calendar events</div>
                <div className="text-sm text-gray-600">
                  Cancel the InkGest appointment sync and keep existing external events
                </div>
              </div>
            </label>
            
            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="resolution"
                value="reschedule"
                checked={selectedResolution === 'reschedule'}
                onChange={(e) => setSelectedResolution(e.target.value as 'reschedule')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Reschedule appointment</div>
                <div className="text-sm text-gray-600">
                  Cancel sync and return to appointment form to choose a different time
                </div>
              </div>
            </label>
          </div>

          {selectedConflicts.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                {selectedConflicts.length} conflict(s) selected for resolution
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleResolve}
            disabled={loading || (selectedResolution !== 'reschedule' && selectedConflicts.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {loading ? 'Resolving...' : 
               selectedResolution === 'reschedule' ? 'Reschedule' : 'Resolve Conflicts'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};