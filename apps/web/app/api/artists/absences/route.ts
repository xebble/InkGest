import { NextRequest, NextResponse } from 'next/server';
import { artistService } from '@/lib/services/artistService';
import { CreateAbsenceData, ApiResponse, ArtistAbsence } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data: CreateAbsenceData = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate)
    };

    // Basic validation
    if (!data.artistId || !data.startDate || !data.endDate || !data.type) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Missing required fields'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const absence = await artistService.createAbsence(data);

    const response: ApiResponse<ArtistAbsence> = {
      success: true,
      data: absence
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating absence:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && error.message.includes('validation') ? 400 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}