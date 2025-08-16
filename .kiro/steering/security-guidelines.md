# Security Guidelines - InkGest

## Authentication & Authorization

### NextAuth.js Configuration
```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { company: true },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          storeIds: JSON.parse(user.storeIds),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.storeIds = user.storeIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.storeIds = token.storeIds as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### Role-Based Access Control
```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  appointments: {
    create: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ARTIST'],
    update: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    delete: ['ADMIN', 'MANAGER'],
  },
  clients: {
    create: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ARTIST'],
    update: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    delete: ['ADMIN', 'MANAGER'],
  },
  financial: {
    read: ['ADMIN', 'MANAGER'],
    update: ['ADMIN', 'MANAGER'],
  },
  settings: {
    read: ['ADMIN', 'MANAGER'],
    update: ['ADMIN'],
  },
} as const;

export function hasPermission(
  userRole: string,
  resource: keyof typeof PERMISSIONS,
  action: string
): boolean {
  const allowedRoles = PERMISSIONS[resource]?.[action as keyof typeof PERMISSIONS[typeof resource]];
  return allowedRoles?.includes(userRole as any) ?? false;
}

// Middleware for API routes
export function requirePermission(resource: keyof typeof PERMISSIONS, action: string) {
  return async (req: NextRequest, context: any, next: () => Promise<Response>) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, resource, action)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return next();
  };
}
```

### Store-Level Access Control
```typescript
// lib/store-access.ts
export async function validateStoreAccess(
  userId: string,
  storeId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  const userStoreIds = JSON.parse(user.storeIds) as string[];
  return userStoreIds.includes(storeId);
}

// Middleware for store-specific operations
export function requireStoreAccess() {
  return async (req: NextRequest, context: any, next: () => Promise<Response>) => {
    const session = await getServerSession(authOptions);
    const storeId = req.nextUrl.searchParams.get('storeId') || 
                   context.params?.storeId;

    if (!session?.user || !storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateStoreAccess(session.user.id, storeId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Store access denied' }, { status: 403 });
    }

    return next();
  };
}
```

## Input Validation & Sanitization

### Zod Validation Schemas
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// ✅ Good: Comprehensive validation schemas
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  artistId: z.string().uuid('Invalid artist ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  startTime: z.coerce.date().refine(
    (date) => date > new Date(),
    'Start time must be in the future'
  ),
  endTime: z.coerce.date(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  price: z.number().positive('Price must be positive').max(10000, 'Price too high'),
  deposit: z.number().positive('Deposit must be positive').optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const createClientSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Invalid name format'),
  email: z.string().email('Invalid email format').toLowerCase(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  birthDate: z.coerce.date().optional().refine(
    (date) => !date || date < new Date(),
    'Birth date must be in the past'
  ),
  notes: z.string().max(2000, 'Notes too long').optional(),
});

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
}
```

### API Route Validation
```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAppointmentSchema } from '@/lib/validation/schemas';
import { requirePermission, requireStoreAccess } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'appointments', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    // Additional business validation
    await validateBusinessRules(validatedData);

    // Create appointment
    const appointment = await appointmentService.createAppointment(validatedData);

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Data Protection & Privacy

### Personal Data Handling
```typescript
// lib/data-protection.ts
import { createHash, randomBytes, createCipher, createDecipher } from 'crypto';

export class DataProtectionService {
  private readonly encryptionKey = process.env.ENCRYPTION_KEY!;

  // Hash sensitive data (one-way)
  hashSensitiveData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  // Encrypt reversible data
  encryptData(data: string): string {
    const cipher = createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt data
  decryptData(encryptedData: string): string {
    const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Anonymize data for analytics
  anonymizeClientData(client: Client): AnonymizedClient {
    return {
      id: this.hashSensitiveData(client.id),
      ageGroup: this.getAgeGroup(client.birthDate),
      location: this.getLocationArea(client.address),
      serviceHistory: client.appointments.map(a => ({
        serviceType: a.service.category,
        date: a.startTime.toISOString().split('T')[0], // Date only
        price: Math.round(a.price / 10) * 10, // Rounded price
      })),
    };
  }

  // GDPR compliance - data deletion
  async deleteClientData(clientId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // Anonymize appointments instead of deleting (for business records)
      await tx.appointment.updateMany({
        where: { clientId },
        data: {
          notes: null,
          // Keep essential business data, remove personal data
        },
      });

      // Delete personal documents
      await tx.document.deleteMany({
        where: { clientId },
      });

      // Delete client record
      await tx.client.delete({
        where: { id: clientId },
      });
    });
  }

  private getAgeGroup(birthDate: Date | null): string {
    if (!birthDate) return 'unknown';
    
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 18) return 'minor';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }
}
```

### Audit Logging
```typescript
// lib/audit-log.ts
export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, { from: any; to: any }>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogger {
  static async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          ...entry,
          changes: JSON.stringify(entry.changes || {}),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }

  static async logDataAccess(
    userId: string,
    entity: string,
    entityId: string,
    request: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: 'READ',
      entity,
      entityId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }

  static async logDataModification(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    entityId: string,
    changes: Record<string, { from: any; to: any }>,
    request: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entity,
      entityId,
      changes,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }
}
```

## Rate Limiting & DDoS Protection

### API Rate Limiting
```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(private config: RateLimitConfig) {}

  async isAllowed(request: NextRequest): Promise<{ allowed: boolean; resetTime?: number }> {
    const key = this.config.keyGenerator?.(request) || this.getDefaultKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old entries
    this.cleanup(windowStart);

    const requestData = this.requests.get(key);
    
    if (!requestData) {
      this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return { allowed: true };
    }

    if (requestData.resetTime <= now) {
      // Window has expired, reset
      this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return { allowed: true };
    }

    if (requestData.count >= this.config.maxRequests) {
      return { allowed: false, resetTime: requestData.resetTime };
    }

    requestData.count++;
    return { allowed: true };
  }

  private getDefaultKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `ip:${ip}`;
  }

  private cleanup(windowStart: number): void {
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= windowStart) {
        this.requests.delete(key);
      }
    }
  }
}

// Usage in API routes
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const { allowed, resetTime } = await rateLimiter.isAllowed(request);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetTime! - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return handler();
}
```

## Secure Headers & CSRF Protection

### Security Headers Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### CSRF Protection
```typescript
// lib/csrf.ts
import { createHash, randomBytes } from 'crypto';

export class CSRFProtection {
  private static readonly SECRET = process.env.CSRF_SECRET!;

  static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const random = randomBytes(16).toString('hex');
    const payload = `${sessionId}:${timestamp}:${random}`;
    const signature = createHash('sha256')
      .update(payload + this.SECRET)
      .digest('hex');
    
    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  static validateToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [session, timestamp, random, signature] = decoded.split(':');
      
      if (session !== sessionId) {
        return false;
      }

      // Check if token is not too old (1 hour)
      const tokenTime = parseInt(timestamp);
      if (Date.now() - tokenTime > 60 * 60 * 1000) {
        return false;
      }

      // Verify signature
      const payload = `${session}:${timestamp}:${random}`;
      const expectedSignature = createHash('sha256')
        .update(payload + this.SECRET)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}

// Middleware for form submissions
export function requireCSRFToken() {
  return async (request: NextRequest, context: any, next: () => Promise<Response>) => {
    if (request.method === 'GET') {
      return next();
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = request.headers.get('x-csrf-token') || 
                 (await request.formData()).get('_csrf_token') as string;

    if (!token || !CSRFProtection.validateToken(token, session.user.id)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    return next();
  };
}
```

## Environment & Secrets Management

### Environment Validation
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  
  // External APIs
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Email
  EMAIL_FROM: z.string().email(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  CRON_SECRET: z.string().min(16).optional(),
});

export type Environment = z.infer<typeof envSchema>;

let env: Environment;

export function getEnvironment(): Environment {
  if (!env) {
    try {
      env = envSchema.parse(process.env);
    } catch (error) {
      console.error('Environment validation failed:', error);
      process.exit(1);
    }
  }
  return env;
}

// Validate environment on startup
getEnvironment();
```

## Security Testing

### Security Test Patterns
```typescript
// __tests__/security/auth.test.ts
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/appointments/route';

describe('Authentication Security', () => {
  test('should reject requests without authentication', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          body: JSON.stringify({
            clientId: 'test-client',
            artistId: 'test-artist',
            serviceId: 'test-service',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            price: 100,
          }),
        });

        expect(response.status).toBe(401);
      },
    });
  });

  test('should reject requests with invalid permissions', async () => {
    // Test with artist role trying to access admin endpoints
    const mockSession = {
      user: { id: 'test-user', role: 'ARTIST' },
    };

    // Mock getServerSession to return artist session
    jest.mocked(getServerSession).mockResolvedValue(mockSession);

    await testApiHandler({
      handler: adminHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        expect(response.status).toBe(403);
      },
    });
  });
});

// __tests__/security/input-validation.test.ts
describe('Input Validation Security', () => {
  test('should reject XSS attempts', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    
    const result = createClientSchema.safeParse({
      name: maliciousInput,
      email: 'test@example.com',
      phone: '+1234567890',
    });

    expect(result.success).toBe(false);
  });

  test('should reject SQL injection attempts', async () => {
    const maliciousInput = "'; DROP TABLE clients; --";
    
    const result = createClientSchema.safeParse({
      name: maliciousInput,
      email: 'test@example.com',
      phone: '+1234567890',
    });

    expect(result.success).toBe(false);
  });
});
```