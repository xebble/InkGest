import { useState, useEffect, useCallback } from 'react';
import type { 
  Client, 
  CreateClientData, 
  Document
} from '../types';
import { 
  clientService, 
  type ClientFilters, 
  type ClientSortOptions, 
  type PaginationOptions,
  type ConsentFormData 
} from '../lib/services/clientService';

interface UseClientsOptions {
  storeId?: string;
  initialFilters?: ClientFilters;
  initialSort?: ClientSortOptions;
  initialPagination?: PaginationOptions;
}

interface UseClientsReturn {
  // Data
  clients: Client[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error state
  error: string | null;
  
  // Filters and sorting
  filters: ClientFilters;
  sortOptions: ClientSortOptions;
  
  // Actions
  loadClients: () => Promise<void>;
  createClient: (data: CreateClientData) => Promise<Client>;
  updateClient: (id: string, data: Partial<CreateClientData>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  setFilters: (filters: ClientFilters) => void;
  setSortOptions: (options: ClientSortOptions) => void;
  setPage: (page: number) => void;
  refreshClients: () => Promise<void>;
}

export const useClients = (options: UseClientsOptions = {}): UseClientsReturn => {
  const {
    storeId,
    initialFilters = {},
    initialSort = { sortBy: 'name', sortOrder: 'asc' },
    initialPagination = { page: 1, limit: 10 }
  } = options;

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPagination.page || 1);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<ClientFilters>({
    ...initialFilters,
    ...(storeId && { storeId })
  });
  const [sortOptions, setSortOptions] = useState<ClientSortOptions>(initialSort);

  // Load clients
  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await clientService.getClients(
        filters,
        sortOptions,
        { page: currentPage, limit: initialPagination.limit || 10 }
      );
      
      setClients(response.data);
      setTotalCount(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMessage);
      console.error('Error loading clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortOptions, currentPage, initialPagination.limit]);

  // Create client
  const createClient = useCallback(async (data: CreateClientData): Promise<Client> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Validate data
      const validation = clientService.validateClientData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const newClient = await clientService.createClient(data);
      
      // Refresh the list
      await loadClients();
      
      return newClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [loadClients]);

  // Update client
  const updateClient = useCallback(async (
    id: string, 
    data: Partial<CreateClientData>
  ): Promise<Client> => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const updatedClient = await clientService.updateClient(id, data);
      
      // Update the client in the local state
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
      
      return updatedClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Delete client
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await clientService.deleteClient(id);
      
      // Remove the client from local state
      setClients(prev => prev.filter(client => client.id !== id));
      setTotalCount(prev => prev - 1);
      
      // If current page is empty after deletion, go to previous page
      if (clients.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [clients.length, currentPage]);

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Refresh clients
  const refreshClients = useCallback(async () => {
    await loadClients();
  }, [loadClients]);

  // Load clients when dependencies change
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return {
    // Data
    clients,
    totalCount,
    currentPage,
    totalPages,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error state
    error,
    
    // Filters and sorting
    filters,
    sortOptions,
    
    // Actions
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    setFilters,
    setSortOptions,
    setPage,
    refreshClients
  };
};

// Hook for single client management
interface UseClientOptions {
  clientId: string;
  loadAppointments?: boolean;
  loadDocuments?: boolean;
}

interface UseClientReturn {
  // Data
  client: Client | null;
  appointments: any[];
  documents: Document[];
  stats: any;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  isGeneratingDocument: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  loadClient: () => Promise<void>;
  updateClient: (data: Partial<CreateClientData>) => Promise<Client>;
  generateDocument: (data: ConsentFormData) => Promise<Document>;
  updateLoyaltyPoints: (points: number) => Promise<void>;
  sendBirthdayGreeting: () => Promise<void>;
  sendAppointmentReminder: (appointmentId: string) => Promise<void>;
  refreshClient: () => Promise<void>;
}

export const useClient = (options: UseClientOptions): UseClientReturn => {
  const { clientId, loadAppointments = true, loadDocuments = true } = options;

  // State
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);

  // Load client data
  const loadClient = useCallback(async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [clientData, appointmentsData, documentsData, statsData] = await Promise.all([
        clientService.getClient(clientId),
        loadAppointments ? clientService.getClientAppointments(clientId) : Promise.resolve([]),
        loadDocuments ? clientService.getClientDocuments(clientId) : Promise.resolve([]),
        clientService.getClientStats(clientId)
      ]);
      
      setClient(clientData);
      setAppointments(appointmentsData);
      setDocuments(documentsData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load client';
      setError(errorMessage);
      console.error('Error loading client:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, loadAppointments, loadDocuments]);

  // Update client
  const updateClient = useCallback(async (data: Partial<CreateClientData>): Promise<Client> => {
    if (!clientId) throw new Error('No client ID provided');
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const updatedClient = await clientService.updateClient(clientId, data);
      setClient(updatedClient);
      return updatedClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [clientId]);

  // Generate document
  const generateDocument = useCallback(async (data: ConsentFormData): Promise<Document> => {
    setIsGeneratingDocument(true);
    setError(null);
    
    try {
      const document = await clientService.generateDocument(data);
      setDocuments(prev => [document, ...prev]);
      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate document';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGeneratingDocument(false);
    }
  }, []);

  // Update loyalty points
  const updateLoyaltyPoints = useCallback(async (points: number): Promise<void> => {
    if (!clientId) throw new Error('No client ID provided');
    
    try {
      const updatedClient = await clientService.updateLoyaltyPoints(clientId, points);
      setClient(updatedClient);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update loyalty points';
      setError(errorMessage);
      throw err;
    }
  }, [clientId]);

  // Send birthday greeting
  const sendBirthdayGreeting = useCallback(async (): Promise<void> => {
    if (!clientId) throw new Error('No client ID provided');
    
    try {
      await clientService.sendBirthdayGreeting(clientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send birthday greeting';
      setError(errorMessage);
      throw err;
    }
  }, [clientId]);

  // Send appointment reminder
  const sendAppointmentReminder = useCallback(async (appointmentId: string): Promise<void> => {
    if (!clientId) throw new Error('No client ID provided');
    
    try {
      await clientService.sendAppointmentReminder(clientId, appointmentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reminder';
      setError(errorMessage);
      throw err;
    }
  }, [clientId]);

  // Refresh client
  const refreshClient = useCallback(async () => {
    await loadClient();
  }, [loadClient]);

  // Load client when clientId changes
  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [loadClient, clientId]);

  return {
    // Data
    client,
    appointments,
    documents,
    stats,
    
    // Loading states
    isLoading,
    isUpdating,
    isGeneratingDocument,
    
    // Error state
    error,
    
    // Actions
    loadClient,
    updateClient,
    generateDocument,
    updateLoyaltyPoints,
    sendBirthdayGreeting,
    sendAppointmentReminder,
    refreshClient
  };
};