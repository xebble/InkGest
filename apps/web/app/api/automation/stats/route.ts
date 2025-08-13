import { NextResponse } from 'next/server';
import type { AutomationStats } from '../../../../lib/services/automationService';

// GET /api/automation/stats - Get automation statistics
export async function GET() {
  try {
    // In a real implementation, you would query the database for actual stats
    // For now, we'll return mock data
    const stats: AutomationStats = {
      totalJobs: 0,
      pendingJobs: 0,
      sentJobs: 0,
      failedJobs: 0,
      birthdayGreetings: 0,
      appointmentReminders: 0,
      postCareFollowups: 0
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get automation stats error:', error);
    
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