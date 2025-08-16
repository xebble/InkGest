import { db } from '@/lib/db';
import { reminderService } from './reminderService';
import { communicationService } from './communicationService';
import type { 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  Appointment,
  AppointmentStatus
} from '@/types';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@/types';

// Validation schemas
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  artistId: z.string().uuid('Invalid artist ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  startTime: z.date(),
  endTime: z.date(),
  notes: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  deposit: z.number().positive('Deposit must be positive').optional()
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const updateAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID').optional(),
  artistId: z.string().uuid('Invalid artist ID').optional(),
  serviceId: z.string().uuid('Invalid service ID').optional(),
  roomId: z.string().uuid('Invalid room ID').optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  deposit: z.number().positive('Deposit must be positive').optional()
});

class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      // Validate input data
      const validatedData = createAppointmentSchema.parse(data);

      // Check for conflicts
      await this.checkForConflicts(
        validatedData.artistId,
        validatedData.startTime,
        validatedData.endTime,
        validatedData.roomId
      );

      // Get store ID from artist
      const artist = await db.artist.findUnique({
        where: { id: validatedData.artistId },
        select: { storeId: true }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      // Create appointment
      const appointment = await db.appointment.create({
        data: {
          storeId: artist.storeId,
          clientId: validatedData.clientId,
          artistId: validatedData.artistId,
          serviceId: validatedData.serviceId,
          roomId: validatedData.roomId || null,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          notes: validatedData.notes || null,
          price: validatedData.price,
          deposit: validatedData.deposit || null,
          status: 'SCHEDULED'
        },
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          },
          store: true
        }
      });

      // Schedule automatic reminders
      try {
        await reminderService.scheduleAppointmentReminders(appointment.id);
      } catch (error) {
        console.error('Failed to schedule reminders for appointment:', appointment.id, error);
        // Don't fail the appointment creation if reminders fail
      }

      // Send confirmation message
      try {
        await communicationService.sendAppointmentReminder(
          appointment as any,
          '24h', // This will be used as confirmation
          'es' // Default locale, should be determined from client preferences
        );
      } catch (error) {
        console.error('Failed to send appointment confirmation:', error);
        // Don't fail the appointment creation if confirmation fails
      }

      return appointment as Appointment;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid appointment data', error.errors[0]?.path[0]?.toString());
      }
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    try {
      // Validate input data
      const validatedData = updateAppointmentSchema.parse(data);

      // Get existing appointment
      const existingAppointment = await db.appointment.findUnique({
        where: { id },
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          }
        }
      });

      if (!existingAppointment) {
        throw new NotFoundError('Appointment');
      }

      // Check for conflicts if time or artist changed
      if (validatedData.startTime || validatedData.endTime || validatedData.artistId) {
        const startTime = validatedData.startTime || existingAppointment.startTime;
        const endTime = validatedData.endTime || existingAppointment.endTime;
        const artistId = validatedData.artistId || existingAppointment.artistId;

        await this.checkForConflicts(artistId, startTime, endTime, validatedData.roomId, id);
      }

      // Build update data with proper null handling
      const updateData: any = {};
      if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId;
      if (validatedData.artistId !== undefined) updateData.artistId = validatedData.artistId;
      if (validatedData.serviceId !== undefined) updateData.serviceId = validatedData.serviceId;
      if (validatedData.roomId !== undefined) updateData.roomId = validatedData.roomId;
      if (validatedData.startTime !== undefined) updateData.startTime = validatedData.startTime;
      if (validatedData.endTime !== undefined) updateData.endTime = validatedData.endTime;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
      if (validatedData.price !== undefined) updateData.price = validatedData.price;
      if (validatedData.deposit !== undefined) updateData.deposit = validatedData.deposit;

      // Update appointment
      const updatedAppointment = await db.appointment.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          },
          store: true
        }
      });

      // Handle status changes
      if (validatedData.status) {
        await this.handleStatusChange(updatedAppointment, validatedData.status, existingAppointment.status);
      }

      // Reschedule reminders if time changed
      if (validatedData.startTime || validatedData.endTime) {
        try {
          await reminderService.cancelAppointmentReminders(id);
          await reminderService.scheduleAppointmentReminders(id);
        } catch (error) {
          console.error('Failed to reschedule reminders for appointment:', id, error);
        }
      }

      return updatedAppointment as Appointment;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid appointment data', error.errors[0]?.path[0]?.toString());
      }
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(id: string): Promise<Appointment | null> {
    try {
      const appointment = await db.appointment.findUnique({
        where: { id },
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          },
          store: true,
          room: true,
          payments: true,
          documents: true
        }
      });

      return appointment as Appointment | null;
    } catch (error) {
      throw new Error(`Failed to get appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get appointments for a store
   */
  async getStoreAppointments(
    storeId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      artistId?: string;
      clientId?: string;
      status?: AppointmentStatus;
    }
  ): Promise<Appointment[]> {
    try {
      const where: any = { storeId };

      if (filters?.startDate || filters?.endDate) {
        where.startTime = {};
        if (filters.startDate) where.startTime.gte = filters.startDate;
        if (filters.endDate) where.startTime.lte = filters.endDate;
      }

      if (filters?.artistId) where.artistId = filters.artistId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;

      const appointments = await db.appointment.findMany({
        where,
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          },
          room: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return appointments as Appointment[];
    } catch (error) {
      throw new Error(`Failed to get store appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    try {
      const appointment = await this.updateAppointment(id, { 
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      });

      // Cancel reminders
      try {
        await reminderService.cancelAppointmentReminders(id);
      } catch (error) {
        console.error('Failed to cancel reminders for appointment:', id, error);
      }

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(id: string): Promise<Appointment> {
    try {
      const appointment = await this.updateAppointment(id, { status: 'COMPLETED' });

      // Schedule post-care follow-up
      try {
        setTimeout(async () => {
          await communicationService.sendPostCareFollowup(appointment as any, 'es');
        }, 24 * 60 * 60 * 1000); // 24 hours later
      } catch (error) {
        console.error('Failed to schedule post-care follow-up:', error);
      }

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkForConflicts(
    artistId: string,
    startTime: Date,
    endTime: Date,
    roomId?: string,
    excludeAppointmentId?: string
  ): Promise<void> {
    const where: any = {
      AND: [
        {
          OR: [
            { artistId },
            ...(roomId ? [{ roomId }] : [])
          ]
        },
        {
          status: {
            notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW']
          }
        },
        {
          startTime: {
            lt: endTime
          },
          endTime: {
            gt: startTime
          }
        }
      ]
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const conflicts = await db.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
        artist: {
          include: {
            user: true
          }
        },
        room: true
      }
    });

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      if (conflict) {
        const conflictType = conflict.artistId === artistId ? 'Artist' : 'Room';
        const conflictName = conflict.artistId === artistId 
          ? conflict.artist.user.name 
          : conflict.room?.name || 'Unknown';

        throw new ValidationError(
          `${conflictType} ${conflictName} is already booked from ${conflict.startTime.toLocaleTimeString()} to ${conflict.endTime.toLocaleTimeString()}`
        );
      }
    }
  }

  /**
   * Handle appointment status changes
   */
  private async handleStatusChange(
    appointment: any,
    newStatus: AppointmentStatus,
    oldStatus: string
  ): Promise<void> {
    // Send notifications based on status change
    switch (newStatus) {
      case 'CONFIRMED':
        if (oldStatus === 'SCHEDULED') {
          // Appointment was confirmed, no additional action needed
          // Reminders will continue as scheduled
        }
        break;

      case 'CANCELLED':
        // Cancel all pending reminders
        try {
          await reminderService.cancelAppointmentReminders(appointment.id);
        } catch (error) {
          console.error('Failed to cancel reminders:', error);
        }
        break;

      case 'COMPLETED':
        // Schedule post-care follow-up
        try {
          setTimeout(async () => {
            await communicationService.sendPostCareFollowup(appointment, 'es');
          }, 24 * 60 * 60 * 1000); // 24 hours later
        } catch (error) {
          console.error('Failed to schedule post-care follow-up:', error);
        }
        break;

      case 'NO_SHOW':
        // Cancel reminders and potentially send follow-up
        try {
          await reminderService.cancelAppointmentReminders(appointment.id);
        } catch (error) {
          console.error('Failed to cancel reminders:', error);
        }
        break;
    }
  }

  /**
   * Get upcoming appointments for reminders
   */
  async getUpcomingAppointments(hours: number = 48): Promise<Appointment[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const appointments = await db.appointment.findMany({
        where: {
          startTime: {
            gte: now,
            lte: futureTime
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED']
          }
        },
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          },
          store: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return appointments as Appointment[];
    } catch (error) {
      throw new Error(`Failed to get upcoming appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(storeId: string, startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenue: number;
    averageValue: number;
    completionRate: number;
  }> {
    try {
      const appointments = await db.appointment.findMany({
        where: {
          storeId,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const stats = {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
        noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
        revenue: appointments
          .filter(a => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + a.price, 0),
        averageValue: 0,
        completionRate: 0
      };

      stats.averageValue = stats.completed > 0 ? stats.revenue / stats.completed : 0;
      stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get appointment stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
export default appointmentService;