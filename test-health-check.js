// Test health check function in browser console
// Copy and paste this into the browser console while the app is running

// Test 1: Check if health check function exists
console.log('🔍 Testing health check...');

// Test 2: Import and test the health check
(async () => {
  try {
    // Try to call the health check directly
    const response = await fetch('/api/health');
    console.log('✅ Backend health endpoint accessible:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health data:', data);
    } else {
      console.error('❌ Backend health check failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
  }
})();

// Test 3: Check environment variables
console.log('🔧 Environment variables:');
console.log('NODE_ENV:', import.meta?.env?.NODE_ENV);
console.log('DEV mode:', import.meta?.env?.DEV);
console.log('API_BASE_URL:', import.meta?.env?.VITE_API_BASE_URL);

// Test 4: Check IndexedDB availability
console.log('💾 Storage checks:');
console.log('IndexedDB available:', 'indexedDB' in window);
console.log('localStorage available:', 'localStorage' in window);
console.log('sessionStorage available:', 'sessionStorage' in window);

// Test 5: Test store state
console.log('📊 Store state check:');
try {
  // This will only work if the store is available in global scope
  if (window.useStore) {
    const state = window.useStore.getState();
    console.log('Store state keys:', Object.keys(state));
    console.log('Pagination state:', state.pagination);
  } else {
    console.log('Store not available in global scope (this is normal)');
  }
} catch (error) {
  console.log('Store access error:', error.message);
}