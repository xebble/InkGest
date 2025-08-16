# React 19 Patterns & Best Practices - InkGest

## New React 19 Features

### React Compiler
- React 19 includes an automatic compiler that optimizes re-renders
- Reduces need for manual `useMemo`, `useCallback`, and `React.memo`
- Focus on writing clean, readable code rather than premature optimization
- The compiler handles most performance optimizations automatically

### Actions and Form Handling
```typescript
// Use Server Actions for form submissions
async function createAppointment(formData: FormData) {
  'use server';
  
  const data = {
    clientId: formData.get('clientId') as string,
    serviceId: formData.get('serviceId') as string,
    // ... other fields
  };
  
  const validatedData = appointmentSchema.parse(data);
  await db.appointment.create({ data: validatedData });
  
  revalidatePath('/appointments');
}

// In your component
function AppointmentForm() {
  return (
    <form action={createAppointment}>
      <input name="clientId" required />
      <input name="serviceId" required />
      <button type="submit">Create Appointment</button>
    </form>
  );
}
```

### useActionState Hook
```typescript
import { useActionState } from 'react';

function AppointmentForm() {
  const [state, formAction] = useActionState(createAppointment, null);
  
  return (
    <form action={formAction}>
      {state?.error && <div className="error">{state.error}</div>}
      <input name="clientId" required />
      <button type="submit">Create Appointment</button>
    </form>
  );
}
```

## Component Patterns

### Server Components Best Practices
```typescript
// ✅ Good: Server Component with direct data fetching
async function AppointmentsList({ storeId }: { storeId: string }) {
  const appointments = await db.appointment.findMany({
    where: { storeId },
    include: { client: true, service: true }
  });
  
  return (
    <div>
      {appointments.map(appointment => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}

// ✅ Good: Client Component for interactivity
'use client';
function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {/* Interactive content */}
    </div>
  );
}
```

### Composition Patterns
```typescript
// ✅ Good: Composition over inheritance
interface AppointmentLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

function AppointmentLayout({ children, sidebar, header }: AppointmentLayoutProps) {
  return (
    <div className="appointment-layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}
```

### Error Boundaries with React 19
```typescript
'use client';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="error-boundary">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function AppointmentPage() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <AppointmentsList />
    </ErrorBoundary>
  );
}
```

## State Management Patterns

### Local State with useState
```typescript
'use client';
function AppointmentForm() {
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    startTime: '',
  });
  
  // React 19 compiler optimizes this automatically
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <form>
      <input 
        value={formData.clientId}
        onChange={(e) => handleChange('clientId', e.target.value)}
      />
    </form>
  );
}
```

### Global State with Zustand
```typescript
// stores/appointmentStore.ts
import { create } from 'zustand';

interface AppointmentStore {
  selectedDate: Date;
  selectedArtist: string | null;
  setSelectedDate: (date: Date) => void;
  setSelectedArtist: (artistId: string | null) => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  selectedDate: new Date(),
  selectedArtist: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedArtist: (artistId) => set({ selectedArtist: artistId }),
}));
```

## Data Fetching Patterns

### Server-Side Data Fetching
```typescript
// ✅ Preferred: Direct database access in Server Components
async function AppointmentPage({ params }: { params: { id: string } }) {
  const appointment = await db.appointment.findUnique({
    where: { id: params.id },
    include: { client: true, service: true, artist: true }
  });
  
  if (!appointment) {
    notFound();
  }
  
  return <AppointmentDetails appointment={appointment} />;
}
```

### Client-Side Data Fetching (when necessary)
```typescript
'use client';
import useSWR from 'swr';

function AppointmentStats({ storeId }: { storeId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/appointments/stats?storeId=${storeId}`,
    fetcher
  );
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading stats</div>;
  
  return <StatsDisplay data={data} />;
}
```

## Form Handling with React 19

### Server Actions
```typescript
// actions/appointments.ts
'use server';

export async function createAppointment(prevState: any, formData: FormData) {
  try {
    const data = {
      clientId: formData.get('clientId') as string,
      serviceId: formData.get('serviceId') as string,
      startTime: new Date(formData.get('startTime') as string),
    };
    
    const validatedData = createAppointmentSchema.parse(data);
    const appointment = await db.appointment.create({ data: validatedData });
    
    revalidatePath('/appointments');
    return { success: true, appointment };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Form Component with useActionState
```typescript
'use client';
import { useActionState } from 'react';
import { createAppointment } from '@/actions/appointments';

function AppointmentForm() {
  const [state, formAction, isPending] = useActionState(createAppointment, null);
  
  return (
    <form action={formAction}>
      {state?.error && (
        <div className="error">{state.error}</div>
      )}
      
      <input name="clientId" required disabled={isPending} />
      <input name="serviceId" required disabled={isPending} />
      <input name="startTime" type="datetime-local" required disabled={isPending} />
      
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Appointment'}
      </button>
      
      {state?.success && (
        <div className="success">Appointment created successfully!</div>
      )}
    </form>
  );
}
```

## Performance Optimization

### Automatic Optimization
- React 19 compiler handles most optimizations automatically
- Avoid premature optimization with manual memoization
- Focus on component architecture and data flow

### When to Use Manual Optimization
```typescript
// Only use manual optimization for expensive computations
const expensiveValue = useMemo(() => {
  return heavyComputation(largeDataSet);
}, [largeDataSet]);

// Or for preventing unnecessary re-renders of expensive components
const MemoizedChart = memo(ExpensiveChart);
```

### Streaming and Suspense
```typescript
import { Suspense } from 'react';

function AppointmentPage() {
  return (
    <div>
      <h1>Appointments</h1>
      <Suspense fallback={<div>Loading appointments...</div>}>
        <AppointmentsList />
      </Suspense>
      <Suspense fallback={<div>Loading stats...</div>}>
        <AppointmentStats />
      </Suspense>
    </div>
  );
}
```

## Testing Patterns

### Testing Server Components
```typescript
// __tests__/AppointmentsList.test.tsx
import { render, screen } from '@testing-library/react';
import AppointmentsList from '@/components/AppointmentsList';

// Mock the database
jest.mock('@/lib/db', () => ({
  appointment: {
    findMany: jest.fn(),
  },
}));

test('renders appointments list', async () => {
  const mockAppointments = [
    { id: '1', client: { name: 'John Doe' }, service: { name: 'Tattoo' } }
  ];
  
  (db.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);
  
  render(await AppointmentsList({ storeId: 'store-1' }));
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### Testing Client Components
```typescript
// __tests__/AppointmentForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentForm from '@/components/AppointmentForm';

test('submits form with correct data', async () => {
  const mockAction = jest.fn();
  
  render(<AppointmentForm action={mockAction} />);
  
  fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'client-1' } });
  fireEvent.click(screen.getByText('Create Appointment'));
  
  await waitFor(() => {
    expect(mockAction).toHaveBeenCalledWith(expect.any(FormData));
  });
});
```

## Migration from React 18

### Gradual Migration
- React 19 is backward compatible with React 18 patterns
- Gradually adopt new features like Server Actions
- Update components to use new hooks when beneficial
- Remove manual optimizations where React Compiler can handle them

### Breaking Changes to Watch
- Some legacy patterns may need updates
- Check for deprecated APIs in your codebase
- Update testing utilities for new React features
- Review third-party library compatibility