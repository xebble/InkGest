import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';
import { hasPermission, hasStoreAccess } from '../../../../lib/permissions';
import { StoreService } from '../../../../lib/services/store';
import { UpdateStoreData } from '../../../../lib/services/store';
import { ValidationError, NotFoundError } from '../../../../types';

const storeService = new StoreService();

async function handleGET(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Store ID is required' } },
        { status: 400 }
      );
    }

    const store = await storeService.getStoreById(id);
    
    return NextResponse.json({
      success: true,
      data: store,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    console.error('Error fetching store:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch store' } },
      { status: 500 }
    );
  }
}

async function handlePUT(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Store ID is required' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data: UpdateStoreData = {
      name: body.name,
      configuration: body.configuration,
      timezone: body.timezone,
      businessHours: body.businessHours,
    };

    const store = await storeService.updateStore(id, data);
    
    return NextResponse.json({
      success: true,
      data: store,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    console.error('Error updating store:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update store' } },
      { status: 500 }
    );
  }
}

async function handleDELETE(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Store ID is required' } },
        { status: 400 }
      );
    }

    await storeService.deleteStore(id);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Store deleted successfully' },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete store' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'stores', 'read')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const storeId = url.pathname.split('/').pop();
    
    if (storeId && !hasStoreAccess(req.user.storeIds, storeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this store' } },
        { status: 403 }
      );
    }
    
    return handleGET(req);
  })(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'stores', 'update')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const storeId = url.pathname.split('/').pop();
    
    if (storeId && !hasStoreAccess(req.user.storeIds, storeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this store' } },
        { status: 403 }
      );
    }
    
    return handlePUT(req);
  })(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'stores', 'delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const storeId = url.pathname.split('/').pop();
    
    if (storeId && !hasStoreAccess(req.user.storeIds, storeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this store' } },
        { status: 403 }
      );
    }
    
    return handleDELETE(req);
  })(request);
}