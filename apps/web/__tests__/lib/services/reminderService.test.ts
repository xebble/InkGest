import { reminderService } from '@/lib/services/reminderService';
import { communicationService } from '@/lib/services/communicationService';
import { db } from '@/lib/db';

// Mock dependencies
const mockDb = {
  appointment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  reminderSchedule: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  },
  appointmentConfirmation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
};

jest.mock('@/lib/db', () => ({
  db: mockDb
}));

jest.mock('@/lib/services/communicationService', () => ({
  communicationService: {
    getCommunicationPreferences: jest.fn(),
    sendWhatsAppMessage: jest.fn(),
    sendEmail: jest.fn()
  }
}));

describe('ReminderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleAppointmentReminders', () => {
    const mockAppointment = {
      id: 'appointment-1',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      client: {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      service: {
        name: 'Tattoo Session'
      },
      artist: {
        user: {
          name: 'Jane Artist'
        }
      }
    };

    it('should schedule all three types of reminders', async () => {
      mockDb.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockDb.reminderSchedule.findFirst.mockResolvedValue(null);
      mockDb.reminderSchedule.create.mockImplementation((data) => ({
        id: `reminder-${Date.now()}`,
        ...data.data,
        sent: false,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const reminders = await reminderService.scheduleAppointmentReminders('appointment-1');

      expect(reminders).toHaveLength(3);
      expect(mockDb.reminderSchedule.create).toHaveBeenCalledTimes(3);
      
      // Check that all reminder types are scheduled
      const reminderTypes = reminders.map(r => r.type);
      expect(reminderTypes).toContain('24h');
      expect(reminderTypes).toContain('2h');
      expect(reminderTypes).toContain('confirmation');
    });

    it('should update existing reminders instead of creating duplicates', async () => {
      mockDb.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockDb.reminderSchedule.findFirst.mockResolvedValue({
        id: 'existing-reminder',
        appointmentId: 'appointment-1',
        type: '24h'
      });
      mockDb.reminderSchedule.update.mockResolvedValue({
        id: 'existing-reminder',
        appointmentId: 'appointment-1',
        type: '24h',
        scheduledFor: new Date(),
        sent: false,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await reminderService.scheduleAppointmentReminders('appointment-1');

      expect(mockDb.reminderSchedule.update).toHaveBeenCalled();
      expect(mockDb.reminderSchedule.create).toHaveBeenCalledTimes(2); // Only for the other two types
    });

    it('should throw error if appointment not found', async () => {
      mockDb.appointment.findUnique.mockResolvedValue(null);

      await expect(reminderService.scheduleAppointmentReminders('nonexistent'))
        .rejects.toThrow('Appointment not found');
    });
  });

  describe('processPendingReminders', () => {
    const mockPendingReminder = {
      id: 'reminder-1',
      appointmentId: 'appointment-1',
      type: '24h',
      scheduledFor: new Date(Date.now() - 1000), // 1 second ago
      sent: false,
      retryCount: 0,
      appointment: {
        id: 'appointment-1',
        status: 'SCHEDULED',
        startTime: new Date(),
        endTime: new Date(),
        price: 100,
        client: {
          id: 'client-1',
          name: 'John Doe',
          phone: '+1234567890'
        },
        service: {
          name: 'Tattoo Session'
        }
      }
    };

    it('should process pending reminders successfully', async () => {
      (db.reminderSchedule.findMany as jest.Mock).mockResolvedValue([mockPendingReminder]);
      (communicationService.getCommunicationPreferences as jest.Mock).mockResolvedValue({
        appointmentReminders: true,
        preferredChannel: 'whatsapp',
        whatsappEnabled: true,
        preferredLanguage: 'es'
      });
      (communicationService.sendWhatsAppMessage as jest.Mock).mockResolvedValue({});
      (db.reminderSchedule.update as jest.Mock).mockResolvedValue({});

      await reminderService.processPendingReminders();

      expect(db.reminderSchedule.findMany).toHaveBeenCalled();
      expect(communicationService.sendWhatsAppMessage).toHaveBeenCalled();
      expect(db.reminderSchedule.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: expect.objectContaining({
          sent: true,
          sentAt: expect.any(Date),
          error: null
        })
      });
    });

    it('should skip reminders for cancelled appointments', async () => {
      const cancelledReminder = {
        ...mockPendingReminder,
        appointment: {
          ...mockPendingReminder.appointment,
          status: 'CANCELLED'
        }
      };

      (db.reminderSchedule.findMany as jest.Mock).mockResolvedValue([cancelledReminder]);
      (db.reminderSchedule.update as jest.Mock).mockResolvedValue({});

      await reminderService.processPendingReminders();

      expect(communicationService.sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(db.reminderSchedule.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: expect.objectContaining({
          sent: true,
          error: 'Appointment cancelled or completed'
        })
      });
    });

    it('should handle reminder sending failures with retry', async () => {
      (db.reminderSchedule.findMany as jest.Mock).mockResolvedValue([mockPendingReminder]);
      (communicationService.getCommunicationPreferences as jest.Mock).mockResolvedValue({
        appointmentReminders: true,
        preferredChannel: 'whatsapp',
        whatsappEnabled: true,
        preferredLanguage: 'es'
      });
      (communicationService.sendWhatsAppMessage as jest.Mock).mockRejectedValue(new Error('Network error'));
      (db.reminderSchedule.update as jest.Mock).mockResolvedValue({});

      await reminderService.processPendingReminders();

      expect(db.reminderSchedule.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: expect.objectContaining({
          retryCount: 1,
          error: 'Network error'
        })
      });
    });
  });

  describe('confirmAppointment', () => {
    const mockConfirmation = {
      id: 'confirmation-1',
      appointmentId: 'appointment-1',
      token: 'test-token',
      confirmed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      appointment: {
        id: 'appointment-1',
        client: { name: 'John Doe' },
        service: { name: 'Tattoo Session' }
      }
    };

    it('should confirm appointment successfully', async () => {
      (db.appointmentConfirmation.findUnique as jest.Mock).mockResolvedValue(mockConfirmation);
      (db.appointmentConfirmation.update as jest.Mock).mockResolvedValue({});
      (db.appointment.update as jest.Mock).mockResolvedValue({});

      const result = await reminderService.confirmAppointment('test-token');

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(db.appointmentConfirmation.update).toHaveBeenCalledWith({
        where: { id: 'confirmation-1' },
        data: {
          confirmed: true,
          confirmedAt: expect.any(Date)
        }
      });
      expect(db.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        data: { status: 'CONFIRMED' }
      });
    });

    it('should reject invalid token', async () => {
      (db.appointmentConfirmation.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await reminderService.confirmAppointment('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid confirmation token');
    });

    it('should reject already confirmed appointment', async () => {
      const confirmedToken = { ...mockConfirmation, confirmed: true };
      (db.appointmentConfirmation.findUnique as jest.Mock).mockResolvedValue(confirmedToken);

      const result = await reminderService.confirmAppointment('test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment already confirmed');
    });

    it('should reject expired token', async () => {
      const expiredToken = {
        ...mockConfirmation,
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      };
      (db.appointmentConfirmation.findUnique as jest.Mock).mockResolvedValue(expiredToken);

      const result = await reminderService.confirmAppointment('test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Confirmation token expired');
    });
  });

  describe('cancelAppointmentReminders', () => {
    it('should cancel all pending reminders for an appointment', async () => {
      (db.reminderSchedule.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      await reminderService.cancelAppointmentReminders('appointment-1');

      expect(db.reminderSchedule.updateMany).toHaveBeenCalledWith({
        where: {
          appointmentId: 'appointment-1',
          sent: false
        },
        data: {
          sent: true,
          sentAt: expect.any(Date),
          error: 'Appointment cancelled',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getReminderStats', () => {
    const mockReminders = [
      { type: '24h', sent: true, error: null },
      { type: '24h', sent: false, error: 'Failed to send' },
      { type: '2h', sent: true, error: null },
      { type: 'confirmation', sent: true, error: null }
    ];

    it('should calculate reminder statistics correctly', async () => {
      (db.reminderSchedule.findMany as jest.Mock).mockResolvedValue(mockReminders);

      const stats = await reminderService.getReminderStats(
        'store-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(stats.totalScheduled).toBe(4);
      expect(stats.totalSent).toBe(3);
      expect(stats.totalFailed).toBe(1);
      expect(stats.successRate).toBe(75);
      expect(stats.byType['24h'].scheduled).toBe(2);
      expect(stats.byType['24h'].sent).toBe(1);
      expect(stats.byType['24h'].failed).toBe(1);
    });
  });
});