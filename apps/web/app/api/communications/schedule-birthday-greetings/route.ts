import { NextResponse } from 'next/server';
import { automationService } from '../../../../lib/services/automationService';

// POST /api/communications/schedule-birthday-greetings - Schedule birthday greetings
export async function POST() {
  try {
    await automationService.scheduleBirthdayGreetings();
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Birthday greetings scheduled successfully'
      }
    });
  } catch (error) {
    console.error('Schedule birthday greetings error:', error);
    
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