// Store repository implementation
import type { PrismaClient } from '../generated/client';
import type { 
  Store, 
  StoreWithRelations,
  PaginationParams, 
  FilterParams, 
  PaginatedResponse 
} from '../types';
import type { CreateStoreInput, UpdateStoreInput } from '../validation/schemas';
import { CompanyBaseRepository } from './base.repository';
import { getPaginationParams } from '../utils';

export class StoreRepository extends CompanyBaseRepository<Store, CreateStoreInput, UpdateStoreInput> {
  constructor(prisma: PrismaClient, companyId: string) {
    super(prisma, 'store', companyId);
  }

  async findById(id: string): Promise<Store | null> {
    try {
      return await this.prisma.store.findFirst({
        where: { 
          id, 
          ...this.getCompanyFilter() 
        },
      });
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async findByIdWithRelations(id: string): Promise<StoreWithRelations | null> {
    try {
      return await this.prisma.store.findFirst({
        where: { 
          id, 
          ...this.getCompanyFilter() 
        },
        include: {
          company: true,
          appointments: {
            take: 10,
            orderBy: { startTime: 'desc' },
          },
          clients: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          artists: {
            include: { user: true },
          },
          services: true,
          products: true,
          rooms: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'findByIdWithRelations');
    }
  }

  async findMany(params?: PaginationParams & FilterParams<Store>): Promise<PaginatedResponse<Store>> {
    try {
      const { skip, take, page, limit } = getPaginationParams(params?.page, params?.limit);
      
      const where: any = this.getCompanyFilter();
      if (params?.name) {
        where.name = { contains: params.name, mode: 'insensitive' };
      }
      if (params?.timezone) {
        where.timezone = params.timezone;
      }

      const [items, total] = await Promise.all([
        this.prisma.store.findMany({
          where,
          skip,
          take,
          orderBy: { name: 'asc' },
          include: {
            company: true,
          },
        }),
        this.prisma.store.count({ where }),
      ]);

      return this.buildPaginatedResponse(items, total, page, limit);
    } catch (error) {
      this.handleError(error, 'findMany');
    }
  }

  async create(data: CreateStoreInput): Promise<Store> {
    try {
      return await this.prisma.store.create({
        data: {
          ...data,
          companyId: this.companyId,
        },
      });
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, data: UpdateStoreInput): Promise<Store> {
    try {
      return await this.prisma.store.update({
        where: { 
          id,
          companyId: this.companyId,
        },
        data: Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        ),
      });
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async count(filters?: FilterParams<Store>): Promise<number> {
    try {
      const where: any = this.getCompanyFilter();
      if (filters?.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters?.timezone) {
        where.timezone = filters.timezone;
      }

      return await this.prisma.store.count({ where });
    } catch (error) {
      this.handleError(error, 'count');
    }
  }

  async findByName(name: string): Promise<Store | null> {
    try {
      return await this.prisma.store.findFirst({
        where: { 
          name: { equals: name },
          ...this.getCompanyFilter()
        },
      });
    } catch (error) {
      this.handleError(error, 'findByName');
    }
  }

  async updateConfiguration(id: string, configuration: string): Promise<Store> {
    try {
      return await this.prisma.store.update({
        where: { 
          id,
          companyId: this.companyId,
        },
        data: { configuration },
      });
    } catch (error) {
      this.handleError(error, 'updateConfiguration');
    }
  }

  async updateBusinessHours(id: string, businessHours: string): Promise<Store> {
    try {
      return await this.prisma.store.update({
        where: { 
          id,
          companyId: this.companyId,
        },
        data: { businessHours },
      });
    } catch (error) {
      this.handleError(error, 'updateBusinessHours');
    }
  }
}