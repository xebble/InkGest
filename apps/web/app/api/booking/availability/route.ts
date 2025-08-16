import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const availabilitySchema = z.object({
  storeId: z.string().uuid(),
  serviceId: z.string().uuid(),
  artistId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

interface TimeSlot {
  time: string;
  available: boolean;
  datetime: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      storeId: searchParams.get('storeId'),
      serviceId: searchParams.get('serviceId'),
      artistId: searchParams.get('artistId'),
      date: searchParams.get('date'),
    };

    // Validate parameters
    const validatedParams = availabilitySchema.parse(params);

    // Get service details for duration
    const service = await db.service.findUnique({
      where: { id: validatedParams.serviceId },
      select: { duration: true, name: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get artist details and schedule
    const artist = await db.artist.findUnique({
      where: { id: validatedParams.artistId },
      select: { 
        schedule: true,
        user: {
          select: { name: true }
        }
      },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Parse the requested date
    const requestedDate = new Date(validatedParams.date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Parse artist schedule
    let artistSchedule;
    try {
      artistSchedule = JSON.parse(artist.schedule);
    } catch {
      artistSchedule = {};
    }

    const daySchedule = artistSchedule[dayOfWeek];
    
    // Check if artist works on this day
    if (!daySchedule || !daySchedule.isWorking) {
      return NextResponse.json({
        success: true,
        data: {
          slots: [],
          message: 'Artist is not available on this day',
        },
      });
    }

    // Generate time slots based on artist's schedule
    const startTime = daySchedule.startTime || '09:00';
    const endTime = daySchedule.endTime || '18:00';
    const breaks = daySchedule.breaks || [];

    const slots = generateTimeSlots(
      requestedDate,
      startTime,
      endTime,
      service.duration,
      breaks
    );

    // Get existing appointments for this artist on this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await db.appointment.findMany({
      where: {
        artistId: validatedParams.artistId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Mark slots as unavailable if they conflict with existing appointments
    const availableSlots = slots.map(slot => {
      const slotStart = slot.datetime;
      const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);

      const hasConflict = existingAppointments.some(appointment => {
        return (
          slotStart < appointment.endTime && slotEnd > appointment.startTime
        );
      });

      return {
        ...slot,
        available: !hasConflict,
      };
    });

    // Filter out past time slots for today
    const now = new Date();
    const filteredSlots = availableSlots.filter(slot => {
      if (requestedDate.toDateString() === now.toDateString()) {
        return slot.datetime > now;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: {
        slots: filteredSlots,
        artist: artist.user.name,
        service: service.name,
        date: validatedParams.date,
      },
    });

  } catch (error) {
    console.error('Error fetching availability:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTimeSlots(
  date: Date,
  startTime: string,
  endTime: string,
  serviceDuration: number,
  breaks: Array<{ startTime: string; endTime: string }> = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  if (startHour === undefined || startMinute === undefined || endHour === undefined || endMinute === undefined) {
    return [];
  }
  
  const startDateTime = new Date(date);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // Generate slots every 30 minutes (or service duration if shorter)
  const slotInterval = Math.min(30, serviceDuration); // minutes
  
  let currentTime = new Date(startDateTime);
  
  while (currentTime.getTime() + serviceDuration * 60000 <= endDateTime.getTime()) {
    const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);
    
    // Check if this slot conflicts with any breaks
    const conflictsWithBreak = breaks.some(breakPeriod => {
      const [breakStartHour, breakStartMinute] = breakPeriod.startTime.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = breakPeriod.endTime.split(':').map(Number);
      
      if (breakStartHour === undefined || breakStartMinute === undefined || 
          breakEndHour === undefined || breakEndMinute === undefined) {
        return false;
      }
      
      const breakStart = new Date(date);
      breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
      
      const breakEnd = new Date(date);
      breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
      
      return currentTime < breakEnd && slotEndTime > breakStart;
    });
    
    if (!conflictsWithBreak) {
      slots.push({
        time: currentTime.toTimeString().slice(0, 5), // HH:MM format
        available: true, // Will be updated based on existing appointments
        datetime: new Date(currentTime),
      });
    }
    
    // Move to next slot
    currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
  }
  
  return slots;
}