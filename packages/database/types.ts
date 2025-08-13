// Type definitions for InkGest database models
import type { 
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
  CashRegister,
  CashMovement,
  Inventory,
  InventoryMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Notification,
  AuditLog,
  Prisma
} from './generated/client';

// Re-export Prisma types
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
  CashRegister,
  CashMovement,
  Inventory,
  InventoryMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Notification,
  AuditLog,
  Prisma
};

// Enum types (since SQLite doesn't support native enums)
export type Role = 'ADMIN' | 'MANAGER' | 'ARTIST' | 'EMPLOYEE';

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PaymentMethod = 
  | 'CASH' 
  | 'BIZUM' 
  | 'PAYPAL' 
  | 'STRIPE' 
  | 'CRYPTO';

export type PaymentStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REFUNDED';

export type ServiceCategory = 
  | 'TATTOO' 
  | 'PIERCING' 
  | 'LASER' 
  | 'MICROBLADING' 
  | 'OTHER';

export type DocumentType = 
  | 'CONSENT' 
  | 'INVOICE' 
  | 'RECEIPT' 
  | 'CONTRACT';

export type CashRegisterStatus = 'OPEN' | 'CLOSED';

export type PurchaseOrderStatus = 
  | 'PENDING' 
  | 'ORDERED' 
  | 'RECEIVED' 
  | 'CANCELLED';

export type NotificationType = 
  | 'APPOINTMENT_REMINDER'
  | 'PAYMENT_DUE'
  | 'STOCK_LOW'
  | 'SYSTEM_ALERT'
  | 'BIRTHDAY'
  | 'INSPECTION_DUE';

// Extended types with relations
export type CompanyWithStores = Company & {
  stores: Store[];
  users: User[];
};

export type StoreWithRelations = Store & {
  company: Company;
  appointments: Appointment[];
  clients: Client[];
  artists: Artist[];
  services: Service[];
  products: Product[];
  rooms: Room[];
};

export type UserWithCompany = User & {
  company: Company;
  artist?: Artist;
};

export type ClientWithAppointments = Client & {
  store: Store;
  appointments: Appointment[];
  documents: Document[];
};

export type ArtistWithRelations = Artist & {
  store: Store;
  user: User;
  appointments: Appointment[];
};

export type AppointmentWithRelations = Appointment & {
  store: Store;
  client: Client;
  artist: Artist;
  service: Service;
  room?: Room;
  payments: Payment[];
  documents: Document[];
};

export type ServiceWithAppointments = Service & {
  store: Store;
  appointments: Appointment[];
};

export type ProductWithInventory = Product & {
  store: Store;
  inventory: Inventory[];
  saleItems: SaleItem[];
};

export type SaleWithItems = Sale & {
  store: Store;
  items: SaleItem[];
  payments: Payment[];
};

export type PaymentWithRelations = Payment & {
  appointment?: Appointment;
  sale?: Sale;
};

export type DocumentWithRelations = Document & {
  client: Client;
  appointment?: Appointment;
};

// Input types for creating/updating records
export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export type CreateStoreInput = Omit<Store, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateStoreInput = Partial<Omit<CreateStoreInput, 'companyId'>>;

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserInput = Partial<Omit<CreateUserInput, 'companyId'>>;

export type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClientInput = Partial<Omit<CreateClientInput, 'storeId'>>;

export type CreateArtistInput = Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateArtistInput = Partial<Omit<CreateArtistInput, 'storeId' | 'userId'>>;

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAppointmentInput = Partial<Omit<CreateAppointmentInput, 'storeId'>>;

export type CreateServiceInput = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateServiceInput = Partial<Omit<CreateServiceInput, 'storeId'>>;

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductInput = Partial<Omit<CreateProductInput, 'storeId'>>;

export type CreatePaymentInput = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePaymentInput = Partial<CreatePaymentInput>;

// Utility types
export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type FilterParams<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type SearchParams = {
  query?: string;
  fields?: string[];
};

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

// Business logic types
export type BusinessHours = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
    open: string;
    close: string;
    closed: boolean;
  };
};

export type ArtistSchedule = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
    start: string;
    end: string;
    available: boolean;
  };
};

export type GuardianInfo = {
  name: string;
  email: string;
  phone: string;
  relationship: 'parent' | 'guardian' | 'other';
  idDocument: string;
};

export type MedicalInfo = {
  allergies: string[];
  medications: string[];
  conditions: string[];
  notes?: string;
};

export type CompanySettings = {
  currency: string;
  timezone: string;
  language: string;
  features?: string[];
};

export type StoreConfiguration = {
  theme: 'light' | 'dark';
  notifications: boolean;
  autoReminders: boolean;
  requireDeposit: boolean;
  depositPercentage?: number;
};

export type UserPreferences = {
  theme: 'light' | 'dark';
  language: 'es' | 'ca' | 'en';
  notifications: boolean;
  timezone?: string;
};

export type InstallmentPlan = {
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'monthly';
  startDate: Date;
};

export type CryptoPaymentDetails = {
  currency: string;
  address: string;
  amount: number;
  exchangeRate: number;
  confirmations: number;
};

export type SignatureData = {
  signature: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
};

// Validation schemas will be defined in a separate file using Zod
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};