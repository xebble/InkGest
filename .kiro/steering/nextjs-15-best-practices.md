# Next.js 15 Best Practices - InkGest

## App Router Architecture

### File-based Routing
- Use the `app/` directory for all new routes
- Leverage route groups with `(group-name)` for organization without affecting URL structure
- Use `layout.tsx` files for shared UI components across routes
- Implement `loading.tsx` for loading states and `error.tsx` for error boundaries

### Server Components by Default
- All components in the `app/` directory are Server Components by default
- Use `'use client'` directive only when necessary (interactivity, browser APIs, state)
- Prefer Server Components for data fetching and static content
- Keep client components small and focused on interactivity

## Data Fetching Patterns

### Server-Side Data Fetching
```typescript
// Preferred: Direct database calls in Server Components
async function AppointmentsPage() {
  const appointments = await db.appointment.findMany({
    include: { client: true, service: true }
  });
  
  return <AppointmentsList appointments={appointments} />;
}
```

### API Routes Usage
- Use API routes (`app/api/`) only for:
  - External webhooks
  - Client-side mutations
  - Third-party integrations
- Avoid API routes for internal data fetching in Server Components

### Caching Strategy
- Leverage Next.js automatic caching for `fetch()` requests
- Use `revalidateTag()` and `revalidatePath()` for targeted cache invalidation
- Implement proper cache headers for static assets

## TypeScript Integration

### Strict Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### Type Safety
- Use Prisma generated types for database operations
- Implement proper error boundaries with typed error handling
- Validate API inputs with Zod schemas
- Use `satisfies` operator for better type inference

## Performance Optimization

### Bundle Optimization
- Use dynamic imports for heavy components: `const Component = dynamic(() => import('./Component'))`
- Implement proper code splitting at route level
- Use `next/image` for all images with proper sizing
- Leverage `next/font` for font optimization

### Rendering Strategies
- Use Static Generation (SSG) for pages that don't change frequently
- Implement Incremental Static Regeneration (ISR) for semi-dynamic content
- Use Server-Side Rendering (SSR) only when necessary
- Prefer streaming with Suspense boundaries

## Security Best Practices

### Authentication & Authorization
- Implement proper session management with NextAuth.js
- Use middleware for route protection
- Validate user permissions at both client and server level
- Implement CSRF protection for forms

### Data Validation
- Validate all inputs with Zod schemas
- Sanitize user inputs before database operations
- Use parameterized queries (Prisma handles this automatically)
- Implement rate limiting for API endpoints

## Error Handling

### Error Boundaries
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Global Error Handling
- Implement global error boundaries at layout level
- Use proper error logging and monitoring
- Provide meaningful error messages to users
- Handle network errors gracefully

## State Management

### Server State
- Use Server Components for server state when possible
- Implement optimistic updates for better UX
- Cache server state appropriately

### Client State
- Use React's built-in state management (useState, useReducer)
- Implement Zustand for complex client state
- Avoid unnecessary global state
- Use React Query/SWR for server state synchronization

## Internationalization (i18n)

### next-intl Integration
- Use next-intl for type-safe internationalization
- Implement proper locale routing
- Provide fallback translations
- Use ICU message format for complex translations

## Testing Strategy

### Unit Testing
- Test Server Components with proper mocking
- Use React Testing Library for component testing
- Mock external dependencies appropriately
- Test error states and edge cases

### Integration Testing
- Test API routes with proper request/response validation
- Use Playwright for E2E testing
- Test authentication flows thoroughly
- Validate database operations

## Development Workflow

### Code Organization
- Group related components in feature folders
- Use barrel exports for cleaner imports
- Implement consistent naming conventions
- Separate business logic from UI components

### Git Workflow
- Use conventional commits
- Implement proper branch protection
- Use pre-commit hooks for linting and testing
- Review code thoroughly before merging

## Deployment Considerations

### Production Optimization
- Enable compression and minification
- Implement proper caching strategies
- Use CDN for static assets
- Monitor performance metrics

### Environment Configuration
- Use environment variables for configuration
- Implement proper secrets management
- Use different configurations for different environments
- Validate environment variables at startup