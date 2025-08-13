'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CalendarView } from '../../../../components/appointments';
import { useAppointments } from '../../../../hooks/useAppointments';

const AppointmentsPage: React.FC = () => {
  const t = useTranslations('appointments');
  
  // Mock store ID - in real app this would come from session/context
  const storeId = 'mock-store-id';
  
  const {
    appointments,
    artists,
    rooms,
    services,
    loading,
    error,
    view,
    filters,
    setView,
    setFilters,
    setDateRange,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments({ storeId });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">
          Gestiona las citas de tu estudio de forma visual y eficiente
        </p>
      </div>

      <CalendarView
        view={view}
        appointments={appointments}
        artists={artists}
        rooms={rooms}
        services={services}
        filters={filters}
        onViewChange={setView}
        onAppointmentCreate={createAppointment}
        onAppointmentUpdate={updateAppointment}
        onAppointmentDelete={deleteAppointment}
        onFiltersChange={setFilters}
        onDateRangeChange={setDateRange}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default AppointmentsPage;