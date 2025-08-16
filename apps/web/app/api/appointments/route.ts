import { NextRequest, NextResponse } from 'next/server';
import { appointmentService } from '@/lib/services/appointmentService';
import { z } from 'zod';

// Create appointment
const createAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  artistId: z.string().uuid('Invalid artist ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  notes: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  deposit: z.number().positive('Deposit must be positive').optional()
});

// Get appointments query
const getAppointmentsSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  artistId: z.string().uuid('Invalid artist ID').optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    const appointmentData: any = {
      clientId: validatedData.clientId,
      artistId: validatedData.artistId,
      serviceId: validatedData.serviceId,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      price: validatedData.price
    };

    if (validatedData.roomId) appointmentData.roomId = validatedData.roomId;
    if (validatedData.notes) appointmentData.notes = validatedData.notes;
    if (validatedData.deposit) appointmentData.deposit = validatedData.deposit;

    const appointment = await appointmentService.createAppointment(appointmentData);

    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Failed to create appointment:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to create appointment'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      storeId: searchParams.get('storeId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      artistId: searchParams.get('artistId'),
      clientId: searchParams.get('clientId'),
      status: searchParams.get('status')
    };

    const validatedQuery = getAppointmentsSchema.parse(queryParams);

    const filters: any = {};
    if (validatedQuery.startDate) filters.startDate = new Date(validatedQuery.startDate);
    if (validatedQuery.endDate) filters.endDate = new Date(validatedQuery.endDate);
    if (validatedQuery.artistId) filters.artistId = validatedQuery.artistId;
    if (validatedQuery.clientId) filters.clientId = validatedQuery.clientId;
    if (validatedQuery.status) filters.status = validatedQuery.status;

    const appointments = await appointmentService.getStoreAppointments(
      validatedQuery.storeId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Failed to get appointments:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to get appointments'
      },
      { status: 500 }
    );
  }
}