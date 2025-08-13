'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop, {
  EventInteractionArgs,
} from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es, ca, enUS } from 'date-fns/locale';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

import type {
  CalendarViewProps,
  CalendarEvent,
  CalendarAppointment,
  CalendarViewType,
  CalendarConfig,
} from './types';
import { APPOINTMENT_STATUS_COLORS, CALENDAR_VIEWS } from './types';
import { AppointmentForm } from './AppointmentForm';
import { AppointmentFilters } from './AppointmentFilters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Import calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Create DnD Calendar component with proper typing
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

// Locale mapping for date-fns
const localeMap = {
  es: es,
  ca: ca,
  en: enUS,
} as const;

const CalendarView: React.FC<CalendarViewProps> = ({
  view,
  appointments,
  artists,
  rooms,
  services,
  filters,
  onViewChange,
  onAppointmentCreate,
  onAppointmentUpdate,

  onFiltersChange,
  onDateRangeChange,
  loading = false,
  error = null,
}) => {
  const t = useTranslations('appointments');
  const locale = useLocale() as 'es' | 'ca' | 'en';

  // State management
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // Configure localizer with proper locale
  const localizer = useMemo(() => {
    const currentLocale = localeMap[locale];
    return dateFnsLocalizer({
      format,
      parse,
      startOfWeek: (date: Date) => startOfWeek(date, { locale: currentLocale }),
      getDay,
      locales: { [locale]: currentLocale },
    });
  }, [locale]);

  // Calendar configuration
  const calendarConfig: CalendarConfig = useMemo(
    () => ({
      businessHours: {
        start: '09:00',
        end: '20:00',
      },
      slotDuration: 30,
      timezone: 'Europe/Madrid',
      firstDayOfWeek: 1, // Monday
      workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    }),
    []
  );

  // Filter appointments based on current filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Artist filter
      if (
        filters.artistIds.length > 0 &&
        !filters.artistIds.includes(appointment.artistId)
      ) {
        return false;
      }

      // Service filter
      if (
        filters.serviceIds.length > 0 &&
        !filters.serviceIds.includes(appointment.serviceId)
      ) {
        return false;
      }

      // Status filter
      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(appointment.status as any)
      ) {
        return false;
      }

      // Room filter
      if (filters.roomIds.length > 0) {
        if (
          !appointment.roomId ||
          !filters.roomIds.includes(appointment.roomId)
        ) {
          return false;
        }
      }

      // Date range filter
      const appointmentDate = new Date(appointment.startTime);
      if (
        appointmentDate < filters.dateRange.start ||
        appointmentDate > filters.dateRange.end
      ) {
        return false;
      }

      // Client search filter
      if (filters.clientSearch) {
        const searchTerm = filters.clientSearch.toLowerCase();
        const clientName = appointment.client.name.toLowerCase();
        const clientEmail = appointment.client.email.toLowerCase();
        const clientPhone = appointment.client.phone.toLowerCase();

        if (
          !clientName.includes(searchTerm) &&
          !clientEmail.includes(searchTerm) &&
          !clientPhone.includes(searchTerm)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, filters]);

  // Convert appointments to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredAppointments.map(appointment => ({
      id: appointment.id,
      appointmentId: appointment.id,
      title: `${appointment.client.name} - ${appointment.service.name}`,
      start: new Date(appointment.startTime),
      end: new Date(appointment.endTime),
      resource: appointment,
      status: appointment.status as any,
      artistId: appointment.artistId,
      roomId: appointment.roomId || null,
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
      price: appointment.price,
    }));
  }, [filteredAppointments]);

  // Event style getter for calendar
  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const backgroundColor = APPOINTMENT_STATUS_COLORS[event.status];
      const isDraggedEvent = isDragging && draggedEvent?.id === event.id;

      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: isDraggedEvent ? 0.5 : 0.8,
          color: 'white',
          border: isDraggedEvent ? '2px dashed #3B82F6' : '0px',
          display: 'block',
          fontSize: '12px',
          padding: '2px 4px',
          cursor: 'move',
          transition: 'all 0.2s ease',
          transform: isDraggedEvent ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isDraggedEvent ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
        },
      };
    },
    [isDragging, draggedEvent]
  );

  // Calendar event handlers
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setIsFormOpen(true);
  }, []);

  const handleSelectSlot = useCallback(
    (slotInfo: {
      start: Date;
      end: Date;
      slots: Date[];
      action: 'select' | 'click' | 'doubleClick';
    }) => {
      if (slotInfo.action === 'doubleClick') {
        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
        setSelectedAppointment(null);
        setIsFormOpen(true);
      }
    },
    []
  );

  const handleNavigate = useCallback(
    (date: Date, view: View, _action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => {
      setCurrentDate(date);

      // Update date range based on view
      let start: Date;
      let end: Date;

      switch (view) {
        case 'day':
          start = new Date(date);
          end = new Date(date);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start = startOfWeek(date, { locale: localeMap[locale] });
          end = new Date(start);
          end.setDate(end.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          start = new Date(date.getFullYear(), date.getMonth(), 1);
          end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          start = new Date(date);
          end = new Date(date);
          end.setDate(end.getDate() + 30);
          end.setHours(23, 59, 59, 999);
      }

      onDateRangeChange(start, end);
    },
    [locale, onDateRangeChange]
  );

  // Form handlers
  const handleFormSubmit = useCallback(
    async (data: any) => {
      try {
        if (selectedAppointment) {
          await onAppointmentUpdate(selectedAppointment.id, data);
        } else {
          await onAppointmentCreate(data);
        }
        setIsFormOpen(false);
        setSelectedAppointment(null);
        setSelectedSlot(null);
      } catch (error) {
        console.error('Error saving appointment:', error);
        // TODO: Show error notification
      }
    },
    [selectedAppointment, onAppointmentCreate, onAppointmentUpdate]
  );

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedAppointment(null);
    setSelectedSlot(null);
  }, []);

  // Validation function for drag and drop operations
  const validateDragDrop = useCallback(
    (
      _event: CalendarEvent,
      start: Date,
      end: Date
    ): { isValid: boolean; message?: string } => {
      // Check if the new time is in the past
      if (start < new Date()) {
        return { isValid: false, message: t('error.pastTime') };
      }

      // Check if the appointment duration is reasonable (minimum 15 minutes)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration < 15) {
        return { isValid: false, message: t('error.minimumDuration') };
      }

      // Check if the appointment is too long (maximum 8 hours)
      if (duration > 480) {
        return { isValid: false, message: t('error.maximumDuration') };
      }

      // Check business hours
      const startHour = start.getHours();
      const endHour = end.getHours();
      if (startHour < 9 || endHour > 20) {
        return { isValid: false, message: t('error.outsideBusinessHours') };
      }

      return { isValid: true };
    },
    [t]
  );

  // Drag start handler for visual feedback
  const handleDragStart = useCallback((args: { event: CalendarEvent }) => {
    setIsDragging(true);
    setDraggedEvent(args.event);
    console.log('Drag started for appointment:', args.event.title);
  }, []);

  // Drag and drop handlers for react-big-calendar
  const handleEventDrop = useCallback(
    async (args: EventInteractionArgs<CalendarEvent>) => {
      const { event, start, end } = args;
      const startDate = typeof start === 'string' ? new Date(start) : start;
      const endDate = typeof end === 'string' ? new Date(end) : end;
      // Validate the drop operation
      const validation = validateDragDrop(event, startDate, endDate);
      if (!validation.isValid) {
        console.warn('Invalid drop operation:', validation.message);
        // TODO: Show validation error to user
        return;
      }

      try {
        await onAppointmentUpdate(event.appointmentId, {
          startTime: startDate,
          endTime: endDate,
        });

        // TODO: Show success notification
        console.log('Appointment moved successfully');
      } catch (error) {
        console.error('Error updating appointment:', error);
        // TODO: Show error notification to user
      } finally {
        // Reset drag state
        setIsDragging(false);
        setDraggedEvent(null);
      }
    },
    [onAppointmentUpdate, validateDragDrop]
  );

  const handleEventResize = useCallback(
    async (args: EventInteractionArgs<CalendarEvent>) => {
      const { event, start, end } = args;
      const startDate = typeof start === 'string' ? new Date(start) : start;
      const endDate = typeof end === 'string' ? new Date(end) : end;
      // Validate the resize operation
      const validation = validateDragDrop(event, startDate, endDate);
      if (!validation.isValid) {
        console.warn('Invalid resize operation:', validation.message);
        // TODO: Show validation error to user
        return;
      }

      try {
        await onAppointmentUpdate(event.appointmentId, {
          startTime: startDate,
          endTime: endDate,
        });

        // TODO: Show success notification
        console.log('Appointment resized successfully');
      } catch (error) {
        console.error('Error resizing appointment:', error);
        // TODO: Show error notification to user
      } finally {
        // Reset drag state
        setIsDragging(false);
        setDraggedEvent(null);
      }
    },
    [onAppointmentUpdate, validateDragDrop]
  );

  // Drag and drop handlers for @hello-pangea/dnd (for custom drag operations)
  const handleDragEnd = useCallback((_result: any) => {
    // This can be used for custom drag operations like moving between artists
    // For now, we rely on react-big-calendar's built-in drag and drop
    console.log('Custom drag ended');
  }, []);

  // View change handler
  const handleViewChange = useCallback(
    (newView: CalendarViewType) => {
      onViewChange(newView);
    },
    [onViewChange]
  );

  // Custom components for calendar
  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="text-xs">
      <div className="font-medium truncate">{event.clientName}</div>
      <div className="truncate">{event.serviceName}</div>
      <div className="text-xs opacity-75">€{event.price}</div>
    </div>
  );

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate('PREV')}>
          ←
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')}>
          {t('today')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('NEXT')}>
          →
        </Button>
      </div>

      <h2 className="text-lg font-semibold">{label}</h2>

      <div className="flex items-center space-x-1">
        {Object.entries(CALENDAR_VIEWS).map(([viewKey, viewConfig]) => (
          <Button
            key={viewKey}
            variant={view === viewKey ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(viewKey)}
          >
            {viewConfig.label}
          </Button>
        ))}
      </div>
    </div>
  );

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>{t('error.loadingAppointments')}</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Filters */}
        <AppointmentFilters
          filters={filters}
          artists={artists}
          services={services}
          rooms={rooms}
          onFiltersChange={onFiltersChange}
          onReset={() =>
            onFiltersChange({
              artistIds: [],
              serviceIds: [],
              statuses: [],
              roomIds: [],
              clientSearch: '',
            })
          }
        />

        {/* Drag indicator */}
        {isDragging && draggedEvent && (
          <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-2 text-blue-700">
              <div className="animate-pulse">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12L6 8h8l-4 4z" />
                </svg>
              </div>
              <span className="text-sm font-medium">
                {t('dragIndicator', {
                  client: draggedEvent.clientName,
                  service: draggedEvent.serviceName,
                })}
              </span>
            </div>
          </Card>
        )}

        {/* Calendar */}
        <Card className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div style={{ height: '600px' }}>
              <DnDCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor={(event: CalendarEvent) => event.start}
                endAccessor={(event: CalendarEvent) => event.end}
                style={{ height: '100%' }}
                view={view as View}
                onView={handleViewChange as any}
                date={currentDate}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onDragStart={handleDragStart}
                eventPropGetter={eventStyleGetter}
                selectable
                resizable
                popup
                showMultiDayTimes
                step={calendarConfig.slotDuration}
                timeslots={2}
                min={new Date(2024, 0, 1, 9, 0)} // 9:00 AM
                max={new Date(2024, 0, 1, 20, 0)} // 8:00 PM
                formats={{
                  timeGutterFormat: 'HH:mm',
                  eventTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                  agendaTimeFormat: 'HH:mm',
                  agendaTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                }}
                messages={{
                  allDay: t('allDay'),
                  previous: t('previous'),
                  next: t('next'),
                  today: t('today'),
                  month: t('month'),
                  week: t('week'),
                  day: t('day'),
                  agenda: t('agenda'),
                  date: t('date'),
                  time: t('time'),
                  event: t('event'),
                  noEventsInRange: t('noEventsInRange'),
                  showMore: (total: number) => t('showMore', { count: total }),
                }}
                components={{
                  event: CustomEvent,
                  toolbar: CustomToolbar,
                }}
              />
            </div>
          )}
        </Card>

        {/* Appointment Form Modal */}
        <AppointmentForm
          appointment={selectedAppointment}
          artists={artists}
          services={services}
          rooms={rooms}
          clients={[]} // TODO: Pass clients from parent
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          defaultDate={selectedSlot?.start || undefined}
          defaultArtist={filters.artistIds[0]}
          defaultRoom={filters.roomIds[0]}
        />
      </div>
    </DragDropContext>
  );
};

export { CalendarView };
