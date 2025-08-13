import { db } from '@/lib/db';
import { 
  CommissionCalculation, 
  CommissionBreakdown, 
  ArtistPerformanceReport, 
  StorePerformanceReport,
  ArtistPerformanceSummary,
  ServicePerformance,
  MonthlyTrend
} from '@/types';
import { NotFoundError } from '@/types';

class CommissionService {
  /**
   * Calculate commission for an artist for a specific period
   */
  async calculateCommission(
    artistId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<CommissionCalculation> {
    try {
      // Verify artist exists
      const artist = await db.artist.findUnique({
        where: { id: artistId },
        include: { user: true }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      // Get completed appointments in the period
      const appointments = await db.appointment.findMany({
        where: {
          artistId,
          status: 'COMPLETED',
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          client: true,
          service: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Calculate totals
      const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);
      const commissionAmount = totalRevenue * artist.commission;
      const averageServicePrice = appointments.length > 0 ? totalRevenue / appointments.length : 0;

      // Create breakdown
      const breakdown: CommissionBreakdown[] = appointments.map(apt => ({
        appointmentId: apt.id,
        clientName: apt.client.name,
        serviceName: apt.service.name,
        appointmentDate: apt.startTime,
        servicePrice: apt.price,
        commissionRate: artist.commission,
        commissionAmount: apt.price * artist.commission
      }));

      return {
        artistId,
        period: { startDate, endDate },
        totalRevenue,
        commissionRate: artist.commission,
        commissionAmount,
        appointmentCount: appointments.length,
        averageServicePrice,
        breakdown
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to calculate commission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate performance report for an artist
   */
  async generateArtistPerformanceReport(
    artistId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ArtistPerformanceReport> {
    try {
      // Verify artist exists
      const artist = await db.artist.findUnique({
        where: { id: artistId },
        include: { user: true }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      // Get all appointments in the period
      const appointments = await db.appointment.findMany({
        where: {
          artistId,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          client: true,
          service: true
        }
      });

      // Calculate metrics
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED').length;
      const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED').length;
      const noShowAppointments = appointments.filter(apt => apt.status === 'NO_SHOW').length;
      
      const completedRevenue = appointments
        .filter(apt => apt.status === 'COMPLETED')
        .reduce((sum, apt) => sum + apt.price, 0);
      
      const averageServicePrice = completedAppointments > 0 ? completedRevenue / completedAppointments : 0;
      const commissionEarned = completedRevenue * artist.commission;

      // Calculate client retention rate (simplified)
      const uniqueClients = new Set(appointments.map(apt => apt.clientId));
      const returningClients = new Set();
      
      for (const clientId of uniqueClients) {
        const clientAppointments = appointments.filter(apt => apt.clientId === clientId);
        if (clientAppointments.length > 1) {
          returningClients.add(clientId);
        }
      }
      
      const clientRetentionRate = uniqueClients.size > 0 ? 
        (returningClients.size / uniqueClients.size) * 100 : 0;

      // Get top services
      const serviceStats = new Map<string, { count: number; revenue: number; name: string }>();
      
      appointments
        .filter(apt => apt.status === 'COMPLETED')
        .forEach(apt => {
          const existing = serviceStats.get(apt.serviceId) || { count: 0, revenue: 0, name: apt.service.name };
          existing.count += 1;
          existing.revenue += apt.price;
          serviceStats.set(apt.serviceId, existing);
        });

      const topServices: ServicePerformance[] = Array.from(serviceStats.entries())
        .map(([serviceId, stats]) => ({
          serviceId,
          serviceName: stats.name,
          appointmentCount: stats.count,
          totalRevenue: stats.revenue,
          averagePrice: stats.count > 0 ? stats.revenue / stats.count : 0
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      // Generate monthly trends
      const monthlyStats = new Map<string, { appointments: number; revenue: number }>();
      
      appointments
        .filter(apt => apt.status === 'COMPLETED')
        .forEach(apt => {
          const monthKey = apt.startTime.toISOString().slice(0, 7); // YYYY-MM
          const existing = monthlyStats.get(monthKey) || { appointments: 0, revenue: 0 };
          existing.appointments += 1;
          existing.revenue += apt.price;
          monthlyStats.set(monthKey, existing);
        });

      const monthlyTrends: MonthlyTrend[] = Array.from(monthlyStats.entries())
        .map(([month, stats]) => ({
          month,
          appointmentCount: stats.appointments,
          revenue: stats.revenue,
          commission: stats.revenue * artist.commission
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        artistId,
        artistName: artist.user.name,
        period: { startDate, endDate },
        metrics: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          noShowAppointments,
          totalRevenue: completedRevenue,
          averageServicePrice,
          commissionEarned,
          clientRetentionRate
        },
        topServices,
        monthlyTrends
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to generate artist performance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate performance report for a store
   */
  async generateStorePerformanceReport(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StorePerformanceReport> {
    try {
      // Verify store exists
      const store = await db.store.findUnique({
        where: { id: storeId }
      });

      if (!store) {
        throw new NotFoundError('Store');
      }

      // Get all appointments in the period for this store
      const appointments = await db.appointment.findMany({
        where: {
          storeId,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          client: true,
          service: true,
          artist: {
            include: {
              user: true
            }
          }
        }
      });

      // Calculate store metrics
      const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
      const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.price, 0);
      const totalAppointments = appointments.length;
      const averageAppointmentValue = completedAppointments.length > 0 ? 
        totalRevenue / completedAppointments.length : 0;

      // Calculate total commissions paid
      const totalCommissionsPaid = completedAppointments.reduce((sum, apt) => {
        return sum + (apt.price * apt.artist.commission);
      }, 0);

      // Get active artists count
      const activeArtists = new Set(appointments.map(apt => apt.artistId)).size;

      // Calculate client retention rate
      const uniqueClients = new Set(appointments.map(apt => apt.clientId));
      const returningClients = new Set();
      
      for (const clientId of uniqueClients) {
        const clientAppointments = appointments.filter(apt => apt.clientId === clientId);
        if (clientAppointments.length > 1) {
          returningClients.add(clientId);
        }
      }
      
      const clientRetentionRate = uniqueClients.size > 0 ? 
        (returningClients.size / uniqueClients.size) * 100 : 0;

      // Generate artist performance summaries
      const artistStats = new Map<string, {
        name: string;
        appointments: number;
        revenue: number;
        commission: number;
        commissionRate: number;
      }>();

      completedAppointments.forEach(apt => {
        const existing = artistStats.get(apt.artistId) || {
          name: apt.artist.user.name,
          appointments: 0,
          revenue: 0,
          commission: 0,
          commissionRate: apt.artist.commission
        };
        existing.appointments += 1;
        existing.revenue += apt.price;
        existing.commission += apt.price * apt.artist.commission;
        artistStats.set(apt.artistId, existing);
      });

      const artistPerformance: ArtistPerformanceSummary[] = Array.from(artistStats.entries())
        .map(([artistId, stats]) => ({
          artistId,
          artistName: stats.name,
          appointmentCount: stats.appointments,
          revenue: stats.revenue,
          commission: stats.commission,
          commissionRate: stats.commissionRate
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Get top services
      const serviceStats = new Map<string, { count: number; revenue: number; name: string }>();
      
      completedAppointments.forEach(apt => {
        const existing = serviceStats.get(apt.serviceId) || { 
          count: 0, 
          revenue: 0, 
          name: apt.service.name 
        };
        existing.count += 1;
        existing.revenue += apt.price;
        serviceStats.set(apt.serviceId, existing);
      });

      const topServices: ServicePerformance[] = Array.from(serviceStats.entries())
        .map(([serviceId, stats]) => ({
          serviceId,
          serviceName: stats.name,
          appointmentCount: stats.count,
          totalRevenue: stats.revenue,
          averagePrice: stats.count > 0 ? stats.revenue / stats.count : 0
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      return {
        storeId,
        storeName: store.name,
        period: { startDate, endDate },
        metrics: {
          totalRevenue,
          totalAppointments,
          averageAppointmentValue,
          totalCommissionsPaid,
          activeArtists,
          clientRetentionRate
        },
        artistPerformance,
        topServices
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to generate store performance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get commission calculations for all artists in a store for a period
   */
  async getStoreCommissions(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommissionCalculation[]> {
    try {
      // Get all artists in the store
      const artists = await db.artist.findMany({
        where: { storeId },
        include: { user: true }
      });

      // Calculate commissions for each artist
      const commissions = await Promise.all(
        artists.map(artist => 
          this.calculateCommission(artist.id, startDate, endDate)
        )
      );

      return commissions.sort((a, b) => b.commissionAmount - a.commissionAmount);
    } catch (error) {
      throw new Error(`Failed to get store commissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const commissionService = new CommissionService();