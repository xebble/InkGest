/**
 * Tests for hydration utilities
 */

import { 
  createHydrationError, 
  safeDOMOperation, 
  safeLocalStorage,
  safeClassListOperation,
  handleStrictModeError 
} from '../hydration';

// Mock DOM environment
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockClassList = {
  add: jest.fn(),
  remove: jest.fn(),
  toggle: jest.fn(),
};

const mockElement = {
  classList: mockClassList,
};

// Mock window and localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Hydration Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createHydrationError', () => {
    it('should create a hydration error with correct properties', () => {
      const error = createHydrationError(
        'Test error',
        'hydration',
        'TestComponent',
        true
      );

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('hydration');
      expect(error.component).toBe('TestComponent');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('HydrationError');
    });

    it('should create error with undefined component', () => {
      const error = createHydrationError('Test error', 'dom_manipulation');

      expect(error.component).toBeUndefined();
      expect(error.recoverable).toBe(true); // default value
    });
  });

  describe('safeDOMOperation', () => {
    it('should execute operation successfully', () => {
      const operation = jest.fn().mockReturnValue('success');
      const result = safeDOMOperation(operation, 'fallback', 'TestComponent');

      expect(operation).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should return fallback on error', () => {
      const operation = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });
      const result = safeDOMOperation(operation, 'fallback', 'TestComponent');

      expect(result).toBe('fallback');
    });

    it('should return undefined when no fallback provided', () => {
      const operation = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });
      const result = safeDOMOperation(operation, undefined, 'TestComponent');

      expect(result).toBeUndefined();
    });
  });

  describe('safeLocalStorage', () => {
    it('should get item successfully', () => {
      mockLocalStorage.getItem.mockReturnValue('stored-value');
      const storage = safeLocalStorage();
      const result = storage.getItem('test-key');

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe('stored-value');
    });

    it('should return fallback when getItem fails', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const storage = safeLocalStorage();
      const result = storage.getItem('test-key', 'fallback');

      expect(result).toBe('fallback');
    });

    it('should set item successfully', () => {
      const storage = safeLocalStorage();
      const result = storage.setItem('test-key', 'test-value');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      expect(result).toBe(true);
    });

    it('should return false when setItem fails', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const storage = safeLocalStorage();
      const result = storage.setItem('test-key', 'test-value');

      expect(result).toBe(false);
    });
  });

  describe('safeClassListOperation', () => {
    it('should add class successfully', () => {
      const result = safeClassListOperation(
        mockElement as any,
        'add',
        'test-class',
        'TestComponent'
      );

      expect(mockClassList.add).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
    });

    it('should remove class successfully', () => {
      const result = safeClassListOperation(
        mockElement as any,
        'remove',
        'test-class',
        'TestComponent'
      );

      expect(mockClassList.remove).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
    });

    it('should toggle class successfully', () => {
      const result = safeClassListOperation(
        mockElement as any,
        'toggle',
        'test-class',
        'TestComponent'
      );

      expect(mockClassList.toggle).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
    });

    it('should return false on error', () => {
      mockClassList.add.mockImplementation(() => {
        throw new Error('ClassList error');
      });
      const result = safeClassListOperation(
        mockElement as any,
        'add',
        'test-class',
        'TestComponent'
      );

      expect(result).toBe(false);
    });
  });

  describe('handleStrictModeError', () => {
    beforeEach(() => {
      // Mock development environment
      process.env.NODE_ENV = 'development';
    });

    it('should handle removeChild errors in strict mode gracefully', () => {
      // Mock strict mode detection
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
      
      const error = new Error('Failed to execute removeChild on Node');
      
      // Should not throw
      expect(() => {
        handleStrictModeError(error, 'TestComponent');
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalled();
    });

    it('should re-throw non-removeChild errors', () => {
      const error = new Error('Some other error');
      
      expect(() => {
        handleStrictModeError(error, 'TestComponent');
      }).toThrow('Some other error');
    });
  });
});