'use client';

import type { Client } from '@/types';

interface ClientHeaderProps {
  client: Client & {
    appointments?: Array<{ status: string }>;
  };
  storeName: string;
  companyName: string;
}

export function ClientHeader({ client, storeName, companyName }: ClientHeaderProps) {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {getInitials(client.name)}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {client.name.split(' ')[0]}
              </h1>
              <p className="text-gray-600">
                {storeName} • {companyName}
              </p>
              <p className="text-sm text-gray-500">
                Member since {formatDate(client.createdAt)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {client.loyaltyPoints}
                </div>
                <div className="text-sm text-gray-500">Loyalty Points</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {client.appointments?.filter((a: any) => a.status === 'COMPLETED').length || 0}
                </div>
                <div className="text-sm text-gray-500">Completed Sessions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}