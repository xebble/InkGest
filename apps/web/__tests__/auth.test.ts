import { hasPermission } from '../lib/permissions';

describe('Authentication System', () => {
  describe('hasPermission', () => {
    it('should allow ADMIN to access all resources', () => {
      expect(hasPermission('ADMIN', 'companies', 'create')).toBe(true);
      expect(hasPermission('ADMIN', 'companies', 'read')).toBe(true);
      expect(hasPermission('ADMIN', 'companies', 'update')).toBe(true);
      expect(hasPermission('ADMIN', 'companies', 'delete')).toBe(true);
    });

    it('should restrict EMPLOYEE access appropriately', () => {
      expect(hasPermission('EMPLOYEE', 'companies', 'create')).toBe(false);
      expect(hasPermission('EMPLOYEE', 'companies', 'read')).toBe(false);
      expect(hasPermission('EMPLOYEE', 'appointments', 'create')).toBe(true);
      expect(hasPermission('EMPLOYEE', 'appointments', 'read')).toBe(true);
    });

    it('should restrict ARTIST access appropriately', () => {
      expect(hasPermission('ARTIST', 'appointments', 'read')).toBe(true);
      expect(hasPermission('ARTIST', 'appointments', 'create')).toBe(false);
      expect(hasPermission('ARTIST', 'clients', 'read')).toBe(true);
      expect(hasPermission('ARTIST', 'clients', 'create')).toBe(false);
    });
  });
});