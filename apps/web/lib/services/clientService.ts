import type { 
  Client, 
  CreateClientData, 
  Document, 
  DocumentType,
  PaginatedResponse,
  ApiResponse 
} from '../../types';

export interface ClientFilters {
  search?: string;
  isMinor?: boolean;
  hasImageRights?: boolean;
  storeId?: string;
}

export interface ClientSortOptions {
  sortBy?: 'name' | 'email' | 'createdAt' | 'loyaltyPoints';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface ConsentFormData {
  clientId: string;
  type: DocumentType;
  title: string;
  content: string;
  requiresSignature: boolean;
  signatureData?: {
    signature: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

class ClientService {
  private baseUrl = '/api/clients';

  /**
   * Get paginated list of clients with filters
   */
  async getClients(
    filters: ClientFilters = {},
    sortOptions: ClientSortOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<Client>> {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.search) params.append('search', filters.search);
    if (filters.isMinor !== undefined) params.append('isMinor', filters.isMinor.toString());
    if (filters.hasImageRights !== undefined) params.append('hasImageRights', filters.hasImageRights.toString());
    if (filters.storeId) params.append('storeId', filters.storeId);
    
    // Add sorting
    if (sortOptions.sortBy) params.append('sortBy', sortOptions.sortBy);
    if (sortOptions.sortOrder) params.append('sortOrder', sortOptions.sortOrder);
    
    // Add pagination
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.limit) params.append('limit', pagination.limit.toString());

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single client by ID
   */
  async getClient(id: string): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Client not found');
      }
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }

    const result: ApiResponse<Client> = await response.json();
    return result.data;
  }

  /**
   * Create a new client
   */
  async createClient(data: CreateClientData): Promise<Client> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create client');
    }

    const result: ApiResponse<Client> = await response.json();
    return result.data;
  }

  /**
   * Update an existing client
   */
  async updateClient(id: string, data: Partial<CreateClientData>): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update client');
    }

    const result: ApiResponse<Client> = await response.json();
    return result.data;
  }

  /**
   * Delete a client
   */
  async deleteClient(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete client');
    }
  }

  /**
   * Get client's appointments
   */
  async getClientAppointments(clientId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${clientId}/appointments`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch client appointments: ${response.statusText}`);
    }

    const result: ApiResponse<any[]> = await response.json();
    return result.data;
  }

  /**
   * Get client's documents
   */
  async getClientDocuments(clientId: string): Promise<Document[]> {
    const response = await fetch(`${this.baseUrl}/${clientId}/documents`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch client documents: ${response.statusText}`);
    }

    const result: ApiResponse<Document[]> = await response.json();
    return result.data;
  }

  /**
   * Generate a consent form or document
   */
  async generateDocument(data: ConsentFormData): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/${data.clientId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate document');
    }

    const result: ApiResponse<Document> = await response.json();
    return result.data;
  }

  /**
   * Update client loyalty points
   */
  async updateLoyaltyPoints(clientId: string, points: number): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${clientId}/loyalty`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loyaltyPoints: points }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update loyalty points');
    }

    const result: ApiResponse<Client> = await response.json();
    return result.data;
  }

  /**
   * Send birthday greeting
   */
  async sendBirthdayGreeting(clientId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${clientId}/birthday-greeting`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send birthday greeting');
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(clientId: string, appointmentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${clientId}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appointmentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send reminder');
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(clientId: string): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    totalSpent: number;
    loyaltyPoints: number;
    documentsCount: number;
  }> {
    const response = await fetch(`${this.baseUrl}/${clientId}/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch client stats: ${response.statusText}`);
    }

    const result: ApiResponse<any> = await response.json();
    return result.data;
  }

  /**
   * Search clients by query
   */
  async searchClients(query: string, storeId?: string): Promise<Client[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (storeId) params.append('storeId', storeId);

    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search clients: ${response.statusText}`);
    }

    const result: ApiResponse<Client[]> = await response.json();
    return result.data;
  }

  /**
   * Export clients data
   */
  async exportClients(
    format: 'csv' | 'xlsx' | 'pdf',
    filters: ClientFilters = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    // Add filters
    if (filters.search) params.append('search', filters.search);
    if (filters.isMinor !== undefined) params.append('isMinor', filters.isMinor.toString());
    if (filters.hasImageRights !== undefined) params.append('hasImageRights', filters.hasImageRights.toString());
    if (filters.storeId) params.append('storeId', filters.storeId);

    const response = await fetch(`${this.baseUrl}/export?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to export clients: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Validate client data before submission
   */
  validateClientData(data: CreateClientData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!data.name?.trim()) errors.push('Name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.phone?.trim()) errors.push('Phone is required');
    if (!data.storeId?.trim()) errors.push('Store ID is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (data.phone && !phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format');
    }

    // Minor validation
    if (data.isMinor && !data.guardianInfo) {
      errors.push('Guardian information is required for minors');
    }

    // Guardian info validation
    if (data.guardianInfo) {
      const guardian = typeof data.guardianInfo === 'string' 
        ? JSON.parse(data.guardianInfo) 
        : data.guardianInfo;
      
      if (!guardian.name?.trim()) errors.push('Guardian name is required');
      if (!guardian.email?.trim()) errors.push('Guardian email is required');
      if (!guardian.phone?.trim()) errors.push('Guardian phone is required');
      if (!guardian.idDocument?.trim()) errors.push('Guardian ID document is required');
      
      if (guardian.email && !emailRegex.test(guardian.email)) {
        errors.push('Invalid guardian email format');
      }
      
      if (guardian.phone && !phoneRegex.test(guardian.phone)) {
        errors.push('Invalid guardian phone number format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const clientService = new ClientService();
export default clientService;