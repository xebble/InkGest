import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { hasPermission, hasStoreAccess, hasSameCompanyAccess, Resource } from '../permissions';
import { Role } from '../../types';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    companyId: string;
    storeIds: string[];
  };
}

/**
 * Middleware to authenticate requests and add user info
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'
      });

      if (!token) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        );
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: token.id,
        email: token.email || '',
        name: token.name || '',
        role: token.role,
        companyId: token.companyId,
        storeIds: token.storeIds,
      };

      return await handler(authenticatedRequest);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to check permissions for a specific resource and action
 */
export function withPermission(
  resource: Resource,
  action: string
) {
  return (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) => {
    return async (request: AuthenticatedRequest): Promise<NextResponse> => {
      if (!hasPermission(request.user.role, resource, action)) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'FORBIDDEN', 
              message: `Insufficient permissions for ${resource}:${action}` 
            } 
          },
          { status: 403 }
        );
      }

      return await handler(request);
    };
  };
}

/**
 * Middleware to check store access
 */
export function withStoreAccess(
  getStoreId: (req: AuthenticatedRequest) => string | null
) {
  return (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) => {
    return async (request: AuthenticatedRequest): Promise<NextResponse> => {
      const storeId = getStoreId(request);
      
      if (!storeId) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'Store ID is required' } },
          { status: 400 }
        );
      }

      if (!hasStoreAccess(request.user.storeIds, storeId)) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'FORBIDDEN', 
              message: 'Access denied to this store' 
            } 
          },
          { status: 403 }
        );
      }

      return await handler(request);
    };
  };
}

/**
 * Middleware to check company access
 */
export function withCompanyAccess(
  getCompanyId: (req: AuthenticatedRequest) => string | null
) {
  return (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) => {
    return async (request: AuthenticatedRequest): Promise<NextResponse> => {
      const companyId = getCompanyId(request);
      
      if (!companyId) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'Company ID is required' } },
          { status: 400 }
        );
      }

      if (!hasSameCompanyAccess(request.user.companyId, companyId)) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'FORBIDDEN', 
              message: 'Access denied to this company' 
            } 
          },
          { status: 403 }
        );
      }

      return await handler(request);
    };
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose<T extends NextRequest>(
  ...middlewares: Array<(handler: (req: T) => Promise<NextResponse>) => (req: T) => Promise<NextResponse>>
) {
  return (handler: (req: T) => Promise<NextResponse>) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}