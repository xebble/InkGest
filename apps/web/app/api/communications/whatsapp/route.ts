import { NextRequest, NextResponse } from 'next/server';
import { communicationService, whatsAppMessageSchema } from '../../../../lib/services/communicationService';
import { z } from 'zod';

// POST /api/communications/whatsapp - Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedMessage = whatsAppMessageSchema.parse(body);
    
    // Send WhatsApp message
    const result = await communicationService.sendWhatsAppMessage(validatedMessage as any);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid message format',
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

// GET /api/communications/whatsapp/test - Test WhatsApp connection
export async function GET() {
  try {
    const isConnected = await communicationService.testWhatsAppConnection();
    
    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected ? 'WhatsApp API is working' : 'WhatsApp API connection failed'
      }
    });
  } catch (error) {
    console.error('WhatsApp connection test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: {
          connected: false,
          message: 'WhatsApp API connection test failed'
        }
      },
      { status: 500 }
    );
  }
}