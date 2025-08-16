import { NextRequest, NextResponse } from 'next/server';

// GET /api/calendar/auth/[provider] - Get authentication URL or status
export async function GET(
  _request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    
    if (!['google', 'microsoft', 'apple'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Return authentication URLs or status based on provider
    switch (provider) {
      case 'google':
        const googleAuthUrl = await getGoogleAuthUrl();
        return NextResponse.json({ authUrl: googleAuthUrl });
      
      case 'microsoft':
        const microsoftAuthUrl = await getMicrosoftAuthUrl();
        return NextResponse.json({ authUrl: microsoftAuthUrl });
      
      case 'apple':
        // Apple Calendar uses CalDAV with app-specific passwords
        return NextResponse.json({ 
          message: 'Apple Calendar requires app-specific password',
          instructions: 'Please generate an app-specific password from your Apple ID settings'
        });
      
      default:
        return NextResponse.json({ error: 'Provider not supported' }, { status: 400 });
    }
  } catch (error) {
    console.error('Calendar auth error:', error);
    return NextResponse.json(
      { error: 'Failed to get authentication URL' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/auth/[provider] - Authenticate with provider
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const body = await request.json();

    if (!['google', 'microsoft', 'apple'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Mock authentication - in real implementation would authenticate with provider
    console.log(`Authenticating with ${provider}`, body.credentials);
    
    return NextResponse.json({ 
      success: true,
      message: `${provider} calendar connected successfully`
    });
  } catch (error) {
    console.error('Calendar authentication error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate calendar' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/auth/[provider] - Disconnect provider
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;

    if (!['google', 'microsoft', 'apple'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Mock disconnect - in real implementation would disconnect from provider
    console.log(`Disconnecting from ${provider}`);
    
    return NextResponse.json({ 
      success: true,
      message: `${provider} calendar disconnected successfully`
    });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getGoogleAuthUrl(): Promise<string> {
  const { google } = await import('googleapis');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env['GOOGLE_CLIENT_ID'] || 'mock-client-id',
    process.env['GOOGLE_CLIENT_SECRET'] || 'mock-client-secret',
    process.env['GOOGLE_REDIRECT_URI'] || 'http://localhost:3000/auth/google/callback'
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

async function getMicrosoftAuthUrl(): Promise<string> {
  const clientId = process.env['MICROSOFT_CLIENT_ID'] || 'mock-client-id';
  const redirectUri = process.env['MICROSOFT_REDIRECT_URI'] || 'http://localhost:3000/auth/microsoft/callback';
  const scopes = 'https://graph.microsoft.com/calendars.readwrite';
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_mode=query`;

  return authUrl;
}