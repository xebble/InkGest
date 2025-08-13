import { NextRequest, NextResponse } from 'next/server';
import { communicationPreferencesSchema, type CommunicationPreferences } from '../../../../../lib/services/communicationService';
import { z } from 'zod';

// GET /api/clients/[id]/communication-preferences - Get client communication preferences
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required'
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would fetch from database
    // For now, return default preferences
    const defaultPreferences: CommunicationPreferences = {
      clientId,
      whatsappEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      appointmentReminders: true,
      birthdayGreetings: true,
      postCareFollowup: true,
      marketingMessages: false,
      preferredLanguage: 'es',
      preferredChannel: 'whatsapp'
    };

    return NextResponse.json({
      success: true,
      data: defaultPreferences
    });
  } catch (error) {
    console.error('Get communication preferences error:', error);
    
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

// PUT /api/clients/[id]/communication-preferences - Update client communication preferences
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const body = await request.json();

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required'
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedPreferences = communicationPreferencesSchema.parse({
      clientId,
      ...body
    });

    // In a real implementation, you would save to database
    // For now, just return the validated preferences
    
    return NextResponse.json({
      success: true,
      data: validatedPreferences
    });
  } catch (error) {
    console.error('Update communication preferences error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid preferences data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
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