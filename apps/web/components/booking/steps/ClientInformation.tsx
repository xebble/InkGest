'use client';

import { useState } from 'react';
import { useBooking } from '../BookingProvider';

export function ClientInformation() {
  const { state, dispatch } = useBooking();
  const [showGuardianInfo, setShowGuardianInfo] = useState(state.clientData.isMinor);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    dispatch({
      type: 'SET_CLIENT_DATA',
      payload: { [field]: value },
    });
  };

  const handleGuardianInfoChange = (field: string, value: string) => {
    const currentGuardianInfo = state.clientData.guardianInfo || {
      name: '',
      email: '',
      phone: '',
      relationship: 'parent' as const,
      idDocument: '',
    };

    dispatch({
      type: 'SET_CLIENT_DATA',
      payload: {
        guardianInfo: {
          ...currentGuardianInfo,
          [field]: value,
        },
      },
    });
  };

  const handleMedicalInfoChange = (field: string, value: any) => {
    const currentMedicalInfo = state.clientData.medicalInfo || {
      allergies: [],
      medications: [],
      conditions: [],
      notes: '',
    };

    dispatch({
      type: 'SET_CLIENT_DATA',
      payload: {
        medicalInfo: {
          ...currentMedicalInfo,
          [field]: value,
        },
      },
    });
  };

  const handleMinorChange = (isMinor: boolean) => {
    handleInputChange('isMinor', isMinor);
    setShowGuardianInfo(isMinor);
    
    if (!isMinor) {
      handleInputChange('guardianInfo', undefined);
    }
  };

  const addMedicalItem = (field: 'allergies' | 'medications' | 'conditions', item: string) => {
    if (!item.trim()) return;
    
    const currentItems = state.clientData.medicalInfo?.[field] || [];
    if (!currentItems.includes(item.trim())) {
      handleMedicalInfoChange(field, [...currentItems, item.trim()]);
    }
  };

  const removeMedicalItem = (field: 'allergies' | 'medications' | 'conditions', index: number) => {
    const currentItems = state.clientData.medicalInfo?.[field] || [];
    handleMedicalInfoChange(field, currentItems.filter((_, i) => i !== index));
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Information
        </h2>
        <p className="text-gray-600">
          Please provide your details to complete the booking
        </p>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={state.clientData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={state.clientData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={state.clientData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+34 123 456 789"
              required
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              id="birthDate"
              value={state.clientData.birthDate ? state.clientData.birthDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                handleInputChange('birthDate', date);
                
                // Auto-detect if minor
                if (date) {
                  const age = calculateAge(date);
                  const isMinor = age < 18;
                  if (isMinor !== state.clientData.isMinor) {
                    handleMinorChange(isMinor);
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Minor Status */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isMinor"
            checked={state.clientData.isMinor}
            onChange={(e) => handleMinorChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isMinor" className="text-sm font-medium text-gray-700">
            I am under 18 years old
          </label>
        </div>

        {/* Guardian Information */}
        {showGuardianInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Guardian Information (Required for minors)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Name *
                </label>
                <input
                  type="text"
                  id="guardianName"
                  value={state.clientData.guardianInfo?.name || ''}
                  onChange={(e) => handleGuardianInfoChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Guardian's full name"
                  required={state.clientData.isMinor}
                />
              </div>

              <div>
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Email *
                </label>
                <input
                  type="email"
                  id="guardianEmail"
                  value={state.clientData.guardianInfo?.email || ''}
                  onChange={(e) => handleGuardianInfoChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Guardian's email"
                  required={state.clientData.isMinor}
                />
              </div>

              <div>
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Phone *
                </label>
                <input
                  type="tel"
                  id="guardianPhone"
                  value={state.clientData.guardianInfo?.phone || ''}
                  onChange={(e) => handleGuardianInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Guardian's phone"
                  required={state.clientData.isMinor}
                />
              </div>

              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <select
                  id="relationship"
                  value={state.clientData.guardianInfo?.relationship || 'parent'}
                  onChange={(e) => handleGuardianInfoChange('relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={state.clientData.isMinor}
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Legal Guardian</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="guardianId" className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian ID Document *
                </label>
                <input
                  type="text"
                  id="guardianId"
                  value={state.clientData.guardianInfo?.idDocument || ''}
                  onChange={(e) => handleGuardianInfoChange('idDocument', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ID/Passport number"
                  required={state.clientData.isMinor}
                />
              </div>
            </div>
          </div>
        )}

        {/* Medical Information Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowMedicalInfo(!showMedicalInfo)}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showMedicalInfo ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Medical Information (Optional)</span>
          </button>
        </div>

        {/* Medical Information */}
        {showMedicalInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Medical Information
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide any relevant medical information that might affect your treatment.
            </p>

            <div className="space-y-4">
              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(state.clientData.medicalInfo?.allergies || []).map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeMedicalItem('allergies', index)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add allergy and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMedicalItem('allergies', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(state.clientData.medicalInfo?.medications || []).map((medication, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {medication}
                      <button
                        type="button"
                        onClick={() => removeMedicalItem('medications', index)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add medication and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMedicalItem('medications', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Medical Notes */}
              <div>
                <label htmlFor="medicalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Medical Notes
                </label>
                <textarea
                  id="medicalNotes"
                  rows={3}
                  value={state.clientData.medicalInfo?.notes || ''}
                  onChange={(e) => handleMedicalInfoChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any other medical information we should know about..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Rights */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="imageRights"
            checked={state.clientData.imageRights}
            onChange={(e) => handleInputChange('imageRights', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="imageRights" className="text-sm text-gray-700">
            I consent to the use of my image for promotional purposes (optional)
          </label>
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={state.clientData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special requests or information you'd like us to know..."
          />
        </div>
      </form>
    </div>
  );
}