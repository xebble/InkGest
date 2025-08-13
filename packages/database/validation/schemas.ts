// Zod validation schemas for all database models
import { z } from 'zod';

// Enum schemas
export const RoleSchema = z.enum(['ADMIN', 'MANAGER', 'ARTIST', 'EMPLOYEE']);
export const AppointmentStatusSchema = z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
export const PaymentMethodSchema = z.enum(['CASH', 'BIZUM', 'PAYPAL', 'STRIPE', 'CRYPTO']);
export const PaymentStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']);
export const ServiceCategorySchema = z.enum(['TATTOO', 'PIERCING', 'LASER', 'MICROBLADING', 'OTHER']);
export const DocumentTypeSchema = z.enum(['CONSENT', 'INVOICE', 'RECEIPT', 'CONTRACT']);
export const CashRegisterStatusSchema = z.enum(['OPEN', 'CLOSED']);
export const PurchaseOrderStatusSchema = z.enum(['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']);
export const NotificationTypeSchema = z.enum(['APPOINTMENT_REMINDER', 'PAYMENT_DUE', 'STOCK_LOW', 'SYSTEM_ALERT', 'BIRTHDAY', 'INSPECTION_DUE']);

// Common schemas
export const IdSchema = z.string().cuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const UrlSchema = z.string().url();
export const DateSchema = z.coerce.date();
export const JsonSchema = z.string().refine((val) => {
  try {
    JSON.parse(val);
    return true;
  } catch {
    return false;
  }
}, 'Invalid JSON string');

// Business Hours schema
export const BusinessHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
});

// Artist Schedule schema
export const ArtistScheduleSchema = z.object({
  monday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  tuesday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  wednesday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  thursday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  friday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  saturday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  sunday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
});

// Guardian Info schema
export const GuardianInfoSchema = z.object({
  name: z.string().min(1),
  email: EmailSchema,
  phone: PhoneSchema,
  relationship: z.enum(['parent', 'guardian', 'other']),
  idDocument: z.string().min(1),
});

// Medical Info schema
export const MedicalInfoSchema = z.object({
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  conditions: z.array(z.string()),
  notes: z.string().optional(),
});

// Company schemas
export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(255),
  settings: JsonSchema.default('{}'),
  subscription: z.string().default('basic'),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

// Store schemas
export const CreateStoreSchema = z.object({
  companyId: IdSchema,
  name: z.string().min(1).max(255),
  configuration: JsonSchema.default('{}'),
  timezone: z.string().default('Europe/Madrid'),
  businessHours: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return BusinessHoursSchema.safeParse(parsed).success;
    } catch {
      return false;
    }
  }, 'Invalid business hours format'),
});

export const UpdateStoreSchema = CreateStoreSchema.omit({ companyId: true }).partial();

// User schemas
export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(255),
  password: z.string().min(8).optional(),
  role: RoleSchema.default('EMPLOYEE'),
  companyId: IdSchema,
  storeIds: JsonSchema.default('[]'),
  preferences: JsonSchema.default('{}'),
});

export const UpdateUserSchema = CreateUserSchema.omit({ companyId: true }).partial();

// Client schemas
export const CreateClientSchema = z.object({
  storeId: IdSchema,
  email: EmailSchema,
  name: z.string().min(1).max(255),
  phone: PhoneSchema,
  birthDate: DateSchema.optional(),
  isMinor: z.boolean().default(false),
  guardianInfo: z.string().refine((val) => {
    if (!val) return true;
    try {
      const parsed = JSON.parse(val);
      return GuardianInfoSchema.safeParse(parsed).success;
    } catch {
      return false;
    }
  }, 'Invalid guardian info format').optional(),
  medicalInfo: z.string().refine((val) => {
    if (!val) return true;
    try {
      const parsed = JSON.parse(val);
      return MedicalInfoSchema.safeParse(parsed).success;
    } catch {
      return false;
    }
  }, 'Invalid medical info format').optional(),
  imageRights: z.boolean().default(false),
  source: z.string().optional(),
  loyaltyPoints: z.number().int().min(0).default(0),
});

export const UpdateClientSchema = CreateClientSchema.omit({ storeId: true }).partial();

// Artist schemas
export const CreateArtistSchema = z.object({
  storeId: IdSchema,
  userId: IdSchema,
  specialties: JsonSchema.default('[]'),
  schedule: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return ArtistScheduleSchema.safeParse(parsed).success;
    } catch {
      return false;
    }
  }, 'Invalid schedule format'),
  commission: z.number().min(0).max(1).default(0.5),
  googleCalendarId: z.string().optional(),
});

export const UpdateArtistSchema = CreateArtistSchema.omit({ storeId: true, userId: true }).partial();

// Appointment schemas
export const CreateAppointmentSchema = z.object({
  storeId: IdSchema,
  clientId: IdSchema,
  artistId: IdSchema,
  serviceId: IdSchema,
  roomId: IdSchema.optional(),
  startTime: DateSchema,
  endTime: DateSchema,
  status: AppointmentStatusSchema.default('SCHEDULED'),
  notes: z.string().optional(),
  price: z.number().min(0),
  deposit: z.number().min(0).optional(),
  googleEventId: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const BaseUpdateAppointmentSchema = z.object({
  clientId: IdSchema.optional(),
  artistId: IdSchema.optional(),
  serviceId: IdSchema.optional(),
  roomId: IdSchema.optional(),
  startTime: DateSchema.optional(),
  endTime: DateSchema.optional(),
  status: AppointmentStatusSchema.optional(),
  notes: z.string().optional(),
  price: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
  googleEventId: z.string().optional(),
});

export const UpdateAppointmentSchema = BaseUpdateAppointmentSchema.refine((data: any) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Service schemas
export const CreateServiceSchema = z.object({
  storeId: IdSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  duration: z.number().int().min(1),
  price: z.number().min(0),
  category: ServiceCategorySchema,
  requiresConsent: z.boolean().default(true),
});

export const UpdateServiceSchema = CreateServiceSchema.omit({ storeId: true }).partial();

// Product schemas
export const CreateProductSchema = z.object({
  storeId: IdSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  batch: z.string().optional(),
  expiryDate: DateSchema.optional(),
});

export const UpdateProductSchema = CreateProductSchema.omit({ storeId: true }).partial();

// Room schemas
export const CreateRoomSchema = z.object({
  storeId: IdSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const UpdateRoomSchema = CreateRoomSchema.omit({ storeId: true }).partial();

// Payment schemas
export const CreatePaymentSchema = z.object({
  appointmentId: IdSchema.optional(),
  saleId: IdSchema.optional(),
  amount: z.number().min(0),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema.default('PENDING'),
  transactionId: z.string().optional(),
  installmentPlan: JsonSchema.optional(),
  cryptoDetails: JsonSchema.optional(),
}).refine((data) => data.appointmentId || data.saleId, {
  message: 'Either appointmentId or saleId must be provided',
  path: ['appointmentId'],
});

const BaseUpdatePaymentSchema = z.object({
  appointmentId: IdSchema.optional(),
  saleId: IdSchema.optional(),
  amount: z.number().min(0).optional(),
  method: PaymentMethodSchema.optional(),
  status: PaymentStatusSchema.optional(),
  transactionId: z.string().optional(),
  installmentPlan: JsonSchema.optional(),
  cryptoDetails: JsonSchema.optional(),
});

export const UpdatePaymentSchema = BaseUpdatePaymentSchema;

// Document schemas
export const CreateDocumentSchema = z.object({
  clientId: IdSchema,
  appointmentId: IdSchema.optional(),
  type: DocumentTypeSchema,
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  signed: z.boolean().default(false),
  signedAt: DateSchema.optional(),
  signatureData: JsonSchema.optional(),
  filePath: z.string().optional(),
});

export const UpdateDocumentSchema = CreateDocumentSchema.omit({ clientId: true }).partial();

// Sale schemas
export const CreateSaleSchema = z.object({
  storeId: IdSchema,
  clientId: IdSchema.optional(),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
});

export const UpdateSaleSchema = CreateSaleSchema.omit({ storeId: true }).partial();

// Sale Item schemas
export const CreateSaleItemSchema = z.object({
  saleId: IdSchema,
  productId: IdSchema.optional(),
  serviceId: IdSchema.optional(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  discount: z.number().min(0).default(0),
}).refine((data) => data.productId || data.serviceId, {
  message: 'Either productId or serviceId must be provided',
  path: ['productId'],
});

const BaseUpdateSaleItemSchema = z.object({
  productId: IdSchema.optional(),
  serviceId: IdSchema.optional(),
  quantity: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
});

export const UpdateSaleItemSchema = BaseUpdateSaleItemSchema;

// Cash Register schemas
export const CreateCashRegisterSchema = z.object({
  storeId: IdSchema,
  userId: IdSchema,
  openingTime: DateSchema,
  closingTime: DateSchema.optional(),
  openingCash: z.number().min(0),
  closingCash: z.number().min(0).optional(),
  totalSales: z.number().min(0).default(0),
  differences: JsonSchema.default('{}'),
  notes: z.string().optional(),
  status: CashRegisterStatusSchema.default('OPEN'),
});

export const UpdateCashRegisterSchema = CreateCashRegisterSchema.omit({ storeId: true }).partial();

// Inventory schemas
export const CreateInventorySchema = z.object({
  storeId: IdSchema,
  productId: IdSchema,
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0).default(5),
  maxStock: z.number().int().min(0).optional(),
  location: z.string().optional(),
});

export const UpdateInventorySchema = CreateInventorySchema.omit({ storeId: true, productId: true }).partial();

// Supplier schemas
export const CreateSupplierSchema = z.object({
  storeId: IdSchema,
  name: z.string().min(1).max(255),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.omit({ storeId: true }).partial();

// Purchase Order schemas
export const CreatePurchaseOrderSchema = z.object({
  storeId: IdSchema,
  supplierId: IdSchema,
  orderDate: DateSchema,
  status: PurchaseOrderStatusSchema.default('PENDING'),
  total: z.number().min(0),
  notes: z.string().optional(),
});

export const UpdatePurchaseOrderSchema = CreatePurchaseOrderSchema.omit({ storeId: true }).partial();

// Notification schemas
export const CreateNotificationSchema = z.object({
  userId: IdSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: JsonSchema.default('{}'),
  read: z.boolean().default(false),
});

export const UpdateNotificationSchema = CreateNotificationSchema.omit({ userId: true }).partial();

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Search schema
export const SearchSchema = z.object({
  query: z.string().optional(),
  fields: z.array(z.string()).optional(),
});

// Export all schemas as a single object for easy access
export const ValidationSchemas = {
  // Enums
  Role: RoleSchema,
  AppointmentStatus: AppointmentStatusSchema,
  PaymentMethod: PaymentMethodSchema,
  PaymentStatus: PaymentStatusSchema,
  ServiceCategory: ServiceCategorySchema,
  DocumentType: DocumentTypeSchema,
  CashRegisterStatus: CashRegisterStatusSchema,
  PurchaseOrderStatus: PurchaseOrderStatusSchema,
  NotificationType: NotificationTypeSchema,
  
  // Common
  Id: IdSchema,
  Email: EmailSchema,
  Phone: PhoneSchema,
  Url: UrlSchema,
  Date: DateSchema,
  Json: JsonSchema,
  BusinessHours: BusinessHoursSchema,
  ArtistSchedule: ArtistScheduleSchema,
  GuardianInfo: GuardianInfoSchema,
  MedicalInfo: MedicalInfoSchema,
  
  // Models
  CreateCompany: CreateCompanySchema,
  UpdateCompany: UpdateCompanySchema,
  CreateStore: CreateStoreSchema,
  UpdateStore: UpdateStoreSchema,
  CreateUser: CreateUserSchema,
  UpdateUser: UpdateUserSchema,
  CreateClient: CreateClientSchema,
  UpdateClient: UpdateClientSchema,
  CreateArtist: CreateArtistSchema,
  UpdateArtist: UpdateArtistSchema,
  CreateAppointment: CreateAppointmentSchema,
  UpdateAppointment: UpdateAppointmentSchema,
  CreateService: CreateServiceSchema,
  UpdateService: UpdateServiceSchema,
  CreateProduct: CreateProductSchema,
  UpdateProduct: UpdateProductSchema,
  CreateRoom: CreateRoomSchema,
  UpdateRoom: UpdateRoomSchema,
  CreatePayment: CreatePaymentSchema,
  UpdatePayment: UpdatePaymentSchema,
  CreateDocument: CreateDocumentSchema,
  UpdateDocument: UpdateDocumentSchema,
  CreateSale: CreateSaleSchema,
  UpdateSale: UpdateSaleSchema,
  CreateSaleItem: CreateSaleItemSchema,
  UpdateSaleItem: UpdateSaleItemSchema,
  CreateCashRegister: CreateCashRegisterSchema,
  UpdateCashRegister: UpdateCashRegisterSchema,
  CreateInventory: CreateInventorySchema,
  UpdateInventory: UpdateInventorySchema,
  CreateSupplier: CreateSupplierSchema,
  UpdateSupplier: UpdateSupplierSchema,
  CreatePurchaseOrder: CreatePurchaseOrderSchema,
  UpdatePurchaseOrder: UpdatePurchaseOrderSchema,
  CreateNotification: CreateNotificationSchema,
  UpdateNotification: UpdateNotificationSchema,
  
  // Utility
  Pagination: PaginationSchema,
  Search: SearchSchema,
};

// Type inference helpers
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type CreateArtistInput = z.infer<typeof CreateArtistSchema>;
export type UpdateArtistInput = z.infer<typeof UpdateArtistSchema>;
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
export type UpdateSaleInput = z.infer<typeof UpdateSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof CreateSaleItemSchema>;
export type UpdateSaleItemInput = z.infer<typeof UpdateSaleItemSchema>;
export type CreateCashRegisterInput = z.infer<typeof CreateCashRegisterSchema>;
export type UpdateCashRegisterInput = z.infer<typeof UpdateCashRegisterSchema>;
export type CreateInventoryInput = z.infer<typeof CreateInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;