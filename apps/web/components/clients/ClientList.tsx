'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Client } from '../../types';

interface ClientListProps {
  clients: Client[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onClientSelect: (client: Client) => void;
  onClientEdit: (client: Client) => void;
  onClientDelete: (clientId: string) => Promise<void>;
  isLoading?: boolean;
}

interface FilterOptions {
  search: string;
  isMinor: 'all' | 'yes' | 'no';
  hasImageRights: 'all' | 'yes' | 'no';
  sortBy: 'name' | 'email' | 'createdAt' | 'loyaltyPoints';
  sortOrder: 'asc' | 'desc';
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onClientSelect,
  onClientEdit,
  onClientDelete,
  isLoading = false
}) => {
  const t = useTranslations();
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    isMinor: 'all',
    hasImageRights: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.includes(filters.search)
      );
    }

    // Apply minor filter
    if (filters.isMinor !== 'all') {
      filtered = filtered.filter(client =>
        filters.isMinor === 'yes' ? client.isMinor : !client.isMinor
      );
    }

    // Apply image rights filter
    if (filters.hasImageRights !== 'all') {
      filtered = filtered.filter(client =>
        filters.hasImageRights === 'yes' ? client.imageRights : !client.imageRights
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'loyaltyPoints':
          aValue = a.loyaltyPoints;
          bValue = b.loyaltyPoints;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clients, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback(<K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle client selection
  const handleClientSelect = useCallback((clientId: string, selected: boolean) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(clientId);
      } else {
        newSet.delete(clientId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedClients(new Set(filteredClients.map(client => client.id)));
    } else {
      setSelectedClients(new Set());
    }
  }, [filteredClients]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedClients.size === 0) return;
    
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar ${selectedClients.size} cliente(s)?`
    );
    
    if (confirmed) {
      try {
        await Promise.all(
          Array.from(selectedClients).map(clientId => onClientDelete(clientId))
        );
        setSelectedClients(new Set());
      } catch (error) {
        console.error('Error deleting clients:', error);
      }
    }
  }, [selectedClients, onClientDelete]);

  // Calculate client age
  const calculateAge = useCallback((birthDate: Date | string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Format date
  const formatDate = useCallback((date: Date | string): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const allSelected = filteredClients.length > 0 && selectedClients.size === filteredClients.length;
  const someSelected = selectedClients.size > 0 && selectedClients.size < filteredClients.length;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('clients.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {totalCount} cliente(s) total
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              {t('common.filter')}
            </button>
            {selectedClients.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Eliminar ({selectedClients.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.search')}
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleFilterChange('search', e.target.value)
                }
                placeholder="Nombre, email o teléfono..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="isMinor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Menor de edad
              </label>
              <select
                id="isMinor"
                value={filters.isMinor}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  handleFilterChange('isMinor', e.target.value as 'all' | 'yes' | 'no')
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label htmlFor="hasImageRights" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Derechos de imagen
              </label>
              <select
                id="hasImageRights"
                value={filters.hasImageRights}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  handleFilterChange('hasImageRights', e.target.value as 'all' | 'yes' | 'no')
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="yes">Autorizados</option>
                <option value="no">No autorizados</option>
              </select>
            </div>

            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordenar por
              </label>
              <div className="flex space-x-2">
                <select
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="name">Nombre</option>
                  <option value="email">Email</option>
                  <option value="createdAt">Fecha registro</option>
                  <option value="loyaltyPoints">Puntos</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleSelectAll(e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Edad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Puntos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {t('common.loading')}
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const age = calculateAge(client.birthDate);
                const isSelected = selectedClients.has(client.id);
                
                return (
                  <tr
                    key={client.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => onClientSelect(client)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          e.stopPropagation();
                          handleClientSelect(client.id, e.target.checked);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.source && `Origen: ${client.source}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {client.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {client.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {age ? `${age} años` : 'N/A'}
                      {client.isMinor && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Menor
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {client.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {client.imageRights && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Imagen OK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onClientEdit(client);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
                              onClientDelete(client.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {startIndex} a {endIndex} de {totalCount} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                {t('common.previous')}
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'text-white bg-blue-600 border border-blue-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;