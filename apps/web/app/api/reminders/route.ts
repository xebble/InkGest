import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/services/reminderService';
import { z } from 'zod';

// Schedule reminders for an appointment
const scheduleRemindersSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId } = scheduleRemindersSchema.parse(body);

    const reminders = await reminderService.scheduleAppointmentReminders(appointmentId);

    return NextResponse.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Failed to schedule reminders:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule reminders'
      },
      { status: 500 }
    );
  }
}

// Process pending reminders (for cron job)
export async function PUT(request: NextRequest) {
  try {
    // Verify this is called from a cron job or internal service
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env['CRON_SECRET'];
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await reminderService.processPendingReminders();

    return NextResponse.json({
      success: true,
      message: 'Pending reminders processed successfully'
    });
  } catch (error) {
    console.error('Failed to process pending reminders:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process pending reminders'
      },
      { status: 500 }
    );
  }
}