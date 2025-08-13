import type { 
  Client, 
  Appointment, 
  ApiResponse,
  Locale 
} from '../../types';
import { z } from 'zod';

// WhatsApp Business API types
export interface WhatsAppMessage {
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: { code: string };
    components: WhatsAppComponent[];
  };
  text?: {
    body: string;
  };
}

export interface WhatsAppComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  parameters?: WhatsAppParameter[];
  sub_type?: string;
  index?: number;
}

export interface WhatsAppParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename: string;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

// Email types
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

// Message template types
export type MessageType = 
  | 'appointment_reminder_24h'
  | 'appointment_reminder_2h'
  | 'appointment_confirmation'
  | 'birthday_greeting'
  | 'post_care_followup'
  | 'consent_form_request'
  | 'payment_reminder'
  | 'loyalty_reward';

export interface MessageTemplate {
  id: string;
  type: MessageType;
  name: string;
  description: string;
  channels: ('whatsapp' | 'email' | 'sms')[];
  templates: {
    [key in Locale]: {
      whatsapp?: {
        templateName: string;
        fallbackText: string;
      };
      email?: {
        subject: string;
        html: string;
        text: string;
      };
      sms?: {
        text: string;
      };
    };
  };
  variables: string[];
  isActive: boolean;
}

// Communication preferences
export interface CommunicationPreferences {
  clientId: string;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  appointmentReminders: boolean;
  birthdayGreetings: boolean;
  postCareFollowup: boolean;
  marketingMessages: boolean;
  preferredLanguage: Locale;
  preferredChannel: 'whatsapp' | 'email' | 'sms';
}

// Validation schemas
export const whatsAppMessageSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  type: z.enum(['template', 'text']),
  template: z.object({
    name: z.string(),
    language: z.object({
      code: z.string()
    }),
    components: z.array(z.object({
      type: z.enum(['header', 'body', 'footer', 'button']),
      parameters: z.array(z.object({
        type: z.enum(['text', 'currency', 'date_time', 'image', 'document']),
        text: z.string().optional()
      })).optional()
    }))
  }).optional(),
  text: z.object({
    body: z.string()
  }).optional()
});

export const emailMessageSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.any(),
    contentType: z.string()
  })).optional()
});

export const communicationPreferencesSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  whatsappEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  appointmentReminders: z.boolean().default(true),
  birthdayGreetings: z.boolean().default(true),
  postCareFollowup: z.boolean().default(true),
  marketingMessages: z.boolean().default(false),
  preferredLanguage: z.enum(['es', 'ca', 'en']).default('es'),
  preferredChannel: z.enum(['whatsapp', 'email', 'sms']).default('whatsapp')
});

class CommunicationService {
  private whatsappApiUrl = 'https://graph.facebook.com/v18.0';
  private whatsappToken = process.env['WHATSAPP_ACCESS_TOKEN'];
  private whatsappPhoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'];
  
  /**
   * Send WhatsApp message using Business API
   */
  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.whatsappToken || !this.whatsappPhoneNumberId) {
      throw new Error('WhatsApp API credentials not configured');
    }

    // Validate message
    const validatedMessage = whatsAppMessageSchema.parse(message);

    const response = await fetch(
      `${this.whatsappApiUrl}/${this.whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...validatedMessage,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send email message
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    // Validate message
    const validatedMessage = emailMessageSchema.parse(message);

    const response = await fetch('/api/communications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedMessage),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Email service error: ${error.error || response.statusText}`);
    }
  }

  /**
   * Get message templates
   */
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    const response = await fetch('/api/communications/templates');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch message templates: ${response.statusText}`);
    }

    const result: ApiResponse<MessageTemplate[]> = await response.json();
    return result.data;
  }

  /**
   * Get specific message template
   */
  async getMessageTemplate(type: MessageType): Promise<MessageTemplate | null> {
    const templates = await this.getMessageTemplates();
    return templates.find(template => template.type === type) || null;
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    appointment: Appointment & { client: Client; service: { name: string } },
    reminderType: '24h' | '2h',
    locale: Locale = 'es'
  ): Promise<void> {
    const templateType: MessageType = reminderType === '24h' 
      ? 'appointment_reminder_24h' 
      : 'appointment_reminder_2h';

    const template = await this.getMessageTemplate(templateType);
    if (!template || !template.isActive) {
      throw new Error(`Template ${templateType} not found or inactive`);
    }

    const preferences = await this.getCommunicationPreferences(appointment.client.id);
    if (!preferences.appointmentReminders) {
      return; // Client has disabled appointment reminders
    }

    const variables = this.buildTemplateVariables(appointment, appointment.client);
    const clientLocale = preferences.preferredLanguage || locale;

    // Send via preferred channel
    if (preferences.preferredChannel === 'whatsapp' && preferences.whatsappEnabled) {
      await this.sendWhatsAppTemplate(
        appointment.client.phone,
        template,
        clientLocale,
        variables
      );
    } else if (preferences.preferredChannel === 'email' && preferences.emailEnabled) {
      await this.sendEmailTemplate(
        appointment.client.email,
        template,
        clientLocale,
        variables
      );
    }
  }

  /**
   * Send birthday greeting
   */
  async sendBirthdayGreeting(client: Client, locale: Locale = 'es'): Promise<void> {
    const template = await this.getMessageTemplate('birthday_greeting');
    if (!template || !template.isActive) {
      throw new Error('Birthday greeting template not found or inactive');
    }

    const preferences = await this.getCommunicationPreferences(client.id);
    if (!preferences.birthdayGreetings) {
      return; // Client has disabled birthday greetings
    }

    const variables = this.buildBirthdayVariables(client);
    const clientLocale = preferences.preferredLanguage || locale;

    // Send via preferred channel
    if (preferences.preferredChannel === 'whatsapp' && preferences.whatsappEnabled) {
      await this.sendWhatsAppTemplate(
        client.phone,
        template,
        clientLocale,
        variables
      );
    } else if (preferences.preferredChannel === 'email' && preferences.emailEnabled) {
      await this.sendEmailTemplate(
        client.email,
        template,
        clientLocale,
        variables
      );
    }
  }

  /**
   * Send post-care follow-up message
   */
  async sendPostCareFollowup(
    appointment: Appointment & { client: Client; service: { name: string } },
    locale: Locale = 'es'
  ): Promise<void> {
    const template = await this.getMessageTemplate('post_care_followup');
    if (!template || !template.isActive) {
      throw new Error('Post-care follow-up template not found or inactive');
    }

    const preferences = await this.getCommunicationPreferences(appointment.client.id);
    if (!preferences.postCareFollowup) {
      return; // Client has disabled post-care follow-up
    }

    const variables = this.buildTemplateVariables(appointment, appointment.client);
    const clientLocale = preferences.preferredLanguage || locale;

    // Send via preferred channel
    if (preferences.preferredChannel === 'whatsapp' && preferences.whatsappEnabled) {
      await this.sendWhatsAppTemplate(
        appointment.client.phone,
        template,
        clientLocale,
        variables
      );
    } else if (preferences.preferredChannel === 'email' && preferences.emailEnabled) {
      await this.sendEmailTemplate(
        appointment.client.email,
        template,
        clientLocale,
        variables
      );
    }
  }

  /**
   * Send WhatsApp template message
   */
  private async sendWhatsAppTemplate(
    phoneNumber: string,
    template: MessageTemplate,
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

    const message: WhatsAppMessage = {
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
    };

    try {
      await this.sendWhatsAppMessage(message);
    } catch (error) {
      // Fallback to text message if template fails
      console.error('WhatsApp template failed, sending fallback text:', error);
      
      const fallbackText = this.replacePlaceholders(
        templateConfig.fallbackText,
        variables
      );

      await this.sendWhatsAppMessage({
        to: phoneNumber,
        type: 'text',
        text: { body: fallbackText }
      });
    }
  }

  /**
   * Send email template message
   */
  private async sendEmailTemplate(
    email: string,
    template: MessageTemplate,
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

    await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Build template variables for appointments
   */
  private buildTemplateVariables(
    appointment: Appointment & { client: Client; service: { name: string } },
    client: Client
  ): Record<string, string> {
    return {
      clientName: client.name,
      serviceName: appointment.service.name,
      appointmentDate: appointment.startTime.toLocaleDateString(),
      appointmentTime: appointment.startTime.toLocaleTimeString(),
      price: appointment.price.toString(),
      deposit: appointment.deposit?.toString() || '0'
    };
  }

  /**
   * Build template variables for birthday greetings
   */
  private buildBirthdayVariables(client: Client): Record<string, string> {
    const age = client.birthDate 
      ? new Date().getFullYear() - new Date(client.birthDate).getFullYear()
      : 0;

    return {
      clientName: client.name,
      age: age.toString(),
      loyaltyPoints: client.loyaltyPoints.toString()
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
   * Get client communication preferences
   */
  async getCommunicationPreferences(clientId: string): Promise<CommunicationPreferences> {
    const response = await fetch(`/api/clients/${clientId}/communication-preferences`);
    
    if (!response.ok) {
      // Return default preferences if not found
      if (response.status === 404) {
        return {
          clientId,
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
      }
      throw new Error(`Failed to fetch communication preferences: ${response.statusText}`);
    }

    const result: ApiResponse<CommunicationPreferences> = await response.json();
    return result.data;
  }

  /**
   * Update client communication preferences
   */
  async updateCommunicationPreferences(
    clientId: string,
    preferences: Partial<CommunicationPreferences>
  ): Promise<CommunicationPreferences> {
    const validatedPreferences = communicationPreferencesSchema.parse({
      clientId,
      ...preferences
    });

    const response = await fetch(`/api/clients/${clientId}/communication-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedPreferences),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update communication preferences');
    }

    const result: ApiResponse<CommunicationPreferences> = await response.json();
    return result.data;
  }

  /**
   * Schedule automatic birthday greetings
   */
  async scheduleBirthdayGreetings(): Promise<void> {
    const response = await fetch('/api/communications/schedule-birthday-greetings', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to schedule birthday greetings');
    }
  }

  /**
   * Schedule post-care follow-ups
   */
  async schedulePostCareFollowups(): Promise<void> {
    const response = await fetch('/api/communications/schedule-post-care-followups', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to schedule post-care follow-ups');
    }
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats(storeId: string): Promise<{
    totalSent: number;
    whatsappSent: number;
    emailSent: number;
    smsSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  }> {
    const response = await fetch(`/api/communications/stats?storeId=${storeId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch communication stats: ${response.statusText}`);
    }

    const result: ApiResponse<any> = await response.json();
    return result.data;
  }

  /**
   * Test WhatsApp connection
   */
  async testWhatsAppConnection(): Promise<boolean> {
    try {
      const testMessage: WhatsAppMessage = {
        to: '+1234567890', // Test number
        type: 'text',
        text: { body: 'Test connection' }
      };

      // This will fail but we can check if the API responds correctly
      await this.sendWhatsAppMessage(testMessage);
      return true;
    } catch (error) {
      // Check if it's a valid API error (not connection error)
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorMessage.includes('WhatsApp API error') && 
             !errorMessage.includes('credentials not configured');
    }
  }

  /**
   * Validate phone number for WhatsApp
   */
  validateWhatsAppNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for WhatsApp
   */
  formatWhatsAppNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }

    return formatted;
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();
export default communicationService;

// Types are already exported above