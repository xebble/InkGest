// Appointment repository implementation
import type { PrismaClient } from '../generated/client';
import type { 
  Appointment, 
  AppointmentWithRelations,
  AppointmentStatus,
  PaginationParams, 
  FilterParams, 
  PaginatedResponse 
} from '../types';
import type { CreateAppointmentInput, UpdateAppointmentInput } from '../validation/schemas';
import { StoreBaseRepository } from './base.repository';
import { getPaginationParams } from '../utils';

export class AppointmentRepository extends StoreBaseRepository<Appointment, CreateAppointmentInput, UpdateAppointmentInput> {
  constructor(prisma: PrismaClient, storeId: string) {
    super(prisma, 'appointment', storeId);
  }

  async findById(id: string): Promise<Appointment | null> {
    try {
      return await this.prisma.appointment.findFirst({
        where: { 
          id, 
          ...this.getStoreFilter() 
        },
      });
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null> {
    try {
      const result = await this.prisma.appointment.findFirst({
        where: { 
          id, 
          ...this.getStoreFilter() 
        },
        include: {
          store: true,
          client: true,
          artist: { include: { user: true } },
          service: true,
          room: true,
          payments: true,
          documents: true,
        },
      });
      return result as AppointmentWithRelations | null;
    } catch (error) {
      this.handleError(error, 'findByIdWithRelations');
    }
  }

  async findMany(params?: PaginationParams & FilterParams<Appointment>): Promise<PaginatedResponse<Appointment>> {
    try {
      const { skip, take, page, limit } = getPaginationParams(params?.page, params?.limit);
      
      const where: any = this.getStoreFilter();
      if (params?.clientId) {
        where.clientId = params.clientId;
      }
      if (params?.artistId) {
        where.artistId = params.artistId;
      }
      if (params?.serviceId) {
        where.serviceId = params.serviceId;
      }
      if (params?.status) {
        where.status = params.status;
      }
      if (params?.startTime) {
        where.startTime = { gte: params.startTime };
      }
      if (params?.endTime) {
        where.endTime = { lte: params.endTime };
      }

      const [items, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          skip,
          take,
          orderBy: { startTime: 'asc' },
          include: {
            client: true,
            artist: { include: { user: true } },
            service: true,
            room: true,
          },
        }),
        this.prisma.appointment.count({ where }),
      ]);

      return this.buildPaginatedResponse(items, total, page, limit);
    } catch (error) {
      this.handleError(error, 'findMany');
    }
  }

  async create(data: CreateAppointmentInput): Promise<Appointment> {
    try {
      return await this.prisma.appointment.create({
        data: {
          ...data,
          storeId: this.storeId,
          roomId: data.roomId || null,
          notes: data.notes || null,
          deposit: data.deposit || null,
          googleEventId: data.googleEventId || null,
        },
      });
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
    try {
      return await this.prisma.appointment.update({
        where: { 
          id,
          storeId: this.storeId,
        },
        data: Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        ),
      });
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async count(filters?: FilterParams<Appointment>): Promise<number> {
    try {
      const where: any = this.getStoreFilter();
      if (filters?.clientId) {
        where.clientId = filters.clientId;
      }
      if (filters?.artistId) {
        where.artistId = filters.artistId;
      }
      if (filters?.status) {
        where.status = filters.status;
      }

      return await this.prisma.appointment.count({ where });
    } catch (error) {
      this.handleError(error, 'count');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    try {
      return await this.prisma.appointment.findMany({
        where: {
          ...this.getStoreFilter(),
          startTime: { gte: startDate },
          endTime: { lte: endDate },
        },
        include: {
          client: true,
          artist: { include: { user: true } },
          service: true,
          room: true,
        },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findByDateRange');
    }
  }

  async findByArtistAndDate(artistId: string, date: Date): Promise<Appointment[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.prisma.appointment.findMany({
        where: {
          ...this.getStoreFilter(),
          artistId,
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay },
        },
        include: {
          client: true,
          service: true,
          room: true,
        },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findByArtistAndDate');
    }
  }

  async findByClientId(clientId: string): Promise<Appointment[]> {
    try {
      return await this.prisma.appointment.findMany({
        where: {
          ...this.getStoreFilter(),
          clientId,
        },
        include: {
          artist: { include: { user: true } },
          service: true,
          room: true,
        },
        orderBy: { startTime: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'findByClientId');
    }
  }

  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    try {
      return await this.prisma.appointment.findMany({
        where: {
          ...this.getStoreFilter(),
          status,
        },
        include: {
          client: true,
          artist: { include: { user: true } },
          service: true,
          room: true,
        },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findByStatus');
    }
  }

  async findUpcomingAppointments(hours: number = 24): Promise<Appointment[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      return await this.prisma.appointment.findMany({
        where: {
          ...this.getStoreFilter(),
          startTime: {
            gte: now,
            lte: futureTime,
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          client: true,
          artist: { include: { user: true } },
          service: true,
        },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findUpcomingAppointments');
    }
  }

  async findConflictingAppointments(
    artistId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<Appointment[]> {
    try {
      const where: any = {
        ...this.getStoreFilter(),
        artistId,
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      return await this.prisma.appointment.findMany({
        where,
        include: {
          client: true,
          service: true,
        },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findConflictingAppointments');
    }
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    try {
      return await this.prisma.appointment.update({
        where: { 
          id,
          storeId: this.storeId,
        },
        data: { status },
      });
    } catch (error) {
      this.handleError(error, 'updateStatus');
    }
  }

  async updateGoogleEventId(id: string, googleEventId: string): Promise<Appointment> {
    try {
      return await this.prisma.appointment.update({
        where: { 
          id,
          storeId: this.storeId,
        },
        data: { googleEventId },
      });
    } catch (error) {
      this.handleError(error, 'updateGoogleEventId');
    }
  }

  async findByGoogleEventId(googleEventId: string): Promise<Appointment | null> {
    try {
      return await this.prisma.appointment.findFirst({
        where: {
          ...this.getStoreFilter(),
          googleEventId,
        },
      });
    } catch (error) {
      this.handleError(error, 'findByGoogleEventId');
    }
  }
}