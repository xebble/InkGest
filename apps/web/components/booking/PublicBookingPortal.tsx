'use client';

import { useBooking } from './BookingProvider';
import { BookingHeader } from './BookingHeader';
import { BookingSteps } from './BookingSteps';
import { ServiceSelection } from './steps/ServiceSelection';
import { ArtistSelection } from './steps/ArtistSelection';
import { DateTimeSelection } from './steps/DateTimeSelection';
import { ClientInformation } from './steps/ClientInformation';
import { BookingConfirmation } from './steps/BookingConfirmation';
import { BookingNavigation } from './BookingNavigation';
import type { Store, Service, Artist } from '@/types';

interface PublicBookingPortalProps {
  store: Store & {
    company: { id: string; name: string };
  };
  services: Service[];
  artists: (Artist & {
    user: { id: string; name: string };
  })[];
}

export function PublicBookingPortal({ 
  store, 
  services, 
  artists 
}: PublicBookingPortalProps) {
  const { state } = useBooking();

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return <ServiceSelection services={services} />;
      case 1:
        return <ArtistSelection artists={artists} selectedService={state.selectedService} />;
      case 2:
        return (
          <DateTimeSelection 
            storeId={store.id}
            selectedService={state.selectedService}
            selectedArtist={state.selectedArtist}
          />
        );
      case 3:
        return <ClientInformation />;
      case 4:
        return (
          <BookingConfirmation 
            store={store}
            service={state.selectedService}
            artist={state.selectedArtist}
            dateTime={state.selectedDateTime}
            clientData={state.clientData}
          />
        );
      default:
        return <ServiceSelection services={services} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BookingHeader 
          storeName={store.name}
          companyName={store.company.name}
        />
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <BookingSteps 
            steps={state.steps}
            currentStep={state.currentStep}
          />
          
          <div className="p-6 md:p-8">
            {state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {state.error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : (
              renderCurrentStep()
            )}
          </div>

          <BookingNavigation />
        </div>
      </div>
    </div>
  );
}