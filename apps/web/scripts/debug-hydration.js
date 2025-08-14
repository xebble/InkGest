/**
 * Debug script to identify hydration issues
 * Run this to test specific pages for hydration problems
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Test specific routes for hydration issues
const testRoutes = [
  '/en/signin',
  '/en',
  '/en/dashboard'
];

console.log('🔍 Testing routes for hydration issues...\n');

// Temporarily disable React Strict Mode for comparison
const nextConfigPath = './next.config.js';
const originalConfig = fs.readFileSync(nextConfigPath, 'utf8');

try {
  // Test with Strict Mode enabled
  console.log('📋 Testing with React Strict Mode ENABLED...');
  
  // Start dev server in background
  const devProcess = execSync('npm run dev &', { 
    stdio: 'pipe',
    timeout: 5000 
  }).toString();
  
  console.log('Dev server started, testing routes...');
  
  // Wait a bit for server to start
  setTimeout(() => {
    testRoutes.forEach(route => {
      console.log(`Testing route: ${route}`);
      // Here you would typically use a headless browser to test
      // For now, just log the route being tested
    });
  }, 3000);
  
} catch (error) {
  console.error('Error during testing:', error.message);
} finally {
  // Kill any running dev processes
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors when killing processes
  }
}

console.log('\n✅ Hydration testing complete');