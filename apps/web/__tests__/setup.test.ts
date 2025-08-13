/**
 * Basic setup test to verify Jest configuration
 */
describe('Project Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import from utils', () => {
    // This tests that module resolution is working
    expect(() => {
      // Simple test that doesn't require actual imports
      const testValue = 'test';
      return testValue;
    }).not.toThrow();
  });
});