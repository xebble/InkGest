import { NextRequest, NextResponse } from 'next/server';
import { messageTemplates, getMessageTemplate, getActiveTemplates, getTemplatesByChannel } from '../../../../lib/templates/messageTemplates';
import type { MessageType } from '../../../../lib/services/communicationService';

// GET /api/communications/templates - Get message templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as MessageType | null;
    const channel = searchParams.get('channel') as 'whatsapp' | 'email' | 'sms' | null;
    const activeOnly = searchParams.get('active') === 'true';

    let templates = messageTemplates;

    // Filter by type
    if (type) {
      const template = getMessageTemplate(type);
      templates = template ? [template] : [];
    }

    // Filter by channel
    if (channel) {
      templates = getTemplatesByChannel(channel);
    }

    // Filter active only
    if (activeOnly) {
      templates = getActiveTemplates();
    }

    return NextResponse.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Templates API error:', error);
    
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

// PUT /api/communications/templates - Update template status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, isActive } = body;

    if (!templateId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Template ID and isActive status are required'
        },
        { status: 400 }
      );
    }

    // Find template
    const templateIndex = messageTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found'
        },
        { status: 404 }
      );
    }

    // Update template status
    if (messageTemplates[templateIndex]) {
      messageTemplates[templateIndex].isActive = isActive;
    }

    return NextResponse.json({
      success: true,
      data: messageTemplates[templateIndex]
    });
  } catch (error) {
    console.error('Template update error:', error);
    
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