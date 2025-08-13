import { NextRequest, NextResponse } from 'next/server';
import { emailMessageSchema } from '../../../../lib/services/communicationService';
import { z } from 'zod';
import nodemailer from 'nodemailer';

// Configure email transporter
const createTransporter = () => {
  const emailService = process.env['EMAIL_SERVICE'] || 'smtp';
  
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env['GMAIL_USER'],
        pass: process.env['GMAIL_APP_PASSWORD'],
      },
    });
  } else if (emailService === 'smtp') {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASSWORD'],
      },
    });
  } else {
    throw new Error('Unsupported email service');
  }
};

// POST /api/communications/email - Send email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedMessage = emailMessageSchema.parse(body);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email options
    const mailOptions = {
      from: process.env['EMAIL_FROM'] || process.env['SMTP_USER'],
      to: validatedMessage.to,
      subject: validatedMessage.subject,
      html: validatedMessage.html,
      text: validatedMessage.text,
      attachments: validatedMessage.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    };
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      }
    });
  } catch (error) {
    console.error('Email API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
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

// GET /api/communications/email/test - Test email connection
export async function GET() {
  try {
    const transporter = createTransporter();
    
    // Verify connection
    await transporter.verify();
    
    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        message: 'Email service is working'
      }
    });
  } catch (error) {
    
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: {
          connected: false,
          message: 'Email service connection failed'
        }
      },
      { status: 500 }
    );
  }
}