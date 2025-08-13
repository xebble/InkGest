'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function DashboardPage(): JSX.Element {
  const { data: session, status } = useSession();
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-foreground">{tCommon('loading')}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-foreground">Redirigiendo...</div>
      </div>
    );
  }

  return (
    <AppLayout title={t('dashboard')}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-medium text-sm">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Información del Usuario
                  </dt>
                  <dd className="text-lg font-medium text-card-foreground">
                    {session.user.name}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Rol:</strong> {session.user.role}</p>
                <p><strong>ID Empresa:</strong> {session.user.companyId}</p>
                <p><strong>Tiendas:</strong> {session.user.storeIds.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Card */}
        <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Permisos
                  </dt>
                  <dd className="text-lg font-medium text-card-foreground">
                    Rol: {session.user.role}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>✅ Acceso al dashboard</p>
                {session.user.role === 'ADMIN' && (
                  <>
                    <p>✅ Gestión de empresas</p>
                    <p>✅ Gestión de usuarios</p>
                    <p>✅ Todos los permisos</p>
                  </>
                )}
                {session.user.role === 'MANAGER' && (
                  <>
                    <p>✅ Gestión de tiendas</p>
                    <p>✅ Reportes</p>
                    <p>✅ Gestión de personal</p>
                  </>
                )}
                {session.user.role === 'ARTIST' && (
                  <>
                    <p>✅ Ver citas</p>
                    <p>✅ Ver clientes</p>
                    <p>❌ Crear citas</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Acciones Rápidas
                  </dt>
                  <dd className="text-lg font-medium text-card-foreground">
                    Próximamente
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• {t('appointments')}</p>
                <p>• {t('clients')}</p>
                <p>• {t('pos')}</p>
                <p>• {t('reports')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}