import { NextRequest, NextResponse } from 'next/server';
import { appointmentService } from '@/lib/services/appointmentService';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// Update appointment
const updateAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID').optional(),
  artistId: z.string().uuid('Invalid artist ID').optional(),
  serviceId: z.string().uuid('Invalid service ID').optional(),
  roomId: z.string().uuid('Invalid room ID').optional(),
  startTime: z.string().datetime('Invalid start time').optional(),
  endTime: z.string().datetime('Invalid end time').optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  deposit: z.number().positive('Deposit must be positive').optional()
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const appointment = await appointmentService.getAppointment(id);

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Failed to get appointment:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get appointment'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const validatedData = updateAppointmentSchema.parse(body);

    const updateData: any = {};
    if (validatedData.clientId) updateData.clientId = validatedData.clientId;
    if (validatedData.artistId) updateData.artistId = validatedData.artistId;
    if (validatedData.serviceId) updateData.serviceId = validatedData.serviceId;
    if (validatedData.roomId) updateData.roomId = validatedData.roomId;
    if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.notes) updateData.notes = validatedData.notes;
    if (validatedData.price) updateData.price = validatedData.price;
    if (validatedData.deposit) updateData.deposit = validatedData.deposit;

    const appointment = await appointmentService.updateAppointment(id, updateData);

    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Failed to update appointment:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to update appointment'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    const appointment = await appointmentService.cancelAppointment(id, reason || undefined);

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel appointment'
      },
      { status: 500 }
    );
  }
}