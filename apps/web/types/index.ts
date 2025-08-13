// Re-export Prisma types for easier imports
export type {
  Company,
  Store,
  User,
  Client,
  Artist,
  Appointment,
  Service,
  Product,
  Room,
  Sale,
  SaleItem,
  Payment,
  Document,
} from '@inkgest/database/generated/client';

// Define enum types as string literals since SQLite doesn't support native enums
export type Role = 'ADMIN' | 'MANAGER' | 'ARTIST' | 'EMPLOYEE';

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PaymentMethod = 'CASH' | 'BIZUM' | 'PAYPAL' | 'STRIPE' | 'CRYPTO';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type ServiceCategory = 'TATTOO' | 'PIERCING' | 'LASER' | 'MICROBLADING' | 'OTHER';

export type DocumentType = 'CONSENT' | 'INVOICE' | 'RECEIPT' | 'CONTRACT';

// Additional application types
export interface CreateAppointmentData {
  clientId: string;
  artistId: string;
  serviceId: string;
  roomId?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  price: number;
  deposit?: number;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: AppointmentStatus;
}

export interface CreateClientData {
  storeId: string;
  email: string;
  name: string;
  phone: string;
  birthDate?: Date;
  isMinor?: boolean;
  guardianInfo?: GuardianInfo;
  medicalInfo?: MedicalInfo;
  imageRights?: boolean;
  source?: string;
}

export interface GuardianInfo {
  name: string;
  email: string;
  phone: string;
  relationship: 'parent' | 'guardian' | 'other';
  idDocument: string;
}

export interface MedicalInfo {
  allergies: string[];
  medications: string[];
  conditions: string[];
  notes?: string;
}

export interface CartItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  discount?: number;
}

export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  installments?: number;
  cryptoCurrency?: string;
}

export interface SaleData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  clientId?: string;
  payments: PaymentData[];
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Locale types
export type Locale = 'es' | 'ca' | 'en';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

// Communication types
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