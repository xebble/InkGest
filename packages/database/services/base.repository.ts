// Base repository interface and implementation
import type { PrismaClient } from '../generated/client';
import type { PaginationParams, FilterParams, PaginatedResponse } from '../types';
import { calculatePaginationMeta, handlePrismaError } from '../utils';

export interface BaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findMany(params?: PaginationParams & FilterParams<T>): Promise<PaginatedResponse<T>>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(filters?: FilterParams<T>): Promise<number>;
}

export abstract class BaseRepositoryImpl<T, CreateInput, UpdateInput> 
  implements BaseRepository<T, CreateInput, UpdateInput> {
  
  constructor(
    protected prisma: PrismaClient,
    protected modelName: string
  ) {}

  abstract findById(id: string): Promise<T | null>;
  abstract findMany(params?: PaginationParams & FilterParams<T>): Promise<PaginatedResponse<T>>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract count(filters?: FilterParams<T>): Promise<number>;

  async delete(id: string): Promise<void> {
    try {
      const model = (this.prisma as any)[this.modelName];
      await model.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  protected buildPaginatedResponse<U>(
    items: U[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<U> {
    return {
      success: true,
      data: {
        items,
        pagination: calculatePaginationMeta(total, page, limit),
      },
    };
  }

  protected handleError(error: any, operation: string): never {
    console.error(`Error in ${this.modelName} ${operation}:`, error);
    return handlePrismaError(error);
  }
}

// Multi-tenant base repository for store-scoped entities
export abstract class StoreBaseRepository<T, CreateInput, UpdateInput> 
  extends BaseRepositoryImpl<T, CreateInput, UpdateInput> {
  
  constructor(
    prisma: PrismaClient,
    modelName: string,
    protected storeId: string
  ) {
    super(prisma, modelName);
  }

  protected getStoreFilter() {
    return { storeId: this.storeId };
  }
}

// Multi-tenant base repository for company-scoped entities
export abstract class CompanyBaseRepository<T, CreateInput, UpdateInput> 
  extends BaseRepositoryImpl<T, CreateInput, UpdateInput> {
  
  constructor(
    prisma: PrismaClient,
    modelName: string,
    protected companyId: string
  ) {
    super(prisma, modelName);
  }

  protected getCompanyFilter() {
    return { companyId: this.companyId };
  }
}