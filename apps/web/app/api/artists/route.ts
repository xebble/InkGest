import { NextRequest, NextResponse } from 'next/server';
import { artistService } from '@/lib/services/artistService';
import { CreateArtistData, ApiResponse, ArtistWithUser } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Store ID is required'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const artists = await artistService.getArtistsByStore(storeId);

    const response: ApiResponse<ArtistWithUser[]> = {
      success: true,
      data: artists
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching artists:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data: CreateArtistData = body;

    // Basic validation
    if (!data.storeId || !data.userId || !data.specialties || !data.schedule) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Missing required fields'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const artist = await artistService.createArtist(data);

    // Fetch the complete artist with user data
    const artistWithUser = await artistService.getArtistById(artist.id);

    if (!artistWithUser) {
      throw new Error('Failed to fetch created artist');
    }

    const response: ApiResponse<ArtistWithUser> = {
      success: true,
      data: artistWithUser
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating artist:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && error.message.includes('validation') ? 400 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}