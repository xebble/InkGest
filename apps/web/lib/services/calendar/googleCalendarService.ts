import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  ICalendarService,
  CalendarEvent,
  CalendarSyncResult,
  CalendarConflict,
  CalendarError,
  CalendarAuthError,
  CalendarSyncError,
  CalendarConflictError
} from './types';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleCalendarCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export class GoogleCalendarService implements ICalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;
  private calendarId: string = 'primary';
  private isConnected: boolean = false;

  constructor(
    config: GoogleCalendarConfig,
    _artistId: string
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async authenticate(credentials: GoogleCalendarCredentials): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials(credentials);
      
      // Test the connection
      await this.calendar.calendarList.list();
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new CalendarAuthError('google', `Google Calendar authentication failed: ${error}`);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Check if token is still valid
      const tokenInfo = await this.oauth2Client.getTokenInfo(
        this.oauth2Client.credentials.access_token!
      );
      return tokenInfo.expiry_date! > Date.now();
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.oauth2Client.credentials.access_token) {
        await this.oauth2Client.revokeCredentials();
      }
      this.oauth2Client.setCredentials({});
      this.isConnected = false;
    } catch (error) {
      throw new CalendarError('google', `Failed to disconnect: ${error}`);
    }
  }

  async createEvent(event: CalendarEvent): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected) {
        throw new CalendarAuthError('google', 'Not authenticated');
      }

      // Check for conflicts first
      const conflicts = await this.detectConflicts(event);
      if (conflicts.length > 0) {
        throw new CalendarConflictError('google', conflicts);
      }

      const googleEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description || null,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: event.timezone || 'Europe/Madrid',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: event.timezone || 'Europe/Madrid',
        },
        location: event.location || null,
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name || null,
          responseStatus: this.mapAttendeeStatus(attendee.status),
        })) as any,
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map(reminder => ({
            method: reminder.method === 'popup' ? 'popup' : 'email',
            minutes: reminder.minutes,
          })) || [
            { method: 'email', minutes: 1440 }, // 24 hours
            { method: 'popup', minutes: 120 },  // 2 hours
          ],
        },
      };

      // Add recurrence if specified
      if (event.recurrence) {
        googleEvent.recurrence = [this.buildRecurrenceRule(event.recurrence)];
      }

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: googleEvent,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: event.id,
        externalEventId: response.data.id!,
      };
    } catch (error) {
      if (error instanceof CalendarConflictError) {
        return {
          success: false,
          conflicts: error.conflicts,
          error: error.message,
        };
      }
      
      throw new CalendarSyncError('google', `Failed to create event: ${error}`, error);
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected) {
        throw new CalendarAuthError('google', 'Not authenticated');
      }

      // Get the existing event first
      const existingEvent = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      if (!existingEvent.data) {
        throw new CalendarError('google', 'Event not found');
      }

      // Build update object
      const updateData: calendar_v3.Schema$Event = {
        ...existingEvent.data,
      };

      if (event.title !== undefined) {
        updateData.summary = event.title;
      }
      if (event.description !== undefined) {
        updateData.description = event.description;
      }
      if (event.startTime !== undefined) {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: event.timezone || 'Europe/Madrid',
        };
      }
      if (event.endTime !== undefined) {
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: event.timezone || 'Europe/Madrid',
        };
      }
      if (event.location !== undefined) {
        updateData.location = event.location;
      }
      if (event.attendees !== undefined) {
        updateData.attendees = event.attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name || null,
          responseStatus: this.mapAttendeeStatus(attendee.status),
        })) as any;
      }

      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        requestBody: updateData,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: event.id || eventId,
        externalEventId: response.data.id!,
      };
    } catch (error) {
      throw new CalendarSyncError('google', `Failed to update event: ${error}`, error);
    }
  }

  async deleteEvent(eventId: string): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected) {
        throw new CalendarAuthError('google', 'Not authenticated');
      }

      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: eventId,
      };
    } catch (error) {
      throw new CalendarSyncError('google', `Failed to delete event: ${error}`, error);
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      if (!this.isConnected) {
        throw new CalendarAuthError('google', 'Not authenticated');
      }

      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      if (!response.data) {
        return null;
      }

      return this.mapGoogleEventToCalendarEvent(response.data);
    } catch (error) {
      if ((error as any).code === 404) {
        return null;
      }
      throw new CalendarError('google', `Failed to get event: ${error}`, 'GET_EVENT_ERROR', error);
    }
  }

  async syncEvents(startDate: Date, endDate: Date): Promise<CalendarSyncResult[]> {
    try {
      if (!this.isConnected) {
        throw new CalendarAuthError('google', 'Not authenticated');
      }

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const results: CalendarSyncResult[] = [];
      
      for (const googleEvent of response.data.items || []) {
        try {
          const calendarEvent = this.mapGoogleEventToCalendarEvent(googleEvent);
          results.push({
            success: true,
            eventId: calendarEvent.id,
            externalEventId: googleEvent.id!,
          });
        } catch (error) {
          results.push({
            success: false,
            externalEventId: googleEvent.id!,
            error: `Failed to map event: ${error}`,
          });
        }
      }

      return results;
    } catch (error) {
      throw new CalendarSyncError('google', `Failed to sync events: ${error}`, error);
    }
  }

  async detectConflicts(event: CalendarEvent): Promise<CalendarConflict[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      // Get events in the same time range
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: event.startTime.toISOString(),
        timeMax: event.endTime.toISOString(),
        singleEvents: true,
      });

      const conflicts: CalendarConflict[] = [];

      for (const googleEvent of response.data.items || []) {
        if (!googleEvent.start?.dateTime || !googleEvent.end?.dateTime) {
          continue;
        }

        const eventStart = new Date(googleEvent.start.dateTime);
        const eventEnd = new Date(googleEvent.end.dateTime);

        // Check for overlap
        if (this.eventsOverlap(event.startTime, event.endTime, eventStart, eventEnd)) {
          conflicts.push({
            eventId: googleEvent.id!,
            title: googleEvent.summary || 'Untitled Event',
            startTime: eventStart,
            endTime: eventEnd,
            conflictType: 'overlap',
            severity: 'high',
            suggestion: 'Consider rescheduling one of the events',
          });
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      return [];
    }
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merge'
  ): Promise<CalendarSyncResult> {
    // Implementation depends on the specific conflict resolution strategy
    // For now, we'll implement a basic version
    try {
      switch (resolution) {
        case 'keep_local':
          // Delete the remote event
          return await this.deleteEvent(conflictId);
        
        case 'keep_remote':
          // Keep the remote event, return success
          return {
            success: true,
            externalEventId: conflictId,
          };
        
        case 'merge':
          // This would require more complex logic to merge event details
          throw new CalendarError('google', 'Merge resolution not implemented yet');
        
        default:
          throw new CalendarError('google', 'Invalid resolution type');
      }
    } catch (error) {
      throw new CalendarSyncError('google', `Failed to resolve conflict: ${error}`, error);
    }
  }

  async getAvailability(startDate: Date, endDate: Date): Promise<{ start: Date; end: Date; available: boolean }[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: this.calendarId }],
        },
      });

      const busyTimes = response.data.calendars?.[this.calendarId]?.busy || [];
      const availability: { start: Date; end: Date; available: boolean }[] = [];

      // Convert busy times to unavailable slots
      for (const busyTime of busyTimes) {
        if (busyTime.start && busyTime.end) {
          availability.push({
            start: new Date(busyTime.start),
            end: new Date(busyTime.end),
            available: false,
          });
        }
      }

      return availability;
    } catch (error) {
      throw new CalendarError('google', `Failed to get availability: ${error}`, 'AVAILABILITY_ERROR', error);
    }
  }

  async findAvailableSlots(
    duration: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ start: Date; end: Date }[]> {
    try {
      const availability = await this.getAvailability(startDate, endDate);
      const availableSlots: { start: Date; end: Date }[] = [];

      // Simple implementation - find gaps between busy times
      const busyTimes = availability.filter(slot => !slot.available);
      busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime());

      let currentTime = new Date(startDate);
      
      for (const busyTime of busyTimes) {
        // Check if there's a gap before this busy time
        const gapDuration = busyTime.start.getTime() - currentTime.getTime();
        if (gapDuration >= duration * 60 * 1000) { // duration in minutes
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(currentTime.getTime() + duration * 60 * 1000),
          });
        }
        currentTime = new Date(Math.max(currentTime.getTime(), busyTime.end.getTime()));
      }

      // Check for availability after the last busy time
      if (currentTime < endDate) {
        const remainingDuration = endDate.getTime() - currentTime.getTime();
        if (remainingDuration >= duration * 60 * 1000) {
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(currentTime.getTime() + duration * 60 * 1000),
          });
        }
      }

      return availableSlots;
    } catch (error) {
      throw new CalendarError('google', `Failed to find available slots: ${error}`, 'AVAILABILITY_ERROR', error);
    }
  }

  // Helper methods
  private mapGoogleEventToCalendarEvent(googleEvent: calendar_v3.Schema$Event): CalendarEvent {
    return {
      id: googleEvent.id!,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      startTime: new Date(googleEvent.start?.dateTime || googleEvent.start?.date!),
      endTime: new Date(googleEvent.end?.dateTime || googleEvent.end?.date!),
      location: googleEvent.location || '',
      attendees: googleEvent.attendees?.map(attendee => ({
        email: attendee.email!,
        name: attendee.displayName || undefined,
        status: this.mapGoogleAttendeeStatus(attendee.responseStatus || undefined),
      })) as any,
      reminders: googleEvent.reminders?.overrides?.map(reminder => ({
        method: reminder.method === 'popup' ? 'popup' : 'email',
        minutes: reminder.minutes || 0,
      })) || [],
    };
  }

  private mapAttendeeStatus(status?: string): string {
    switch (status) {
      case 'accepted': return 'accepted';
      case 'declined': return 'declined';
      case 'tentative': return 'tentative';
      default: return 'needsAction';
    }
  }

  private mapGoogleAttendeeStatus(status?: string | null): 'accepted' | 'declined' | 'tentative' | 'needsAction' {
    switch (status) {
      case 'accepted': return 'accepted';
      case 'declined': return 'declined';
      case 'tentative': return 'tentative';
      default: return 'needsAction';
    }
  }

  private buildRecurrenceRule(recurrence: any): string {
    let rule = `FREQ=${recurrence.frequency.toUpperCase()}`;
    
    if (recurrence.interval) {
      rule += `;INTERVAL=${recurrence.interval}`;
    }
    
    if (recurrence.count) {
      rule += `;COUNT=${recurrence.count}`;
    }
    
    if (recurrence.until) {
      rule += `;UNTIL=${recurrence.until.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    }
    
    if (recurrence.byWeekDay && recurrence.byWeekDay.length > 0) {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const weekDays = recurrence.byWeekDay.map((day: number) => days[day]).join(',');
      rule += `;BYDAY=${weekDays}`;
    }
    
    return `RRULE:${rule}`;
  }

  private eventsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }
}