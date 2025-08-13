import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';
import { hasPermission } from '../../../lib/permissions';
import { StoreService } from '../../../lib/services/store';
import { CreateStoreData } from '../../../lib/services/store';
import { ValidationError } from '../../../types';

const storeService = new StoreService();

async function handleGET(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    
    let stores;
    if (companyId) {
      // Get stores by company ID (for admins/managers)
      stores = await storeService.getStoresByCompanyId(companyId);
    } else {
      // Get accessible stores for the current user
      stores = await storeService.getAccessibleStores(request.user.storeIds);
    }
    
    return NextResponse.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stores' } },
      { status: 500 }
    );
  }
}

async function handlePOST(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data: CreateStoreData = {
      companyId: body.companyId || request.user.companyId,
      name: body.name,
      configuration: body.configuration,
      timezone: body.timezone,
      businessHours: body.businessHours,
    };

    // Ensure user can only create stores in their company
    if (data.companyId !== request.user.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot create store in different company' } },
        { status: 403 }
      );
    }

    const store = await storeService.createStore(data);
    
    return NextResponse.json({
      success: true,
      data: store,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    console.error('Error creating store:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create store' } },
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
    return handleGET(req);
  })(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'stores', 'create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    return handlePOST(req);
  })(request);
}