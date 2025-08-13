'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { 
  Client, 
  CreateClientData, 
  GuardianInfo, 
  MedicalInfo 
} from '../../types';
import { 
  createClientSchema, 
  guardianInfoSchema, 
  medicalInfoSchema 
} from '../../utils/validation';

interface ClientFormProps {
  client?: Client;
  storeId: string;
  onSubmit: (data: CreateClientData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface ClientFormData {
  storeId: string;
  email: string;
  name: string;
  phone: string;
  birthDate?: Date | undefined;
  isMinor: boolean;
  guardianInfo?: GuardianInfo | undefined;
  medicalInfo?: MedicalInfo | undefined;
  imageRights: boolean;
  source?: string | undefined;
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  storeId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const t = useTranslations();
  
  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    storeId,
    email: client?.email || '',
    name: client?.name || '',
    phone: client?.phone || '',
    birthDate: client?.birthDate ? new Date(client.birthDate) : undefined,
    isMinor: client?.isMinor || false,
    guardianInfo: client?.guardianInfo ? JSON.parse(client.guardianInfo as string) : undefined,
    medicalInfo: client?.medicalInfo ? JSON.parse(client.medicalInfo as string) : undefined,
    imageRights: client?.imageRights || false,
    source: client?.source || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showGuardianForm, setShowGuardianForm] = useState<boolean>(
    client?.isMinor || false
  );
  const [showMedicalForm, setShowMedicalForm] = useState<boolean>(
    Boolean(client?.medicalInfo)
  );

  // Handle form field changes
  const handleInputChange = useCallback((
    field: keyof ClientFormData,
    value: string | boolean | Date | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  }, [errors]);

  // Handle guardian info changes
  const handleGuardianChange = useCallback((
    field: keyof GuardianInfo,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      guardianInfo: {
        ...prev.guardianInfo,
        [field]: value
      } as GuardianInfo
    }));
  }, []);

  // Handle medical info changes
  const handleMedicalChange = useCallback((
    field: keyof MedicalInfo,
    value: string | string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [field]: value
      } as MedicalInfo
    }));
  }, []);

  // Handle minor status change
  const handleMinorChange = useCallback((isMinor: boolean) => {
    setFormData(prev => ({
      ...prev,
      isMinor,
      guardianInfo: isMinor ? (prev.guardianInfo || {
        name: '',
        email: '',
        phone: '',
        relationship: 'parent' as const,
        idDocument: ''
      }) : undefined
    }));
    setShowGuardianForm(isMinor);
  }, []);

  // Add allergy/medication/condition
  const addMedicalItem = useCallback((
    type: 'allergies' | 'medications' | 'conditions',
    value: string
  ) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [type]: [...(prev.medicalInfo?.[type] || []), value.trim()]
      } as MedicalInfo
    }));
  }, []);

  // Remove allergy/medication/condition
  const removeMedicalItem = useCallback((
    type: 'allergies' | 'medications' | 'conditions',
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [type]: prev.medicalInfo?.[type]?.filter((_, i) => i !== index) || []
      } as MedicalInfo
    }));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    try {
      createClientSchema.parse(formData as CreateClientData);
      
      // Additional validation for guardian info if minor
      if (formData.isMinor && formData.guardianInfo) {
        guardianInfoSchema.parse(formData.guardianInfo);
      }
      
      // Additional validation for medical info if provided
      if (formData.medicalInfo) {
        medicalInfoSchema.parse(formData.medicalInfo);
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData as CreateClientData);
    } catch (error) {
      
    }
  }, [formData, validateForm, onSubmit]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {client ? t('clients.edit') : t('clients.create')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6" role="form">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('clients.name')} *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('name', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            {errors['name'] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['name']}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('clients.email')} *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('email', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            {errors['email'] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['email']}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('clients.phone')} *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('phone', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            {errors['phone'] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['phone']}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('clients.birthDate')}
            </label>
            <input
              type="date"
              id="birthDate"
              value={formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('birthDate', e.target.value ? new Date(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Origen del cliente
            </label>
            <input
              type="text"
              id="source"
              value={formData.source || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('source', e.target.value)
              }
              placeholder="Redes sociales, recomendación, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Minor and Image Rights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isMinor"
              checked={formData.isMinor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleMinorChange(e.target.checked)
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isMinor" className="ml-2 block text-sm text-gray-900 dark:text-white">
              {t('clients.isMinor')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="imageRights"
              checked={formData.imageRights}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('imageRights', e.target.checked)
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="imageRights" className="ml-2 block text-sm text-gray-900 dark:text-white">
              {t('clients.imageRights')}
            </label>
          </div>
        </div>

        {/* Guardian Information (only if minor) */}
        {showGuardianForm && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('clients.guardian')} *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del tutor *
                </label>
                <input
                  type="text"
                  id="guardianName"
                  value={formData.guardianInfo?.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleGuardianChange('name', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required={formData.isMinor}
                />
                {errors['guardianInfo.name'] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['guardianInfo.name']}</p>
                )}
              </div>

              <div>
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email del tutor *
                </label>
                <input
                  type="email"
                  id="guardianEmail"
                  value={formData.guardianInfo?.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleGuardianChange('email', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required={formData.isMinor}
                />
                {errors['guardianInfo.email'] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['guardianInfo.email']}</p>
                )}
              </div>

              <div>
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono del tutor *
                </label>
                <input
                  type="tel"
                  id="guardianPhone"
                  value={formData.guardianInfo?.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleGuardianChange('phone', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required={formData.isMinor}
                />
                {errors['guardianInfo.phone'] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['guardianInfo.phone']}</p>
                )}
              </div>

              <div>
                <label htmlFor="guardianRelationship" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relación *
                </label>
                <select
                  id="guardianRelationship"
                  value={formData.guardianInfo?.relationship || 'parent'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    handleGuardianChange('relationship', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required={formData.isMinor}
                >
                  <option value="parent">Padre/Madre</option>
                  <option value="guardian">Tutor Legal</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="guardianId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento de identidad *
                </label>
                <input
                  type="text"
                  id="guardianId"
                  value={formData.guardianInfo?.idDocument || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleGuardianChange('idDocument', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required={formData.isMinor}
                />
                {errors['guardianInfo.idDocument'] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['guardianInfo.idDocument']}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Medical Information */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('clients.medicalInfo')}
            </h3>
            <button
              type="button"
              onClick={() => setShowMedicalForm(!showMedicalForm)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showMedicalForm ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showMedicalForm && (
            <MedicalInfoForm
              medicalInfo={formData.medicalInfo}
              onMedicalChange={handleMedicalChange}
              onAddItem={addMedicalItem}
              onRemoveItem={removeMedicalItem}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Medical Information Form Component
interface MedicalInfoFormProps {
  medicalInfo?: MedicalInfo | undefined;
  onMedicalChange: (field: keyof MedicalInfo, value: string | string[]) => void;
  onAddItem: (type: 'allergies' | 'medications' | 'conditions', value: string) => void;
  onRemoveItem: (type: 'allergies' | 'medications' | 'conditions', index: number) => void;
}

const MedicalInfoForm: React.FC<MedicalInfoFormProps> = ({
  medicalInfo,
  onMedicalChange,
  onAddItem,
  onRemoveItem
}) => {
  const [newAllergy, setNewAllergy] = useState<string>('');
  const [newMedication, setNewMedication] = useState<string>('');
  const [newCondition, setNewCondition] = useState<string>('');

  const handleAddAllergy = useCallback(() => {
    if (newAllergy.trim()) {
      onAddItem('allergies', newAllergy);
      setNewAllergy('');
    }
  }, [newAllergy, onAddItem]);

  const handleAddMedication = useCallback(() => {
    if (newMedication.trim()) {
      onAddItem('medications', newMedication);
      setNewMedication('');
    }
  }, [newMedication, onAddItem]);

  const handleAddCondition = useCallback(() => {
    if (newCondition.trim()) {
      onAddItem('conditions', newCondition);
      setNewCondition('');
    }
  }, [newCondition, onAddItem]);

  return (
    <div className="space-y-6">
      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alergias
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newAllergy}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAllergy(e.target.value)}
            placeholder="Agregar alergia"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAllergy();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddAllergy}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {medicalInfo?.allergies?.map((allergy, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            >
              {allergy}
              <button
                type="button"
                onClick={() => onRemoveItem('allergies', index)}
                className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Medications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Medicamentos
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newMedication}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMedication(e.target.value)}
            placeholder="Agregar medicamento"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMedication();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddMedication}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {medicalInfo?.medications?.map((medication, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              {medication}
              <button
                type="button"
                onClick={() => onRemoveItem('medications', index)}
                className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Condiciones médicas
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newCondition}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCondition(e.target.value)}
            placeholder="Agregar condición"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCondition();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddCondition}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {medicalInfo?.conditions?.map((condition, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {condition}
              <button
                type="button"
                onClick={() => onRemoveItem('conditions', index)}
                className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="medicalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notas adicionales
        </label>
        <textarea
          id="medicalNotes"
          value={medicalInfo?.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
            onMedicalChange('notes', e.target.value)
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Información médica adicional relevante..."
        />
      </div>
    </div>
  );
};

export default ClientForm;