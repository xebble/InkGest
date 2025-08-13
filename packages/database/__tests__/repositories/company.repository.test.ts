// Company repository tests
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '../../generated/client';
import { CompanyRepository } from '../../services/company.repository';
import type { CreateCompanyInput, UpdateCompanyInput } from '../../validation/schemas';

describe('CompanyRepository', () => {
  let prisma: PrismaClient;
  let repository: CompanyRepository;
  let testCompanyId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    repository = new CompanyRepository(prisma);
    
    // Create a test company
    const testCompany = await repository.create({
      name: 'Test Company',
      settings: '{"currency": "EUR"}',
      subscription: 'basic',
    });
    testCompanyId = testCompany.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testCompanyId) {
      await prisma.company.delete({ where: { id: testCompanyId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const companyData: CreateCompanyInput = {
        name: 'New Test Company',
        settings: '{"currency": "USD"}',
        subscription: 'premium',
      };

      const company = await repository.create(companyData);

      expect(company).toBeDefined();
      expect(company.name).toBe(companyData.name);
      expect(company.settings).toBe(companyData.settings);
      expect(company.subscription).toBe(companyData.subscription);
      expect(company.id).toBeDefined();
      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();

      // Clean up
      await prisma.company.delete({ where: { id: company.id } });
    });

    it('should create a company with default values', async () => {
      const companyData: CreateCompanyInput = {
        name: 'Minimal Company',
        settings: '{}',
        subscription: 'basic',
      };

      const company = await repository.create(companyData);

      expect(company.name).toBe(companyData.name);
      expect(company.subscription).toBe('basic');

      // Clean up
      await prisma.company.delete({ where: { id: company.id } });
    });
  });

  describe('findById', () => {
    it('should find a company by id', async () => {
      const company = await repository.findById(testCompanyId);

      expect(company).toBeDefined();
      expect(company?.id).toBe(testCompanyId);
      expect(company?.name).toBe('Test Company');
    });

    it('should return null for non-existent id', async () => {
      const company = await repository.findById('non-existent-id');
      expect(company).toBeNull();
    });
  });

  describe('findByIdWithStores', () => {
    it('should find a company with its stores', async () => {
      const company = await repository.findByIdWithStores(testCompanyId);

      expect(company).toBeDefined();
      expect(company?.id).toBe(testCompanyId);
      expect(company?.stores).toBeDefined();
      expect(company?.users).toBeDefined();
      expect(Array.isArray(company?.stores)).toBe(true);
      expect(Array.isArray(company?.users)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const updateData: UpdateCompanyInput = {
        name: 'Updated Test Company',
        subscription: 'premium',
      };

      const updatedCompany = await repository.update(testCompanyId, updateData);

      expect(updatedCompany.name).toBe(updateData.name);
      expect(updatedCompany.subscription).toBe(updateData.subscription);
      expect(updatedCompany.id).toBe(testCompanyId);
    });

    it('should update only provided fields', async () => {
      const originalCompany = await repository.findById(testCompanyId);
      const updateData: UpdateCompanyInput = {
        name: 'Partially Updated Company',
      };

      const updatedCompany = await repository.update(testCompanyId, updateData);

      expect(updatedCompany.name).toBe(updateData.name);
      expect(updatedCompany.subscription).toBe(originalCompany?.subscription);
    });
  });

  describe('findMany', () => {
    it('should find companies with pagination', async () => {
      const result = await repository.findMany({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data.items).toBeDefined();
      expect(result.data.pagination).toBeDefined();
      expect(Array.isArray(result.data.items)).toBe(true);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(10);
    });

    it('should filter companies by name', async () => {
      const result = await repository.findMany({ name: 'Test Company' });

      expect(result.success).toBe(true);
      expect(result.data.items.length).toBeGreaterThan(0);
      expect(result.data.items[0]?.name).toContain('Test Company');
    });
  });

  describe('findByName', () => {
    it('should find a company by name', async () => {
      const company = await repository.findByName('Test Company');

      expect(company).toBeDefined();
      expect(company?.name).toBe('Test Company');
    });

    it('should return null for non-existent name', async () => {
      const company = await repository.findByName('Non-existent Company');
      expect(company).toBeNull();
    });
  });

  describe('count', () => {
    it('should count all companies', async () => {
      const count = await repository.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should count companies with filters', async () => {
      const count = await repository.count({ subscription: 'basic' });
      expect(typeof count).toBe('number');
    });
  });

  describe('delete', () => {
    it('should delete a company', async () => {
      // Create a company to delete
      const companyToDelete = await repository.create({
        name: 'Company to Delete',
        settings: '{}',
        subscription: 'basic',
      });

      await repository.delete(companyToDelete.id);

      const deletedCompany = await repository.findById(companyToDelete.id);
      expect(deletedCompany).toBeNull();
    });
  });

  describe('updateSubscription', () => {
    it('should update company subscription', async () => {
      const updatedCompany = await repository.updateSubscription(testCompanyId, 'premium');

      expect(updatedCompany.subscription).toBe('premium');
      expect(updatedCompany.id).toBe(testCompanyId);
    });
  });
});