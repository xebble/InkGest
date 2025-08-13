// Service factory and exports
import type { PrismaClient } from '../generated/client';
import { CompanyRepository } from './company.repository';
import { StoreRepository } from './store.repository';
import { ClientRepository } from './client.repository';
import { AppointmentRepository } from './appointment.repository';

// Export all repository classes
export { CompanyRepository } from './company.repository';
export { StoreRepository } from './store.repository';
export { ClientRepository } from './client.repository';
export { AppointmentRepository } from './appointment.repository';
export { BaseRepositoryImpl, StoreBaseRepository, CompanyBaseRepository } from './base.repository';

// Service factory for creating repository instances
export class ServiceFactory {
  constructor(private prisma: PrismaClient) {}

  // Company-scoped services
  createCompanyRepository(): CompanyRepository {
    return new CompanyRepository(this.prisma);
  }

  createStoreRepository(companyId: string): StoreRepository {
    return new StoreRepository(this.prisma, companyId);
  }

  // Store-scoped services
  createClientRepository(storeId: string): ClientRepository {
    return new ClientRepository(this.prisma, storeId);
  }

  createAppointmentRepository(storeId: string): AppointmentRepository {
    return new AppointmentRepository(this.prisma, storeId);
  }

  // Convenience method to create all store-scoped services at once
  createStoreServices(storeId: string) {
    return {
      clients: this.createClientRepository(storeId),
      appointments: this.createAppointmentRepository(storeId),
    };
  }

  // Convenience method to create all company-scoped services at once
  createCompanyServices(companyId: string) {
    return {
      companies: this.createCompanyRepository(),
      stores: this.createStoreRepository(companyId),
    };
  }

  // Create all services for a specific context
  createAllServices(companyId: string, storeId: string) {
    return {
      ...this.createCompanyServices(companyId),
      ...this.createStoreServices(storeId),
    };
  }
}

// Singleton service factory
let serviceFactory: ServiceFactory;

export const createServiceFactory = (prisma: PrismaClient): ServiceFactory => {
  if (!serviceFactory) {
    serviceFactory = new ServiceFactory(prisma);
  }
  return serviceFactory;
};

export const getServiceFactory = (): ServiceFactory => {
  if (!serviceFactory) {
    throw new Error('Service factory not initialized. Call createServiceFactory first.');
  }
  return serviceFactory;
};