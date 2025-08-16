import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import type { Client, Appointment, Document } from '@/types';

interface ClientDashboardPageProps {
  params: {
    clientId: string;
  };
}

async function getClientData(clientId: string) {
  try {
    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        store: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        appointments: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                category: true,
              },
            },
            artist: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      return null;
    }

    return {
      client: client as Client & {
        store: {
          id: string;
          name: string;
          company: { id: string; name: string };
        };
        appointments: (Appointment & {
          service: {
            id: string;
            name: string;
            duration: number;
            price: number;
            category: string;
          };
          artist: {
            user: { id: string; name: string };
          };
          payments: Array<{
            id: string;
            amount: number;
            method: string;
            status: string;
            createdAt: Date;
          }>;
        })[];
        documents: Document[];
      },
    };
  } catch (error) {
    console.error('Error fetching client data:', error);
    return null;
  }
}

export default async function ClientDashboardPage({ params }: ClientDashboardPageProps) {
  const data = await getClientData(params.clientId);

  if (!data) {
    notFound();
  }

  const { client } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>}>
        <ClientDashboard client={client} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: ClientDashboardPageProps) {
  const data = await getClientData(params.clientId);

  if (!data) {
    return {
      title: 'Client Not Found',
    };
  }

  return {
    title: `${data.client.name} - Client Dashboard`,
    description: `Personal dashboard for ${data.client.name}`,
  };
}