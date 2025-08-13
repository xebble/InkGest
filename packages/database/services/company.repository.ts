// Company repository implementation
import type { PrismaClient } from '../generated/client';
import type { 
  Company, 
  CompanyWithStores,
  PaginationParams, 
  FilterParams, 
  PaginatedResponse 
} from '../types';
import type { CreateCompanyInput, UpdateCompanyInput } from '../validation/schemas';
import { BaseRepositoryImpl } from './base.repository';
import { getPaginationParams } from '../utils';

export class CompanyRepository extends BaseRepositoryImpl<Company, CreateCompanyInput, UpdateCompanyInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'company');
  }

  async findById(id: string): Promise<Company | null> {
    try {
      return await this.prisma.company.findUnique({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async findByIdWithStores(id: string): Promise<CompanyWithStores | null> {
    try {
      return await this.prisma.company.findUnique({
        where: { id },
        include: {
          stores: true,
          users: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'findByIdWithStores');
    }
  }

  async findMany(params?: PaginationParams & FilterParams<Company>): Promise<PaginatedResponse<Company>> {
    try {
      const { skip, take, page, limit } = getPaginationParams(params?.page, params?.limit);
      
      const where: any = {};
      if (params?.name) {
        where.name = { contains: params.name, mode: 'insensitive' };
      }
      if (params?.subscription) {
        where.subscription = params.subscription;
      }

      const [items, total] = await Promise.all([
        this.prisma.company.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.company.count({ where }),
      ]);

      return this.buildPaginatedResponse(items, total, page, limit);
    } catch (error) {
      this.handleError(error, 'findMany');
    }
  }

  async create(data: CreateCompanyInput): Promise<Company> {
    try {
      return await this.prisma.company.create({
        data,
      });
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, data: UpdateCompanyInput): Promise<Company> {
    try {
      return await this.prisma.company.update({
        where: { id },
        data: Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        ),
      });
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async count(filters?: FilterParams<Company>): Promise<number> {
    try {
      const where: any = {};
      if (filters?.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters?.subscription) {
        where.subscription = filters.subscription;
      }

      return await this.prisma.company.count({ where });
    } catch (error) {
      this.handleError(error, 'count');
    }
  }

  async findByName(name: string): Promise<Company | null> {
    try {
      return await this.prisma.company.findFirst({
        where: { name: { equals: name } },
      });
    } catch (error) {
      this.handleError(error, 'findByName');
    }
  }

  async updateSubscription(id: string, subscription: string): Promise<Company> {
    try {
      return await this.prisma.company.update({
        where: { id },
        data: { subscription },
      });
    } catch (error) {
      this.handleError(error, 'updateSubscription');
    }
  }
}