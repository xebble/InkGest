import { db } from '../db';
import { Store } from '../../types';
import { NotFoundError, ValidationError } from '../../types';

export interface CreateStoreData {
  companyId: string;
  name: string;
  configuration?: Record<string, any>;
  timezone?: string;
  businessHours: Record<string, any>;
}

export interface UpdateStoreData extends Partial<Omit<CreateStoreData, 'companyId'>> {}

export interface StoreWithCounts extends Store {
  _count: {
    clients: number;
    artists: number;
    appointments: number;
    services: number;
    products: number;
  };
}

export class StoreService {
  /**
   * Create a new store
   */
  async createStore(data: CreateStoreData): Promise<Store> {
    if (!data.name?.trim()) {
      throw new ValidationError('Store name is required');
    }

    if (!data.companyId) {
      throw new ValidationError('Company ID is required');
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    try {
      const store = await db.store.create({
        data: {
          companyId: data.companyId,
          name: data.name.trim(),
          configuration: JSON.stringify(data.configuration || {}),
          timezone: data.timezone || 'Europe/Madrid',
          businessHours: JSON.stringify(data.businessHours),
        },
      });

      return {
        ...store,
        configuration: JSON.parse(store.configuration),
        businessHours: JSON.parse(store.businessHours),
      } as Store;
    } catch (error) {
      console.error('Error creating store:', error);
      throw new Error('Failed to create store');
    }
  }

  /**
   * Get store by ID with counts
   */
  async getStoreById(id: string): Promise<StoreWithCounts> {
    const store = await db.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: true,
            artists: true,
            appointments: true,
            services: true,
            products: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store');
    }

    return {
      ...store,
      configuration: JSON.parse(store.configuration),
      businessHours: JSON.parse(store.businessHours),
    } as StoreWithCounts;
  }

  /**
   * Get stores by company ID
   */
  async getStoresByCompanyId(companyId: string): Promise<StoreWithCounts[]> {
    const stores = await db.store.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            clients: true,
            artists: true,
            appointments: true,
            services: true,
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return stores.map(store => ({
      ...store,
      configuration: JSON.parse(store.configuration),
      businessHours: JSON.parse(store.businessHours),
    })) as StoreWithCounts[];
  }

  /**
   * Get stores accessible by user
   */
  async getAccessibleStores(userStoreIds: string[]): Promise<StoreWithCounts[]> {
    if (userStoreIds.length === 0) {
      return [];
    }

    const stores = await db.store.findMany({
      where: {
        id: {
          in: userStoreIds,
        },
      },
      include: {
        _count: {
          select: {
            clients: true,
            artists: true,
            appointments: true,
            services: true,
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return stores.map(store => ({
      ...store,
      configuration: JSON.parse(store.configuration),
      businessHours: JSON.parse(store.businessHours),
    })) as StoreWithCounts[];
  }

  /**
   * Update store
   */
  async updateStore(id: string, data: UpdateStoreData): Promise<Store> {
    const existingStore = await db.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      throw new NotFoundError('Store');
    }

    if (data.name && !data.name.trim()) {
      throw new ValidationError('Store name cannot be empty');
    }

    try {
      const updateData: any = {};
      
      if (data.name) {
        updateData.name = data.name.trim();
      }
      
      if (data.configuration) {
        updateData.configuration = JSON.stringify(data.configuration);
      }
      
      if (data.timezone) {
        updateData.timezone = data.timezone;
      }
      
      if (data.businessHours) {
        updateData.businessHours = JSON.stringify(data.businessHours);
      }

      const store = await db.store.update({
        where: { id },
        data: updateData,
      });

      return {
        ...store,
        configuration: JSON.parse(store.configuration),
        businessHours: JSON.parse(store.businessHours),
      } as Store;
    } catch (error) {
      console.error('Error updating store:', error);
      throw new Error('Failed to update store');
    }
  }

  /**
   * Delete store
   */
  async deleteStore(id: string): Promise<void> {
    const existingStore = await db.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: true,
            artists: true,
            appointments: true,
          },
        },
      },
    });

    if (!existingStore) {
      throw new NotFoundError('Store');
    }

    if (
      existingStore._count.clients > 0 ||
      existingStore._count.artists > 0 ||
      existingStore._count.appointments > 0
    ) {
      throw new ValidationError('Cannot delete store with existing data');
    }

    try {
      await db.store.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting store:', error);
      throw new Error('Failed to delete store');
    }
  }

  /**
   * Get store statistics
   */
  async getStoreStats(id: string): Promise<{
    totalClients: number;
    totalArtists: number;
    totalAppointments: number;
    completedAppointments: number;
    monthlyRevenue: number;
    averageAppointmentValue: number;
  }> {
    const store = await db.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: true,
            artists: true,
            appointments: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store');
    }

    // Get completed appointments count
    const completedAppointments = await db.appointment.count({
      where: {
        storeId: id,
        status: 'COMPLETED',
      },
    });

    // Calculate monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyAppointments = await db.appointment.findMany({
      where: {
        storeId: id,
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

    // Calculate average appointment value
    const allCompletedAppointments = await db.appointment.findMany({
      where: {
        storeId: id,
        status: 'COMPLETED',
      },
      select: {
        price: true,
      },
    });

    const totalRevenue = allCompletedAppointments.reduce(
      (sum, appointment) => sum + appointment.price,
      0
    );

    const averageAppointmentValue = 
      allCompletedAppointments.length > 0 
        ? totalRevenue / allCompletedAppointments.length 
        : 0;

    return {
      totalClients: store._count.clients,
      totalArtists: store._count.artists,
      totalAppointments: store._count.appointments,
      completedAppointments,
      monthlyRevenue,
      averageAppointmentValue,
    };
  }
}