'use client';

import { useState } from 'react';
import { ClientHeader } from './ClientHeader';
import { ClientNavigation } from './ClientNavigation';
import { AppointmentHistory } from './AppointmentHistory';
import { ClientDocuments } from './ClientDocuments';
import { ClientCommunication } from './ClientCommunication';
import { ClientPhotoGallery } from './ClientPhotoGallery';
import { TattooPreview } from './TattooPreview';
import type { Client, Appointment, Document } from '@/types';

type ClientDashboardTab = 'appointments' | 'documents' | 'communication' | 'gallery' | 'preview';

interface ClientDashboardProps {
  client: Client & {
    store: {
      id: string;
      name: string;
      company: { id: string; name: string };
    };
    appointments: (Appointment & {
      service: {
        id: string;
        name: string;
        duration: number;
        price: number;
        category: string;
      };
      artist: {
        user: { id: string; name: string };
      };
      payments: Array<{
        id: string;
        amount: number;
        method: string;
        status: string;
        createdAt: Date;
      }>;
    })[];
    documents: Document[];
  };
}

export function ClientDashboard({ client }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<ClientDashboardTab>('appointments');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentHistory appointments={client.appointments} />;
      case 'documents':
        return <ClientDocuments documents={client.documents} clientId={client.id} />;
      case 'communication':
        return <ClientCommunication client={client} />;
      case 'gallery':
        return <ClientPhotoGallery clientId={client.id} />;
      case 'preview':
        return <TattooPreview clientId={client.id} />;
      default:
        return <AppointmentHistory appointments={client.appointments} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader 
        client={client}
        storeName={client.store.name}
        companyName={client.store.company.name}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ClientNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          appointmentCount={client.appointments.length}
          documentCount={client.documents.length}
        />
        
        <div className="mt-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}