// Client repository implementation
import type { PrismaClient } from '../generated/client';
import type { 
  Client, 
  ClientWithAppointments,
  PaginationParams, 
  FilterParams, 
  PaginatedResponse 
} from '../types';
import type { CreateClientInput, UpdateClientInput } from '../validation/schemas';
import { StoreBaseRepository } from './base.repository';
import { getPaginationParams } from '../utils';

export class ClientRepository extends StoreBaseRepository<Client, CreateClientInput, UpdateClientInput> {
  constructor(prisma: PrismaClient, storeId: string) {
    super(prisma, 'client', storeId);
  }

  async findById(id: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findFirst({
        where: { 
          id, 
          ...this.getStoreFilter() 
        },
      });
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async findByIdWithAppointments(id: string): Promise<ClientWithAppointments | null> {
    try {
      return await this.prisma.client.findFirst({
        where: { 
          id, 
          ...this.getStoreFilter() 
        },
        include: {
          store: true,
          appointments: {
            include: {
              artist: { include: { user: true } },
              service: true,
              room: true,
            },
            orderBy: { startTime: 'desc' },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'findByIdWithAppointments');
    }
  }

  async findMany(params?: PaginationParams & FilterParams<Client>): Promise<PaginatedResponse<Client>> {
    try {
      const { skip, take, page, limit } = getPaginationParams(params?.page, params?.limit);
      
      const where: any = this.getStoreFilter();
      if (params?.name) {
        where.name = { contains: params.name, mode: 'insensitive' };
      }
      if (params?.email) {
        where.email = { contains: params.email, mode: 'insensitive' };
      }
      if (params?.phone) {
        where.phone = { contains: params.phone };
      }
      if (params?.isMinor !== undefined) {
        where.isMinor = params.isMinor;
      }
      if (params?.source) {
        where.source = { contains: params.source, mode: 'insensitive' };
      }

      const [items, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            store: true,
          },
        }),
        this.prisma.client.count({ where }),
      ]);

      return this.buildPaginatedResponse(items, total, page, limit);
    } catch (error) {
      this.handleError(error, 'findMany');
    }
  }

  async create(data: CreateClientInput): Promise<Client> {
    try {
      return await this.prisma.client.create({
        data: {
          ...data,
          storeId: this.storeId,
          birthDate: data.birthDate || null,
          guardianInfo: data.guardianInfo || null,
          medicalInfo: data.medicalInfo || null,
          source: data.source || null,
        },
      });
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, data: UpdateClientInput): Promise<Client> {
    try {
      return await this.prisma.client.update({
        where: { 
          id,
          storeId: this.storeId,
        },
        data: Object.fromEntries(
          Object.entries({
            ...data,
            birthDate: data.birthDate || null,
            guardianInfo: data.guardianInfo || null,
            medicalInfo: data.medicalInfo || null,
            source: data.source || null,
          }).filter(([_, value]) => value !== undefined)
        ),
      });
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async count(filters?: FilterParams<Client>): Promise<number> {
    try {
      const where: any = this.getStoreFilter();
      if (filters?.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters?.email) {
        where.email = { contains: filters.email, mode: 'insensitive' };
      }
      if (filters?.isMinor !== undefined) {
        where.isMinor = filters.isMinor;
      }

      return await this.prisma.client.count({ where });
    } catch (error) {
      this.handleError(error, 'count');
    }
  }

  async findByEmail(email: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findFirst({
        where: { 
          email: { equals: email },
          ...this.getStoreFilter()
        },
      });
    } catch (error) {
      this.handleError(error, 'findByEmail');
    }
  }

  async findByPhone(phone: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findFirst({
        where: { 
          phone,
          ...this.getStoreFilter()
        },
      });
    } catch (error) {
      this.handleError(error, 'findByPhone');
    }
  }

  async findMinors(): Promise<Client[]> {
    try {
      return await this.prisma.client.findMany({
        where: { 
          isMinor: true,
          ...this.getStoreFilter()
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findMinors');
    }
  }

  async findBirthdaysInRange(startDate: Date, endDate: Date): Promise<Client[]> {
    try {
      return await this.prisma.client.findMany({
        where: {
          ...this.getStoreFilter(),
          birthDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { birthDate: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'findBirthdaysInRange');
    }
  }

  async updateLoyaltyPoints(id: string, points: number): Promise<Client> {
    try {
      return await this.prisma.client.update({
        where: { 
          id,
          storeId: this.storeId,
        },
        data: { loyaltyPoints: points },
      });
    } catch (error) {
      this.handleError(error, 'updateLoyaltyPoints');
    }
  }

  async addLoyaltyPoints(id: string, pointsToAdd: number): Promise<Client> {
    try {
      return await this.prisma.client.update({
        where: { 
          id,
          storeId: this.storeId,
        },
        data: { 
          loyaltyPoints: { increment: pointsToAdd } 
        },
      });
    } catch (error) {
      this.handleError(error, 'addLoyaltyPoints');
    }
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      return await this.prisma.client.findMany({
        where: {
          ...this.getStoreFilter(),
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        take: 20,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'searchClients');
    }
  }
}