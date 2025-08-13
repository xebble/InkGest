import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';
import { hasPermission } from '../../../lib/permissions';
import { CompanyService } from '../../../lib/services/company';
import { CreateCompanyData } from '../../../lib/services/company';
import { ValidationError } from '../../../types';

const companyService = new CompanyService();

async function handleGET(_request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const companies = await companyService.getAllCompanies();
    
    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch companies' } },
      { status: 500 }
    );
  }
}

async function handlePOST(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data: CreateCompanyData = {
      name: body.name,
      settings: body.settings,
      subscription: body.subscription,
    };

    const company = await companyService.createCompany(data);
    
    return NextResponse.json({
      success: true,
      data: company,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    console.error('Error creating company:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create company' } },
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
    return handleGET(req);
  })(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!hasPermission(req.user.role, 'companies', 'create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    return handlePOST(req);
  })(request);
}