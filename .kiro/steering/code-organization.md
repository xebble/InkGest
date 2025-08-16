# Code Organization & Architecture - InkGest

## Project Structure

### Monorepo Organization
```
inkgest/
├── apps/
│   ├── web/                    # Main Next.js application
│   │   ├── app/               # Next.js 15 App Router
│   │   │   ├── [locale]/      # Internationalized routes
│   │   │   │   ├── (dashboard)/  # Route groups
│   │   │   │   ├── (auth)/       # Authentication routes
│   │   │   │   └── layout.tsx    # Locale-specific layout
│   │   │   ├── api/           # API routes
│   │   │   │   ├── appointments/
│   │   │   │   ├── clients/
│   │   │   │   ├── reminders/
│   │   │   │   └── auth/
│   │   │   └── globals.css
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Base UI components
│   │   │   ├── forms/        # Form components
│   │   │   ├── layout/       # Layout components
│   │   │   └── features/     # Feature-specific components
│   │   │       ├── appointments/
│   │   │       ├── clients/
│   │   │       ├── reminders/
│   │   │       └── calendar/
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries
│   │   │   ├── services/     # Business logic services
│   │   │   ├── utils/        # Helper functions
│   │   │   ├── validation/   # Validation schemas
│   │   │   └── middleware/   # API middleware
│   │   ├── types/            # TypeScript type definitions
│   │   ├── styles/           # Global styles and themes
│   │   └── __tests__/        # Test files
│   └── mobile/               # Future React Native app
├── packages/
│   ├── database/             # Prisma schema and migrations
│   ├── ui/                   # Shared UI components
│   ├── utils/                # Shared utilities
│   ├── types/                # Shared TypeScript types
│   └── config/               # Shared configurations
└── docs/                     # Documentation
```

### Feature-Based Organization
```typescript
// ✅ Good: Feature-based component organization
components/
├── appointments/
│   ├── AppointmentCard.tsx
│   ├── AppointmentForm.tsx
│   ├── AppointmentList.tsx
│   ├── CalendarView.tsx
│   └── index.ts              # Barrel export
├── clients/
│   ├── ClientProfile.tsx
│   ├── ClientForm.tsx
│   ├── ClientList.tsx
│   └── index.ts
├── reminders/
│   ├── ReminderStats.tsx
│   ├── ReminderTemplateManager.tsx
│   └── index.ts
└── ui/                       # Base components
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    └── index.ts
```

## Component Architecture

### Component Hierarchy
```typescript
// ✅ Good: Clear component hierarchy with proper separation
// Layout Components (Server Components)
export default function AppointmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="appointment-layout">
      <AppointmentHeader />
      <div className="appointment-content">
        <AppointmentSidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}

// Page Components (Server Components)
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { date?: string; artist?: string };
}) {
  const appointments = await getAppointments({
    date: searchParams.date ? new Date(searchParams.date) : new Date(),
    artistId: searchParams.artist,
  });

  return (
    <div>
      <AppointmentFilters />
      <AppointmentList appointments={appointments} />
    </div>
  );
}

// Interactive Components (Client Components)
'use client';
export function AppointmentForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState(initialState);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Composition Patterns
```typescript
// ✅ Good: Composition over inheritance
interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppointmentCard({ 
  appointment, 
  actions, 
  footer 
}: AppointmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3>{appointment.service.name}</h3>
        <p>{appointment.client.name}</p>
      </CardHeader>
      <CardContent>
        <AppointmentDetails appointment={appointment} />
      </CardContent>
      {actions && <CardActions>{actions}</CardActions>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

// Usage with different compositions
<AppointmentCard
  appointment={appointment}
  actions={
    <>
      <Button onClick={handleEdit}>Edit</Button>
      <Button onClick={handleCancel} variant="destructive">Cancel</Button>
    </>
  }
  footer={<AppointmentStatus status={appointment.status} />}
/>
```

## Service Layer Architecture

### Service Organization
```typescript
// lib/services/index.ts - Service registry
export { appointmentService } from './appointmentService';
export { clientService } from './clientService';
export { reminderService } from './reminderService';
export { communicationService } from './communicationService';
export { calendarService } from './calendarService';

// lib/services/base/BaseService.ts
export abstract class BaseService {
  protected db = db;
  protected logger = console; // Replace with proper logger

  protected async withTransaction<T>(
    operation: (tx: any) => Promise<T>
  ): Promise<T> {
    return await this.db.$transaction(operation);
  }

  protected handleError(error: unknown, context: string): never {
    this.logger.error(`Error in ${context}:`, error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof NotFoundError) {
      throw error;
    }
    
    throw new Error(`Internal error in ${context}`);
  }
}

// lib/services/appointmentService.ts
export class AppointmentService extends BaseService {
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      return await this.withTransaction(async (tx) => {
        // Validate business rules
        await this.validateAppointmentData(data);
        
        // Check for conflicts
        await this.checkForConflicts(data);
        
        // Create appointment
        const appointment = await tx.appointment.create({
          data: this.prepareAppointmentData(data),
          include: this.getAppointmentIncludes(),
        });
        
        // Schedule reminders
        await reminderService.scheduleAppointmentReminders(appointment.id);
        
        return appointment;
      });
    } catch (error) {
      this.handleError(error, 'createAppointment');
    }
  }

  private getAppointmentIncludes() {
    return {
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
    };
  }
}
```

### Dependency Injection
```typescript
// lib/container.ts - Simple DI container
class Container {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  register<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    const service = factory();
    this.services.set(name, service);
    return service;
  }
}

export const container = new Container();

// Register services
container.register('appointmentService', () => new AppointmentService());
container.register('reminderService', () => new ReminderService());
container.register('communicationService', () => new CommunicationService());

// Usage in API routes
export async function POST(request: NextRequest) {
  const appointmentService = container.get<AppointmentService>('appointmentService');
  // Use service...
}
```

## State Management

### Global State with Zustand
```typescript
// stores/appointmentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppointmentState {
  // State
  selectedDate: Date;
  selectedArtist: string | null;
  viewMode: 'day' | 'week' | 'month';
  filters: AppointmentFilters;
  
  // Actions
  setSelectedDate: (date: Date) => void;
  setSelectedArtist: (artistId: string | null) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  updateFilters: (filters: Partial<AppointmentFilters>) => void;
  resetFilters: () => void;
}

export const useAppointmentStore = create<AppointmentState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedDate: new Date(),
      selectedArtist: null,
      viewMode: 'day',
      filters: {},

      // Actions
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedArtist: (artistId) => set({ selectedArtist: artistId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: {} }),
    }),
    { name: 'appointment-store' }
  )
);

// Selectors for derived state
export const useAppointmentSelectors = () => {
  const store = useAppointmentStore();
  
  return {
    ...store,
    hasActiveFilters: Object.keys(store.filters).length > 0,
    isToday: store.selectedDate.toDateString() === new Date().toDateString(),
  };
};
```

### Server State Management
```typescript
// hooks/useAppointments.ts
import useSWR from 'swr';
import { useAppointmentStore } from '@/stores/appointmentStore';

export function useAppointments(storeId: string) {
  const { selectedDate, selectedArtist, filters } = useAppointmentStore();
  
  const queryParams = new URLSearchParams({
    storeId,
    date: selectedDate.toISOString(),
    ...(selectedArtist && { artistId: selectedArtist }),
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>),
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/appointments?${queryParams}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const createAppointment = async (appointmentData: CreateAppointmentData) => {
    // Optimistic update
    const optimisticAppointment = {
      id: 'temp-' + Date.now(),
      ...appointmentData,
      status: 'SCHEDULED' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mutate(
      (current: any) => ({
        ...current,
        data: [...(current?.data || []), optimisticAppointment],
      }),
      false
    );

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      const result = await response.json();
      
      // Revalidate to get the real data
      mutate();
      
      return result.data;
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    }
  };

  return {
    appointments: data?.data || [],
    isLoading,
    error,
    createAppointment,
    refresh: mutate,
  };
}
```

## Error Handling Architecture

### Error Boundary System
```typescript
// components/ErrorBoundary.tsx
'use client';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
        // Send to error reporting service
      }}
      onReset={() => {
        // Clear any error state
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AppErrorBoundary>
          {children}
        </AppErrorBoundary>
      </body>
    </html>
  );
}
```

### Global Error Handler
```typescript
// lib/error-handler.ts
export class GlobalErrorHandler {
  static handleError(error: unknown, context?: string): void {
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', errorInfo);
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorInfo);
    }
  }

  private static async reportError(errorInfo: any): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

// Set up global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    GlobalErrorHandler.handleError(event.error, 'window.error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    GlobalErrorHandler.handleError(event.reason, 'unhandledrejection');
  });
}
```

## Testing Architecture

### Test Organization
```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// __tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          {
            id: '1',
            clientId: 'client-1',
            artistId: 'artist-1',
            serviceId: 'service-1',
            startTime: '2024-01-01T10:00:00Z',
            endTime: '2024-01-01T11:00:00Z',
            status: 'SCHEDULED',
            price: 100,
          },
        ],
      })
    );
  }),

  rest.post('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: '2',
          ...req.body,
          status: 'SCHEDULED',
          createdAt: new Date().toISOString(),
        },
      })
    );
  }),
];
```

### Component Testing Patterns
```typescript
// __tests__/components/AppointmentCard.test.tsx
import { render, screen, fireEvent } from '@/test-utils';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';

const mockAppointment = {
  id: '1',
  client: { name: 'John Doe', email: 'john@example.com' },
  service: { name: 'Tattoo Session', duration: 120 },
  artist: { user: { name: 'Jane Artist' } },
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T12:00:00Z'),
  status: 'SCHEDULED' as const,
  price: 200,
};

describe('AppointmentCard', () => {
  test('renders appointment information correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Tattoo Session')).toBeInTheDocument();
    expect(screen.getByText('Jane Artist')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    
    render(
      <AppointmentCard 
        appointment={mockAppointment}
        actions={<button onClick={() => onEdit(mockAppointment)}>Edit</button>}
      />
    );
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockAppointment);
  });
});
```

## Documentation Standards

### Code Documentation
```typescript
/**
 * Creates a new appointment with automatic reminder scheduling
 * 
 * @param data - The appointment data to create
 * @returns Promise resolving to the created appointment with relations
 * 
 * @throws {ValidationError} When appointment data is invalid
 * @throws {ConflictError} When time slot is not available
 * 
 * @example
 * ```typescript
 * const appointment = await appointmentService.createAppointment({
 *   clientId: 'client-123',
 *   artistId: 'artist-456',
 *   serviceId: 'service-789',
 *   startTime: new Date('2024-01-01T10:00:00Z'),
 *   endTime: new Date('2024-01-01T11:00:00Z'),
 *   price: 100,
 * });
 * ```
 */
async createAppointment(data: CreateAppointmentData): Promise<AppointmentWithRelations> {
  // Implementation...
}

/**
 * Validates appointment data against business rules
 * 
 * @internal
 * @param data - Appointment data to validate
 * @throws {ValidationError} When validation fails
 */
private async validateAppointmentData(data: CreateAppointmentData): Promise<void> {
  // Implementation...
}
```

### README Templates
```markdown
# Component Name

Brief description of what this component does.

## Usage

```tsx
import { ComponentName } from '@/components/ComponentName';

function Example() {
  return (
    <ComponentName
      prop1="value1"
      prop2={value2}
      onAction={handleAction}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prop1 | string | Yes | - | Description of prop1 |
| prop2 | number | No | 0 | Description of prop2 |
| onAction | function | No | - | Callback when action occurs |

## Examples

### Basic Usage
[Example code]

### Advanced Usage
[Example code]

## Testing

```bash
npm test ComponentName
```

## Notes

- Important implementation details
- Known limitations
- Future improvements
```