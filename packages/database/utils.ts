// Database utility functions
import { PrismaClient } from './generated/client';
import type { 
  Role, 
  AppointmentStatus, 
  PaymentMethod, 
  PaymentStatus, 
  ServiceCategory, 
  DocumentType,
  CashRegisterStatus,
  PurchaseOrderStatus,
  NotificationType
} from './types';

// Singleton Prisma client
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env['NODE_ENV'] === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

export { prisma };

// Enum validation functions
export const isValidRole = (role: string): role is Role => {
  return ['ADMIN', 'MANAGER', 'ARTIST', 'EMPLOYEE'].includes(role);
};

export const isValidAppointmentStatus = (status: string): status is AppointmentStatus => {
  return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);
};

export const isValidPaymentMethod = (method: string): method is PaymentMethod => {
  return ['CASH', 'BIZUM', 'PAYPAL', 'STRIPE', 'CRYPTO'].includes(method);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status);
};

export const isValidServiceCategory = (category: string): category is ServiceCategory => {
  return ['TATTOO', 'PIERCING', 'LASER', 'MICROBLADING', 'OTHER'].includes(category);
};

export const isValidDocumentType = (type: string): type is DocumentType => {
  return ['CONSENT', 'INVOICE', 'RECEIPT', 'CONTRACT'].includes(type);
};

export const isValidCashRegisterStatus = (status: string): status is CashRegisterStatus => {
  return ['OPEN', 'CLOSED'].includes(status);
};

export const isValidPurchaseOrderStatus = (status: string): status is PurchaseOrderStatus => {
  return ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'].includes(status);
};

export const isValidNotificationType = (type: string): type is NotificationType => {
  return ['APPOINTMENT_REMINDER', 'PAYMENT_DUE', 'STOCK_LOW', 'SYSTEM_ALERT', 'BIRTHDAY', 'INSPECTION_DUE'].includes(type);
};

// Utility functions for JSON fields
export const parseJsonField = <T>(jsonString: string | null, defaultValue: T): T => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
};

export const stringifyJsonField = <T>(data: T): string => {
  return JSON.stringify(data);
};

// Database connection utilities
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(callback);
};

// Pagination helper
export const getPaginationParams = (page?: number, limit?: number) => {
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.min(100, Math.max(1, limit || 10));
  const skip = (pageNum - 1) * limitNum;
  
  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

// Calculate pagination metadata
export const calculatePaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// Multi-tenant helpers
export const withStoreFilter = (storeId: string) => {
  return { storeId };
};

export const withCompanyFilter = (companyId: string) => {
  return { companyId };
};

// Date utilities
export const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday to Friday
};

export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      addedDays++;
    }
  }
  
  return result;
};

// Audit logging helper
export const createAuditLog = async (
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes: Record<string, any>,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes: stringifyJsonField(changes),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });
};

// Notification helper
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> => {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: stringifyJsonField(data || {}),
    },
  });
};

// Error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string = 'DATABASE_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handlePrismaError = (error: any): never => {
  if (error.code === 'P2002') {
    throw new DatabaseError('Unique constraint violation', 'UNIQUE_CONSTRAINT', 409);
  }
  
  if (error.code === 'P2025') {
    throw new DatabaseError('Record not found', 'NOT_FOUND', 404);
  }
  
  if (error.code === 'P2003') {
    throw new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY_CONSTRAINT', 400);
  }
  
  throw new DatabaseError(error.message || 'Database operation failed');
};