import { GoogleCalendarService, GoogleCalendarConfig, GoogleCalendarCredentials } from './googleCalendarService';
import { MicrosoftCalendarService, MicrosoftCalendarConfig, MicrosoftCalendarCredentials } from './microsoftCalendarService';
import { AppleCalendarService, AppleCalendarConfig, AppleCalendarCredentials } from './appleCalendarService';
import {
  ICalendarService,
  CalendarEvent,
  CalendarSyncResult,
  CalendarConflict,
  CalendarProvider,
  CalendarIntegrationConfig,
  CalendarError
} from './types';

export interface CalendarIntegrationCredentials {
  google?: GoogleCalendarCredentials;
  microsoft?: MicrosoftCalendarCredentials;
  apple?: AppleCalendarCredentials;
}

export interface CalendarIntegrationConfigs {
  google?: GoogleCalendarConfig;
  microsoft?: MicrosoftCalendarConfig;
  apple?: AppleCalendarConfig;
}

export interface SyncOptions {
  providers?: ('google' | 'microsoft' | 'apple')[];
  conflictResolution?: 'manual' | 'auto' | 'skip';
  syncDirection?: 'bidirectional' | 'to_external' | 'from_external';
}

export class CalendarIntegrationService {
  private services: Map<string, ICalendarService> = new Map();
  private config: CalendarIntegrationConfig;
  private syncInProgress: boolean = false;

  constructor(
    private artistId: string,
    private configs: CalendarIntegrationConfigs,
    config?: Partial<CalendarIntegrationConfig>
  ) {
    this.config = {
      providers: [],
      syncInterval: 15, // 15 minutes
      conflictResolution: 'manual',
      defaultReminders: [
        { method: 'email', minutes: 1440 }, // 24 hours
        { method: 'popup', minutes: 120 },  // 2 hours
      ],
      timezone: 'Europe/Madrid',
      ...config,
    };

    this.initializeServices();
  }

  private initializeServices(): void {
    if (this.configs.google) {
      const googleService = new GoogleCalendarService(this.configs.google, this.artistId);
      this.services.set('google', googleService);
    }

    if (this.configs.microsoft) {
      const microsoftService = new MicrosoftCalendarService(this.configs.microsoft, this.artistId);
      this.services.set('microsoft', microsoftService);
    }

    if (this.configs.apple) {
      const appleService = new AppleCalendarService(this.configs.apple, this.artistId);
      this.services.set('apple', appleService);
    }
  }

  async authenticateProvider(
    provider: 'google' | 'microsoft' | 'apple',
    credentials: GoogleCalendarCredentials | MicrosoftCalendarCredentials | AppleCalendarCredentials
  ): Promise<boolean> {
    const service = this.services.get(provider);
    if (!service) {
      throw new CalendarError(provider, `${provider} service not configured`);
    }

    try {
      const success = await service.authenticate(credentials);
      if (success) {
        // Update provider status
        const providerIndex = this.config.providers.findIndex(p => p.name === provider);
        if (providerIndex >= 0) {
          this.config.providers[providerIndex]!.isConnected = true;
          this.config.providers[providerIndex]!.lastSync = new Date();
        } else {
          this.config.providers.push({
            name: provider,
            displayName: this.getProviderDisplayName(provider),
            isConnected: true,
            lastSync: new Date(),
            syncEnabled: true,
          });
        }
      }
      return success;
    } catch (error) {
      throw new CalendarError(provider, `Authentication failed: ${error}`);
    }
  }

  async disconnectProvider(provider: 'google' | 'microsoft' | 'apple'): Promise<void> {
    const service = this.services.get(provider);
    if (!service) {
      throw new CalendarError(provider, `${provider} service not configured`);
    }

    try {
      await service.disconnect();
      
      // Update provider status
      const providerIndex = this.config.providers.findIndex(p => p.name === provider);
      if (providerIndex >= 0) {
        this.config.providers[providerIndex]!.isConnected = false;
        this.config.providers[providerIndex]!.lastSync = undefined;
      }
    } catch (error) {
      throw new CalendarError(provider, `Disconnect failed: ${error}`);
    }
  }

  async syncAppointmentToCalendars(
    appointment: any,
    options?: SyncOptions
  ): Promise<Map<string, CalendarSyncResult>> {
    const results = new Map<string, CalendarSyncResult>();
    const calendarEvent = this.mapAppointmentToCalendarEvent(appointment);
    
    const providersToSync = options?.providers || this.getEnabledProviders();

    for (const providerName of providersToSync) {
      const service = this.services.get(providerName);
      if (!service) {
        results.set(providerName, {
          success: false,
          error: `${providerName} service not available`,
        });
        continue;
      }

      try {
        const isAuthenticated = await service.isAuthenticated();
        if (!isAuthenticated) {
          results.set(providerName, {
            success: false,
            error: `${providerName} not authenticated`,
          });
          continue;
        }

        const result = await service.createEvent(calendarEvent);
        results.set(providerName, result);

        // Handle conflicts based on resolution strategy
        if (!result.success && result.conflicts) {
          const resolvedResult = await this.handleConflicts(
            service,
            result.conflicts,
            options?.conflictResolution || this.config.conflictResolution
          );
          results.set(providerName, resolvedResult);
        }
      } catch (error) {
        results.set(providerName, {
          success: false,
          error: `Sync failed: ${error}`,
        });
      }
    }

    return results;
  }

  async updateAppointmentInCalendars(
    _appointmentId: string,
    updates: any,
    externalEventIds: Map<string, string>,
    options?: SyncOptions
  ): Promise<Map<string, CalendarSyncResult>> {
    const results = new Map<string, CalendarSyncResult>();
    const calendarEventUpdates = this.mapAppointmentToCalendarEvent(updates);
    
    const providersToSync = options?.providers || this.getEnabledProviders();

    for (const providerName of providersToSync) {
      const service = this.services.get(providerName);
      const externalEventId = externalEventIds.get(providerName);
      
      if (!service || !externalEventId) {
        results.set(providerName, {
          success: false,
          error: `${providerName} service or event ID not available`,
        });
        continue;
      }

      try {
        const isAuthenticated = await service.isAuthenticated();
        if (!isAuthenticated) {
          results.set(providerName, {
            success: false,
            error: `${providerName} not authenticated`,
          });
          continue;
        }

        const result = await service.updateEvent(externalEventId, calendarEventUpdates);
        results.set(providerName, result);
      } catch (error) {
        results.set(providerName, {
          success: false,
          error: `Update failed: ${error}`,
        });
      }
    }

    return results;
  }

  async deleteAppointmentFromCalendars(
    externalEventIds: Map<string, string>,
    options?: SyncOptions
  ): Promise<Map<string, CalendarSyncResult>> {
    const results = new Map<string, CalendarSyncResult>();
    const providersToSync = options?.providers || this.getEnabledProviders();

    for (const providerName of providersToSync) {
      const service = this.services.get(providerName);
      const externalEventId = externalEventIds.get(providerName);
      
      if (!service || !externalEventId) {
        results.set(providerName, {
          success: false,
          error: `${providerName} service or event ID not available`,
        });
        continue;
      }

      try {
        const isAuthenticated = await service.isAuthenticated();
        if (!isAuthenticated) {
          results.set(providerName, {
            success: false,
            error: `${providerName} not authenticated`,
          });
          continue;
        }

        const result = await service.deleteEvent(externalEventId);
        results.set(providerName, result);
      } catch (error) {
        results.set(providerName, {
          success: false,
          error: `Delete failed: ${error}`,
        });
      }
    }

    return results;
  }

  async detectConflictsForAppointment(
    appointment: any
  ): Promise<Map<string, CalendarConflict[]>> {
    const conflicts = new Map<string, CalendarConflict[]>();
    const calendarEvent = this.mapAppointmentToCalendarEvent(appointment);
    
    const enabledProviders = this.getEnabledProviders();

    for (const providerName of enabledProviders) {
      const service = this.services.get(providerName);
      if (!service) {
        continue;
      }

      try {
        const isAuthenticated = await service.isAuthenticated();
        if (!isAuthenticated) {
          continue;
        }

        const providerConflicts = await service.detectConflicts(calendarEvent);
        if (providerConflicts.length > 0) {
          conflicts.set(providerName, providerConflicts);
        }
      } catch (error) {
        console.error(`Failed to detect conflicts for ${providerName}:`, error);
      }
    }

    return conflicts;
  }

  async getArtistAvailability(
    startDate: Date,
    endDate: Date,
    providers?: ('google' | 'microsoft' | 'apple')[]
  ): Promise<Map<string, { start: Date; end: Date; available: boolean }[]>> {
    const availability = new Map<string, { start: Date; end: Date; available: boolean }[]>();
    const providersToCheck = providers || this.getEnabledProviders();

    for (const providerName of providersToCheck) {
      const service = this.services.get(providerName);
      if (!service) {
        continue;
      }

      try {
        const isAuthenticated = await service.isAuthenticated();
        if (!isAuthenticated) {
          continue;
        }

        const providerAvailability = await service.getAvailability(startDate, endDate);
        availability.set(providerName, providerAvailability);
      } catch (error) {
        console.error(`Failed to get availability for ${providerName}:`, error);
      }
    }

    return availability;
  }

  async findAvailableSlots(
    duration: number,
    startDate: Date,
    endDate: Date,
    providers?: ('google' | 'microsoft' | 'apple')[]
  ): Promise<{ start: Date; end: Date }[]> {
    const providersToCheck = providers || this.getEnabledProviders();
    const allAvailableSlots: { start: Date; end: Date }[] = [];

    for (const providerName of providersToCheck) {
      const service = this.services.get(providerName);
      if (!service) {
        continue;
      }

      try {
        const isAuthenticated = await service.isAuthenticated();
        if (!isAuthenticated) {
          continue;
        }

        const slots = await service.findAvailableSlots(duration, startDate, endDate);
        allAvailableSlots.push(...slots);
      } catch (error) {
        console.error(`Failed to find available slots for ${providerName}:`, error);
      }
    }

    // Merge and deduplicate slots
    return this.mergeAvailableSlots(allAvailableSlots);
  }

  async startPeriodicSync(intervalMinutes?: number): Promise<void> {
    const interval = intervalMinutes || this.config.syncInterval;
    
    if (this.syncInProgress) {
      console.warn('Sync already in progress');
      return;
    }

    setInterval(async () => {
      if (!this.syncInProgress) {
        await this.performPeriodicSync();
      }
    }, interval * 60 * 1000);
  }

  private async performPeriodicSync(): Promise<void> {
    this.syncInProgress = true;
    
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
      
      for (const providerName of this.getEnabledProviders()) {
        const service = this.services.get(providerName);
        if (!service) {
          continue;
        }

        try {
          const isAuthenticated = await service.isAuthenticated();
          if (!isAuthenticated) {
            continue;
          }

          await service.syncEvents(now, endDate);
          
          // Update last sync time
          const providerIndex = this.config.providers.findIndex(p => p.name === providerName);
          if (providerIndex >= 0) {
            this.config.providers[providerIndex]!.lastSync = new Date();
          }
        } catch (error) {
          console.error(`Periodic sync failed for ${providerName}:`, error);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async handleConflicts(
    service: ICalendarService,
    conflicts: CalendarConflict[],
    resolution: 'manual' | 'auto' | 'skip'
  ): Promise<CalendarSyncResult> {
    switch (resolution) {
      case 'skip':
        return {
          success: false,
          conflicts,
          error: 'Conflicts detected, sync skipped',
        };

      case 'auto':
        // Implement automatic conflict resolution logic
        // For now, we'll keep the local version (delete remote conflicts)
        for (const conflict of conflicts) {
          try {
            await service.resolveConflict(conflict.eventId, 'keep_local');
          } catch (error) {
            console.error(`Failed to auto-resolve conflict ${conflict.eventId}:`, error);
          }
        }
        return {
          success: true,
          conflicts: [],
        };

      case 'manual':
      default:
        // Return conflicts for manual resolution
        return {
          success: false,
          conflicts,
          error: 'Manual conflict resolution required',
        };
    }
  }

  private mapAppointmentToCalendarEvent(appointment: any): CalendarEvent {
    return {
      id: appointment.id,
      title: `${appointment.service?.name || 'Appointment'} - ${appointment.client?.name || 'Client'}`,
      description: appointment.notes || `Appointment with ${appointment.client?.name || 'client'}`,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.room?.name || 'Studio',
      timezone: this.config.timezone,
      attendees: [
        {
          email: appointment.client?.email || '',
          name: appointment.client?.name || 'Client',
          required: true,
        },
        {
          email: appointment.artist?.user?.email || '',
          name: appointment.artist?.user?.name || 'Artist',
          required: true,
        },
      ].filter(attendee => attendee.email), // Filter out empty emails
      reminders: this.config.defaultReminders,
      metadata: {
        appointmentId: appointment.id,
        storeId: appointment.storeId,
        artistId: appointment.artistId,
        serviceId: appointment.serviceId,
        price: appointment.price,
      },
    };
  }

  private getEnabledProviders(): ('google' | 'microsoft' | 'apple')[] {
    return this.config.providers
      .filter(provider => provider.isConnected && provider.syncEnabled)
      .map(provider => provider.name);
  }

  private getProviderDisplayName(provider: 'google' | 'microsoft' | 'apple'): string {
    switch (provider) {
      case 'google': return 'Google Calendar';
      case 'microsoft': return 'Microsoft Outlook';
      case 'apple': return 'Apple Calendar';
      default: return provider;
    }
  }

  private mergeAvailableSlots(slots: { start: Date; end: Date }[]): { start: Date; end: Date }[] {
    if (slots.length === 0) {
      return [];
    }

    // Sort slots by start time
    const sortedSlots = slots.sort((a, b) => a.start.getTime() - b.start.getTime());
    const mergedSlots: { start: Date; end: Date }[] = [];
    
    if (sortedSlots.length === 0) {
      return mergedSlots;
    }
    
    let currentSlot: { start: Date; end: Date } = {
      start: sortedSlots[0]!.start,
      end: sortedSlots[0]!.end
    };

    for (let i = 1; i < sortedSlots.length; i++) {
      const nextSlot = sortedSlots[i]!;
      
      // If slots overlap or are adjacent, merge them
      if (nextSlot.start.getTime() <= currentSlot.end.getTime()) {
        currentSlot.end = new Date(Math.max(currentSlot.end.getTime(), nextSlot.end.getTime()));
      } else {
        // No overlap, add current slot and start a new one
        mergedSlots.push(currentSlot);
        currentSlot = {
          start: nextSlot.start,
          end: nextSlot.end
        };
      }
    }

    // Add the last slot
    mergedSlots.push(currentSlot);

    return mergedSlots;
  }

  // Getters
  getConfig(): CalendarIntegrationConfig {
    return { ...this.config };
  }

  getProviders(): CalendarProvider[] {
    return [...this.config.providers];
  }

  isProviderConnected(provider: 'google' | 'microsoft' | 'apple'): boolean {
    const providerConfig = this.config.providers.find(p => p.name === provider);
    return providerConfig?.isConnected || false;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}