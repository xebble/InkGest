import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { appointmentService } from '@/lib/services/appointmentService';


const guardianInfoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  relationship: z.enum(['parent', 'guardian', 'other']),
  idDocument: z.string().min(1),
});

const medicalInfoSchema = z.object({
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const clientDataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  birthDate: z.string().optional(),
  isMinor: z.boolean().default(false),
  guardianInfo: z.string().optional(),
  medicalInfo: z.string().optional(),
  imageRights: z.boolean().default(false),
  source: z.string().default('online_booking'),
});

const createBookingSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  artistId: z.string().uuid('Invalid artist ID').optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  price: z.number().positive('Price must be positive'),
  clientData: clientDataSchema,
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Validate that end time is after start time
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Validate guardian info for minors
    if (validatedData.clientData.isMinor) {
      if (!validatedData.clientData.guardianInfo) {
        return NextResponse.json(
          { success: false, error: 'Guardian information is required for minors' },
          { status: 400 }
        );
      }

      try {
        const guardianInfo = JSON.parse(validatedData.clientData.guardianInfo);
        guardianInfoSchema.parse(guardianInfo);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid guardian information' },
          { status: 400 }
        );
      }
    }

    // Validate medical info if provided
    if (validatedData.clientData.medicalInfo) {
      try {
        const medicalInfo = JSON.parse(validatedData.clientData.medicalInfo);
        medicalInfoSchema.parse(medicalInfo);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid medical information' },
          { status: 400 }
        );
      }
    }

    // Check if service and store exist
    const service = await db.service.findUnique({
      where: { id: validatedData.serviceId },
      include: { store: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    if (service.storeId !== validatedData.storeId) {
      return NextResponse.json(
        { success: false, error: 'Service does not belong to the specified store' },
        { status: 400 }
      );
    }

    // If no specific artist is selected, find an available one
    let selectedArtistId = validatedData.artistId;
    
    if (!selectedArtistId) {
      const availableArtists = await db.artist.findMany({
        where: {
          storeId: validatedData.storeId,
        },
        include: {
          appointments: {
            where: {
              startTime: {
                lt: endTime,
              },
              endTime: {
                gt: startTime,
              },
              status: {
                notIn: ['CANCELLED', 'NO_SHOW'],
              },
            },
          },
        },
      });

      // Find an artist with no conflicts
      const availableArtist = availableArtists.find(artist => 
        artist.appointments.length === 0
      );

      if (!availableArtist) {
        return NextResponse.json(
          { success: false, error: 'No artists available for the selected time slot' },
          { status: 400 }
        );
      }

      selectedArtistId = availableArtist.id;
    } else {
      // Verify the selected artist exists and is available
      const artist = await db.artist.findUnique({
        where: { id: selectedArtistId },
        include: {
          appointments: {
            where: {
              startTime: {
                lt: endTime,
              },
              endTime: {
                gt: startTime,
              },
              status: {
                notIn: ['CANCELLED', 'NO_SHOW'],
              },
            },
          },
        },
      });

      if (!artist) {
        return NextResponse.json(
          { success: false, error: 'Artist not found' },
          { status: 404 }
        );
      }

      if (artist.storeId !== validatedData.storeId) {
        return NextResponse.json(
          { success: false, error: 'Artist does not belong to the specified store' },
          { status: 400 }
        );
      }

      if (artist.appointments.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Artist is not available for the selected time slot' },
          { status: 400 }
        );
      }
    }

    // Create or find existing client
    let client = await db.client.findFirst({
      where: {
        email: validatedData.clientData.email,
        storeId: validatedData.storeId,
      },
    });

    if (!client) {
      // Create new client
      const clientCreateData = {
        storeId: validatedData.storeId,
        name: validatedData.clientData.name,
        email: validatedData.clientData.email,
        phone: validatedData.clientData.phone,
        birthDate: validatedData.clientData.birthDate ? new Date(validatedData.clientData.birthDate) : null,
        isMinor: validatedData.clientData.isMinor,
        guardianInfo: validatedData.clientData.guardianInfo || null,
        medicalInfo: validatedData.clientData.medicalInfo || null,
        imageRights: validatedData.clientData.imageRights,
        source: validatedData.clientData.source,
        loyaltyPoints: 0,
      };

      client = await db.client.create({
        data: clientCreateData,
      });
    } else {
      // Update existing client with new information
      client = await db.client.update({
        where: { id: client.id },
        data: {
          name: validatedData.clientData.name,
          phone: validatedData.clientData.phone,
          birthDate: validatedData.clientData.birthDate ? new Date(validatedData.clientData.birthDate) : client.birthDate,
          isMinor: validatedData.clientData.isMinor,
          guardianInfo: validatedData.clientData.guardianInfo || client.guardianInfo,
          medicalInfo: validatedData.clientData.medicalInfo || client.medicalInfo,
          imageRights: validatedData.clientData.imageRights,
        },
      });
    }

    // Create the appointment
    const appointmentData = {
      clientId: client.id,
      artistId: selectedArtistId,
      serviceId: validatedData.serviceId,
      startTime,
      endTime,
      price: validatedData.price,
      ...(validatedData.notes && { notes: validatedData.notes }),
    };

    const appointment = await appointmentService.createAppointment(appointmentData);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        appointmentId: appointment.id,
        clientId: client.id,
        message: 'Appointment booked successfully',
      },
    });

  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid booking data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}