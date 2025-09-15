/**
 * T-23: Health-check API Implementation
 * Consumes /api/health endpoint with fallback to frontend checks
 * Updated to use new backend /api/health endpoint structure
 */

/* eslint-disable max-lines */

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  dependencies?: {
    database?: DependencyStatus;
    vectordb?: DependencyStatus;
    openai?: DependencyStatus;
    browser?: DependencyStatus;
    storage?: DependencyStatus;
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
 * Backend health response interface (from /api/health)
 */
interface BackendHealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  version: string;
  deps: {
    openai?: {
      status: 'available' | 'error' | 'timeout' | 'not_configured';
      response_time_ms?: number;
      models_available?: number;
      api_version?: string;
    };
    browser?: {
      status: 'not_applicable';
    };
    storage?: {
      status: 'available' | 'error';
      type?: string;
      writable?: boolean;
    };
    [key: string]:
      | {
          status: string;
          response_time_ms?: number;
          [key: string]: unknown;
        }
      | undefined; // Allow additional dependencies with undefined
  };
}

/**
 * Get API base URL for health endpoint
 */
const getApiBaseUrl = (): string => {
  // In development, use proxy (handled by Vite)
  // In production, use environment variable or default
  if (import.meta.env.DEV) {
    return ''; // Use proxy in dev
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

/**
 * Check system health by calling backend /api/health endpoint
 * Uses new structured response format with dependency details
 * Falls back to frontend-only checks if backend is unavailable
 */
export const checkSystemHealth = async (): Promise<HealthCheckResponse> => {
  try {
    // Try backend health endpoint first
    const backendHealth = await checkBackendHealth();
    if (backendHealth) {
      return backendHealth;
    }
  } catch (error) {
    console.warn('Backend health check failed, falling back to frontend checks:', error);
  }

  // Fallback to frontend-only health checks
  return getFrontendOnlyHealth();
};

/**
 * Call backend /api/health endpoint and normalize response
 */
const checkBackendHealth = async (): Promise<HealthCheckResponse | null> => {
  const apiBaseUrl = getApiBaseUrl();
  const healthUrl = `${apiBaseUrl}/api/health`;

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status} ${response.statusText}`);
    }

    const backendData: BackendHealthResponse = await response.json();

    // Normalize backend response to frontend format
    return await normalizeBackendResponse(backendData);
  } catch (error) {
    // Network errors, timeouts, or JSON parsing errors
    throw new Error(
      `Backend health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Normalize backend health response to match frontend HealthCheckResponse interface
 */
const normalizeBackendResponse = async (
  backendData: BackendHealthResponse
): Promise<HealthCheckResponse> => {
  // Map backend dependency status to frontend status format
  const mapDependencyStatus = (status: string): HealthStatus['status'] => {
    switch (status.toLowerCase()) {
      case 'available':
      case 'ok':
        return 'ok';
      case 'not_configured':
      case 'timeout':
        return 'degraded';
      case 'error':
      case 'fail':
        return 'error';
      case 'not_applicable':
        return 'ok'; // Browser dependency is not applicable on backend
      default:
        return 'degraded';
    }
  };

  // Convert backend dependencies format to frontend format
  const normalizeDependencies = (
    backendDeps: BackendHealthResponse['deps']
  ): Record<string, DependencyStatus> => {
    const dependencies: Record<string, DependencyStatus> = {};

    Object.entries(backendDeps).forEach(([key, depData]) => {
      if (depData && typeof depData === 'object' && 'status' in depData) {
        const status = mapDependencyStatus(depData.status);
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize key for security
        // eslint-disable-next-line security/detect-object-injection
        dependencies[safeKey] = {
          status,
          responseTime: 'response_time_ms' in depData ? depData.response_time_ms : undefined,
          error:
            status === 'error'
              ? `${key} service unavailable`
              : status === 'degraded' && depData.status === 'not_configured'
                ? 'Not configured'
                : status === 'degraded' && depData.status === 'timeout'
                  ? 'Request timeout'
                  : undefined,
        };
      }
    });

    return dependencies;
  };

  // Get backend dependencies
  const backendDeps = normalizeDependencies(backendData.deps);

  // Add frontend-specific checks (browser and localStorage-based storage)
  const frontendChecks: Record<string, DependencyStatus> = {
    browser: await checkBrowserHealth(),
  };

  // Only add frontend storage check if backend doesn't provide storage info
  if (!backendDeps.storage) {
    frontendChecks.storage = await checkStorageHealth();
  }

  // Only add frontend OpenAI check if backend doesn't provide OpenAI info or if it's not configured
  if (!backendDeps.openai || backendDeps.openai.status === 'degraded') {
    frontendChecks.openai = await checkOpenAIHealth();
  }

  // Combine backend and frontend dependencies
  const allDependencies: Record<string, DependencyStatus> = {
    ...backendDeps,
    ...frontendChecks,
  };

  // Map backend overall status to frontend status format
  const mapOverallStatus = (status: string): HealthStatus['status'] => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'ok';
      case 'degraded':
        return 'degraded';
      default:
        return 'degraded';
    }
  };

  // Determine overall health status (prioritize backend status but escalate based on dependencies)
  const backendStatus = mapOverallStatus(backendData.status);
  const hasErrors = Object.values(allDependencies).some(dep => dep.status === 'error');
  const hasDegraded = Object.values(allDependencies).some(dep => dep.status === 'degraded');
  const overallStatus: HealthStatus['status'] = hasErrors
    ? 'error'
    : hasDegraded
      ? 'degraded'
      : backendStatus;

  return {
    health: {
      status: overallStatus,
      timestamp: backendData.timestamp,
      version: backendData.version,
      dependencies: allDependencies,
    },
    uptime: performance.now(), // Frontend uptime since backend doesn't provide it
    environment: import.meta.env.NODE_ENV || 'development',
  };
};

/**
 * Frontend-only health check (fallback when backend is unavailable)
 */
const getFrontendOnlyHealth = async (): Promise<HealthCheckResponse> => {
  try {
    // Frontend dependency checks only
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
        version: '0.1.0-frontend-only',
        dependencies,
      },
      uptime: performance.now(),
      environment: import.meta.env.NODE_ENV || 'development',
    };
  } catch (_error) {
    return {
      health: {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '0.1.0-frontend-only',
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
      console.log(name, status);
    });
    console.groupEnd();
  }

  console.groupEnd();
};
