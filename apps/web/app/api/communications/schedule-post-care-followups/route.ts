import { NextResponse } from 'next/server';
import { automationService } from '../../../../lib/services/automationService';

// POST /api/communications/schedule-post-care-followups - Schedule post-care follow-ups
export async function POST() {
  try {
    await automationService.schedulePostCareFollowups();
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Post-care follow-ups scheduled successfully'
      }
    });
  } catch (error) {
    console.error('Schedule post-care follow-ups error:', error);
    
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