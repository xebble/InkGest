// Main export file for the database package
export { PrismaClient } from './generated/client';
export type { Prisma } from './generated/client';

// Export all types
export * from './types';

// Export database utilities
export * from './utils';

// Export validation schemas (excluding duplicate types)
export { ValidationSchemas } from './validation/schemas';

// Export services
export * from './services';