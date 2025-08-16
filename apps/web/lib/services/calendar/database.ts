// Temporary database interface for calendar integrations
// This would be replaced with actual Prisma models

export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: 'google' | 'microsoft' | 'apple';
  credentials: string; // JSON string of encrypted credentials
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock database functions for now
export const db = {
  calendarIntegration: {
    findMany: async (_where: any): Promise<CalendarIntegration[]> => {
      // Mock implementation - would use actual database
      return [];
    },
    create: async (data: any): Promise<CalendarIntegration> => {
      // Mock implementation
      return {
        id: 'mock-id',
        userId: data.userId,
        provider: data.provider,
        credentials: data.credentials,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    delete: async (_where: any): Promise<void> => {
      // Mock implementation
    },
  },
  appointment: {
    findUnique: async (_options: any): Promise<any> => {
      // Mock implementation
      return null;
    },
    update: async (_options: any): Promise<any> => {
      // Mock implementation
      return {};
    },
  },
  artist: {
    findUnique: async (_options: any): Promise<any> => {
      // Mock implementation
      return null;
    },
    findMany: async (_options: any): Promise<any[]> => {
      // Mock implementation
      return [];
    },
  },
  user: {
    findUnique: async (_options: any): Promise<any> => {
      // Mock implementation
      return null;
    },
  },
};