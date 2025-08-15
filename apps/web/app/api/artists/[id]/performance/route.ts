import { NextRequest, NextResponse } from 'next/server';
import { commissionService } from '@/lib/services/commissionService';
import { ApiResponse, ArtistPerformanceReport } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: artistId } = await params;
    const { searchParams } = new URL(request.url);
    
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Start date and end date are required'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Invalid date format'
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (startDate >= endDate) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'End date must be after start date'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const report = await commissionService.generateArtistPerformanceReport(artistId, startDate, endDate);

    const response: ApiResponse<ArtistPerformanceReport> = {
      success: true,
      data: report
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating performance report:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}