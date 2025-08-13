import { NextRequest, NextResponse } from 'next/server';
import { artistService } from '@/lib/services/artistService';
import { UpdateArtistData, ApiResponse, ArtistWithUser } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;

    const artist = await artistService.getArtistById(id);

    if (!artist) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Artist not found'
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<ArtistWithUser> = {
      success: true,
      data: artist
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching artist:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;
    const body = await request.json();
    const data: UpdateArtistData = { ...body, id };

    const updatedArtist = await artistService.updateArtist(data);

    // Fetch the complete artist with user data
    const artistWithUser = await artistService.getArtistById(updatedArtist.id);

    if (!artistWithUser) {
      throw new Error('Failed to fetch updated artist');
    }

    const response: ApiResponse<ArtistWithUser> = {
      success: true,
      data: artistWithUser
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating artist:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && 
      (error.message.includes('validation') || error.message.includes('not found')) ? 400 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;

    await artistService.deleteArtist(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting artist:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && 
      (error.message.includes('validation') || error.message.includes('not found')) ? 400 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}