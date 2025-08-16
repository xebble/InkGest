import { db } from '@/lib/db';
import { communicationService } from './communicationService';
import type { 
  Locale
} from '@/types';
import { z } from 'zod';

// Reminder types
export type ReminderType = '24h' | '2h' | 'confirmation';

export interface ReminderSchedule {
  id: string;
  appointmentId: string;
  type: ReminderType;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderData {
  appointmentId: string;
  type: ReminderType;
  scheduledFor: Date;
}

export interface ReminderTemplate {
  type: ReminderType;
  name: string;
  description: string;
  templates: {
    [key in Locale]: {
      whatsapp: {
        templateName: string;
        fallbackText: string;
      };
      email: {
        subject: string;
        html: string;
        text: string;
      };
    };
  };
  variables: string[];
}

export interface AppointmentConfirmation {
  id: string;
  appointmentId: string;
  token: string;
  confirmed: boolean;
  confirmedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateConfirmationData {
  appointmentId: string;
  expiresAt: Date;
}

// Validation schemas
export const createReminderSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  type: z.enum(['24h', '2h', 'confirmation']),
  scheduledFor: z.date()
});

export const createConfirmationSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  expiresAt: z.date()
});

class ReminderService {
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY_MINUTES = 30;

  /**
   * Schedule reminders for an appointment
   */
  async scheduleAppointmentReminders(appointmentId: string): Promise<ReminderSchedule[]> {
    try {
      // Get appointment details
      const appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
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

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const reminders: ReminderSchedule[] = [];

      // Schedule 24h reminder
      const reminder24h = await this.scheduleReminder({
        appointmentId,
        type: '24h',
        scheduledFor: new Date(appointment.startTime.getTime() - 24 * 60 * 60 * 1000)
      });
      reminders.push(reminder24h);

      // Schedule 2h reminder
      const reminder2h = await this.scheduleReminder({
        appointmentId,
        type: '2h',
        scheduledFor: new Date(appointment.startTime.getTime() - 2 * 60 * 60 * 1000)
      });
      reminders.push(reminder2h);

      // Schedule confirmation request (48h before)
      const confirmationReminder = await this.scheduleReminder({
        appointmentId,
        type: 'confirmation',
        scheduledFor: new Date(appointment.startTime.getTime() - 48 * 60 * 60 * 1000)
      });
      reminders.push(confirmationReminder);

      return reminders;
    } catch (error) {
      throw new Error(`Failed to schedule appointment reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule a single reminder
   */
  async scheduleReminder(data: CreateReminderData): Promise<ReminderSchedule> {
    try {
      const validatedData = createReminderSchema.parse(data);

      // Check if reminder already exists
      const existingReminder = await db.reminderSchedule.findFirst({
        where: {
          appointmentId: validatedData.appointmentId,
          type: validatedData.type
        }
      });

      if (existingReminder) {
        // Update existing reminder
        const updated = await db.reminderSchedule.update({
          where: { id: existingReminder.id },
          data: {
            scheduledFor: validatedData.scheduledFor,
            sent: false,
            sentAt: null,
            error: null,
            retryCount: 0,
            updatedAt: new Date()
          }
        });

        return this.mapToReminderSchedule(updated);
      }

      // Create new reminder
      const reminder = await db.reminderSchedule.create({
        data: {
          appointmentId: validatedData.appointmentId,
          type: validatedData.type,
          scheduledFor: validatedData.scheduledFor,
          sent: false,
          retryCount: 0
        }
      });

      return this.mapToReminderSchedule(reminder);
    } catch (error) {
      throw new Error(`Failed to schedule reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process pending reminders
   */
  async processPendingReminders(): Promise<void> {
    try {
      const now = new Date();
      
      // Get all pending reminders that should be sent
      const pendingReminders = await db.reminderSchedule.findMany({
        where: {
          sent: false,
          scheduledFor: {
            lte: now
          },
          retryCount: {
            lt: this.MAX_RETRY_COUNT
          }
        },
        include: {
          appointment: {
            include: {
              client: true,
              service: true,
              artist: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      for (const reminder of pendingReminders) {
        try {
          await this.sendReminder(reminder);
        } catch (error) {
          console.error(`Failed to send reminder ${reminder.id}:`, error);
          
          // Update retry count and error
          await db.reminderSchedule.update({
            where: { id: reminder.id },
            data: {
              retryCount: reminder.retryCount + 1,
              error: error instanceof Error ? error.message : 'Unknown error',
              // Schedule retry if under max retry count
              scheduledFor: reminder.retryCount + 1 < this.MAX_RETRY_COUNT 
                ? new Date(now.getTime() + this.RETRY_DELAY_MINUTES * 60 * 1000)
                : reminder.scheduledFor,
              updatedAt: new Date()
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to process pending reminders:', error);
      throw new Error(`Failed to process pending reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a specific reminder
   */
  private async sendReminder(reminder: any): Promise<void> {
    const appointment = reminder.appointment;
    
    if (!appointment) {
      throw new Error('Appointment not found for reminder');
    }

    // Skip if appointment is cancelled or completed
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      await db.reminderSchedule.update({
        where: { id: reminder.id },
        data: {
          sent: true,
          sentAt: new Date(),
          error: 'Appointment cancelled or completed',
          updatedAt: new Date()
        }
      });
      return;
    }

    try {
      if (reminder.type === 'confirmation') {
        await this.sendConfirmationRequest(appointment);
      } else {
        await this.sendAppointmentReminder(appointment, reminder.type);
      }

      // Mark as sent
      await db.reminderSchedule.update({
        where: { id: reminder.id },
        data: {
          sent: true,
          sentAt: new Date(),
          error: null,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw error; // Re-throw to be handled by caller
    }
  }

  /**
   * Send appointment reminder
   */
  private async sendAppointmentReminder(
    appointment: any,
    reminderType: '24h' | '2h'
  ): Promise<void> {
    const client = appointment.client;
    const service = appointment.service;
    
    // Get client's communication preferences
    const preferences = await communicationService.getCommunicationPreferences(client.id);
    
    if (!preferences.appointmentReminders) {
      return; // Client has disabled reminders
    }

    const locale = preferences.preferredLanguage || 'es';
    const template = this.getReminderTemplate(reminderType);
    const variables = this.buildReminderVariables(appointment, client, service);

    // Send via preferred channel
    if (preferences.preferredChannel === 'whatsapp' && preferences.whatsappEnabled) {
      await this.sendWhatsAppReminder(client.phone, template, locale, variables);
    } else if (preferences.preferredChannel === 'email' && preferences.emailEnabled) {
      await this.sendEmailReminder(client.email, template, locale, variables);
    }
  }

  /**
   * Send confirmation request
   */
  private async sendConfirmationRequest(appointment: any): Promise<void> {
    const client = appointment.client;
    const service = appointment.service;
    
    // Create confirmation token
    const confirmation = await this.createAppointmentConfirmation({
      appointmentId: appointment.id,
      expiresAt: new Date(appointment.startTime.getTime() - 12 * 60 * 60 * 1000) // Expires 12h before appointment
    });

    // Get client's communication preferences
    const preferences = await communicationService.getCommunicationPreferences(client.id);
    
    if (!preferences.appointmentReminders) {
      return; // Client has disabled reminders
    }

    const locale = preferences.preferredLanguage || 'es';
    const template = this.getReminderTemplate('confirmation');
    const variables = {
      ...this.buildReminderVariables(appointment, client, service),
      confirmationUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/confirm/${confirmation.token}`,
      confirmationToken: confirmation.token
    };

    // Send via preferred channel
    if (preferences.preferredChannel === 'whatsapp' && preferences.whatsappEnabled) {
      await this.sendWhatsAppReminder(client.phone, template, locale, variables);
    } else if (preferences.preferredChannel === 'email' && preferences.emailEnabled) {
      await this.sendEmailReminder(client.email, template, locale, variables);
    }
  }

  /**
   * Send WhatsApp reminder
   */
  private async sendWhatsAppReminder(
    phoneNumber: string,
    template: ReminderTemplate,
    locale: Locale,
    variables: Record<string, string>
  ): Promise<void> {
    const templateConfig = template.templates[locale]?.whatsapp;
    if (!templateConfig) {
      throw new Error(`WhatsApp template not configured for locale ${locale}`);
    }

    // Build template parameters
    const parameters = template.variables.map(variable => ({
      type: 'text' as const,
      text: variables[variable] || ''
    }));

    try {
      await communicationService.sendWhatsAppMessage({
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateConfig.templateName,
          language: { code: locale },
          components: [{
            type: 'body',
            parameters
          }]
        }
      });
    } catch (error) {
      // Fallback to text message
      const fallbackText = this.replacePlaceholders(templateConfig.fallbackText, variables);
      
      await communicationService.sendWhatsAppMessage({
        to: phoneNumber,
        type: 'text',
        text: { body: fallbackText }
      });
    }
  }

  /**
   * Send email reminder
   */
  private async sendEmailReminder(
    email: string,
    template: ReminderTemplate,
    locale: Locale,
    variables: Record<string, string>
  ): Promise<void> {
    const templateConfig = template.templates[locale]?.email;
    if (!templateConfig) {
      throw new Error(`Email template not configured for locale ${locale}`);
    }

    const subject = this.replacePlaceholders(templateConfig.subject, variables);
    const html = this.replacePlaceholders(templateConfig.html, variables);
    const text = this.replacePlaceholders(templateConfig.text, variables);

    await communicationService.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Create appointment confirmation
   */
  async createAppointmentConfirmation(data: CreateConfirmationData): Promise<AppointmentConfirmation> {
    try {
      const validatedData = createConfirmationSchema.parse(data);
      
      // Generate unique token
      const token = this.generateConfirmationToken();

      const confirmation = await db.appointmentConfirmation.create({
        data: {
          appointmentId: validatedData.appointmentId,
          token,
          confirmed: false,
          expiresAt: validatedData.expiresAt
        }
      });

      const result: AppointmentConfirmation = {
        id: confirmation.id,
        appointmentId: confirmation.appointmentId,
        token: confirmation.token,
        confirmed: confirmation.confirmed,
        expiresAt: confirmation.expiresAt,
        createdAt: confirmation.createdAt
      };

      if (confirmation.confirmedAt) {
        result.confirmedAt = confirmation.confirmedAt;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to create appointment confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(token: string): Promise<{ success: boolean; appointment?: any; error?: string }> {
    try {
      const confirmation = await db.appointmentConfirmation.findUnique({
        where: { token },
        include: {
          appointment: {
            include: {
              client: true,
              service: true,
              artist: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!confirmation) {
        return { success: false, error: 'Invalid confirmation token' };
      }

      if (confirmation.confirmed) {
        return { success: false, error: 'Appointment already confirmed' };
      }

      if (new Date() > confirmation.expiresAt) {
        return { success: false, error: 'Confirmation token expired' };
      }

      // Update confirmation
      await db.appointmentConfirmation.update({
        where: { id: confirmation.id },
        data: {
          confirmed: true,
          confirmedAt: new Date()
        }
      });

      // Update appointment status
      await db.appointment.update({
        where: { id: confirmation.appointmentId },
        data: {
          status: 'CONFIRMED'
        }
      });

      return { success: true, appointment: confirmation.appointment };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to confirm appointment: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get reminder templates
   */
  private getReminderTemplate(type: ReminderType): ReminderTemplate {
    const templates: Record<ReminderType, ReminderTemplate> = {
      '24h': {
        type: '24h',
        name: 'Recordatorio 24 horas',
        description: 'Recordatorio enviado 24 horas antes de la cita',
        templates: {
          es: {
            whatsapp: {
              templateName: 'appointment_reminder_24h',
              fallbackText: 'Hola {{clientName}}, te recordamos que tienes una cita para {{serviceName}} mañana {{appointmentDate}} a las {{appointmentTime}}. ¡Te esperamos!'
            },
            email: {
              subject: 'Recordatorio: Cita mañana - {{serviceName}}',
              html: `
                <h2>Recordatorio de Cita</h2>
                <p>Hola {{clientName}},</p>
                <p>Te recordamos que tienes una cita programada para:</p>
                <ul>
                  <li><strong>Servicio:</strong> {{serviceName}}</li>
                  <li><strong>Fecha:</strong> {{appointmentDate}}</li>
                  <li><strong>Hora:</strong> {{appointmentTime}}</li>
                  <li><strong>Precio:</strong> €{{price}}</li>
                </ul>
                <p>¡Te esperamos!</p>
              `,
              text: 'Hola {{clientName}}, te recordamos que tienes una cita para {{serviceName}} el {{appointmentDate}} a las {{appointmentTime}}. Precio: €{{price}}. ¡Te esperamos!'
            }
          },
          ca: {
            whatsapp: {
              templateName: 'appointment_reminder_24h_ca',
              fallbackText: 'Hola {{clientName}}, et recordem que tens una cita per {{serviceName}} demà {{appointmentDate}} a les {{appointmentTime}}. T\'esperem!'
            },
            email: {
              subject: 'Recordatori: Cita demà - {{serviceName}}',
              html: `
                <h2>Recordatori de Cita</h2>
                <p>Hola {{clientName}},</p>
                <p>Et recordem que tens una cita programada per:</p>
                <ul>
                  <li><strong>Servei:</strong> {{serviceName}}</li>
                  <li><strong>Data:</strong> {{appointmentDate}}</li>
                  <li><strong>Hora:</strong> {{appointmentTime}}</li>
                  <li><strong>Preu:</strong> €{{price}}</li>
                </ul>
                <p>T'esperem!</p>
              `,
              text: 'Hola {{clientName}}, et recordem que tens una cita per {{serviceName}} el {{appointmentDate}} a les {{appointmentTime}}. Preu: €{{price}}. T\'esperem!'
            }
          },
          en: {
            whatsapp: {
              templateName: 'appointment_reminder_24h_en',
              fallbackText: 'Hi {{clientName}}, reminder that you have an appointment for {{serviceName}} tomorrow {{appointmentDate}} at {{appointmentTime}}. See you there!'
            },
            email: {
              subject: 'Reminder: Appointment tomorrow - {{serviceName}}',
              html: `
                <h2>Appointment Reminder</h2>
                <p>Hi {{clientName}},</p>
                <p>This is a reminder that you have an appointment scheduled for:</p>
                <ul>
                  <li><strong>Service:</strong> {{serviceName}}</li>
                  <li><strong>Date:</strong> {{appointmentDate}}</li>
                  <li><strong>Time:</strong> {{appointmentTime}}</li>
                  <li><strong>Price:</strong> €{{price}}</li>
                </ul>
                <p>See you there!</p>
              `,
              text: 'Hi {{clientName}}, reminder that you have an appointment for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}}. Price: €{{price}}. See you there!'
            }
          }
        },
        variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'price']
      },
      '2h': {
        type: '2h',
        name: 'Recordatorio 2 horas',
        description: 'Recordatorio enviado 2 horas antes de la cita',
        templates: {
          es: {
            whatsapp: {
              templateName: 'appointment_reminder_2h',
              fallbackText: 'Hola {{clientName}}, tu cita para {{serviceName}} es en 2 horas ({{appointmentTime}}). ¡No olvides venir!'
            },
            email: {
              subject: 'Tu cita es en 2 horas - {{serviceName}}',
              html: `
                <h2>¡Tu cita es en 2 horas!</h2>
                <p>Hola {{clientName}},</p>
                <p>Te recordamos que tu cita es en 2 horas:</p>
                <ul>
                  <li><strong>Servicio:</strong> {{serviceName}}</li>
                  <li><strong>Hora:</strong> {{appointmentTime}}</li>
                  <li><strong>Precio:</strong> €{{price}}</li>
                </ul>
                <p>¡Te esperamos!</p>
              `,
              text: 'Hola {{clientName}}, tu cita para {{serviceName}} es en 2 horas ({{appointmentTime}}). Precio: €{{price}}. ¡Te esperamos!'
            }
          },
          ca: {
            whatsapp: {
              templateName: 'appointment_reminder_2h_ca',
              fallbackText: 'Hola {{clientName}}, la teva cita per {{serviceName}} és en 2 hores ({{appointmentTime}}). No oblidis venir!'
            },
            email: {
              subject: 'La teva cita és en 2 hores - {{serviceName}}',
              html: `
                <h2>La teva cita és en 2 hores!</h2>
                <p>Hola {{clientName}},</p>
                <p>Et recordem que la teva cita és en 2 hores:</p>
                <ul>
                  <li><strong>Servei:</strong> {{serviceName}}</li>
                  <li><strong>Hora:</strong> {{appointmentTime}}</li>
                  <li><strong>Preu:</strong> €{{price}}</li>
                </ul>
                <p>T'esperem!</p>
              `,
              text: 'Hola {{clientName}}, la teva cita per {{serviceName}} és en 2 hores ({{appointmentTime}}). Preu: €{{price}}. T\'esperem!'
            }
          },
          en: {
            whatsapp: {
              templateName: 'appointment_reminder_2h_en',
              fallbackText: 'Hi {{clientName}}, your appointment for {{serviceName}} is in 2 hours ({{appointmentTime}}). Don\'t forget to come!'
            },
            email: {
              subject: 'Your appointment is in 2 hours - {{serviceName}}',
              html: `
                <h2>Your appointment is in 2 hours!</h2>
                <p>Hi {{clientName}},</p>
                <p>This is a reminder that your appointment is in 2 hours:</p>
                <ul>
                  <li><strong>Service:</strong> {{serviceName}}</li>
                  <li><strong>Time:</strong> {{appointmentTime}}</li>
                  <li><strong>Price:</strong> €{{price}}</li>
                </ul>
                <p>See you there!</p>
              `,
              text: 'Hi {{clientName}}, your appointment for {{serviceName}} is in 2 hours ({{appointmentTime}}). Price: €{{price}}. See you there!'
            }
          }
        },
        variables: ['clientName', 'serviceName', 'appointmentTime', 'price']
      },
      'confirmation': {
        type: 'confirmation',
        name: 'Confirmación de cita',
        description: 'Solicitud de confirmación enviada 48 horas antes de la cita',
        templates: {
          es: {
            whatsapp: {
              templateName: 'appointment_confirmation',
              fallbackText: 'Hola {{clientName}}, por favor confirma tu cita para {{serviceName}} el {{appointmentDate}} a las {{appointmentTime}}. Confirma aquí: {{confirmationUrl}}'
            },
            email: {
              subject: 'Confirma tu cita - {{serviceName}}',
              html: `
                <h2>Confirma tu Cita</h2>
                <p>Hola {{clientName}},</p>
                <p>Por favor confirma tu cita programada para:</p>
                <ul>
                  <li><strong>Servicio:</strong> {{serviceName}}</li>
                  <li><strong>Fecha:</strong> {{appointmentDate}}</li>
                  <li><strong>Hora:</strong> {{appointmentTime}}</li>
                  <li><strong>Precio:</strong> €{{price}}</li>
                </ul>
                <p><a href="{{confirmationUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmar Cita</a></p>
                <p>Si no puedes confirmar haciendo clic en el botón, copia y pega este enlace en tu navegador: {{confirmationUrl}}</p>
              `,
              text: 'Hola {{clientName}}, por favor confirma tu cita para {{serviceName}} el {{appointmentDate}} a las {{appointmentTime}}. Precio: €{{price}}. Confirma aquí: {{confirmationUrl}}'
            }
          },
          ca: {
            whatsapp: {
              templateName: 'appointment_confirmation_ca',
              fallbackText: 'Hola {{clientName}}, si us plau confirma la teva cita per {{serviceName}} el {{appointmentDate}} a les {{appointmentTime}}. Confirma aquí: {{confirmationUrl}}'
            },
            email: {
              subject: 'Confirma la teva cita - {{serviceName}}',
              html: `
                <h2>Confirma la teva Cita</h2>
                <p>Hola {{clientName}},</p>
                <p>Si us plau confirma la teva cita programada per:</p>
                <ul>
                  <li><strong>Servei:</strong> {{serviceName}}</li>
                  <li><strong>Data:</strong> {{appointmentDate}}</li>
                  <li><strong>Hora:</strong> {{appointmentTime}}</li>
                  <li><strong>Preu:</strong> €{{price}}</li>
                </ul>
                <p><a href="{{confirmationUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmar Cita</a></p>
                <p>Si no pots confirmar fent clic al botó, copia i enganxa aquest enllaç al teu navegador: {{confirmationUrl}}</p>
              `,
              text: 'Hola {{clientName}}, si us plau confirma la teva cita per {{serviceName}} el {{appointmentDate}} a les {{appointmentTime}}. Preu: €{{price}}. Confirma aquí: {{confirmationUrl}}'
            }
          },
          en: {
            whatsapp: {
              templateName: 'appointment_confirmation_en',
              fallbackText: 'Hi {{clientName}}, please confirm your appointment for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}}. Confirm here: {{confirmationUrl}}'
            },
            email: {
              subject: 'Confirm your appointment - {{serviceName}}',
              html: `
                <h2>Confirm Your Appointment</h2>
                <p>Hi {{clientName}},</p>
                <p>Please confirm your scheduled appointment for:</p>
                <ul>
                  <li><strong>Service:</strong> {{serviceName}}</li>
                  <li><strong>Date:</strong> {{appointmentDate}}</li>
                  <li><strong>Time:</strong> {{appointmentTime}}</li>
                  <li><strong>Price:</strong> €{{price}}</li>
                </ul>
                <p><a href="{{confirmationUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirm Appointment</a></p>
                <p>If you can't confirm by clicking the button, copy and paste this link into your browser: {{confirmationUrl}}</p>
              `,
              text: 'Hi {{clientName}}, please confirm your appointment for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}}. Price: €{{price}}. Confirm here: {{confirmationUrl}}'
            }
          }
        },
        variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'price', 'confirmationUrl']
      }
    };

    return templates[type];
  }

  /**
   * Build reminder variables
   */
  private buildReminderVariables(
    appointment: any,
    client: any,
    service: any
  ): Record<string, string> {
    return {
      clientName: client.name,
      serviceName: service.name,
      appointmentDate: appointment.startTime.toLocaleDateString(),
      appointmentTime: appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: appointment.price.toString(),
      deposit: appointment.deposit?.toString() || '0'
    };
  }

  /**
   * Replace placeholders in template text
   */
  private replacePlaceholders(
    text: string,
    variables: Record<string, string>
  ): string {
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, value);
    });

    return result;
  }

  /**
   * Generate confirmation token
   */
  private generateConfirmationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Map database record to ReminderSchedule
   */
  private mapToReminderSchedule(record: any): ReminderSchedule {
    return {
      id: record.id,
      appointmentId: record.appointmentId,
      type: record.type as ReminderType,
      scheduledFor: record.scheduledFor,
      sent: record.sent,
      sentAt: record.sentAt || undefined,
      error: record.error || undefined,
      retryCount: record.retryCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  /**
   * Cancel reminders for an appointment
   */
  async cancelAppointmentReminders(appointmentId: string): Promise<void> {
    try {
      await db.reminderSchedule.updateMany({
        where: {
          appointmentId,
          sent: false
        },
        data: {
          sent: true,
          sentAt: new Date(),
          error: 'Appointment cancelled',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Failed to cancel appointment reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(storeId: string, startDate: Date, endDate: Date): Promise<{
    totalScheduled: number;
    totalSent: number;
    totalFailed: number;
    successRate: number;
    byType: Record<ReminderType, { scheduled: number; sent: number; failed: number }>;
  }> {
    try {
      const reminders = await db.reminderSchedule.findMany({
        where: {
          appointment: {
            storeId
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const stats = {
        totalScheduled: reminders.length,
        totalSent: reminders.filter(r => r.sent && !r.error).length,
        totalFailed: reminders.filter(r => r.error).length,
        successRate: 0,
        byType: {
          '24h': { scheduled: 0, sent: 0, failed: 0 },
          '2h': { scheduled: 0, sent: 0, failed: 0 },
          'confirmation': { scheduled: 0, sent: 0, failed: 0 }
        } as Record<ReminderType, { scheduled: number; sent: number; failed: number }>
      };

      stats.successRate = stats.totalScheduled > 0 
        ? (stats.totalSent / stats.totalScheduled) * 100 
        : 0;

      reminders.forEach(reminder => {
        const type = reminder.type as ReminderType;
        stats.byType[type].scheduled++;
        
        if (reminder.sent && !reminder.error) {
          stats.byType[type].sent++;
        }
        
        if (reminder.error) {
          stats.byType[type].failed++;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get reminder stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
export default reminderService;