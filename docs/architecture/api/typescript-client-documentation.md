# TypeScript API Client Documentation

## Overview

This document provides comprehensive documentation for the TypeScript API client interfaces and integration patterns used in the AI-Doc-Editor frontend application.

## Table of Contents

1. [API Client Architecture](#api-client-architecture)
2. [Authentication API](#authentication-api)
3. [Health Check API](#health-check-api)
4. [Audit Logs API](#audit-logs-api)
5. [Error Handling](#error-handling)
6. [State Management Integration](#state-management-integration)
7. [Type Definitions](#type-definitions)
8. [Integration Patterns](#integration-patterns)
9. [Testing Strategies](#testing-strategies)

## API Client Architecture

The frontend uses a modular API client architecture with the following design principles:

- **Type Safety**: All API responses and requests are strongly typed using TypeScript interfaces
- **Environment Configuration**: API base URLs are configurable via environment variables
- **Error Handling**: Consistent error handling across all API clients
- **Authentication**: JWT bearer token authentication with automatic token refresh
- **Retry Logic**: Built-in retry mechanisms for transient failures

### Core Configuration

```typescript
// Environment-based API configuration
const API_BASE_URL = getEnvVar('VITE_API_BASE_URL') || 'http://localhost:8000/api';

// API client base class pattern
abstract class BaseAPIClient {
  protected baseURL: string;
  protected timeout: number = 5000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new APIError(response.status, response.statusText);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

## Authentication API

### Interface Definitions

```typescript
// Authentication request/response types
export interface LoginResponse {
  auth_url: string;
  provider: string;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'editor' | 'admin';
    provider: 'google' | 'microsoft';
  };
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'editor' | 'admin';
    provider: 'google' | 'microsoft';
  };
  authenticated: boolean;
}
```

### AuthAPI Client

```typescript
class AuthAPI extends BaseAPIClient {
  constructor() {
    super(`${API_BASE_URL}/auth`);
  }

  /**
   * Initiate OAuth 2.0 login flow
   * @param provider OAuth provider ('google' | 'microsoft')
   * @returns Promise<LoginResponse>
   */
  async initiateLogin(provider: 'google' | 'microsoft'): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(
      `${this.baseURL}/login?provider=${provider}`,
      { method: 'POST' }
    );
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param code Authorization code from OAuth provider
   * @param provider OAuth provider
   * @param state Optional state parameter for CSRF protection
   * @returns Promise<TokenResponse>
   */
  async handleCallback(
    code: string,
    provider: string,
    state?: string
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({ code, provider });
    if (state) params.append('state', state);

    return this.makeRequest<TokenResponse>(
      `${this.baseURL}/callback?${params}`
    );
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Valid refresh token
   * @returns Promise<Omit<TokenResponse, 'user'>>
   */
  async refreshToken(refreshToken: string): Promise<Omit<TokenResponse, 'user'>> {
    return this.makeRequest<Omit<TokenResponse, 'user'>>(
      `${this.baseURL}/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
  }

  /**
   * Get current authenticated user profile
   * @param accessToken JWT access token
   * @returns Promise<UserResponse>
   */
  async getCurrentUser(accessToken: string): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(
      `${this.baseURL}/me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }
}

export const authAPI = new AuthAPI();
```

### Usage Examples

```typescript
// OAuth login flow
try {
  const loginResponse = await authAPI.initiateLogin('google');
  window.location.href = loginResponse.auth_url;
} catch (error) {
  console.error('Login initiation failed:', error);
}

// Handle OAuth callback
try {
  const tokens = await authAPI.handleCallback(code, provider, state);
  // Store tokens securely and update application state
  authStore.setTokens(tokens);
} catch (error) {
  console.error('OAuth callback failed:', error);
}

// Token refresh
try {
  const newTokens = await authAPI.refreshToken(refreshToken);
  authStore.updateTokens(newTokens);
} catch (error) {
  // Handle refresh failure - redirect to login
  authStore.logout();
}
```

## Health Check API

### Interface Definitions

```typescript
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
```

### Health Check Implementation

```typescript
/**
 * Comprehensive health check that combines backend and frontend checks
 * @returns Promise<HealthCheckResponse>
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
 * Check backend health endpoint and normalize response
 */
const checkBackendHealth = async (): Promise<HealthCheckResponse | null> => {
  const apiBaseUrl = getApiBaseUrl();
  const healthUrl = `${apiBaseUrl}/api/health`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const backendData = await response.json();
    return await normalizeBackendResponse(backendData);
  } catch (error) {
    throw new Error(`Backend health check error: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
};
```

### Frontend-Only Health Checks

```typescript
/**
 * Check browser environment health
 */
const checkBrowserHealth = async (): Promise<DependencyStatus> => {
  const startTime = Date.now();

  try {
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
      error: error.message,
    };
  }
};

/**
 * Check IndexedDB storage health
 */
const checkStorageHealth = async (): Promise<DependencyStatus> => {
  const startTime = Date.now();

  try {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('health-test', 1);
      request.onerror = () => reject(new Error('IndexedDB connection failed'));
      request.onsuccess = () => {
        request.result.close();
        resolve(void 0);
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
      error: error.message,
    };
  }
};
```

## Audit Logs API

### Interface Definitions

```typescript
export interface AuditLogEntry {
  id: string;
  action: string;
  user_email: string;
  timestamp: string;
  ip_address: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export interface AuditLogFilters {
  action?: string;
  user_email?: string;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  severity?: string;
}

export interface AuditLogSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByUser: Record<string, number>;
  logsByStatus: Record<string, number>;
  logsByDate: Record<string, number>;
  recentActions: number;
}
```

### Audit API Implementation

```typescript
/**
 * Fetch audit logs with filtering, sorting, and pagination
 */
export const fetchAuditLogs = async ({
  filters,
  sortConfig,
  pagination,
  accessToken,
}: {
  filters: AuditLogFilters;
  sortConfig: AuditLogSortConfig;
  pagination: AuditLogPagination;
  accessToken: string;
}): Promise<{ logs: AuditLogEntry[]; total: number }> => {
  try {
    const params = new URLSearchParams();

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    // Add sorting
    params.append('sortField', sortConfig.field);
    params.append('sortDirection', sortConfig.direction);

    // Add pagination
    params.append('page', pagination.page.toString());
    params.append('pageSize', pagination.pageSize.toString());

    const response = await fetch(`/api/audit/logs?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.status}`);
    }

    const data = await response.json();
    return { logs: data.logs ?? [], total: data.total ?? 0 };
  } catch (error) {
    console.warn('Audit logs fetch failed:', error);
    return { logs: [], total: 0 };
  }
};

/**
 * Fetch audit statistics
 */
export const fetchAuditStats = async (accessToken: string): Promise<AuditLogStats> => {
  try {
    const response = await fetch('/api/audit/stats', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit stats: ${response.status}`);
    }

    const data = await response.json();
    return normalizeStats(data);
  } catch (error) {
    console.warn('Audit stats fetch failed:', error);
    return {
      totalLogs: 0,
      logsByAction: {},
      logsByUser: {},
      logsByStatus: {},
      logsByDate: {},
      recentActions: 0,
    };
  }
};
```

## Error Handling

### Custom Error Classes

```typescript
/**
 * API-specific error class with structured error information
 */
export class APIError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly details?: any;

  constructor(status: number, statusText: string, details?: any) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }

  /**
   * Check if error is a specific HTTP status
   */
  isStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if error indicates authentication failure
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is retryable (5xx errors)
   */
  isRetryable(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

/**
 * Network error for connectivity issues
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(`Network Error: ${message}`);
    this.name = 'NetworkError';
  }
}
```

### Error Handling Patterns

```typescript
/**
 * Retry mechanism with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or client errors
      if (error instanceof APIError && !error.isRetryable()) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Global error handler for API responses
 */
export const handleAPIResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorDetails: any;

    try {
      errorDetails = await response.json();
    } catch {
      // Response is not JSON
      errorDetails = { message: response.statusText };
    }

    throw new APIError(response.status, response.statusText, errorDetails);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from server');
  }
};
```

## State Management Integration

### Zustand Store Integration

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: UserResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (provider: 'google' | 'microsoft') => Promise<void>;
  handleCallback: (code: string, provider: string, state?: string) => Promise<void>;
  refreshTokens: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (provider) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.initiateLogin(provider);
          window.location.href = response.auth_url;
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      handleCallback: async (code, provider, state) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await authAPI.handleCallback(code, provider, state);
          set({
            user: tokens.user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;

        try {
          const newTokens = await authAPI.refreshToken(refreshToken);
          set({
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
          });
        } catch (error) {
          // Refresh failed - logout user
          get().logout();
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Automatic Token Refresh

```typescript
/**
 * HTTP interceptor for automatic token refresh
 */
export const createAuthenticatedFetch = () => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const authStore = useAuthStore.getState();
    let { accessToken } = authStore;

    // Add auth header if token exists
    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }

    let response = await fetch(url, options);

    // Handle token expiration
    if (response.status === 401 && accessToken) {
      try {
        // Attempt token refresh
        await authStore.refreshTokens();
        accessToken = useAuthStore.getState().accessToken;

        if (accessToken) {
          // Retry request with new token
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          response = await fetch(url, options);
        }
      } catch (error) {
        // Refresh failed - user needs to login again
        authStore.logout();
        throw new APIError(401, 'Authentication required');
      }
    }

    return response;
  };
};

export const authenticatedFetch = createAuthenticatedFetch();
```

## Integration Patterns

### React Hook Integration

```typescript
/**
 * Custom hook for API calls with loading and error states
 */
export function useAPI<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * Usage example
 */
function HealthStatus() {
  const { data: health, loading, error, refetch } = useAPI(
    () => checkSystemHealth(),
    []
  );

  if (loading) return <div>Loading health status...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!health) return <div>No health data available</div>;

  return (
    <div>
      <h3>System Status: {health.health.status}</h3>
      <button onClick={refetch}>Refresh</button>
      {/* Render health details */}
    </div>
  );
}
```

### Error Boundary Integration

```typescript
/**
 * API Error Boundary for handling API errors globally
 */
export class APIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log API errors to monitoring service
    if (error instanceof APIError) {
      console.error('API Error caught by boundary:', {
        status: error.status,
        statusText: error.statusText,
        details: error.details,
        errorInfo,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;

      if (error instanceof APIError && error.isAuthError()) {
        // Redirect to login on auth errors
        return <Navigate to="/login" replace />;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategies

### Mock API Implementation

```typescript
/**
 * Mock API client for testing
 */
export class MockAuthAPI {
  async initiateLogin(provider: 'google' | 'microsoft'): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return {
      auth_url: `https://mock-oauth.example.com/auth?provider=${provider}`,
      provider,
      state: 'mock-state-123',
    };
  }

  async handleCallback(code: string, provider: string): Promise<TokenResponse> {
    if (code === 'invalid-code') {
      throw new APIError(400, 'Invalid authorization code');
    }

    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'editor',
        provider,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<Omit<TokenResponse, 'user'>> {
    if (refreshToken === 'expired-token') {
      throw new APIError(401, 'Refresh token expired');
    }

    return {
      access_token: 'new-mock-access-token',
      refresh_token: 'new-mock-refresh-token',
      token_type: 'bearer',
    };
  }
}
```

### Integration Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../auth-store';
import { MockAuthAPI } from '../__mocks__/auth-api';

// Mock the API
jest.mock('../auth-api', () => ({
  authAPI: new MockAuthAPI(),
}));

describe('Auth Store Integration', () => {
  beforeEach(() => {
    useAuthStore.getState().logout(); // Reset state
  });

  test('should handle successful login flow', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.handleCallback('valid-code', 'google');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.accessToken).toBe('mock-access-token');
  });

  test('should handle token refresh', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Set initial tokens
    act(() => {
      result.current.handleCallback('valid-code', 'google');
    });

    await act(async () => {
      await result.current.refreshTokens();
    });

    expect(result.current.accessToken).toBe('new-mock-access-token');
  });

  test('should logout on refresh failure', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Set expired refresh token
    act(() => {
      // @ts-ignore - setting internal state for test
      result.current.refreshToken = 'expired-token';
    });

    await act(async () => {
      await result.current.refreshTokens();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
  });
});
```

## Best Practices

### 1. Type Safety
- Always define interfaces for API requests and responses
- Use discriminated unions for different response types
- Leverage TypeScript's strict mode for better type checking

### 2. Error Handling
- Implement consistent error handling across all API clients
- Use custom error classes for different error types
- Provide user-friendly error messages

### 3. Performance
- Implement request deduplication for identical concurrent requests
- Use proper caching strategies for static data
- Implement pagination for large datasets

### 4. Security
- Never log sensitive data (tokens, passwords)
- Implement proper token storage (secure, httpOnly cookies when possible)
- Use HTTPS in production
- Implement CSRF protection for state-changing operations

### 5. Testing
- Mock external API calls in unit tests
- Test error scenarios and edge cases
- Use integration tests for complete user flows
- Implement proper test data setup and teardown

This documentation provides a comprehensive guide to the TypeScript API client implementation, covering all major patterns and best practices used in the AI-Doc-Editor frontend application.