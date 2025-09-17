/**
 * Enhanced Health Check with Better Error Handling
 * Copy this code to replace problematic sections in health-check.ts
 */

// Enhanced getApiBaseUrl with better error handling
const getApiBaseUrlSafe = (): string => {
  try {
    // Check if running in development
    if (import.meta.env.DEV) {
      return ''; // Use proxy in dev
    }

    // Get from environment variable with fallback
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiUrl) {
      console.warn('VITE_API_BASE_URL not set, using default localhost:8000');
      return 'http://localhost:8000';
    }

    return apiUrl;
  } catch (error) {
    console.error('Error getting API base URL:', error);
    return 'http://localhost:8000';
  }
};

// Enhanced storage health check with better error handling
const checkStorageHealthSafe = async (): Promise<DependencyStatus> => {
  const startTime = Date.now();

  try {
    // Check if IndexedDB is available
    if (!('indexedDB' in window)) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: 'IndexedDB not available in this browser environment'
      };
    }

    // Test IndexedDB with timeout
    const dbTest = await Promise.race([
      new Promise<void>((resolve, reject) => {
        try {
          const request = indexedDB.open('health-test', 1);

          request.onerror = () => reject(new Error('IndexedDB connection failed'));

          request.onsuccess = () => {
            const db = request.result;
            db.close();
            resolve();
          };

          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('test')) {
              db.createObjectStore('test');
            }
          };
        } catch (error) {
          reject(error);
        }
      }),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('IndexedDB test timeout')), 3000)
      )
    ]);

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Storage check failed';

    // Different error handling based on error type
    if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: 'Storage quota exceeded - app may have limited functionality'
      };
    }

    if (errorMessage.includes('timeout')) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: 'Storage check timeout - performance may be degraded'
      };
    }

    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: errorMessage,
    };
  }
};

// Enhanced backend health check with better timeout and error handling
const checkBackendHealthSafe = async (): Promise<HealthCheckResponse | null> => {
  const apiBaseUrl = getApiBaseUrlSafe();
  const healthUrl = `${apiBaseUrl}/api/health`;

  try {
    // Longer timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('Health check timeout after 10 seconds');
    }, 10000); // Increased from 5s to 10s

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status} ${response.statusText}`);
    }

    // Enhanced JSON parsing with error handling
    let backendData: BackendHealthResponse;
    try {
      const text = await response.text();
      backendData = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from backend: ${parseError.message}`);
    }

    // Validate response structure
    if (!backendData.status || !backendData.timestamp) {
      throw new Error('Invalid health response structure from backend');
    }

    return await normalizeBackendResponse(backendData);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Health check was aborted due to timeout');
      throw new Error('Backend health check timeout');
    }

    if (error.message.includes('CORS')) {
      console.error('CORS error - check backend CORS configuration');
      throw new Error('CORS policy error - backend may not be configured for frontend origin');
    }

    if (error.message.includes('Failed to fetch')) {
      console.error('Network error - backend may not be running');
      throw new Error('Cannot connect to backend - check if backend server is running');
    }

    // Re-throw with context
    throw new Error(`Backend health check error: ${error.message}`);
  }
};