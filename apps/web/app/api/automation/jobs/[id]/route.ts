import { NextRequest, NextResponse } from 'next/server';
import type { AutomationJob } from '../../../../../lib/services/automationService';

// PUT /api/automation/jobs/[id] - Update automation job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();

    // Validate job ID
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required'
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would update the job in database
    // For now, we'll simulate the update
    const updatedJob: Partial<AutomationJob> = {
      ...body,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    console.error('Update automation job error:', error);
    
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

// DELETE /api/automation/jobs/[id] - Delete automation job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Validate job ID
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required'
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would delete the job from database
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Job deleted successfully'
      }
    });
  } catch (error) {
    console.error('Delete automation job error:', error);
    
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