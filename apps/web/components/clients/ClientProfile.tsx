'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { 
  Client, 
  Appointment, 
  Document, 
  GuardianInfo, 
  MedicalInfo,
  AppointmentStatus,
  DocumentType
} from '../../types';

interface ClientProfileProps {
  client: Client;
  appointments: Appointment[];
  documents: Document[];
  onClientUpdate: (id: string, data: Partial<Client>) => Promise<void>;
  onDocumentGenerate: (type: DocumentType, clientId: string) => Promise<void>;
  onEdit: () => void;
  isLoading?: boolean;
}

interface AppointmentWithDetails extends Appointment {
  service?: {
    name: string;
    category: string;
  };
  artist?: {
    user: {
      name: string;
    };
  };
}

const ClientProfile: React.FC<ClientProfileProps> = ({
  client,
  appointments,
  documents,
  onClientUpdate,
  onDocumentGenerate,
  onEdit,
  isLoading = false
}) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'documents'>('info');
  const [isGeneratingDocument, setIsGeneratingDocument] = useState<boolean>(false);

  // Parse JSON fields safely
  const guardianInfo: GuardianInfo | null = client.guardianInfo 
    ? JSON.parse(client.guardianInfo as string) 
    : null;
  
  const medicalInfo: MedicalInfo | null = client.medicalInfo 
    ? JSON.parse(client.medicalInfo as string) 
    : null;

  // Calculate client age
  const calculateAge = useCallback((birthDate: Date | string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Handle document generation
  const handleDocumentGenerate = useCallback(async (type: DocumentType) => {
    setIsGeneratingDocument(true);
    try {
      await onDocumentGenerate(type, client.id);
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setIsGeneratingDocument(false);
    }
  }, [client.id, onDocumentGenerate]);

  // Handle loyalty points update
  const handleLoyaltyPointsUpdate = useCallback(async (points: number) => {
    try {
      await onClientUpdate(client.id, { loyaltyPoints: points });
    } catch (error) {
      console.error('Error updating loyalty points:', error);
    }
  }, [client.id, onClientUpdate]);

  // Get appointment status color
  const getStatusColor = useCallback((status: AppointmentStatus): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  // Format date
  const formatDate = useCallback((date: Date | string): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Format date and time
  const formatDateTime = useCallback((date: Date | string): string => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const age = calculateAge(client.birthDate);
  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {client.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {client.email} • {client.phone}
          </p>
          {age && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {age} años {client.isMinor && '(Menor de edad)'}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.edit')}
          </button>
          <button
            onClick={() => handleDocumentGenerate('CONSENT')}
            disabled={isGeneratingDocument}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {isGeneratingDocument ? 'Generando...' : 'Generar Consentimiento'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {completedAppointments.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Servicios completados
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {upcomingAppointments.length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Citas próximas
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {client.loyaltyPoints}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Puntos de fidelidad
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {documents.length}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            Documentos
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Historial de Citas
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Documentos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información Básica
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha de nacimiento
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {client.birthDate ? formatDate(client.birthDate) : 'No especificada'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Origen del cliente
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {client.source || 'No especificado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Derechos de imagen
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {client.imageRights ? 'Autorizados' : 'No autorizados'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Loyalty Points */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Programa de Fidelidad
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {client.loyaltyPoints}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Puntos acumulados
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const points = prompt('Nuevos puntos:', client.loyaltyPoints.toString());
                      if (points && !isNaN(Number(points))) {
                        handleLoyaltyPointsUpdate(Number(points));
                      }
                    }}
                    className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                  >
                    Ajustar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          {client.isMinor && guardianInfo && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información del Tutor Legal
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nombre
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {guardianInfo.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {guardianInfo.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Teléfono
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {guardianInfo.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Relación
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {guardianInfo.relationship === 'parent' ? 'Padre/Madre' : 
                       guardianInfo.relationship === 'guardian' ? 'Tutor Legal' : 'Otro'}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Documento de identidad
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {guardianInfo.idDocument}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Medical Information */}
          {medicalInfo && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información Médica
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg space-y-4">
                {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Alergias
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {medicalInfo.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        >
                          {allergy}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {medicalInfo.medications && medicalInfo.medications.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Medicamentos
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {medicalInfo.medications.map((medication, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          {medication}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {medicalInfo.conditions && medicalInfo.conditions.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Condiciones médicas
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {medicalInfo.conditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {condition}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {medicalInfo.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Notas adicionales
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {medicalInfo.notes}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Historial de Citas
          </h3>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay citas registradas para este cliente.
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {(appointment as AppointmentWithDetails).service?.name || 'Servicio'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status as AppointmentStatus)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">Fecha:</span> {formatDateTime(appointment.startTime)}
                        </p>
                        <p>
                          <span className="font-medium">Artista:</span> {(appointment as AppointmentWithDetails).artist?.user.name || 'No asignado'}
                        </p>
                        <p>
                          <span className="font-medium">Precio:</span> €{appointment.price.toFixed(2)}
                        </p>
                        {appointment.notes && (
                          <p>
                            <span className="font-medium">Notas:</span> {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Documentos
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDocumentGenerate('CONSENT')}
                disabled={isGeneratingDocument}
                className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                Consentimiento
              </button>
              <button
                onClick={() => handleDocumentGenerate('CONTRACT')}
                disabled={isGeneratingDocument}
                className="px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
              >
                Contrato
              </button>
            </div>
          </div>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay documentos generados para este cliente.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {document.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          document.signed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {document.signed ? 'Firmado' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">Tipo:</span> {document.type}
                        </p>
                        <p>
                          <span className="font-medium">Creado:</span> {formatDateTime(document.createdAt)}
                        </p>
                        {document.signed && document.signedAt && (
                          <p>
                            <span className="font-medium">Firmado:</span> {formatDateTime(document.signedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        Ver
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                        Descargar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientProfile;