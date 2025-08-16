# Naming Conventions - InkGest

## File Naming Standards

### React Components

```
✅ Correct: PascalCase for component files
components/
├── ui/
│   ├── Button.tsx          # Base UI component
│   ├── Input.tsx           # Base UI component
│   ├── Card.tsx            # Base UI component
│   └── Select.tsx          # Base UI component
├── appointments/
│   ├── AppointmentCard.tsx # Feature component
│   ├── AppointmentForm.tsx # Feature component
│   └── CalendarView.tsx    # Feature component
└── reminders/
    ├── ReminderStats.tsx
    └── ReminderTemplateManager.tsx

❌ Incorrect: camelCase or kebab-case for components
components/ui/button.tsx     # Wrong
components/ui/appointment-card.tsx # Wrong
```

### Pages and Layouts (Next.js 15 App Router)

```
✅ Correct: lowercase for Next.js special files
app/
├── layout.tsx              # Root layout
├── page.tsx                # Root page
├── loading.tsx             # Loading UI
├── error.tsx               # Error UI
├── not-found.tsx           # 404 page
├── [locale]/
│   ├── layout.tsx          # Locale-specific layout
│   ├── page.tsx            # Locale-specific page
│   └── (dashboard)/
│       ├── layout.tsx      # Dashboard layout
│       ├── appointments/
│       │   ├── page.tsx    # Appointments page
│       │   ├── loading.tsx # Appointments loading
│       │   └── [id]/
│       │       └── page.tsx # Individual appointment page
│       └── clients/
│           └── page.tsx
└── api/
    ├── appointments/
    │   ├── route.ts        # API route
    │   └── [id]/
    │       └── route.ts
    └── reminders/
        └── route.ts
```

### Services and Utilities

```
✅ Correct: kebab-case for service and utility files (more common in community)
lib/
├── services/
│   ├── appointment-service.ts    # Main service
│   ├── reminder-service.ts       # Reminder service
│   ├── communication-service.ts  # Communication service
│   └── calendar-service.ts       # Calendar service
├── utils/
│   ├── date-utils.ts            # Date utilities
│   ├── validation-utils.ts      # Validation utilities
│   └── format-utils.ts          # Format utilities
└── validation/
    ├── appointment-schemas.ts   # Validation schemas
    └── client-schemas.ts        # Client schemas

✅ Acceptable alternative: PascalCase for services as classes
lib/services/
├── AppointmentService.ts        # If exporting classes
├── ReminderService.ts
└── CommunicationService.ts
```

### Custom Hooks

```
✅ Correct: kebab-case starting with 'use' (more common in community)
hooks/
├── use-appointments.ts          # Appointments hook
├── use-reminders.ts             # Reminders hook
├── use-calendar-integration.ts  # Calendar integration hook
└── use-clients.ts               # Clients hook

✅ Acceptable alternative: camelCase (less common but valid)
hooks/
├── useAppointments.ts
├── useReminders.ts
└── useClients.ts
```

### Stores (Zustand)

```
✅ Correct: kebab-case ending with '-store' (more common)
stores/
├── appointment-store.ts         # Appointments store
├── client-store.ts              # Clients store
├── ui-store.ts                  # UI store
└── auth-store.ts                # Authentication store

✅ Acceptable alternative: camelCase ending with 'Store'
stores/
├── appointmentStore.ts
├── clientStore.ts
└── authStore.ts
```

### Types and Interfaces

```
✅ Correct: camelCase for files, PascalCase for types
types/
├── appointment.ts              # Appointment types
├── client.ts                   # Client types
├── reminder.ts                 # Reminder types
└── index.ts                    # Barrel export

// Inside the files:
export interface AppointmentData {     // PascalCase
  id: string;
  clientId: string;
}

export type AppointmentStatus =        // PascalCase
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED';
```

## Variable and Function Naming

### Variables and Functions

```typescript
// ✅ Correct: camelCase
const appointmentData = { ... };
const clientList = [ ... ];
const isLoading = false;
const hasPermission = true;

function createAppointment(data: AppointmentData) { ... }
function validateClientData(client: Client) { ... }
function formatAppointmentTime(date: Date) { ... }

// ❌ Incorrect: PascalCase, snake_case, kebab-case
const AppointmentData = { ... };        // Wrong
const appointment_data = { ... };       // Wrong
const client_list = [ ... ];            // Wrong
```

### Constants

```typescript
// ✅ Correct: SCREAMING_SNAKE_CASE for global constants
export const MAX_APPOINTMENTS_PER_DAY = 20;
export const DEFAULT_APPOINTMENT_DURATION = 60;
export const REMINDER_TYPES = ["24h", "2h", "confirmation"] as const;

// ✅ Correct: camelCase for local constants
const defaultFormData = {
  clientId: "",
  serviceId: "",
};

const apiEndpoints = {
  appointments: "/api/appointments",
  clients: "/api/clients",
};
```

### Enums

```typescript
// ✅ Correct: PascalCase for enum, SCREAMING_SNAKE_CASE for values
enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  ARTIST = "ARTIST",
  EMPLOYEE = "EMPLOYEE",
}
```

## Component Naming Patterns

### Component Names

```typescript
// ✅ Correct: Descriptive PascalCase
export function AppointmentCard({ appointment }: AppointmentCardProps) { ... }
export function ClientProfileForm({ client }: ClientProfileFormProps) { ... }
export function ReminderTemplateManager({ templates }: ReminderTemplateManagerProps) { ... }

// ❌ Incorrect: Generic or confusing names
export function Card({ ... }) { ... }           // Too generic
export function Form({ ... }) { ... }           // Too generic
export function Manager({ ... }) { ... }        // Confusing
```

### Props Interfaces

```typescript
// ✅ Correct: Component name + 'Props'
interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
}

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientData) => void;
  onCancel: () => void;
}

// ❌ Incorrect: Generic names
interface Props { ... }                         // Too generic
interface CardProps { ... }                     // Ambiguous
```

### Event Handlers

```typescript
// ✅ Correct: 'handle' + action in PascalCase
const handleSubmit = (data: FormData) => { ... };
const handleAppointmentEdit = (appointment: Appointment) => { ... };
const handleClientDelete = (clientId: string) => { ... };
const handleFormCancel = () => { ... };

// ✅ Correct: 'on' + action for props
interface ComponentProps {
  onSubmit: (data: FormData) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}
```

## Database and API Naming

### Database Fields (Prisma)

```prisma
// ✅ Correct: camelCase for fields
model Appointment {
  id            String   @id @default(cuid())
  clientId      String   // camelCase
  artistId      String   // camelCase
  serviceId     String   // camelCase
  startTime     DateTime // camelCase
  endTime       DateTime // camelCase
  createdAt     DateTime @default(now()) // camelCase
  updatedAt     DateTime @updatedAt      // camelCase

  @@map("appointments") // snake_case for table
}

// ❌ Incorrect: snake_case for fields
model Appointment {
  client_id     String   // Wrong
  start_time    DateTime // Wrong
  created_at    DateTime // Wrong
}
```

### API Routes

```
✅ Correct: kebab-case for URLs, plural resources
/api/appointments
/api/appointments/[id]
/api/appointments/[id]/reminders
/api/clients
/api/clients/[id]
/api/reminder-templates
/api/communication-preferences

❌ Incorrect: camelCase or singular resources
/api/appointment          # Singular
/api/appointmentReminders # camelCase
/api/Appointments         # PascalCase
```

### API Response Fields

```typescript
// ✅ Correct: camelCase for JSON responses
{
  "success": true,
  "data": {
    "appointmentId": "123",
    "clientName": "John Doe",
    "startTime": "2024-01-01T10:00:00Z",
    "createdAt": "2024-01-01T08:00:00Z"
  }
}

// ❌ Incorrect: snake_case in JSON
{
  "appointment_id": "123",    // Wrong
  "client_name": "John Doe",  // Wrong
  "start_time": "..."         // Wrong
}
```

## CSS and Styling

### CSS Classes

```css
/* ✅ Correct: kebab-case for CSS classes */
.appointment-card { ... }
.client-profile-form { ... }
.reminder-template-manager { ... }
.btn-primary { ... }
.form-input { ... }

/* ❌ Incorrect: camelCase or PascalCase */
.appointmentCard { ... }     /* Wrong */
.AppointmentCard { ... }     /* Wrong */
.appointment_card { ... }    /* Wrong */
```

### Tailwind Classes

```typescript
// ✅ Correct: Use Tailwind classes as they are
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h3 className="text-lg font-semibold text-gray-900">
    {appointment.service.name}
  </h3>
</div>

// ✅ Correct: Combine with custom classes
<div className="appointment-card flex items-center p-4">
  ...
</div>
```

## Test Files

### Test File Naming

```
✅ Correct: Same name as file + '.test.ts'
__tests__/
├── components/
│   ├── AppointmentCard.test.tsx
│   ├── ClientForm.test.tsx
│   └── ReminderStats.test.tsx
├── services/
│   ├── appointment-service.test.ts
│   ├── reminder-service.test.ts
│   └── communication-service.test.ts
├── hooks/
│   ├── use-appointments.test.ts
│   └── use-reminders.test.ts
└── utils/
    ├── date-utils.test.ts
    └── validation-utils.test.ts
```

### Test Descriptions

```typescript
// ✅ Correct: Clear and specific descriptions
describe('AppointmentService', () => {
  describe('createAppointment', () => {
    test('should create appointment with valid data', () => { ... });
    test('should throw ValidationError with invalid data', () => { ... });
    test('should schedule reminders automatically', () => { ... });
  });

  describe('updateAppointment', () => {
    test('should update appointment status', () => { ... });
    test('should reschedule reminders when time changes', () => { ... });
  });
});
```

## Environment Variables

### Environment Variable Naming

```bash
# ✅ Correct: SCREAMING_SNAKE_CASE
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
WHATSAPP_ACCESS_TOKEN=your-token
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
EMAIL_FROM=noreply@inkgest.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
CRON_SECRET=your-cron-secret

# ❌ Incorrect: camelCase or kebab-case
databaseUrl=...              # Wrong
nextauth-secret=...          # Wrong
whatsAppToken=...            # Wrong
```

## Barrel Exports

### Index Files

```typescript
// ✅ Correct: Use barrel exports for organization
// components/appointments/index.ts
export { AppointmentCard } from "./AppointmentCard";
export { AppointmentForm } from "./AppointmentForm";
export { AppointmentList } from "./AppointmentList";
export { CalendarView } from "./CalendarView";

// components/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
export { Select } from "./Select";

// lib/services/index.ts
export { appointmentService } from "./appointment-service";
export { reminderService } from "./reminder-service";
export { communicationService } from "./communication-service";
```

## Convention Summary

| Type                      | Convention            | Example                                  |
| ------------------------- | --------------------- | ---------------------------------------- |
| **React Components**      | PascalCase            | `AppointmentCard.tsx`                    |
| **Pages/Layouts Next.js** | lowercase             | `page.tsx`, `layout.tsx`                 |
| **Services/Utils**        | kebab-case            | `appointment-service.ts`                 |
| **Hooks**                 | kebab-case + 'use'    | `use-appointments.ts`                    |
| **Stores**                | kebab-case + '-store' | `appointment-store.ts`                   |
| **Types/Interfaces**      | PascalCase            | `AppointmentData`                        |
| **Variables/Functions**   | camelCase             | `appointmentData`, `createAppointment()` |
| **Global Constants**      | SCREAMING_SNAKE_CASE  | `MAX_APPOINTMENTS_PER_DAY`               |
| **Enums**                 | PascalCase            | `AppointmentStatus`                      |
| **CSS Classes**           | kebab-case            | `appointment-card`                       |
| **API Routes**            | kebab-case            | `/api/appointments`                      |
| **Database Tables**       | snake_case            | `appointments`                           |
| **Database Fields**       | camelCase             | `clientId`, `startTime`                  |
| **Environment Variables** | SCREAMING_SNAKE_CASE  | `DATABASE_URL`                           |
| **Test Files**            | name + '.test.ts'     | `AppointmentCard.test.tsx`               |

## Official vs Community Conventions

### Important Differences

**Official Next.js/React:**

- Components: PascalCase (Button.tsx) ✅
- Next.js special files: lowercase (page.tsx, layout.tsx) ✅
- No official convention for services/hooks/stores

**Community/Ecosystem:**

- Services: kebab-case (appointment-service.ts) - More common
- Hooks: kebab-case (use-appointments.ts) - More common in large projects
- Stores: kebab-case (appointment-store.ts) - Consistent with services

**Popular Reference Projects:**

- Vercel/Next.js examples: Use kebab-case for non-component files
- shadcn/ui: Uses kebab-case for utilities and hooks
- T3 Stack: Mixes both conventions

### Recommendation for InkGest

Use **kebab-case** for files that are not React components, because:

1. More readable in URLs and imports
2. Avoids issues in case-sensitive file systems
3. It's the trend in modern projects
4. Maintains consistency with CSS classes

## Herramientas de Enforcement

### ESLint Rules

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variableLike",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      },
      {
        "selector": "enumMember",
        "format": ["UPPER_CASE"]
      }
    ]
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

These conventions ensure consistency throughout the InkGest project and facilitate collaboration between developers.
