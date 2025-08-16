// Calendar integration types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: CalendarAttendee[];
  location?: string;
  timezone?: string;
  recurrence?: CalendarRecurrence;
  reminders?: CalendarReminder[];
  metadata?: Record<string, any>;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  required?: boolean;
}

export interface CalendarRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  count?: number;
  until?: Date;
  byWeekDay?: number[];
}

export interface CalendarReminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface CalendarConflict {
  eventId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  conflictType: 'overlap' | 'duplicate' | 'scheduling';
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  externalEventId?: string;
  conflicts?: CalendarConflict[];
  error?: string;
}

export interface CalendarProvider {
  name: 'google' | 'microsoft' | 'apple';
  displayName: string;
  isConnected: boolean;
  lastSync?: Date | undefined;
  syncEnabled: boolean;
  credentials?: any;
}

export interface CalendarIntegrationConfig {
  providers: CalendarProvider[];
  syncInterval: number; // minutes
  conflictResolution: 'manual' | 'auto' | 'skip';
  defaultReminders: CalendarReminder[];
  timezone: string;
}

// Base calendar service interface
export interface ICalendarService {
  // Authentication
  authenticate(credentials: any): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Event management
  createEvent(event: CalendarEvent): Promise<CalendarSyncResult>;
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarSyncResult>;
  deleteEvent(eventId: string): Promise<CalendarSyncResult>;
  getEvent(eventId: string): Promise<CalendarEvent | null>;

  // Sync operations
  syncEvents(startDate: Date, endDate: Date): Promise<CalendarSyncResult[]>;
  detectConflicts(event: CalendarEvent): Promise<CalendarConflict[]>;
  resolveConflict(conflictId: string, resolution: 'keep_local' | 'keep_remote' | 'merge'): Promise<CalendarSyncResult>;

  // Availability
  getAvailability(startDate: Date, endDate: Date): Promise<{ start: Date; end: Date; available: boolean }[]>;
  findAvailableSlots(duration: number, startDate: Date, endDate: Date): Promise<{ start: Date; end: Date }[]>;
}

// Error types
export class CalendarError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

export class CalendarAuthError extends CalendarError {
  constructor(provider: string, message: string = 'Authentication failed') {
    super(message, provider, 'AUTH_ERROR');
    this.name = 'CalendarAuthError';
  }
}

export class CalendarConflictError extends CalendarError {
  constructor(
    provider: string,
    public conflicts: CalendarConflict[],
    message: string = 'Calendar conflicts detected'
  ) {
    super(message, provider, 'CONFLICT_ERROR');
    this.name = 'CalendarConflictError';
  }
}

export class CalendarSyncError extends CalendarError {
  constructor(provider: string, message: string, originalError?: any) {
    super(message, provider, 'SYNC_ERROR', originalError);
    this.name = 'CalendarSyncError';
  }
}