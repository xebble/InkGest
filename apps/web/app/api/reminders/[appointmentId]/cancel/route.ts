import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/services/reminderService';

interface RouteParams {
  params: {
    appointmentId: string;
  };
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = params;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    await reminderService.cancelAppointmentReminders(appointmentId);

    return NextResponse.json({
      success: true,
      message: 'Appointment reminders cancelled successfully'
    });
  } catch (error) {
    console.error('Failed to cancel appointment reminders:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel appointment reminders'
      },
      { status: 500 }
    );
  }
}