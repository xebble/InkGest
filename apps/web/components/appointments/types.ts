import type { Event, View } from 'react-big-calendar';
import type { 
  Appointment, 
  Artist, 
  Room, 
  Service, 
  Client,
  AppointmentStatus,
  CreateAppointmentData,
  UpdateAppointmentData,
  ArtistWithUser
} from '../../types';

// Calendar view types
export type CalendarViewType = 'day' | 'week' | 'month' | 'agenda';

// Extended appointment type for calendar display
export interface CalendarAppointment extends Appointment {
  artist: Artist & {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  client: Client;
  service: Service;
  room?: Room | null;
}

// Calendar event type for react-big-calendar
export interface CalendarEvent extends Event {
  id: string;
  appointmentId: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarAppointment;
  status: AppointmentStatus;
  artistId: string;
  roomId?: string | null;
  clientName: string;
  serviceName: string;
  price: number;
}

// Drag and drop types
export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  } | null;
  reason: 'DROP' | 'CANCEL';
}

export interface DropResult extends DragResult {
  destination: {
    droppableId: string;
    index: number;
  };
}

// Filter types
export interface AppointmentFiltersType {
  artistIds: string[];
  serviceIds: string[];
  statuses: AppointmentStatus[];
  roomIds: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  clientSearch?: string;
}

// Calendar props types
export interface CalendarViewProps {
  view: CalendarViewType;
  appointments: CalendarAppointment[];
  artists: ArtistWithUser[];
  rooms: Room[];
  services: Service[];
  filters: AppointmentFiltersType;
  onViewChange: (view: CalendarViewType) => void;
  onAppointmentCreate: (data: CreateAppointmentData) => Promise<void>;
  onAppointmentUpdate: (id: string, data: UpdateAppointmentData) => Promise<void>;
  onAppointmentDelete: (id: string) => Promise<void>;
  onFiltersChange: (filters: Partial<AppointmentFiltersType>) => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  loading?: boolean;
  error?: string | null;
}

// Appointment form types
export interface AppointmentFormProps {
  appointment?: CalendarAppointment | null;
  artists: ArtistWithUser[];
  services: Service[];
  rooms: Room[];
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAppointmentData | UpdateAppointmentData) => Promise<void>;
  defaultDate?: Date | undefined;
  defaultArtist?: string | undefined;
  defaultRoom?: string | undefined;
}

export interface AppointmentFormData {
  clientId: string;
  artistId: string;
  serviceId: string;
  roomId?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  price: number;
  deposit?: number;
}

// Room management types
export interface RoomManagementProps {
  rooms: Room[];
  onRoomCreate: (data: CreateRoomData) => Promise<void>;
  onRoomUpdate: (id: string, data: UpdateRoomData) => Promise<void>;
  onRoomDelete: (id: string) => Promise<void>;
}

export interface CreateRoomData {
  storeId: string;
  name: string;
  description?: string;
  isAvailable: boolean;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  id: string;
}

// Filter component types
export interface AppointmentFiltersProps {
  filters: AppointmentFiltersType;
  artists: ArtistWithUser[];
  services: Service[];
  rooms: Room[];
  onFiltersChange: (filters: Partial<AppointmentFiltersType>) => void;
  onReset: () => void;
}

// Time slot types for availability
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  appointmentId?: string;
}

export interface ArtistAvailability {
  artistId: string;
  date: Date;
  slots: TimeSlot[];
}

// Calendar event handlers
export interface CalendarEventHandlers {
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date; slots: Date[]; action: 'select' | 'click' | 'doubleClick' }) => void;
  onEventDrop: (args: { event: CalendarEvent; start: Date; end: Date; isAllDay?: boolean }) => void;
  onEventResize: (args: { event: CalendarEvent; start: Date; end: Date }) => void;
  onNavigate: (date: Date, view: View, action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => void;
}

// Drag and drop validation
export interface DragDropValidation {
  isValid: boolean;
  message?: string;
}

export interface DragDropContext {
  isDragging: boolean;
  draggedEvent?: CalendarEvent;
  dropTarget?: {
    start: Date;
    end: Date;
    artistId?: string;
    roomId?: string;
  };
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface AppointmentValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Calendar configuration
export interface CalendarConfig {
  businessHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  slotDuration: number; // minutes
  timezone: string;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  workingDays: number[]; // Array of working day numbers (0-6)
}

// Status color mapping
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: '#3B82F6',    // blue-500
  CONFIRMED: '#10B981',    // emerald-500
  IN_PROGRESS: '#F59E0B',  // amber-500
  COMPLETED: '#6B7280',    // gray-500
  CANCELLED: '#EF4444',    // red-500
  NO_SHOW: '#8B5CF6',      // violet-500
};

// Calendar view configurations
export const CALENDAR_VIEWS: Record<CalendarViewType, { label: string; icon: string }> = {
  day: { label: 'Día', icon: 'calendar-days' },
  week: { label: 'Semana', icon: 'calendar-week' },
  month: { label: 'Mes', icon: 'calendar' },
  agenda: { label: 'Agenda', icon: 'list' },
};