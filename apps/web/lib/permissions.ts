import { Role } from '../types';

// Define permissions for each resource and action
export const permissions = {
  appointments: {
    create: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ARTIST'] as Role[],
    update: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    delete: ['ADMIN', 'MANAGER'] as Role[],
  },
  clients: {
    create: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ARTIST'] as Role[],
    update: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    delete: ['ADMIN', 'MANAGER'] as Role[],
  },
  artists: {
    create: ['ADMIN', 'MANAGER'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    update: ['ADMIN', 'MANAGER'] as Role[],
    delete: ['ADMIN', 'MANAGER'] as Role[],
  },
  services: {
    create: ['ADMIN', 'MANAGER'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ARTIST'] as Role[],
    update: ['ADMIN', 'MANAGER'] as Role[],
    delete: ['ADMIN', 'MANAGER'] as Role[],
  },
  products: {
    create: ['ADMIN', 'MANAGER'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    update: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    delete: ['ADMIN', 'MANAGER'] as Role[],
  },
  reports: {
    read: ['ADMIN', 'MANAGER'] as Role[],
    export: ['ADMIN', 'MANAGER'] as Role[],
  },
  pos: {
    create: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    refund: ['ADMIN', 'MANAGER'] as Role[],
  },
  cash_register: {
    open: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    close: ['ADMIN', 'MANAGER'] as Role[],
    read: ['ADMIN', 'MANAGER'] as Role[],
  },
  companies: {
    create: ['ADMIN'] as Role[],
    read: ['ADMIN', 'MANAGER'] as Role[],
    update: ['ADMIN'] as Role[],
    delete: ['ADMIN'] as Role[],
  },
  stores: {
    create: ['ADMIN', 'MANAGER'] as Role[],
    read: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ARTIST'] as Role[],
    update: ['ADMIN', 'MANAGER'] as Role[],
    delete: ['ADMIN', 'MANAGER'] as Role[],
  },
  users: {
    create: ['ADMIN', 'MANAGER'] as Role[],
    read: ['ADMIN', 'MANAGER'] as Role[],
    update: ['ADMIN', 'MANAGER'] as Role[],
    delete: ['ADMIN'] as Role[],
  },
} as const;

export type Resource = keyof typeof permissions;
export type Action = keyof typeof permissions[Resource];

/**
 * Check if a user role has permission for a specific resource and action
 */
export function hasPermission(
  userRole: Role,
  resource: Resource,
  action: string
): boolean {
  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  const actionPermissions = resourcePermissions[action as keyof typeof resourcePermissions];
  if (!actionPermissions) {
    return false;
  }

  return actionPermissions.includes(userRole);
}

/**
 * Check if a user has access to a specific store
 */
export function hasStoreAccess(userStoreIds: string[], targetStoreId: string): boolean {
  return userStoreIds.includes(targetStoreId);
}

/**
 * Filter stores based on user access
 */
export function filterAccessibleStores<T extends { id: string }>(
  stores: T[],
  userStoreIds: string[]
): T[] {
  return stores.filter(store => userStoreIds.includes(store.id));
}

/**
 * Check if user belongs to the same company
 */
export function hasSameCompanyAccess(userCompanyId: string, targetCompanyId: string): boolean {
  return userCompanyId === targetCompanyId;
}