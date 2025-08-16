# Database Patterns & Best Practices - InkGest

## Prisma Best Practices

### Schema Design Principles
```prisma
// ✅ Good: Proper relationships and constraints
model Appointment {
  id            String   @id @default(cuid())
  storeId       String
  clientId      String
  artistId      String
  serviceId     String
  roomId        String?
  startTime     DateTime
  endTime       DateTime
  status        String   @default("SCHEDULED")
  price         Float
  deposit       Float?
  notes         String?
  googleEventId String?
  
  // Relationships with proper cascading
  store    Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  client   Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  artist   Artist   @relation(fields: [artistId], references: [id], onDelete: Cascade)
  service  Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  room     Room?    @relation(fields: [roomId], references: [id], onDelete: SetNull)
  
  // Audit fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Indexes for performance
  @@index([storeId, startTime])
  @@index([artistId, startTime])
  @@index([clientId])
  @@map("appointments")
}
```

### Query Optimization
```typescript
// ✅ Good: Efficient queries with proper includes
async function getAppointmentsWithDetails(storeId: string, date: Date) {
  return await db.appointment.findMany({
    where: {
      storeId,
      startTime: {
        gte: startOfDay(date),
        lt: endOfDay(date),
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      artist: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}

// ❌ Avoid: Over-fetching data
async function badGetAppointments(storeId: string) {
  return await db.appointment.findMany({
    where: { storeId },
    include: {
      client: true, // Fetches all client fields
      service: true, // Fetches all service fields
      artist: {
        include: {
          user: true, // Fetches all user fields including password
        },
      },
    },
  });
}
```

### Transaction Patterns
```typescript
// ✅ Good: Proper transaction usage
async function createAppointmentWithReminders(data: CreateAppointmentData) {
  return await db.$transaction(async (tx) => {
    // Create appointment
    const appointment = await tx.appointment.create({
      data: {
        ...data,
        status: 'SCHEDULED',
      },
    });

    // Schedule reminders
    const reminders = [
      {
        appointmentId: appointment.id,
        type: '24h',
        scheduledFor: new Date(appointment.startTime.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        appointmentId: appointment.id,
        type: '2h',
        scheduledFor: new Date(appointment.startTime.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    await tx.reminderSchedule.createMany({
      data: reminders,
    });

    return appointment;
  });
}

// ✅ Good: Interactive transactions for complex operations
async function transferAppointment(
  appointmentId: string,
  fromArtistId: string,
  toArtistId: string
) {
  return await db.$transaction(async (tx) => {
    // Check if appointment exists and belongs to fromArtist
    const appointment = await tx.appointment.findFirst({
      where: {
        id: appointmentId,
        artistId: fromArtistId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found or does not belong to artist');
    }

    // Check if toArtist is available
    const conflictingAppointment = await tx.appointment.findFirst({
      where: {
        artistId: toArtistId,
        startTime: {
          lt: appointment.endTime,
        },
        endTime: {
          gt: appointment.startTime,
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
    });

    if (conflictingAppointment) {
      throw new Error('Target artist is not available at this time');
    }

    // Transfer the appointment
    return await tx.appointment.update({
      where: { id: appointmentId },
      data: { artistId: toArtistId },
    });
  });
}
```

## Data Access Layer Patterns

### Repository Pattern
```typescript
// ✅ Good: Repository pattern for data access
interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByStore(storeId: string, filters?: AppointmentFilters): Promise<Appointment[]>;
  create(data: CreateAppointmentData): Promise<Appointment>;
  update(id: string, data: UpdateAppointmentData): Promise<Appointment>;
  delete(id: string): Promise<void>;
}

class PrismaAppointmentRepository implements AppointmentRepository {
  async findById(id: string): Promise<Appointment | null> {
    return await db.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
        artist: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByStore(
    storeId: string,
    filters: AppointmentFilters = {}
  ): Promise<Appointment[]> {
    const where: any = { storeId };

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = filters.startDate;
      if (filters.endDate) where.startTime.lte = filters.endDate;
    }

    if (filters.artistId) where.artistId = filters.artistId;
    if (filters.status) where.status = filters.status;

    return await db.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
        artist: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async create(data: CreateAppointmentData): Promise<Appointment> {
    return await db.appointment.create({
      data,
      include: {
        client: true,
        service: true,
        artist: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    return await db.appointment.update({
      where: { id },
      data,
      include: {
        client: true,
        service: true,
        artist: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await db.appointment.delete({
      where: { id },
    });
  }
}
```

### Service Layer Pattern
```typescript
// ✅ Good: Service layer for business logic
class AppointmentService {
  constructor(
    private appointmentRepo: AppointmentRepository,
    private reminderService: ReminderService,
    private calendarService: CalendarService
  ) {}

  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    // Validate business rules
    await this.validateAppointmentData(data);
    
    // Check for conflicts
    await this.checkForConflicts(data);

    // Create appointment in transaction
    const appointment = await db.$transaction(async (tx) => {
      const newAppointment = await this.appointmentRepo.create(data);
      
      // Schedule reminders
      await this.reminderService.scheduleReminders(newAppointment.id);
      
      // Sync with external calendar
      await this.calendarService.createEvent(newAppointment);
      
      return newAppointment;
    });

    return appointment;
  }

  private async validateAppointmentData(data: CreateAppointmentData): Promise<void> {
    // Check if client exists
    const client = await db.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      throw new ValidationError('Client not found');
    }

    // Check if artist exists and is active
    const artist = await db.artist.findUnique({
      where: { id: data.artistId },
      include: { user: true },
    });
    if (!artist) {
      throw new ValidationError('Artist not found');
    }

    // Validate appointment time
    if (data.endTime <= data.startTime) {
      throw new ValidationError('End time must be after start time');
    }

    // Check business hours
    await this.validateBusinessHours(data.startTime, data.endTime);
  }

  private async checkForConflicts(data: CreateAppointmentData): Promise<void> {
    const conflicts = await db.appointment.findMany({
      where: {
        OR: [
          { artistId: data.artistId },
          ...(data.roomId ? [{ roomId: data.roomId }] : []),
        ],
        status: {
          notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
        },
        startTime: {
          lt: data.endTime,
        },
        endTime: {
          gt: data.startTime,
        },
      },
    });

    if (conflicts.length > 0) {
      throw new ValidationError('Time slot is not available');
    }
  }
}
```

## Caching Strategies

### Query Caching
```typescript
// ✅ Good: Implement caching for expensive queries
class CachedAppointmentService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getAppointmentStats(storeId: string, date: Date): Promise<AppointmentStats> {
    const cacheKey = `stats:${storeId}:${date.toISOString().split('T')[0]}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const stats = await this.calculateStats(storeId, date);
    this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });

    return stats;
  }

  private async calculateStats(storeId: string, date: Date): Promise<AppointmentStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [total, completed, cancelled] = await Promise.all([
      db.appointment.count({
        where: {
          storeId,
          startTime: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.appointment.count({
        where: {
          storeId,
          startTime: { gte: startOfDay, lte: endOfDay },
          status: 'COMPLETED',
        },
      }),
      db.appointment.count({
        where: {
          storeId,
          startTime: { gte: startOfDay, lte: endOfDay },
          status: 'CANCELLED',
        },
      }),
    ]);

    return { total, completed, cancelled };
  }

  invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Migration Patterns

### Safe Migrations
```typescript
// ✅ Good: Safe migration with proper rollback
// migration.sql
/*
  Warnings:
  - You are about to drop the column `old_field` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `new_field` to the `appointments` table without a default value.
*/

-- Step 1: Add new column as optional
ALTER TABLE "appointments" ADD COLUMN "new_field" TEXT;

-- Step 2: Populate new column with data from old column
UPDATE "appointments" SET "new_field" = "old_field" WHERE "old_field" IS NOT NULL;

-- Step 3: Make new column required (in a separate migration)
-- ALTER TABLE "appointments" ALTER COLUMN "new_field" SET NOT NULL;

-- Step 4: Drop old column (in a separate migration)
-- ALTER TABLE "appointments" DROP COLUMN "old_field";
```

### Data Migration Scripts
```typescript
// scripts/migrate-appointment-data.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function migrateAppointmentData() {
  console.log('Starting appointment data migration...');

  const batchSize = 1000;
  let offset = 0;
  let processed = 0;

  while (true) {
    const appointments = await db.appointment.findMany({
      skip: offset,
      take: batchSize,
      where: {
        // Migration condition
        newField: null,
      },
    });

    if (appointments.length === 0) {
      break;
    }

    await db.$transaction(async (tx) => {
      for (const appointment of appointments) {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            newField: transformOldData(appointment.oldField),
          },
        });
      }
    });

    processed += appointments.length;
    offset += batchSize;

    console.log(`Processed ${processed} appointments...`);
  }

  console.log(`Migration completed. Total processed: ${processed}`);
}

function transformOldData(oldValue: string): string {
  // Transform logic here
  return oldValue.toUpperCase();
}

migrateAppointmentData()
  .catch(console.error)
  .finally(() => db.$disconnect());
```

## Performance Monitoring

### Query Performance
```typescript
// ✅ Good: Query performance monitoring
class PerformanceMonitor {
  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }
}

// Usage
const appointments = await PerformanceMonitor.measureQuery(
  'getAppointmentsByStore',
  () => appointmentRepo.findByStore(storeId, filters)
);
```

### Connection Pool Management
```typescript
// ✅ Good: Proper connection management
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Monitor query performance
db.$on('query', (e) => {
  if (e.duration > 1000) {
    console.log(`Slow query: ${e.query} (${e.duration}ms)`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.$disconnect();
  process.exit(0);
});
```

## Testing Database Operations

### Test Database Setup
```typescript
// ✅ Good: Isolated test database
import { PrismaClient } from '@prisma/client';

const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

beforeEach(async () => {
  // Clean database before each test
  await testDb.appointment.deleteMany();
  await testDb.client.deleteMany();
  await testDb.artist.deleteMany();
});

afterAll(async () => {
  await testDb.$disconnect();
});

// Test with proper data setup
test('should create appointment with reminders', async () => {
  // Setup test data
  const client = await testDb.client.create({
    data: {
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      storeId: 'test-store',
    },
  });

  const artist = await testDb.artist.create({
    data: {
      userId: 'test-user',
      storeId: 'test-store',
      specialties: ['tattoo'],
      schedule: '{}',
    },
  });

  // Test the operation
  const appointmentData = {
    clientId: client.id,
    artistId: artist.id,
    serviceId: 'test-service',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    price: 100,
  };

  const appointment = await appointmentService.createAppointment(appointmentData);

  expect(appointment).toBeDefined();
  expect(appointment.clientId).toBe(client.id);
  expect(appointment.artistId).toBe(artist.id);
});
```