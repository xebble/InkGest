import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/services/reminderService';
import { z } from 'zod';

const statsQuerySchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date')
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      storeId: searchParams.get('storeId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    };

    const { storeId, startDate, endDate } = statsQuerySchema.parse(queryParams);

    const stats = await reminderService.getReminderStats(
      storeId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get reminder stats:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reminder stats'
      },
      { status: 500 }
    );
  }
}