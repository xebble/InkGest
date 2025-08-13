import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';
import { hasPermission, hasSameCompanyAccess } from '../../../../lib/permissions';
import { CompanyService } from '../../../../lib/services/company';
import { UpdateCompanyData } from '../../../../lib/services/company';
import { ValidationError, NotFoundError } from '../../../../types';

const companyService = new CompanyService();

async function handleGET(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Company ID is required' } },
        { status: 400 }
      );
    }

    const company = await companyService.getCompanyById(id);
    
    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    console.error('Error fetching company:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch company' } },
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
        { success: false, error: { code: 'BAD_REQUEST', message: 'Company ID is required' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data: UpdateCompanyData = {
      name: body.name,
      settings: body.settings,
      subscription: body.subscription,
    };

    const company = await companyService.updateCompany(id, data);
    
    return NextResponse.json({
      success: true,
      data: company,
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

    console.error('Error updating company:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update company' } },
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
        { success: false, error: { code: 'BAD_REQUEST', message: 'Company ID is required' } },
        { status: 400 }
      );
    }

    await companyService.deleteCompany(id);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Company deleted successfully' },
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

    console.error('Error deleting company:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete company' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'companies', 'read')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const companyId = url.pathname.split('/').pop();
    
    if (companyId && !hasSameCompanyAccess(req.user.companyId, companyId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this company' } },
        { status: 403 }
      );
    }
    
    return handleGET(req);
  })(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'companies', 'update')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const companyId = url.pathname.split('/').pop();
    
    if (companyId && !hasSameCompanyAccess(req.user.companyId, companyId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this company' } },
        { status: 403 }
      );
    }
    
    return handlePUT(req);
  })(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'companies', 'delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const companyId = url.pathname.split('/').pop();
    
    if (companyId && !hasSameCompanyAccess(req.user.companyId, companyId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this company' } },
        { status: 403 }
      );
    }
    
    return handleDELETE(req);
  })(request);
}