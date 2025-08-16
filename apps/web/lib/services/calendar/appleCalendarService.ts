import * as ical from 'node-ical';
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

export interface AppleCalendarConfig {
  serverUrl: string; // iCloud CalDAV server URL
  username: string;  // Apple ID
  password: string;  // App-specific password
}

export interface AppleCalendarCredentials {
  username: string;
  password: string;
  calendarUrl?: string;
}

// CalDAV client for Apple Calendar
class CalDAVClient {
  constructor(
    _serverUrl: string,
    private username: string,
    private password: string
  ) {}

  private getAuthHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/xml; charset=utf-8',
    };
  }

  async propfind(url: string, depth: number = 1): Promise<Response> {
    const body = `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <D:displayname />
          <D:resourcetype />
          <C:calendar-description />
          <C:supported-calendar-component-set />
        </D:prop>
      </D:propfind>`;

    return fetch(url, {
      method: 'PROPFIND',
      headers: {
        ...this.getAuthHeaders(),
        'Depth': depth.toString(),
      },
      body,
    });
  }

  async report(url: string, timeRange: { start: Date; end: Date }): Promise<Response> {
    const body = `<?xml version="1.0" encoding="utf-8" ?>
      <C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <D:getetag />
          <C:calendar-data />
        </D:prop>
        <C:filter>
          <C:comp-filter name="VCALENDAR">
            <C:comp-filter name="VEVENT">
              <C:time-range start="${this.formatCalDAVDate(timeRange.start)}" 
                           end="${this.formatCalDAVDate(timeRange.end)}"/>
            </C:comp-filter>
          </C:comp-filter>
        </C:filter>
      </C:calendar-query>`;

    return fetch(url, {
      method: 'REPORT',
      headers: {
        ...this.getAuthHeaders(),
        'Depth': '1',
      },
      body,
    });
  }

  async put(url: string, icalData: string): Promise<Response> {
    return fetch(url, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'text/calendar; charset=utf-8',
      },
      body: icalData,
    });
  }

  async delete(url: string): Promise<Response> {
    return fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  private formatCalDAVDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

export class AppleCalendarService implements ICalendarService {
  private caldavClient: CalDAVClient | null = null;
  private calendarUrl: string | null = null;
  private isConnected: boolean = false;
  private _config: AppleCalendarConfig;

  constructor(
    config: AppleCalendarConfig,
    _artistId: string
  ) {
    this._config = config;
  }

  async authenticate(credentials: AppleCalendarCredentials): Promise<boolean> {
    try {
      this.caldavClient = new CalDAVClient(
        this._config.serverUrl,
        credentials.username,
        credentials.password
      );

      // Discover calendar URL if not provided
      if (!credentials.calendarUrl) {
        this.calendarUrl = await this.discoverCalendarUrl();
      } else {
        this.calendarUrl = credentials.calendarUrl;
      }

      // Test the connection
      const response = await this.caldavClient.propfind(this.calendarUrl);
      if (!response.ok) {
        throw new Error(`CalDAV connection failed: ${response.status}`);
      }

      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new CalendarAuthError('apple', `Apple Calendar authentication failed: ${error}`);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isConnected || !this.caldavClient || !this.calendarUrl) {
      return false;
    }

    try {
      // Test if the connection is still valid
      const response = await this.caldavClient.propfind(this.calendarUrl);
      return response.ok;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.caldavClient = null;
    this.calendarUrl = null;
    this.isConnected = false;
  }

  async createEvent(event: CalendarEvent): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected || !this.caldavClient || !this.calendarUrl) {
        throw new CalendarAuthError('apple', 'Not authenticated');
      }

      // Check for conflicts first
      const conflicts = await this.detectConflicts(event);
      if (conflicts.length > 0) {
        throw new CalendarConflictError('apple', conflicts);
      }

      const icalData = this.createICalData(event);
      const eventUrl = `${this.calendarUrl}/${event.id}.ics`;

      const response = await this.caldavClient.put(eventUrl, icalData);
      
      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`);
      }

      return {
        success: true,
        eventId: event.id,
        externalEventId: event.id,
      };
    } catch (error) {
      if (error instanceof CalendarConflictError) {
        return {
          success: false,
          conflicts: error.conflicts,
          error: error.message,
        };
      }
      
      throw new CalendarSyncError('apple', `Failed to create event: ${error}`, error);
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected || !this.caldavClient || !this.calendarUrl) {
        throw new CalendarAuthError('apple', 'Not authenticated');
      }

      // Get the existing event first
      const existingEvent = await this.getEvent(eventId);
      if (!existingEvent) {
        throw new CalendarError('apple', 'Event not found');
      }

      // Merge the updates
      const updatedEvent: CalendarEvent = {
        ...existingEvent,
        ...event,
        id: eventId, // Ensure ID doesn't change
      };

      const icalData = this.createICalData(updatedEvent);
      const eventUrl = `${this.calendarUrl}/${eventId}.ics`;

      const response = await this.caldavClient.put(eventUrl, icalData);
      
      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.status}`);
      }

      return {
        success: true,
        eventId: eventId,
        externalEventId: eventId,
      };
    } catch (error) {
      throw new CalendarSyncError('apple', `Failed to update event: ${error}`, error);
    }
  }

  async deleteEvent(eventId: string): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected || !this.caldavClient || !this.calendarUrl) {
        throw new CalendarAuthError('apple', 'Not authenticated');
      }

      const eventUrl = `${this.calendarUrl}/${eventId}.ics`;
      const response = await this.caldavClient.delete(eventUrl);
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }

      return {
        success: true,
        eventId: eventId,
      };
    } catch (error) {
      throw new CalendarSyncError('apple', `Failed to delete event: ${error}`, error);
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      if (!this.isConnected || !this.caldavClient || !this.calendarUrl) {
        throw new CalendarAuthError('apple', 'Not authenticated');
      }

      const eventUrl = `${this.calendarUrl}/${eventId}.ics`;
      const response = await fetch(eventUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this._config.username}:${this._config.password}`).toString('base64')}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get event: ${response.status}`);
      }

      const icalData = await response.text();
      const parsedData = ical.parseICS(icalData);
      
      // Find the VEVENT component
      const eventComponent = Object.values(parsedData).find(
        (component: any) => component.type === 'VEVENT'
      );

      if (!eventComponent) {
        return null;
      }

      return this.mapICalEventToCalendarEvent(eventComponent as any);
    } catch (error) {
      if ((error as any).message?.includes('404')) {
        return null;
      }
      throw new CalendarError('apple', `Failed to get event: ${error}`, 'GET_EVENT_ERROR', error);
    }
  }

  async syncEvents(startDate: Date, endDate: Date): Promise<CalendarSyncResult[]> {
    try {
      if (!this.isConnected || !this.caldavClient || !this.calendarUrl) {
        throw new CalendarAuthError('apple', 'Not authenticated');
      }

      const response = await this.caldavClient.report(this.calendarUrl, {
        start: startDate,
        end: endDate,
      });

      if (!response.ok) {
        throw new Error(`Failed to sync events: ${response.status}`);
      }

      await response.text();
      const results: CalendarSyncResult[] = [];

      // Parse the CalDAV response (simplified - would need proper XML parsing)
      // For now, we'll return a basic structure
      // In a real implementation, you'd parse the XML and extract calendar data

      return results;
    } catch (error) {
      throw new CalendarSyncError('apple', `Failed to sync events: ${error}`, error);
    }
  }

  async detectConflicts(event: CalendarEvent): Promise<CalendarConflict[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      // Get events in the same time range
      await this.syncEvents(event.startTime, event.endTime);
      const conflicts: CalendarConflict[] = [];

      // This is a simplified implementation
      // In a real scenario, you'd need to parse the actual events and check for overlaps

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
          throw new CalendarError('apple', 'Merge resolution not implemented yet');
        
        default:
          throw new CalendarError('apple', 'Invalid resolution type');
      }
    } catch (error) {
      throw new CalendarSyncError('apple', `Failed to resolve conflict: ${error}`, error);
    }
  }

  async getAvailability(startDate: Date, endDate: Date): Promise<{ start: Date; end: Date; available: boolean }[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      // Apple Calendar doesn't have a direct availability API like Google or Microsoft
      // We need to get all events and calculate availability based on busy times
      await this.syncEvents(startDate, endDate);
      const availability: { start: Date; end: Date; available: boolean }[] = [];

      // This is a simplified implementation
      // In a real scenario, you'd parse the events and create availability slots

      return availability;
    } catch (error) {
      throw new CalendarError('apple', `Failed to get availability: ${error}`, 'AVAILABILITY_ERROR', error);
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
      throw new CalendarError('apple', `Failed to find available slots: ${error}`, 'AVAILABILITY_ERROR', error);
    }
  }

  // Helper methods
  private async discoverCalendarUrl(): Promise<string> {
    if (!this.caldavClient) {
      throw new Error('CalDAV client not initialized');
    }

    // This is a simplified discovery process
    // In a real implementation, you'd follow the CalDAV discovery protocol
    const baseUrl = this._config.serverUrl;
    const userUrl = `${baseUrl}/${this._config.username}/`;
    
    // Try to find the calendar collection
    const response = await this.caldavClient.propfind(userUrl);
    
    if (!response.ok) {
      throw new Error(`Calendar discovery failed: ${response.status}`);
    }

    // For iCloud, the calendar URL typically follows this pattern
    return `${userUrl}calendars/`;
  }

  private createICalData(event: CalendarEvent): string {
    const now = new Date();
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//InkGest//Calendar Integration//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}`,
      `DTSTART:${formatDate(event.startTime)}`,
      `DTEND:${formatDate(event.endTime)}`,
      `DTSTAMP:${formatDate(now)}`,
      `SUMMARY:${event.title}`,
    ];

    if (event.description) {
      icalData.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
    }

    if (event.location) {
      icalData.push(`LOCATION:${event.location}`);
    }

    // Add attendees
    if (event.attendees && event.attendees.length > 0) {
      for (const attendee of event.attendees) {
        const attendeeStatus = this.mapAttendeeStatusToICal(attendee.status);
        icalData.push(`ATTENDEE;PARTSTAT=${attendeeStatus};CN=${attendee.name || attendee.email}:mailto:${attendee.email}`);
      }
    }

    // Add reminders
    if (event.reminders && event.reminders.length > 0) {
      for (const reminder of event.reminders) {
        icalData.push('BEGIN:VALARM');
        icalData.push(`TRIGGER:-PT${reminder.minutes}M`);
        icalData.push(`ACTION:${reminder.method === 'email' ? 'EMAIL' : 'DISPLAY'}`);
        icalData.push(`DESCRIPTION:${event.title}`);
        icalData.push('END:VALARM');
      }
    }

    // Add recurrence if specified
    if (event.recurrence) {
      icalData.push(this.buildICalRecurrence(event.recurrence));
    }

    icalData.push('END:VEVENT');
    icalData.push('END:VCALENDAR');

    return icalData.join('\r\n');
  }

  private mapICalEventToCalendarEvent(icalEvent: any): CalendarEvent {
    return {
      id: icalEvent.uid,
      title: icalEvent.summary || 'Untitled Event',
      description: icalEvent.description,
      startTime: new Date(icalEvent.start),
      endTime: new Date(icalEvent.end),
      location: icalEvent.location,
      attendees: icalEvent.attendee ? (Array.isArray(icalEvent.attendee) ? icalEvent.attendee : [icalEvent.attendee]).map((attendee: any) => ({
        email: attendee.val?.replace('mailto:', '') || attendee,
        name: attendee.params?.CN,
        status: this.mapICalAttendeeStatus(attendee.params?.PARTSTAT),
      })) : [],
    };
  }

  private mapAttendeeStatusToICal(status?: string): string {
    switch (status) {
      case 'accepted': return 'ACCEPTED';
      case 'declined': return 'DECLINED';
      case 'tentative': return 'TENTATIVE';
      default: return 'NEEDS-ACTION';
    }
  }

  private mapICalAttendeeStatus(status?: string): 'accepted' | 'declined' | 'tentative' | 'needsAction' {
    switch (status) {
      case 'ACCEPTED': return 'accepted';
      case 'DECLINED': return 'declined';
      case 'TENTATIVE': return 'tentative';
      default: return 'needsAction';
    }
  }

  private buildICalRecurrence(recurrence: any): string {
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


}