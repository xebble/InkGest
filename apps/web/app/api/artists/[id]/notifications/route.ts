import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { ApiResponse, ArtistNotification } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: artistId } = params;
    const { searchParams } = new URL(request.url);
    
    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');
    
    const limit = limitStr ? parseInt(limitStr) : 50;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    if (limit < 1 || limit > 100) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Limit must be between 1 and 100'
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (offset < 0) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Offset must be non-negative'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const notifications = await notificationService.getArtistNotifications(artistId, limit, offset);

    const response: ApiResponse<ArtistNotification[]> = {
      success: true,
      data: notifications
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: artistId } = params;
    const body = await request.json();
    
    const { type, title, message, data } = body;

    if (!type || !title || !message) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Type, title, and message are required'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const notification = await notificationService.createNotification({
      artistId,
      type,
      title,
      message,
      data
    });

    const response: ApiResponse<ArtistNotification> = {
      success: true,
      data: notification
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(response, { status: statusCode });
  }
}