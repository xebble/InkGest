import { NextRequest, NextResponse } from 'next/server';

// GET /api/calendar/availability - Get artist availability from external calendars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const duration = searchParams.get('duration');


    if (!artistId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'artistId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Mock availability data
    const mockAvailability = {
      google: [
        { start: new Date('2024-01-15T09:00:00Z'), end: new Date('2024-01-15T10:00:00Z'), available: false },
      ],
      microsoft: [
        { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z'), available: false },
      ],
    };

    const mockLocalAvailability = [
      { start: new Date('2024-01-15T11:00:00Z'), end: new Date('2024-01-15T12:00:00Z'), available: false, appointmentId: 'local-1' },
    ];

    let availableSlots;
    if (duration) {
      const durationMinutes = parseInt(duration);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        return NextResponse.json(
          { error: 'Invalid duration' },
          { status: 400 }
        );
      }

      // Mock available slots
      availableSlots = [
        { start: new Date('2024-01-15T08:00:00Z'), end: new Date('2024-01-15T09:00:00Z') },
        { start: new Date('2024-01-15T13:00:00Z'), end: new Date('2024-01-15T14:00:00Z') },
      ];
    }

    return NextResponse.json({
      artistId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      duration: duration ? parseInt(duration) : undefined,
      externalAvailability: mockAvailability,
      localAvailability: mockLocalAvailability,
      availableSlots: availableSlots || undefined,
      providers: [
        { name: 'google', displayName: 'Google Calendar', isConnected: true, syncEnabled: true },
        { name: 'microsoft', displayName: 'Microsoft Outlook', isConnected: true, syncEnabled: true },
      ],
    });

  } catch (error) {
    console.error('Calendar availability error:', error);
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/availability/check - Check for conflicts before scheduling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, startTime, endTime } = body;

    if (!artistId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'artistId, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'startTime must be before endTime' },
        { status: 400 }
      );
    }

    // Mock conflict check
    const mockConflicts = {
      external: {
        google: [
          {
            eventId: 'google-conflict-1',
            title: 'Existing Google Event',
            startTime: new Date('2024-01-15T10:30:00Z'),
            endTime: new Date('2024-01-15T11:30:00Z'),
            conflictType: 'overlap',
            severity: 'high',
          },
        ],
      },
      local: [],
      businessHours: false,
    };

    const hasConflicts = Object.values(mockConflicts.external).some(
      (providerConflicts: any) => providerConflicts.length > 0
    );

    return NextResponse.json({
      available: !hasConflicts,
      conflicts: mockConflicts,
      recommendations: hasConflicts ? [
        { start: new Date('2024-01-15T08:00:00Z'), end: new Date('2024-01-15T09:00:00Z') },
        { start: new Date('2024-01-15T13:00:00Z'), end: new Date('2024-01-15T14:00:00Z') },
      ] : undefined,
    });

  } catch (error) {
    console.error('Calendar conflict check error:', error);
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    );
  }
}