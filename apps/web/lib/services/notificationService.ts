import { db } from '@/lib/db';
import { ArtistNotification, CreateNotificationData } from '@/types';
import { NotFoundError } from '@/types';

class NotificationService {
  /**
   * Create a notification for an artist
   */
  async createNotification(data: CreateNotificationData): Promise<ArtistNotification> {
    try {
      // Verify artist exists
      const artist = await db.artist.findUnique({
        where: { id: data.artistId }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      // Create notification record
      const notification = await db.notification.create({
        data: {
          userId: artist.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: JSON.stringify(data.data || {}),
          read: false
        }
      });

      return {
        id: notification.id,
        artistId: data.artistId,
        type: data.type,
        title: notification.title,
        message: notification.message,
        ...(data.data && { data: data.data }),
        read: notification.read,
        createdAt: notification.createdAt
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get notifications for an artist
   */
  async getArtistNotifications(
    artistId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ArtistNotification[]> {
    try {
      // Get artist to get userId
      const artist = await db.artist.findUnique({
        where: { id: artistId }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      const notifications = await db.notification.findMany({
        where: { userId: artist.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return notifications.map(notification => ({
        id: notification.id,
        artistId,
        type: notification.type as ArtistNotification['type'],
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.parse(notification.data) : undefined,
        read: notification.read,
        createdAt: notification.createdAt
      }));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get artist notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark all notifications as read for an artist
   */
  async markAllAsRead(artistId: string): Promise<void> {
    try {
      // Get artist to get userId
      const artist = await db.artist.findUnique({
        where: { id: artistId }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      await db.notification.updateMany({
        where: { 
          userId: artist.userId,
          read: false
        },
        data: { read: true }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get unread notification count for an artist
   */
  async getUnreadCount(artistId: string): Promise<number> {
    try {
      // Get artist to get userId
      const artist = await db.artist.findUnique({
        where: { id: artistId }
      });

      if (!artist) {
        throw new NotFoundError('Artist');
      }

      return await db.notification.count({
        where: { 
          userId: artist.userId,
          read: false
        }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get unread count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send commission ready notification
   */
  async notifyCommissionReady(artistId: string, period: { startDate: Date; endDate: Date }, amount: number): Promise<void> {
    const startDateStr = period.startDate.toLocaleDateString();
    const endDateStr = period.endDate.toLocaleDateString();
    
    await this.createNotification({
      artistId,
      type: 'commission_ready',
      title: 'Commission Ready',
      message: `Your commission for ${startDateStr} - ${endDateStr} is ready: €${amount.toFixed(2)}`,
      data: {
        period,
        amount
      }
    });
  }

  /**
   * Send performance report notification
   */
  async notifyPerformanceReport(artistId: string, period: { startDate: Date; endDate: Date }): Promise<void> {
    const startDateStr = period.startDate.toLocaleDateString();
    const endDateStr = period.endDate.toLocaleDateString();
    
    await this.createNotification({
      artistId,
      type: 'performance_report',
      title: 'Performance Report Available',
      message: `Your performance report for ${startDateStr} - ${endDateStr} is now available`,
      data: { period }
    });
  }

  /**
   * Send schedule reminder notification
   */
  async notifyScheduleReminder(artistId: string, message: string): Promise<void> {
    await this.createNotification({
      artistId,
      type: 'schedule_reminder',
      title: 'Schedule Reminder',
      message,
      data: {}
    });
  }

  /**
   * Send absence status notification
   */
  async notifyAbsenceStatus(
    artistId: string, 
    approved: boolean, 
    startDate: Date, 
    endDate: Date,
    reason?: string
  ): Promise<void> {
    const startDateStr = startDate.toLocaleDateString();
    const endDateStr = endDate.toLocaleDateString();
    const status = approved ? 'approved' : 'rejected';
    
    await this.createNotification({
      artistId,
      type: approved ? 'absence_approved' : 'absence_rejected',
      title: `Absence Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your absence request for ${startDateStr} - ${endDateStr} has been ${status}${reason ? `: ${reason}` : ''}`,
      data: {
        approved,
        startDate,
        endDate,
        reason
      }
    });
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          read: true
        }
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to cleanup old notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const notificationService = new NotificationService();