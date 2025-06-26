/**
 * T-23: Health-check API Implementation
 * Frontend placeholder for /healthz endpoint
 */

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  dependencies?: {
    database?: DependencyStatus;
    vectordb?: DependencyStatus;
    openai?: DependencyStatus;
  };
}

export interface DependencyStatus {
  status: 'ok' | 'degraded' | 'error';
  responseTime?: number;
  error?: string;
}

export interface HealthCheckResponse {
  health: HealthStatus;
  uptime: number;
  environment: string;
}

/**
 * Mock health check for frontend-only phase
 * Will be replaced with actual backend API call in R1
 */
export const checkSystemHealth = async (): Promise<HealthCheckResponse> => {
  try {
    // Mock dependency checks
    const dependencies = {
      openai: await checkOpenAIHealth(),
      browser: await checkBrowserHealth(),
      storage: await checkStorageHealth(),
    };

    const hasErrors = Object.values(dependencies).some(dep => dep.status === 'error');
    const hasDegraded = Object.values(dependencies).some(dep => dep.status === 'degraded');

    const status: HealthStatus['status'] = hasErrors ? 'error' : hasDegraded ? 'degraded' : 'ok';

    return {
      health: {
        status,
        timestamp: new Date().toISOString(),
        version: '0.1.0-frontend',
        dependencies,
      },
      uptime: performance.now(),
      environment: import.meta.env.NODE_ENV || 'development',
    };
  } catch (error) {
    return {
      health: {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '0.1.0-frontend',
      },
      uptime: performance.now(),
      environment: import.meta.env.NODE_ENV || 'development',
    };
  }
};

/**
 * Check OpenAI API accessibility
 */
const checkOpenAIHealth = async (): Promise<DependencyStatus> => {
  const startTime = Date.now();

  try {
    // Mock OpenAI health check (no actual API call to avoid quota usage)
    const apiKey =
      localStorage.getItem('openai-api-key') || sessionStorage.getItem('openai-api-key');

    if (!apiKey) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: 'No API key configured',
      };
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Check browser environment health
 */
const checkBrowserHealth = async (): Promise<DependencyStatus> => {
  const startTime = Date.now();

  try {
    // Check essential browser APIs
    const hasIndexedDB = 'indexedDB' in window;
    const hasLocalStorage = 'localStorage' in window;
    const hasWebWorkers = 'Worker' in window;

    if (!hasIndexedDB || !hasLocalStorage) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: 'Essential browser APIs not available',
      };
    }

    if (!hasWebWorkers) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: 'Web Workers not available - performance may be limited',
      };
    }

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Browser check failed',
    };
  }
};

/**
 * Check IndexedDB storage health
 */
const checkStorageHealth = async (): Promise<DependencyStatus> => {
  const startTime = Date.now();

  try {
    // Test IndexedDB connectivity

    // Try to write to IndexedDB
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('health-test', 1);

      request.onerror = () => reject(new Error('IndexedDB connection failed'));

      request.onsuccess = () => {
        const db = request.result;
        db.close();
        resolve(void 0);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('test')) {
          db.createObjectStore('test');
        }
      };
    });

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Storage check failed',
    };
  }
};

/**
 * Utility function to format health status for display
 */
export const formatHealthStatus = (health: HealthStatus): string => {
  const statusEmoji = {
    ok: '✅',
    degraded: '⚠️',
    error: '❌',
  };

  return `${statusEmoji[health.status]} ${health.status.toUpperCase()} (v${health.version})`;
};

/**
 * Export for use in development/debugging
 */
export const debugHealth = async (): Promise<void> => {
  console.group('🏥 System Health Check');

  const healthCheck = await checkSystemHealth();
  console.log('Overall Status:', formatHealthStatus(healthCheck.health));
  console.log('Uptime:', `${(healthCheck.uptime / 1000).toFixed(2)}s`);
  console.log('Environment:', healthCheck.environment);

  if (healthCheck.health.dependencies) {
    console.group('Dependencies:');
    Object.entries(healthCheck.health.dependencies).forEach(([name, status]) => {
      console.log(`${name}:`, status);
    });
    console.groupEnd();
  }

  console.groupEnd();
};
