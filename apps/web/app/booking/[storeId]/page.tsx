import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PublicBookingPortal } from '@/components/booking/PublicBookingPortal';
import { BookingProvider } from '@/components/booking/BookingProvider';
import type { Store, Service, Artist } from '@/types';

interface PublicBookingPageProps {
  params: {
    storeId: string;
  };
}

async function getStoreData(storeId: string) {
  try {
    const store = await db.store.findUnique({
      where: { id: storeId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        services: {
          where: {
            // Only show active services for public booking
          },
          orderBy: {
            name: 'asc',
          },
        },
        artists: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            user: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!store) {
      return null;
    }

    return {
      store: store as Store & {
        company: { id: string; name: string };
        services: Service[];
        artists: (Artist & {
          user: { id: string; name: string };
        })[];
      },
    };
  } catch (error) {
    console.error('Error fetching store data:', error);
    return null;
  }
}

export default async function PublicBookingPage({ params }: PublicBookingPageProps) {
  const data = await getStoreData(params.storeId);

  if (!data) {
    notFound();
  }

  const { store } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingProvider storeId={store.id}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>}>
          <PublicBookingPortal
            store={store}
            services={store.services}
            artists={store.artists}
          />
        </Suspense>
      </BookingProvider>
    </div>
  );
}

export async function generateMetadata({ params }: PublicBookingPageProps) {
  const data = await getStoreData(params.storeId);

  if (!data) {
    return {
      title: 'Store Not Found',
    };
  }

  return {
    title: `Book Appointment - ${data.store.name}`,
    description: `Book your appointment at ${data.store.name}. Choose from our services and available time slots.`,
  };
}