'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage(): JSX.Element {
  const { data: session, status } = useSession();
  const t = useTranslations('navigation');
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirigiendo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('dashboard')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {session.user.name}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Información del Usuario
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {session.user.name}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">
                    <p><strong>Email:</strong> {session.user.email}</p>
                    <p><strong>Rol:</strong> {session.user.role}</p>
                    <p><strong>ID Empresa:</strong> {session.user.companyId}</p>
                    <p><strong>Tiendas:</strong> {session.user.storeIds.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Permisos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Rol: {session.user.role}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">
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
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Acciones Rápidas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Próximamente
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">
                    <p>• Gestión de citas</p>
                    <p>• Gestión de clientes</p>
                    <p>• Punto de venta</p>
                    <p>• Reportes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}