import { NextRequest, NextResponse } from 'next/server';
import { communicationService } from '../../../../lib/services/communicationService';

// GET /api/communications/stats - Get communication statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Store ID is required'
        },
        { status: 400 }
      );
    }

    const stats = await communicationService.getCommunicationStats(storeId);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Communication stats error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}