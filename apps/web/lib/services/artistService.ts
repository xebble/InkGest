import { db } from '@/lib/db';
import { Artist } from '@/types';
import { ValidationError, NotFoundError } from '@/types';

export interface CreateArtistData {
  storeId: string;
  userId: string;
  specialties: string[];
  schedule: ArtistSchedule;
  commission: number;
  googleCalendarId?: string;
}

export interface UpdateArtistData extends Partial<CreateArtistData> {
  id: string;
}

export interface ArtistSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  startTime?: string; // Format: "HH:mm"
  endTime?: string;   // Format: "HH:mm"
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface ArtistAvailability {
  artistId: string;
  date: Date;
  availableSlots: TimeSlot[];
  bookedSlots: TimeSlot[];
}

export interface ArtistAbsence {
  id: string;
  artistId: string;
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'sick' | 'personal' | 'training';
  reason?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface CreateAbsenceData {
  artistId: string;
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'sick' | 'personal' | 'training';
  reason?: string;
}

export interface ArtistWithUser {
  id: string;
  storeId: string;
  userId: string;
  specialties: string[];
  schedule: ArtistSchedule;
  commission: number;
  googleCalendarId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
    storeIds: string;
    preferences: string;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  store?: {
    id: string;
    companyId: string;
    name: string;
    configuration: string;
    timezone: string;
    businessHours: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

class ArtistService {
  async createArtist(data: CreateArtistData): Promise<Artist> {
    try {
      // Validate that user exists and is not already an artist
      const existingUser = await db.user.findUnique({
        where: { id: data.userId },
        include: { artist: true }
      });

      if (!existingUser) {
        throw new NotFoundError('User');
      }

      if (existingUser.artist) {
        throw new ValidationError('User is already an artist');
      }

      // Validate store exists
      const store = await db.store.findUnique({
        where: { id: data.storeId }
      });

      if (!store) {
        throw new NotFoundError('Store');
      }

      // Validate commission is between 0 and 1
      if (data.commission < 0 || data.commission > 1) {
        throw new ValidationError('Commission must be between 0 and 1');
      }

      // Create artist
      const artist = await db.artist.create({
        data: {
          storeId: data.storeId,
          userId: data.userId,
          specialties: JSON.stringify(data.specialties),
          schedule: JSON.stringify(data.schedule),
          commission: data.commission,
          googleCalendarId: data.googleCalendarId || null,
        },
      });

      return artist;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to create artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateArtist(data: UpdateArtistData): Promise<Artist> {
    try {
      const existingArtist = await db.artist.findUnique({
        where: { id: data.id }
      });

      if (!existingArtist) {
        throw new NotFoundError('Artist');
      }

      // Validate commission if provided
      if (data.commission !== undefined && (data.commission < 0 || data.commission > 1)) {
        throw new ValidationError('Commission must be between 0 and 1');
      }

      const updateData: any = {};
      
      if (data.specialties !== undefined) {
        updateData.specialties = JSON.stringify(data.specialties);
      }
      
      if (data.schedule !== undefined) {
        updateData.schedule = JSON.stringify(data.schedule);
      }
      
      if (data.commission !== undefined) {
        updateData.commission = data.commission;
      }
      
      if (data.googleCalendarId !== undefined) {
        updateData.googleCalendarId = data.googleCalendarId;
      }

      const artist = await db.artist.update({
        where: { id: data.id },
        data: updateData,
      });

      return artist;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getArtistById(id: string): Promise<ArtistWithUser | null> {
    try {
      const artist = await db.artist.findUnique({
        where: { id },
        include: {
          user: true,
          store: true,
        },
      });

      if (!artist) {
        return null;
      }

      return {
        ...artist,
        specialties: JSON.parse(artist.specialties),
        schedule: JSON.parse(artist.schedule),
      } as ArtistWithUser;
    } catch (error) {
      throw new Error(`Failed to get artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getArtistsByStore(storeId: string): Promise<ArtistWithUser[]> {
    try {
      const artists = await db.artist.findMany({
        where: { storeId },
        include: {
          user: true,
          store: true,
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      });

      return artists.map(artist => ({
        ...artist,
        specialties: JSON.parse(artist.specialties),
        schedule: JSON.parse(artist.schedule),
      })) as ArtistWithUser[];
    } catch (error) {
      throw new Error(`Failed to get artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteArtist(id: string): Promise<void> {
    try {
      const artist = await db.artist.findUnique({
        where: { id },
        include: {
          appointments: {
            where: {
              status: {
                in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
              }
            }
          }
        }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      // Check if artist has active appointments
      if (artist.appointments.length > 0) {
        throw new ValidationError('Cannot delete artist with active appointments');
      }

      await db.artist.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to delete artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getArtistAvailability(artistId: string, date: Date): Promise<ArtistAvailability> {
    try {
      const artist = await this.getArtistById(artistId);
      if (!artist) {
        throw new NotFoundError('Artist');
      }

      const schedule = typeof artist.schedule === 'string' 
        ? JSON.parse(artist.schedule) as ArtistSchedule 
        : artist.schedule as ArtistSchedule;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof ArtistSchedule;
      const daySchedule = schedule[dayName];

      if (!daySchedule.isWorking) {
        return {
          artistId,
          date,
          availableSlots: [],
          bookedSlots: []
        };
      }

      // Get booked appointments for the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await db.appointment.findMany({
        where: {
          artistId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      const bookedSlots: TimeSlot[] = appointments.map(apt => ({
        startTime: apt.startTime.toTimeString().slice(0, 5),
        endTime: apt.endTime.toTimeString().slice(0, 5)
      }));

      // Calculate available slots (simplified - would need more complex logic for real implementation)
      const availableSlots: TimeSlot[] = [];
      if (daySchedule.startTime && daySchedule.endTime) {
        // This is a simplified version - in reality, you'd need to calculate
        // available slots by subtracting booked slots and breaks
        availableSlots.push({
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime
        });
      }

      return {
        artistId,
        date,
        availableSlots,
        bookedSlots
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get artist availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createAbsence(data: CreateAbsenceData): Promise<ArtistAbsence> {
    try {
      // Validate artist exists
      const artist = await this.getArtistById(data.artistId);
      if (!artist) {
        throw new NotFoundError('Artist');
      }

      // Validate dates
      if (data.startDate >= data.endDate) {
        throw new ValidationError('End date must be after start date');
      }

      // For now, we'll store absences in a simple way
      // In a real implementation, you might want a separate absences table
      const absence: ArtistAbsence = {
        id: `absence_${Date.now()}`,
        artistId: data.artistId,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        ...(data.reason && { reason: data.reason }),
        approved: false
      };

      // This would typically be stored in a database table
      // For now, we'll return the created absence object
      return absence;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to create absence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getArtistSpecialties(): Promise<string[]> {
    // Return common specialties - in a real app, this might come from a database
    return [
      'Traditional Tattoo',
      'Realistic Tattoo',
      'Watercolor Tattoo',
      'Geometric Tattoo',
      'Blackwork',
      'Fine Line',
      'Japanese Tattoo',
      'Tribal Tattoo',
      'Portrait Tattoo',
      'Ear Piercing',
      'Nose Piercing',
      'Lip Piercing',
      'Eyebrow Piercing',
      'Body Piercing',
      'Microblading',
      'Laser Removal',
      'Permanent Makeup'
    ];
  }
}

export const artistService = new ArtistService();