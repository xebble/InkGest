import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import {
  ICalendarService,
  CalendarEvent,
  CalendarSyncResult,
  CalendarConflict,
  CalendarError,
  CalendarAuthError,
  CalendarSyncError,
  CalendarConflictError,
} from './types';

export interface MicrosoftCalendarConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  scopes: string[];
}

export interface MicrosoftCalendarCredentials {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

// Custom authentication provider for Microsoft Graph
class CustomAuthProvider implements AuthenticationProvider {
  constructor(private accessToken: string) {}

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export class MicrosoftCalendarService implements ICalendarService {
  private graphClient: Client | null = null;
  private isConnected: boolean = false;
  private accessToken: string | null = null; // Used in authenticate and disconnect methods

  constructor(_config: MicrosoftCalendarConfig, _artistId: string) {}

  async authenticate(
    credentials: MicrosoftCalendarCredentials
  ): Promise<boolean> {
    try {
      this.accessToken = credentials.access_token;

      const authProvider = new CustomAuthProvider(credentials.access_token);
      this.graphClient = Client.initWithMiddleware({ authProvider });

      // Test the connection
      await this.graphClient.api('/me').get();
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new CalendarAuthError(
        'microsoft',
        `Microsoft Calendar authentication failed: ${error}`
      );
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isConnected || !this.graphClient || !this.accessToken) {
      return false;
    }

    try {
      // Test if the token is still valid
      await this.graphClient.api('/me').get();
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.graphClient = null;
    this.accessToken = null;
    this.isConnected = false;
  }

  async createEvent(event: CalendarEvent): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected || !this.graphClient) {
        throw new CalendarAuthError('microsoft', 'Not authenticated');
      }

      // Check for conflicts first
      const conflicts = await this.detectConflicts(event);
      if (conflicts.length > 0) {
        throw new CalendarConflictError('microsoft', conflicts);
      }

      const microsoftEvent = {
        subject: event.title,
        body: {
          contentType: 'text',
          content: event.description || '',
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: event.timezone || 'Europe/Madrid',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: event.timezone || 'Europe/Madrid',
        },
        location: event.location
          ? {
              displayName: event.location,
            }
          : undefined,
        attendees: event.attendees?.map(attendee => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: attendee.required ? 'required' : 'optional',
        })),
        reminderMinutesBeforeStart: event.reminders?.[0]?.minutes || 120,
        isReminderOn: (event.reminders?.length || 0) > 0,
      };

      // Add recurrence if specified
      if (event.recurrence) {
        (microsoftEvent as any).recurrence = this.buildMicrosoftRecurrence(
          event.recurrence
        );
      }

      const response = await this.graphClient
        .api('/me/events')
        .post(microsoftEvent);

      return {
        success: true,
        eventId: event.id!,
        externalEventId: response.id,
      };
    } catch (error) {
      if (error instanceof CalendarConflictError) {
        return {
          success: false,
          conflicts: error.conflicts,
          error: error.message,
        };
      }

      throw new CalendarSyncError(
        'microsoft',
        `Failed to create event: ${error}`,
        error
      );
    }
  }

  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected || !this.graphClient) {
        throw new CalendarAuthError('microsoft', 'Not authenticated');
      }

      // Build update object
      const updateData: any = {};

      if (event.title !== undefined) {
        updateData.subject = event.title;
      }
      if (event.description !== undefined) {
        updateData.body = {
          contentType: 'text',
          content: event.description,
        };
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
        updateData.location = {
          displayName: event.location,
        };
      }
      if (event.attendees !== undefined) {
        updateData.attendees = event.attendees.map(attendee => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: attendee.required ? 'required' : 'optional',
        }));
      }

      const response = await this.graphClient
        .api(`/me/events/${eventId}`)
        .patch(updateData);

      return {
        success: true,
        eventId: event.id || eventId,
        externalEventId: response.id,
      };
    } catch (error) {
      throw new CalendarSyncError(
        'microsoft',
        `Failed to update event: ${error}`,
        error
      );
    }
  }

  async deleteEvent(eventId: string): Promise<CalendarSyncResult> {
    try {
      if (!this.isConnected || !this.graphClient) {
        throw new CalendarAuthError('microsoft', 'Not authenticated');
      }

      await this.graphClient.api(`/me/events/${eventId}`).delete();

      return {
        success: true,
        eventId: eventId,
      };
    } catch (error) {
      throw new CalendarSyncError(
        'microsoft',
        `Failed to delete event: ${error}`,
        error
      );
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      if (!this.isConnected || !this.graphClient) {
        throw new CalendarAuthError('microsoft', 'Not authenticated');
      }

      const response = await this.graphClient
        .api(`/me/events/${eventId}`)
        .get();

      if (!response) {
        return null;
      }

      return this.mapMicrosoftEventToCalendarEvent(response);
    } catch (error) {
      if ((error as any).code === 'ItemNotFound') {
        return null;
      }
      throw new CalendarError(
        'microsoft',
        `Failed to get event: ${error}`,
        'GET_EVENT_ERROR',
        error
      );
    }
  }

  async syncEvents(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarSyncResult[]> {
    try {
      if (!this.isConnected || !this.graphClient) {
        throw new CalendarAuthError('microsoft', 'Not authenticated');
      }

      const response = await this.graphClient
        .api('/me/events')
        .filter(
          `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
        )
        .orderby('start/dateTime')
        .get();

      const results: CalendarSyncResult[] = [];

      for (const microsoftEvent of response.value || []) {
        try {
          const calendarEvent =
            this.mapMicrosoftEventToCalendarEvent(microsoftEvent);
          results.push({
            success: true,
            eventId: calendarEvent.id,
            externalEventId: microsoftEvent.id,
          });
        } catch (error) {
          results.push({
            success: false,
            externalEventId: microsoftEvent.id,
            error: `Failed to map event: ${error}`,
          });
        }
      }

      return results;
    } catch (error) {
      throw new CalendarSyncError(
        'microsoft',
        `Failed to sync events: ${error}`,
        error
      );
    }
  }

  async detectConflicts(event: CalendarEvent): Promise<CalendarConflict[]> {
    try {
      if (!this.isConnected || !this.graphClient) {
        return [];
      }

      // Get events in the same time range
      const response = await this.graphClient
        .api('/me/events')
        .filter(
          `start/dateTime lt '${event.endTime.toISOString()}' and end/dateTime gt '${event.startTime.toISOString()}'`
        )
        .get();

      const conflicts: CalendarConflict[] = [];

      for (const microsoftEvent of response.value || []) {
        const eventStart = new Date(microsoftEvent.start.dateTime);
        const eventEnd = new Date(microsoftEvent.end.dateTime);

        // Check for overlap
        if (
          this.eventsOverlap(
            event.startTime,
            event.endTime,
            eventStart,
            eventEnd
          )
        ) {
          conflicts.push({
            eventId: microsoftEvent.id,
            title: microsoftEvent.subject || 'Untitled Event',
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
          throw new CalendarError(
            'microsoft',
            'Merge resolution not implemented yet'
          );

        default:
          throw new CalendarError('microsoft', 'Invalid resolution type');
      }
    } catch (error) {
      throw new CalendarSyncError(
        'microsoft',
        `Failed to resolve conflict: ${error}`,
        error
      );
    }
  }

  async getAvailability(
    startDate: Date,
    endDate: Date
  ): Promise<{ start: Date; end: Date; available: boolean }[]> {
    try {
      if (!this.isConnected || !this.graphClient) {
        return [];
      }

      const response = await this.graphClient
        .api('/me/calendar/getSchedule')
        .post({
          schedules: ['me'],
          startTime: {
            dateTime: startDate.toISOString(),
            timeZone: 'Europe/Madrid',
          },
          endTime: {
            dateTime: endDate.toISOString(),
            timeZone: 'Europe/Madrid',
          },
          availabilityViewInterval: 60, // 60-minute intervals
        });

      const availability: { start: Date; end: Date; available: boolean }[] = [];
      const schedule = response.value[0];

      if (schedule && schedule.busyViewTimes) {
        for (let i = 0; i < schedule.busyViewTimes.length; i++) {
          const busyLevel = schedule.busyViewTimes[i];
          const intervalStart = new Date(
            startDate.getTime() + i * 60 * 60 * 1000
          );
          const intervalEnd = new Date(
            intervalStart.getTime() + 60 * 60 * 1000
          );

          // busyLevel: 0 = free, 1 = tentative, 2 = busy, 3 = out of office, 4 = working elsewhere
          availability.push({
            start: intervalStart,
            end: intervalEnd,
            available: busyLevel === '0',
          });
        }
      }

      return availability;
    } catch (error) {
      throw new CalendarError(
        'microsoft',
        `Failed to get availability: ${error}`,
        'AVAILABILITY_ERROR',
        error
      );
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

      // Find consecutive available slots that meet the duration requirement
      let currentSlotStart: Date | null = null;
      let currentSlotEnd: Date | null = null;

      for (const slot of availability) {
        if (slot.available) {
          if (!currentSlotStart) {
            currentSlotStart = slot.start;
            currentSlotEnd = slot.end;
          } else {
            // Extend the current slot
            currentSlotEnd = slot.end;
          }

          // Check if we have enough duration
          if (currentSlotStart && currentSlotEnd) {
            const slotDuration =
              currentSlotEnd.getTime() - currentSlotStart.getTime();
            if (slotDuration >= duration * 60 * 1000) {
              availableSlots.push({
                start: new Date(currentSlotStart),
                end: new Date(
                  currentSlotStart.getTime() + duration * 60 * 1000
                ),
              });
            }
          }
        } else {
          // Reset current slot
          currentSlotStart = null;
          currentSlotEnd = null;
        }
      }

      return availableSlots;
    } catch (error) {
      throw new CalendarError(
        'microsoft',
        `Failed to find available slots: ${error}`,
        'AVAILABILITY_ERROR',
        error
      );
    }
  }

  // Helper methods
  private mapMicrosoftEventToCalendarEvent(microsoftEvent: any): CalendarEvent {
    return {
      id: microsoftEvent.id,
      title: microsoftEvent.subject || 'Untitled Event',
      description: microsoftEvent.body?.content,
      startTime: new Date(microsoftEvent.start.dateTime),
      endTime: new Date(microsoftEvent.end.dateTime),
      location: microsoftEvent.location?.displayName,
      attendees: microsoftEvent.attendees?.map((attendee: any) => ({
        email: attendee.emailAddress.address,
        name: attendee.emailAddress.name,
        status: this.mapMicrosoftAttendeeStatus(attendee.status?.response),
        required: attendee.type === 'required',
      })),
      reminders: microsoftEvent.isReminderOn
        ? [
            {
              method: 'popup' as const,
              minutes: microsoftEvent.reminderMinutesBeforeStart || 120,
            },
          ]
        : [],
    };
  }

  private mapMicrosoftAttendeeStatus(
    status?: string
  ): 'accepted' | 'declined' | 'tentative' | 'needsAction' {
    switch (status) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentativelyAccepted':
        return 'tentative';
      default:
        return 'needsAction';
    }
  }

  private buildMicrosoftRecurrence(recurrence: any): any {
    const pattern: any = {
      type: recurrence.frequency,
      interval: recurrence.interval || 1,
    };

    if (recurrence.byWeekDay && recurrence.byWeekDay.length > 0) {
      const days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      pattern.daysOfWeek = recurrence.byWeekDay.map((day: number) => days[day]);
    }

    const range: any = {
      type: 'noEnd',
    };

    if (recurrence.count) {
      range.type = 'numbered';
      range.numberOfOccurrences = recurrence.count;
    } else if (recurrence.until) {
      range.type = 'endDate';
      range.endDate = recurrence.until.toISOString().split('T')[0];
    }

    return {
      pattern,
      range,
    };
  }

  private eventsOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}
