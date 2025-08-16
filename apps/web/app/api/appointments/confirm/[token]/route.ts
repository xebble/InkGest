import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/services/reminderService';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Confirmation token is required' },
        { status: 400 }
      );
    }

    const result = await reminderService.confirmAppointment(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: result.appointment,
        message: 'Appointment confirmed successfully'
      }
    });
  } catch (error) {
    console.error('Failed to confirm appointment:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm appointment'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Confirmation token is required' },
        { status: 400 }
      );
    }

    // This endpoint is used to validate the token and get appointment details
    // without actually confirming it (for the confirmation page)
    const result = await reminderService.confirmAppointment(token);

    return NextResponse.json({
      success: true,
      data: {
        valid: result.success,
        appointment: result.appointment,
        error: result.error
      }
    });
  } catch (error) {
    console.error('Failed to validate confirmation token:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate confirmation token'
      },
      { status: 500 }
    );
  }
}