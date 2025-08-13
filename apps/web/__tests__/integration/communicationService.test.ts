import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { communicationService } from '../../lib/services/communicationService';
import type { 
  WhatsAppMessage, 
  EmailMessage, 
  CommunicationPreferences,
  Client,
  Appointment 
} from '../../types';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('CommunicationService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env['WHATSAPP_ACCESS_TOKEN'] = 'test_token';
    process.env['WHATSAPP_PHONE_NUMBER_ID'] = 'test_phone_id';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('WhatsApp Integration', () => {
    it('should send WhatsApp template message successfully', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
        messages: [{ id: 'msg_123' }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const message: WhatsAppMessage = {
        to: '+1234567890',
        type: 'template',
        template: {
          name: 'appointment_reminder_24h_es',
          language: { code: 'es' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: 'Juan Pérez' },
              { type: 'text', text: 'Tatuaje' }
            ]
          }]
        }
      };

      const result = await communicationService.sendWhatsAppMessage(message);

      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test_phone_id/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should send WhatsApp text message successfully', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
        messages: [{ id: 'msg_123' }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const message: WhatsAppMessage = {
        to: '+1234567890',
        type: 'text',
        text: { body: 'Hello, this is a test message!' }
      };

      const result = await communicationService.sendWhatsAppMessage(message);
      expect(result).toEqual(mockResponse);
    });

    it('should handle WhatsApp API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid phone number' }
        })
      });

      const message: WhatsAppMessage = {
        to: 'invalid_phone',
        type: 'text',
        text: { body: 'Test message' }
      };

      await expect(communicationService.sendWhatsAppMessage(message))
        .rejects.toThrow('WhatsApp API error: Invalid phone number');
    });

    it('should validate phone numbers correctly', () => {
      expect(communicationService.validateWhatsAppNumber('+1234567890')).toBe(true);
      expect(communicationService.validateWhatsAppNumber('+34612345678')).toBe(true);
      expect(communicationService.validateWhatsAppNumber('1234567890')).toBe(true);
      expect(communicationService.validateWhatsAppNumber('invalid')).toBe(false);
      expect(communicationService.validateWhatsAppNumber('')).toBe(false);
    });

    it('should format phone numbers correctly', () => {
      expect(communicationService.formatWhatsAppNumber('1234567890')).toBe('+1234567890');
      expect(communicationService.formatWhatsAppNumber('+1234567890')).toBe('+1234567890');
      expect(communicationService.formatWhatsAppNumber('(123) 456-7890')).toBe('+1234567890');
      expect(communicationService.formatWhatsAppNumber('+34 612 34 56 78')).toBe('+34612345678');
    });
  });

  describe('Email Integration', () => {
    it('should send email successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const message: EmailMessage = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
        text: 'Test text'
      };

      await communicationService.sendEmail(message);

      expect(fetch).toHaveBeenCalledWith('/api/communications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    });

    it('should handle email service errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'SMTP connection failed' })
      });

      const message: EmailMessage = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>'
      };

      await expect(communicationService.sendEmail(message))
        .rejects.toThrow('Email service error: SMTP connection failed');
    });
  });

  describe('Message Templates', () => {
    it('should get message templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'appointment_reminder_24h',
          type: 'appointment_reminder_24h',
          name: 'Recordatorio de cita 24h',
          isActive: true
        }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTemplates })
      });

      const templates = await communicationService.getMessageTemplates();
      expect(templates).toEqual(mockTemplates);
    });

    it('should get specific message template', async () => {
      const mockTemplates = [
        {
          id: 'birthday_greeting',
          type: 'birthday_greeting',
          name: 'Felicitación de cumpleaños',
          isActive: true
        }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTemplates })
      });

      const template = await communicationService.getMessageTemplate('birthday_greeting');
      expect(template).toEqual(mockTemplates[0]);
    });
  });

  describe('Automated Communications', () => {
    const mockClient: Client = {
      id: 'client_123',
      storeId: 'store_123',
      email: 'client@example.com',
      name: 'Juan Pérez',
      phone: '+34612345678',
      birthDate: new Date('1990-01-15'),
      isMinor: false,
      guardianInfo: null,
      medicalInfo: null,
      imageRights: true,
      source: null,
      loyaltyPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAppointment = {
      id: 'appointment_123',
      storeId: 'store_123',
      clientId: 'client_123',
      artistId: 'artist_123',
      serviceId: 'service_123',
      roomId: null,
      startTime: new Date('2024-01-16T10:00:00Z'),
      endTime: new Date('2024-01-16T12:00:00Z'),
      status: 'SCHEDULED',
      notes: null,
      price: 150,
      deposit: 50,
      googleEventId: null,
      client: mockClient,
      service: { name: 'Tatuaje personalizado' },
      createdAt: new Date(),
      updatedAt: new Date()
    } as Appointment & { client: Client; service: { name: string } };

    beforeEach(() => {
      // Mock communication preferences
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('communication-preferences')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                clientId: 'client_123',
                whatsappEnabled: true,
                emailEnabled: true,
                appointmentReminders: true,
                birthdayGreetings: true,
                postCareFollowup: true,
                preferredLanguage: 'es',
                preferredChannel: 'whatsapp'
              } as CommunicationPreferences
            })
          });
        }
        
        if (url.includes('templates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [{
                id: 'test_template',
                type: 'appointment_reminder_24h',
                isActive: true,
                templates: {
                  es: {
                    whatsapp: {
                      templateName: 'test_template_es',
                      fallbackText: 'Test message for {{clientName}}'
                    }
                  }
                },
                variables: ['clientName']
              }]
            })
          });
        }

        // Mock WhatsApp API
        return Promise.resolve({
          ok: true,
          json: async () => ({
            messaging_product: 'whatsapp',
            messages: [{ id: 'msg_123' }]
          })
        });
      });
    });

    it('should send appointment reminder successfully', async () => {
      await communicationService.sendAppointmentReminder(mockAppointment, '24h', 'es');

      // Verify that WhatsApp API was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('messages'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token'
          })
        })
      );
    });

    it('should send birthday greeting successfully', async () => {
      await communicationService.sendBirthdayGreeting(mockClient, 'es');

      // Verify that communication was attempted
      expect(fetch).toHaveBeenCalled();
    });

    it('should send post-care follow-up successfully', async () => {
      await communicationService.sendPostCareFollowup(mockAppointment, 'es');

      // Verify that communication was attempted
      expect(fetch).toHaveBeenCalled();
    });

    it('should respect client communication preferences', async () => {
      // Mock preferences with reminders disabled
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('communication-preferences')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                clientId: 'client_123',
                appointmentReminders: false, // Disabled
                preferredLanguage: 'es'
              } as CommunicationPreferences
            })
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      // Should not send reminder when disabled
      await communicationService.sendAppointmentReminder(mockAppointment, '24h', 'es');

      // Verify WhatsApp API was not called
      const whatsappCalls = (fetch as any).mock.calls.filter((call: any) => 
        call[0].includes('messages') && call[1]?.headers?.Authorization
      );
      expect(whatsappCalls).toHaveLength(0);
    });
  });

  describe('Communication Preferences', () => {
    it('should get communication preferences successfully', async () => {
      const mockPreferences: CommunicationPreferences = {
        clientId: 'client_123',
        whatsappEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        appointmentReminders: true,
        birthdayGreetings: true,
        postCareFollowup: true,
        marketingMessages: false,
        preferredLanguage: 'es',
        preferredChannel: 'whatsapp'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPreferences })
      });

      const preferences = await communicationService.getCommunicationPreferences('client_123');
      expect(preferences).toEqual(mockPreferences);
    });

    it('should return default preferences when not found', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const preferences = await communicationService.getCommunicationPreferences('client_123');
      
      expect(preferences).toEqual({
        clientId: 'client_123',
        whatsappEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        appointmentReminders: true,
        birthdayGreetings: true,
        postCareFollowup: true,
        marketingMessages: false,
        preferredLanguage: 'es',
        preferredChannel: 'whatsapp'
      });
    });

    it('should update communication preferences successfully', async () => {
      const updatedPreferences: CommunicationPreferences = {
        clientId: 'client_123',
        whatsappEnabled: false,
        emailEnabled: true,
        smsEnabled: false,
        appointmentReminders: false,
        birthdayGreetings: true,
        postCareFollowup: true,
        marketingMessages: false,
        preferredLanguage: 'ca',
        preferredChannel: 'email'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedPreferences })
      });

      const result = await communicationService.updateCommunicationPreferences(
        'client_123',
        { preferredLanguage: 'ca', preferredChannel: 'email' }
      );

      expect(result).toEqual(updatedPreferences);
    });
  });

  describe('Connection Testing', () => {
    it('should test WhatsApp connection successfully', async () => {
      // Mock a failed API call (expected for test number)
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid recipient' }
        })
      });

      const isConnected = await communicationService.testWhatsAppConnection();
      expect(isConnected).toBe(true); // Should return true for valid API error
    });

    it('should detect WhatsApp connection failure', async () => {
      // Mock credentials not configured
      process.env['WHATSAPP_ACCESS_TOKEN'] = '';
      
      const isConnected = await communicationService.testWhatsAppConnection();
      expect(isConnected).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const message: WhatsAppMessage = {
        to: '+1234567890',
        type: 'text',
        text: { body: 'Test message' }
      };

      await expect(communicationService.sendWhatsAppMessage(message))
        .rejects.toThrow('Network error');
    });

    it('should handle invalid message format', async () => {
      const invalidMessage = {
        to: 'invalid_phone',
        type: 'invalid_type',
        text: { body: 'Test message' }
      } as any;

      await expect(communicationService.sendWhatsAppMessage(invalidMessage))
        .rejects.toThrow();
    });

    it('should handle missing template gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const template = await communicationService.getMessageTemplate('nonexistent_template' as any);
      expect(template).toBeNull();
    });
  });
});