import { NextRequest, NextResponse } from 'next/server';
// import { db } from '../../../../lib/db';
import type { AutomationJob } from '../../../../lib/services/automationService';
import { z } from 'zod';

// Validation schema for automation jobs
const automationJobSchema = z.object({
  type: z.enum(['birthday_greeting', 'appointment_reminder_24h', 'appointment_reminder_2h', 'post_care_followup']),
  clientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  scheduledFor: z.string().datetime(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).default('pending'),
  attempts: z.number().int().min(0).default(0),
  error: z.string().optional()
});

// GET /api/automation/jobs - Get automation jobs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const clientId = searchParams.get('clientId');
    const appointmentId = searchParams.get('appointmentId');
    const due = searchParams.get('due');
    // const limit = parseInt(searchParams.get('limit') || '50');
    // const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (due) {
      where.scheduledFor = {
        lte: new Date(due)
      };
    }

    // For this implementation, we'll simulate the database query
    // In a real implementation, you would use your actual database
    const mockJobs: AutomationJob[] = [];

    return NextResponse.json({
      success: true,
      data: mockJobs
    });
  } catch (error) {
    console.error('Get automation jobs error:', error);
    
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

// POST /api/automation/jobs - Create new automation job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedJob = automationJobSchema.parse(body);
    
    // Create job ID
    const jobId = crypto.randomUUID();
    
    // Create job object
    const job: AutomationJob = {
      id: jobId,
      type: validatedJob.type,
      clientId: validatedJob.clientId,
      appointmentId: validatedJob.appointmentId,
      scheduledFor: new Date(validatedJob.scheduledFor),
      status: validatedJob.status,
      attempts: validatedJob.attempts,
      error: validatedJob.error,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, you would save to database
    // For now, we'll just return the created job
    
    return NextResponse.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Create automation job error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid job data',
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

// DELETE /api/automation/jobs/cleanup - Clean up old jobs
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { cutoffDate } = body;

    if (!cutoffDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cutoff date is required'
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would delete old jobs from database
    const deletedCount = 0; // Placeholder

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        message: `Deleted ${deletedCount} old automation jobs`
      }
    });
  } catch (error) {
    
    
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