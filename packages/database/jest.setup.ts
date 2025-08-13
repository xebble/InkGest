// Jest setup file
import { PrismaClient } from './generated/client';

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Global cleanup
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});