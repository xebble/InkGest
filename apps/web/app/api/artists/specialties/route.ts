import { NextResponse } from 'next/server';
import { artistService } from '@/lib/services/artistService';
import { ApiResponse } from '@/types';

export async function GET(): Promise<NextResponse> {
  try {
    const specialties = await artistService.getArtistSpecialties();

    const response: ApiResponse<string[]> = {
      success: true,
      data: specialties
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching specialties:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}