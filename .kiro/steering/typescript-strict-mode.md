# TypeScript Strict Mode Guidelines - InkGest

## Strict Configuration

### tsconfig.json Settings
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

## Type Safety Patterns

### Proper Type Definitions
```typescript
// ✅ Good: Explicit types with proper optionality
interface CreateAppointmentData {
  clientId: string;
  artistId: string;
  serviceId: string;
  roomId?: string; // Optional
  startTime: Date;
  endTime: Date;
  notes?: string; // Optional
  price: number;
  deposit?: number; // Optional
}

// ✅ Good: Use branded types for IDs
type ClientId = string & { readonly brand: unique symbol };
type ArtistId = string & { readonly brand: unique symbol };

interface Appointment {
  id: string;
  clientId: ClientId;
  artistId: ArtistId;
  startTime: Date;
  endTime: Date;
}
```

### Handling Optional Properties
```typescript
// ✅ Good: Proper handling of optional properties
function updateAppointment(id: string, data: Partial<CreateAppointmentData>) {
  const updateData: Record<string, any> = {};
  
  // Use explicit checks for optional properties
  if (data.clientId !== undefined) updateData.clientId = data.clientId;
  if (data.roomId !== undefined) updateData.roomId = data.roomId;
  if (data.notes !== undefined) updateData.notes = data.notes;
  
  return db.appointment.update({ where: { id }, data: updateData });
}

// ❌ Avoid: Direct assignment of potentially undefined values
function badUpdateAppointment(id: string, data: Partial<CreateAppointmentData>) {
  return db.appointment.update({
    where: { id },
    data: {
      roomId: data.roomId, // This could be undefined
      notes: data.notes,   // This could be undefined
    }
  });
}
```

### Array and Object Access
```typescript
// ✅ Good: Safe array access with noUncheckedIndexedAccess
function getFirstAppointment(appointments: Appointment[]): Appointment | undefined {
  const first = appointments[0]; // Type is Appointment | undefined
  return first;
}

// ✅ Good: Safe object property access
function getEnvironmentVariable(key: string): string {
  const value = process.env[key]; // Type is string | undefined
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

// ✅ Good: Use bracket notation for dynamic property access
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### Null and Undefined Handling
```typescript
// ✅ Good: Explicit null checks
function formatAppointmentTime(appointment: Appointment | null): string {
  if (!appointment) {
    return 'No appointment';
  }
  
  return appointment.startTime.toLocaleString();
}

// ✅ Good: Use nullish coalescing for defaults
function getAppointmentNotes(appointment: Appointment): string {
  return appointment.notes ?? 'No notes provided';
}

// ✅ Good: Optional chaining for nested properties
function getClientEmail(appointment: Appointment & { client?: Client }): string | undefined {
  return appointment.client?.email;
}
```

## Error Handling Patterns

### Custom Error Types
```typescript
// ✅ Good: Typed error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// ✅ Good: Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function createAppointment(data: CreateAppointmentData): Promise<Result<Appointment>> {
  try {
    const appointment = await db.appointment.create({ data });
    return { success: true, data: appointment };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}
```

### Type Guards
```typescript
// ✅ Good: Type guards for runtime type checking
function isValidAppointmentStatus(status: string): status is AppointmentStatus {
  return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status);
}

function isAppointment(obj: unknown): obj is Appointment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'clientId' in obj &&
    'startTime' in obj &&
    typeof (obj as any).id === 'string' &&
    (obj as any).startTime instanceof Date
  );
}

// Usage
function processAppointmentData(data: unknown) {
  if (isAppointment(data)) {
    // data is now typed as Appointment
    console.log(data.startTime.toISOString());
  }
}
```

## API and Database Patterns

### Zod Integration for Runtime Validation
```typescript
import { z } from 'zod';

// ✅ Good: Zod schemas for validation
const createAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  artistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  startTime: z.date(),
  endTime: z.date(),
  notes: z.string().optional(),
  price: z.number().positive(),
  deposit: z.number().positive().optional()
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;

// ✅ Good: API route with proper validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);
    
    const appointment = await createAppointment(validatedData);
    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Prisma Integration
```typescript
// ✅ Good: Proper Prisma types usage
import type { Appointment, Client, Service } from '@prisma/client';

type AppointmentWithRelations = Appointment & {
  client: Client;
  service: Service;
};

async function getAppointmentWithDetails(id: string): Promise<AppointmentWithRelations | null> {
  return await db.appointment.findUnique({
    where: { id },
    include: {
      client: true,
      service: true,
    },
  });
}

// ✅ Good: Type-safe database operations
async function updateAppointmentStatus(
  id: string, 
  status: AppointmentStatus
): Promise<Appointment> {
  return await db.appointment.update({
    where: { id },
    data: { status },
  });
}
```

## Component Type Safety

### Props Interfaces
```typescript
// ✅ Good: Explicit prop types
interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

function AppointmentCard({ 
  appointment, 
  onEdit, 
  onDelete, 
  className 
}: AppointmentCardProps) {
  return (
    <div className={className}>
      <h3>{appointment.service.name}</h3>
      <p>{appointment.client.name}</p>
      {onEdit && (
        <button onClick={() => onEdit(appointment)}>
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(appointment.id)}>
          Delete
        </button>
      )}
    </div>
  );
}
```

### Generic Components
```typescript
// ✅ Good: Generic components with constraints
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

function List<T>({ 
  items, 
  renderItem, 
  keyExtractor, 
  emptyMessage = 'No items found' 
}: ListProps<T>) {
  if (items.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Usage
<List
  items={appointments}
  renderItem={(appointment) => <AppointmentCard appointment={appointment} />}
  keyExtractor={(appointment) => appointment.id}
  emptyMessage="No appointments found"
/>
```

## Utility Types and Helpers

### Custom Utility Types
```typescript
// ✅ Good: Custom utility types
type NonNullable<T> = T extends null | undefined ? never : T;
type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Example usage
type AppointmentWithRequiredNotes = RequiredKeys<Appointment, 'notes'>;
type PartialAppointment = OptionalKeys<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
```

### Type-safe Environment Variables
```typescript
// ✅ Good: Type-safe environment configuration
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  EMAIL_FROM: z.string().email(),
});

type Environment = z.infer<typeof envSchema>;

function getEnvironment(): Environment {
  const env = envSchema.parse(process.env);
  return env;
}

// Usage
const env = getEnvironment();
// env is now fully typed and validated
```

## Testing with TypeScript

### Type-safe Mocks
```typescript
// ✅ Good: Type-safe mocks
const mockAppointment: Appointment = {
  id: 'test-id',
  clientId: 'client-id',
  artistId: 'artist-id',
  serviceId: 'service-id',
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T11:00:00Z'),
  status: 'SCHEDULED',
  price: 100,
  notes: null,
  deposit: null,
  roomId: null,
  googleEventId: null,
  storeId: 'store-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ✅ Good: Type-safe mock functions
const mockCreateAppointment = jest.fn<Promise<Appointment>, [CreateAppointmentData]>();
mockCreateAppointment.mockResolvedValue(mockAppointment);
```

## Common Pitfalls to Avoid

### Index Signature Access
```typescript
// ❌ Avoid: Unchecked index access
const value = obj[key]; // Could be undefined

// ✅ Good: Check before access
const value = key in obj ? obj[key] : undefined;
// or
const value = obj[key as keyof typeof obj];
```

### Any Type Usage
```typescript
// ❌ Avoid: Using any
function processData(data: any) {
  return data.someProperty;
}

// ✅ Good: Use proper types or unknown
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: unknown }).someProperty;
  }
  throw new Error('Invalid data structure');
}
```

### Non-null Assertions
```typescript
// ❌ Avoid: Non-null assertions without proper checks
const appointment = appointments.find(a => a.id === id)!;

// ✅ Good: Proper null checking
const appointment = appointments.find(a => a.id === id);
if (!appointment) {
  throw new NotFoundError('Appointment', id);
}
```