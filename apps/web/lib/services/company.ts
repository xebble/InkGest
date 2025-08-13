import { db } from '../db';
import { Company, Store } from '../../types';
import { NotFoundError, ValidationError } from '../../types';

export interface CreateCompanyData {
  name: string;
  settings?: Record<string, any>;
  subscription?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {}

export interface CompanyWithStores extends Company {
  stores: Store[];
  _count: {
    users: number;
    stores: number;
  };
}

export class CompanyService {
  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyData): Promise<Company> {
    if (!data.name?.trim()) {
      throw new ValidationError('Company name is required');
    }

    try {
      const company = await db.company.create({
        data: {
          name: data.name.trim(),
          settings: JSON.stringify(data.settings || {}),
          subscription: data.subscription || 'basic',
        },
      });

      return company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company');
    }
  }

  /**
   * Get company by ID with stores and user count
   */
  async getCompanyById(id: string): Promise<CompanyWithStores> {
    const company = await db.company.findUnique({
      where: { id },
      include: {
        stores: true,
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    return {
      ...company,
      settings: JSON.parse(company.settings),
    } as CompanyWithStores;
  }

  /**
   * Get all companies (admin only)
   */
  async getAllCompanies(): Promise<CompanyWithStores[]> {
    const companies = await db.company.findMany({
      include: {
        stores: true,
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return companies.map(company => ({
      ...company,
      settings: JSON.parse(company.settings),
    })) as CompanyWithStores[];
  }

  /**
   * Update company
   */
  async updateCompany(id: string, data: UpdateCompanyData): Promise<Company> {
    const existingCompany = await db.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new NotFoundError('Company');
    }

    if (data.name && !data.name.trim()) {
      throw new ValidationError('Company name cannot be empty');
    }

    try {
      const updateData: any = {};
      
      if (data.name) {
        updateData.name = data.name.trim();
      }
      
      if (data.settings) {
        updateData.settings = JSON.stringify(data.settings);
      }
      
      if (data.subscription) {
        updateData.subscription = data.subscription;
      }

      const company = await db.company.update({
        where: { id },
        data: updateData,
      });

      return {
        ...company,
        settings: JSON.parse(company.settings),
      } as Company;
    } catch (error) {
      console.error('Error updating company:', error);
      throw new Error('Failed to update company');
    }
  }

  /**
   * Delete company (admin only)
   */
  async deleteCompany(id: string): Promise<void> {
    const existingCompany = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
    });

    if (!existingCompany) {
      throw new NotFoundError('Company');
    }

    if (existingCompany._count.users > 0 || existingCompany._count.stores > 0) {
      throw new ValidationError('Cannot delete company with existing users or stores');
    }

    try {
      await db.company.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      throw new Error('Failed to delete company');
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(id: string): Promise<{
    totalUsers: number;
    totalStores: number;
    totalClients: number;
    totalAppointments: number;
    monthlyRevenue: number;
  }> {
    const company = await db.company.findUnique({
      where: { id },
      include: {
        stores: {
          include: {
            _count: {
              select: {
                clients: true,
                appointments: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    const totalClients = company.stores.reduce(
      (sum, store) => sum + store._count.clients,
      0
    );

    const totalAppointments = company.stores.reduce(
      (sum, store) => sum + store._count.appointments,
      0
    );

    // Calculate monthly revenue (this is a simplified calculation)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyAppointments = await db.appointment.findMany({
      where: {
        store: {
          companyId: id,
        },
        createdAt: {
          gte: currentMonth,
        },
        status: 'COMPLETED',
      },
      select: {
        price: true,
      },
    });

    const monthlyRevenue = monthlyAppointments.reduce(
      (sum, appointment) => sum + appointment.price,
      0
    );

    return {
      totalUsers: company._count.users,
      totalStores: company.stores.length,
      totalClients,
      totalAppointments,
      monthlyRevenue,
    };
  }
}