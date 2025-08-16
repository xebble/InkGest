'use client';

import React, { useState } from 'react';
import { useCalendarIntegration, useCalendarProviders } from '../../hooks/useCalendarIntegration';
import { CalendarProvider } from '../../lib/services/calendar/types';

interface CalendarIntegrationSettingsProps {
  onClose?: () => void;
}

export const CalendarIntegrationSettings: React.FC<CalendarIntegrationSettingsProps> = ({
  onClose
}) => {
  const { providers, loading: providersLoading, toggleProviderSync } = useCalendarProviders();
  const {
    getAuthUrl,
    authenticateProvider,
    disconnectProvider,
    loading,
    error,
    clearError
  } = useCalendarIntegration();

  const [authInProgress, setAuthInProgress] = useState<string | null>(null);
  const [authCredentials, setAuthCredentials] = useState<Record<string, any>>({});

  const handleConnect = async (provider: CalendarProvider) => {
    try {
      setAuthInProgress(provider.name);
      clearError();

      if (provider.name === 'apple') {
        // Apple Calendar requires manual credential input
        setAuthCredentials(prev => ({
          ...prev,
          [provider.name]: { showForm: true }
        }));
        return;
      }

      // Get authentication URL for Google/Microsoft
      const authUrl = await getAuthUrl(provider.name as 'google' | 'microsoft' | 'apple');
      
      // Open authentication window
      const authWindow = window.open(
        authUrl,
        'calendar-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for authentication completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setAuthInProgress(null);
          // In a real implementation, you'd handle the OAuth callback
          // and extract the credentials from the URL or postMessage
        }
      }, 1000);

    } catch (error) {
      console.error('Authentication error:', error);
      setAuthInProgress(null);
    }
  };

  const handleDisconnect = async (provider: CalendarProvider) => {
    try {
      clearError();
      await disconnectProvider(provider.name as 'google' | 'microsoft' | 'apple');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleAppleAuth = async (credentials: { username: string; password: string }) => {
    try {
      clearError();
      await authenticateProvider('apple', credentials);
      setAuthCredentials(prev => ({
        ...prev,
        apple: { showForm: false }
      }));
    } catch (error) {
      console.error('Apple authentication error:', error);
    }
  };

  const renderProviderCard = (provider: CalendarProvider) => {
    const isConnecting = authInProgress === provider.name;
    const showAppleForm = authCredentials['apple']?.showForm;

    return (
      <div key={provider.name} className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {getProviderIcon(provider.name)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{provider.displayName}</h3>
              <p className="text-sm text-gray-500">
                {provider.isConnected ? 'Connected' : 'Not connected'}
                {provider.lastSync && (
                  <span className="ml-2">
                    • Last sync: {new Date(provider.lastSync).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {provider.isConnected && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={provider.syncEnabled}
                  onChange={() => toggleProviderSync(provider.name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Auto-sync</span>
              </label>
            )}
            
            {provider.isConnected ? (
              <button
                onClick={() => handleDisconnect(provider)}
                disabled={loading}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => handleConnect(provider)}
                disabled={loading || isConnecting}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Apple Calendar credentials form */}
        {provider.name === 'apple' && showAppleForm && (
          <AppleCredentialsForm
            onSubmit={handleAppleAuth}
            onCancel={() => setAuthCredentials(prev => ({
              ...prev,
              apple: { showForm: false }
            }))}
            loading={loading}
          />
        )}

        {/* Provider-specific information */}
        <div className="text-xs text-gray-500">
          {getProviderInfo(provider.name)}
        </div>
      </div>
    );
  };

  if (providersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar Integration</h2>
          <p className="text-gray-600">
            Connect your external calendars to sync appointments automatically
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {providers.map(renderProviderCard)}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Connect your external calendars to sync appointments automatically</li>
          <li>• Appointments created in InkGest will appear in your connected calendars</li>
          <li>• Changes made in external calendars will be detected and conflicts will be flagged</li>
          <li>• You can enable/disable auto-sync for each connected calendar</li>
        </ul>
      </div>
    </div>
  );
};

// Apple credentials form component
interface AppleCredentialsFormProps {
  onSubmit: (credentials: { username: string; password: string }) => void;
  onCancel: () => void;
  loading: boolean;
}

const AppleCredentialsForm: React.FC<AppleCredentialsFormProps> = ({
  onSubmit,
  onCancel,
  loading
}) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apple ID
        </label>
        <input
          type="email"
          value={credentials.username}
          onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your-apple-id@example.com"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          App-Specific Password
        </label>
        <input
          type="password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="xxxx-xxxx-xxxx-xxxx"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Generate an app-specific password from your Apple ID settings
        </p>
      </div>
      
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading || !credentials.username || !credentials.password}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Helper functions
function getProviderIcon(provider: string): React.ReactNode {
  switch (provider) {
    case 'google':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
    case 'microsoft':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#00BCF2" d="M0 0h11.377v11.372H0z"/>
          <path fill="#00BCF2" d="M12.623 0H24v11.372H12.623z"/>
          <path fill="#00BCF2" d="M0 12.623h11.377V24H0z"/>
          <path fill="#00BCF2" d="M12.623 12.623H24V24H12.623z"/>
        </svg>
      );
    case 'apple':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h8a2 2 0 002-2L16 7" />
        </svg>
      );
  }
}

function getProviderInfo(provider: string): string {
  switch (provider) {
    case 'google':
      return 'Syncs with Google Calendar. Requires Google account authentication.';
    case 'microsoft':
      return 'Syncs with Microsoft Outlook Calendar. Requires Microsoft account authentication.';
    case 'apple':
      return 'Syncs with Apple Calendar via CalDAV. Requires Apple ID and app-specific password.';
    default:
      return '';
  }
}