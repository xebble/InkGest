'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { 
  Client, 
  DocumentType, 
  Service,
  GuardianInfo 
} from '../../types';

interface ConsentFormProps {
  client: Client;
  service?: Service;
  documentType: DocumentType;
  template?: string;
  onSubmit: (data: ConsentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ConsentFormData {
  clientId: string;
  type: DocumentType;
  title: string;
  content: string;
  requiresSignature: boolean;
  signatureData?: SignatureData | undefined;
}

interface SignatureData {
  signature: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const ConsentForm: React.FC<ConsentFormProps> = ({
  client,
  service,
  documentType,
  template,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const t = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [formData, setFormData] = useState<ConsentFormData>({
    clientId: client.id,
    type: documentType,
    title: generateDocumentTitle(documentType, service),
    content: template || generateDefaultTemplate(documentType, client, service),
    requiresSignature: true
  });

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Parse guardian info if client is minor
  const guardianInfo: GuardianInfo | null = client.isMinor && client.guardianInfo 
    ? JSON.parse(client.guardianInfo as string) 
    : null;

  // Handle content changes
  const handleContentChange = useCallback((content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  }, []);

  // Handle title change
  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => ({
      ...prev,
      title
    }));
  }, []);

  // Signature canvas handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  // Get signature data
  const getSignatureData = useCallback((): SignatureData | undefined => {
    if (!hasSignature || !canvasRef.current) return undefined;

    const signatureDataUrl = canvasRef.current.toDataURL();
    
    return {
      signature: signatureDataUrl,
      timestamp: new Date(),
      ipAddress: '', // This would be filled by the server
      userAgent: navigator.userAgent
    };
  }, [hasSignature]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.requiresSignature && !hasSignature) {
      alert('Por favor, proporcione su firma antes de continuar.');
      return;
    }

    const signatureData = formData.requiresSignature ? getSignatureData() : undefined;

    try {
      await onSubmit({
        ...formData,
        signatureData
      });
    } catch (error) {
      console.error('Error submitting consent form:', error);
    }
  }, [formData, hasSignature, getSignatureData, onSubmit]);

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getDocumentTypeTitle(documentType)}
        </h2>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {showPreview ? 'Editar' : 'Vista previa'}
          </button>
        </div>
      </div>

      {showPreview ? (
        <ConsentPreview
          client={client}
          guardianInfo={guardianInfo}
          formData={formData}
          hasSignature={hasSignature}
          onBack={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título del documento
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleTitleChange(e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Document Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido del documento
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                handleContentChange(e.target.value)
              }
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="Contenido del consentimiento informado..."
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Puede usar variables como {'{CLIENT_NAME}'}, {'{SERVICE_NAME}'}, {'{DATE}'}, etc.
            </p>
          </div>

          {/* Signature Section */}
          {formData.requiresSignature && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Firma {client.isMinor ? 'del tutor legal' : 'del cliente'}
              </h3>
              
              {client.isMinor && guardianInfo && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Atención:</strong> Como el cliente es menor de edad, la firma debe ser proporcionada por el tutor legal: {guardianInfo.name}
                  </p>
                </div>
              )}

              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Firme en el área de abajo:
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                  >
                    Limpiar
                  </button>
                </div>
                
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded cursor-crosshair bg-white"
                  style={{ touchAction: 'none' }}
                />
                
                {!hasSignature && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Haga clic y arrastre para firmar
                  </p>
                )}
              </div>
            </div>
          )}

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
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-blue-300 rounded-md shadow-sm hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800"
            >
              Vista previa
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Consent Preview Component
interface ConsentPreviewProps {
  client: Client;
  guardianInfo: GuardianInfo | null;
  formData: ConsentFormData;
  hasSignature: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

const ConsentPreview: React.FC<ConsentPreviewProps> = ({
  client,
  guardianInfo,
  formData,
  hasSignature,
  onBack,
  onSubmit,
  isLoading
}) => {
  // const t = useTranslations();

  // Process content with variables
  const processedContent = formData.content
    .replace(/{CLIENT_NAME}/g, client.name)
    .replace(/{CLIENT_EMAIL}/g, client.email)
    .replace(/{CLIENT_PHONE}/g, client.phone)
    .replace(/{GUARDIAN_NAME}/g, guardianInfo?.name || '')
    .replace(/{GUARDIAN_EMAIL}/g, guardianInfo?.email || '')
    .replace(/{GUARDIAN_PHONE}/g, guardianInfo?.phone || '')
    .replace(/{DATE}/g, new Date().toLocaleDateString('es-ES'))
    .replace(/{TIME}/g, new Date().toLocaleTimeString('es-ES'));

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          {formData.title}
        </h3>
        
        <div className="prose dark:prose-invert max-w-none">
          <div 
            className="whitespace-pre-wrap text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br>') }}
          />
        </div>

        {/* Signature Section */}
        {formData.requiresSignature && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {client.isMinor ? 'Datos del tutor legal:' : 'Datos del cliente:'}
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Nombre:</strong> {client.isMinor && guardianInfo ? guardianInfo.name : client.name}</p>
                  <p><strong>Email:</strong> {client.isMinor && guardianInfo ? guardianInfo.email : client.email}</p>
                  <p><strong>Teléfono:</strong> {client.isMinor && guardianInfo ? guardianInfo.phone : client.phone}</p>
                  {client.isMinor && guardianInfo && (
                    <p><strong>Documento:</strong> {guardianInfo.idDocument}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Firma:
                </h4>
                <div className="border border-gray-300 dark:border-gray-600 rounded p-4 h-24 flex items-center justify-center">
                  {hasSignature ? (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      ✓ Firma proporcionada
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 text-sm">
                      Firma requerida
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              Fecha y hora: {new Date().toLocaleString('es-ES')}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Volver a editar
        </button>
        
        <form onSubmit={onSubmit} className="inline">
          <button
            type="submit"
            disabled={isLoading || (formData.requiresSignature && !hasSignature)}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generando...' : 'Generar documento'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Helper functions
function generateDocumentTitle(type: DocumentType, service?: Service): string {
  switch (type) {
    case 'CONSENT':
      return service 
        ? `Consentimiento Informado - ${service.name}`
        : 'Consentimiento Informado';
    case 'CONTRACT':
      return service 
        ? `Contrato de Servicios - ${service.name}`
        : 'Contrato de Servicios';
    case 'INVOICE':
      return 'Factura';
    case 'RECEIPT':
      return 'Recibo';
    default:
      return 'Documento';
  }
}

function getDocumentTypeTitle(type: DocumentType): string {
  switch (type) {
    case 'CONSENT':
      return 'Consentimiento Informado';
    case 'CONTRACT':
      return 'Contrato de Servicios';
    case 'INVOICE':
      return 'Factura';
    case 'RECEIPT':
      return 'Recibo';
    default:
      return 'Documento';
  }
}

function generateDefaultTemplate(type: DocumentType, _client: Client, service?: Service): string {
  const serviceName = service?.name || '[SERVICIO]';
  const clientName = '{CLIENT_NAME}';
  const date = '{DATE}';
  
  switch (type) {
    case 'CONSENT':
      return `CONSENTIMIENTO INFORMADO PARA ${serviceName.toUpperCase()}

Yo, ${clientName}, con fecha ${date}, declaro que:

1. He sido informado/a de manera clara y comprensible sobre el procedimiento de ${serviceName} que se va a realizar.

2. Entiendo que este procedimiento implica:
   - Riesgos asociados al procedimiento
   - Cuidados posteriores necesarios
   - Posibles complicaciones

3. He tenido la oportunidad de hacer todas las preguntas que consideré necesarias y todas han sido respondidas de manera satisfactoria.

4. Entiendo que ningún procedimiento está exento de riesgos y que no se me ha garantizado un resultado específico.

5. Me comprometo a seguir todas las instrucciones de cuidado posterior proporcionadas.

6. Autorizo la realización de fotografías del procedimiento y resultado únicamente para fines médicos y de seguimiento.

DECLARACIÓN DE CONSENTIMIENTO:
Habiendo leído y comprendido la información anterior, y habiendo tenido la oportunidad de hacer preguntas, doy mi consentimiento libre e informado para la realización del procedimiento de ${serviceName}.

Fecha: ${date}
Cliente: ${clientName}`;

    case 'CONTRACT':
      return `CONTRATO DE PRESTACIÓN DE SERVICIOS

Entre el centro de tatuaje y el cliente ${clientName}, se establece el siguiente contrato para la prestación del servicio de ${serviceName}.

CONDICIONES:
1. El servicio a realizar es: ${serviceName}
2. Fecha de realización: ${date}
3. El cliente se compromete a seguir las instrucciones de cuidado posterior
4. El centro se compromete a realizar el servicio con los más altos estándares de calidad e higiene

TÉRMINOS Y CONDICIONES:
- El cliente debe estar en condiciones de salud adecuadas
- Se requiere documento de identidad válido
- Los menores de edad requieren autorización del tutor legal
- El pago debe realizarse según los términos acordados

Fecha: ${date}
Cliente: ${clientName}`;

    default:
      return `Documento generado para ${clientName} en fecha ${date}.

Servicio: ${serviceName}

[Contenido del documento]`;
  }
}

export default ConsentForm;