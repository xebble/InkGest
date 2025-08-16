'use client';

import { useBooking } from '../BookingProvider';
import type { Service } from '@/types';

interface ServiceSelectionProps {
  services: Service[];
}

export function ServiceSelection({ services }: ServiceSelectionProps) {
  const { state, dispatch } = useBooking();

  const handleServiceSelect = (service: Service) => {
    dispatch({ type: 'SET_SERVICE', payload: service });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TATTOO':
        return '🎨';
      case 'PIERCING':
        return '💎';
      case 'LASER':
        return '⚡';
      case 'MICROBLADING':
        return '✨';
      default:
        return '🔧';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TATTOO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PIERCING':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'LASER':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MICROBLADING':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category]!.push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Service
        </h2>
        <p className="text-gray-600">
          Select the service you'd like to book
        </p>
      </div>

      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {category.toLowerCase().replace('_', ' ')}
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {categoryServices.map((service) => (
              <div
                key={service.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  state.selectedService?.id === service.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {service.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(service.category)}`}>
                        {service.category}
                      </span>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDuration(service.duration)}</span>
                        </div>
                      </div>
                      
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(service.price)}
                      </div>
                    </div>
                  </div>

                  {state.selectedService?.id === service.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {services.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Services Available
          </h3>
          <p className="text-gray-600">
            This store doesn't have any services available for booking at the moment.
          </p>
        </div>
      )}
    </div>
  );
}