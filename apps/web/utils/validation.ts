import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

// Client validation schemas
export const guardianInfoSchema = z.object({
  name: z.string().min(1, 'Guardian name is required'),
  email: emailSchema,
  phone: phoneSchema,
  relationship: z.enum(['parent', 'guardian', 'other']),
  idDocument: z.string().min(1, 'ID document is required'),
});

export const medicalInfoSchema = z.object({
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  conditions: z.array(z.string()),
  notes: z.string().optional(),
});

export const createClientSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  email: emailSchema,
  name: z.string().min(1, 'Name is required'),
  phone: phoneSchema,
  birthDate: z.date().optional(),
  isMinor: z.boolean().default(false),
  guardianInfo: guardianInfoSchema.optional(),
  medicalInfo: medicalInfoSchema.optional(),
  imageRights: z.boolean().default(false),
  source: z.string().optional(),
}).refine(
  (data) => {
    if (data.isMinor && !data.guardianInfo) {
      return false;
    }
    return true;
  },
  {
    message: 'Guardian information is required for minors',
    path: ['guardianInfo'],
  }
);

// Appointment validation schemas
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  artistId: z.string().uuid('Invalid artist ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  startTime: z.date(),
  endTime: z.date(),
  notes: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  deposit: z.number().positive('Deposit must be positive').optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Service validation schemas
export const createServiceSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  duration: z.number().positive('Duration must be positive'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['TATTOO', 'PIERCING', 'LASER', 'MICROBLADING', 'OTHER']),
  requiresConsent: z.boolean().default(true),
});

// Product validation schemas
export const createProductSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative'),
  batch: z.string().optional(),
  expiryDate: z.date().optional(),
});

// Payment validation schemas
export const paymentDataSchema = z.object({
  method: z.enum(['CASH', 'BIZUM', 'PAYPAL', 'STRIPE', 'CRYPTO']),
  amount: z.number().positive('Amount must be positive'),
  installments: z.number().int().positive().optional(),
  cryptoCurrency: z.string().optional(),
});

// Sale validation schemas
export const cartItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['product', 'service']),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  discount: z.number().min(0).max(1).optional(),
});

export const saleDataSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().positive(),
  tax: z.number().min(0),
  total: z.number().positive(),
  clientId: z.string().uuid().optional(),
  payments: z.array(paymentDataSchema).min(1, 'At least one payment is required'),
});

// Type inference from schemas
export type CreateClientData = z.infer<typeof createClientSchema>;
export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type CreateServiceData = z.infer<typeof createServiceSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type PaymentData = z.infer<typeof paymentDataSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type SaleData = z.infer<typeof saleDataSchema>;