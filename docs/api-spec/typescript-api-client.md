# TypeScript API Client Documentation

## Overview

This document provides comprehensive documentation for the TypeScript API client interfaces and integration patterns used in the AI-Doc-Editor frontend application. The client provides type-safe interfaces for communicating with the FastAPI backend and external services.

## Architecture

The API client architecture follows a layered approach:

1. **Core API Layer** (`src/api/`) - Low-level HTTP client implementations
2. **Type Definitions** (`src/types/`) - TypeScript interfaces and types
3. **Store Integration** (`src/store/`) - Zustand store integration with API calls
4. **Hook Layer** (`src/hooks/`) - React hooks for API integration
5. **Component Layer** - React components consuming API data

## Core API Clients

### 1. Authentication API Client (`auth-api.ts`)

**Purpose**: Handles OAuth 2.0 authentication flow with backend integration.

```typescript
interface LoginResponse {
  auth_url: string;
  provider: string;
  state: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

class AuthAPI {
  // Initiate OAuth login flow
  async initiateLogin(provider: 'google' | 'microsoft'): Promise<LoginResponse>

  // Handle OAuth callback and get tokens
  async handleCallback(code: string, provider: string, state?: string): Promise<TokenResponse>

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<Omit<TokenResponse, 'user'>>

  // Get current user profile
  async getCurrentUser(accessToken: string): Promise<UserResponse>

  // Health check
  async healthCheck(): Promise<boolean>
}
```

**Error Handling**:
- Network errors are caught and re-thrown with descriptive messages
- HTTP status codes are checked and appropriate errors are thrown
- Token expiration is handled with automatic refresh attempts

**Usage Example**:
```typescript
import { authAPI } from '@api/auth-api';

try {
  const loginResponse = await authAPI.initiateLogin('google');
  window.location.href = loginResponse.auth_url;
} catch (error) {
  console.error('Login initiation failed:', error);
}
```

### 2. OpenAI API Client (`api.ts`)

**Purpose**: Handles OpenAI API communication for chat completions.

```typescript
interface ChatCompletionParams {
  endpoint: string;
  messages: MessageInterface[];
  config: ConfigInterface;
  apiKey?: string;
  customHeaders?: Record<string, string>;
}

// Non-streaming chat completion
export const getChatCompletion = async (params: ChatCompletionParams) => {
  // Handles Azure endpoint detection
  // Manages authentication headers
  // Processes response and error handling
}

// Streaming chat completion
export const getChatCompletionStream = async (params: ChatCompletionParams) => {
  // Returns ReadableStream for real-time processing
  // Handles model_not_found errors
  // Manages rate limiting and quota errors
}
```

**Azure Integration**:
- Automatic Azure endpoint detection using `isAzureEndpoint()`
- Model name transformation for Azure (gpt-3.5-turbo → gpt-35-turbo)
- API version management for Azure endpoints

**Error Handling**:
- Model availability validation
- Rate limiting detection and user-friendly messages
- Quota exhaustion handling
- Network timeout management

### 3. Health Check API Client (`health-check.ts`)

**Purpose**: Monitors system health across frontend and backend dependencies.

```typescript
interface HealthStatus {
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

// Main health check function
export const checkSystemHealth = async (): Promise<HealthCheckResponse>

// Backend-specific health check
const checkBackendHealth = async (): Promise<HealthCheckResponse | null>

// Frontend-only fallback health check
const getFrontendOnlyHealth = async (): Promise<HealthCheckResponse>
```

**Multi-Layer Health Monitoring**:
1. **Backend Health**: Calls `/api/health` endpoint for comprehensive status
2. **Frontend Health**: Browser API availability, storage, and OpenAI key status
3. **Fallback Mode**: Frontend-only checks when backend is unavailable

**Dependency Checks**:
- **OpenAI**: API key validation and model availability
- **Browser**: IndexedDB, localStorage, Web Workers availability
- **Storage**: IndexedDB connectivity and write permissions
- **Backend**: Database, audit system, security features

### 4. Audit API Client (`audit-api.ts`)

**Purpose**: Provides admin-level access to audit logs and statistics.

```typescript
interface FetchLogsParams {
  filters: AuditLogFilters;
  sortConfig: AuditLogSortConfig;
  pagination: AuditLogPagination;
  accessToken: string;
}

// Fetch filtered and paginated audit logs
export const fetchAuditLogs = async (params: FetchLogsParams): Promise<FetchLogsResponse>

// Get audit system statistics
export const fetchAuditStats = async (accessToken: string): Promise<AuditLogStats>

// Get available action types for filtering
export const fetchActionTypes = async (accessToken: string): Promise<string[]>

// Fetch user list for filtering
export const fetchUsers = async (accessToken: string): Promise<Array<{id: string; email: string; name: string}>>
```

**Data Normalization**:
- Handles different response formats from backend vs. test mocks
- Normalizes pagination fields (`total` vs `total_count`)
- Converts raw statistics to frontend-expected format

**Security Features**:
- Admin-only access with token validation
- Comprehensive error handling with fallback data
- Safe JSON parsing with content-type validation

## Type System Integration

### Core Types

```typescript
// User and Authentication Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'editor' | 'admin';
  provider: 'google' | 'microsoft';
  avatar?: string;
}

// API Configuration Types
interface ConfigInterface {
  model: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stream?: boolean;
}

// Message Types
interface MessageInterface {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// Event Source Types for Streaming
interface EventSourceDataInterface {
  choices: EventSourceDataChoices[];
  created: number;
  id: string;
  model: string;
  object: string;
}

type EventSourceData = EventSourceDataInterface | '[DONE]';
```

### Error Types

```typescript
interface APIError {
  error: string;
  message: string;
  details?: object;
  timestamp: string;
  traceId?: string;
}

// Custom error classes
class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

## Store Integration Patterns

### Authentication Store Integration

```typescript
// auth-slice.ts
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (provider: 'google' | 'microsoft') => Promise<void>;
  handleCallback: (code: string, provider: string, state?: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
}

// Usage in store
const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State initialization
  isAuthenticated: false,
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  loading: false,
  error: null,

  // Actions using API clients
  login: async (provider) => {
    try {
      set({ loading: true, error: null });
      const response = await authAPI.initiateLogin(provider);
      window.location.href = response.auth_url;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  handleCallback: async (code, provider, state) => {
    try {
      set({ loading: true });
      const tokens = await authAPI.handleCallback(code, provider, state);

      // Store tokens securely
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);

      set({
        isAuthenticated: true,
        user: tokens.user,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

### Audit Store Integration

```typescript
// audit-slice.ts
interface AuditState {
  logs: AuditLogEntry[];
  stats: AuditLogStats | null;
  loading: boolean;
  error: string | null;
  filters: AuditLogFilters;
  pagination: AuditLogPagination;
  sortConfig: AuditLogSortConfig;
}

// Actions with error boundaries
const fetchLogs = async () => {
  try {
    set({ loading: true, error: null });
    const { accessToken } = get();
    const response = await fetchAuditLogs({
      filters: get().filters,
      sortConfig: get().sortConfig,
      pagination: get().pagination,
      accessToken: accessToken!
    });

    set({
      logs: response.logs,
      loading: false,
      pagination: {
        ...get().pagination,
        total: response.total
      }
    });
  } catch (error) {
    set({
      error: error.message,
      loading: false,
      logs: [] // Fallback to empty array
    });
  }
};
```

## React Hook Patterns

### Authentication Hooks

```typescript
// useAuth.ts - Authentication hook with auto-refresh
export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    login,
    logout,
    refresh,
    loading,
    error
  } = useAuthStore();

  // Auto-refresh token before expiration
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await refresh();
        } catch (error) {
          console.warn('Token refresh failed:', error);
          logout(); // Force logout on refresh failure
        }
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refresh, logout]);

  return {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    error,
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor'
  };
};
```

### API Validation Hooks

```typescript
// useApiValidation.ts - API key and endpoint validation
export const useApiValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);

  const validateOpenAIKey = useCallback(async (apiKey: string) => {
    setIsValidating(true);
    try {
      // Test API key with minimal request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.ok;
      setValidationResults({
        openai: {
          valid: isValid,
          error: isValid ? null : 'Invalid API key or insufficient permissions'
        }
      });
    } catch (error) {
      setValidationResults({
        openai: {
          valid: false,
          error: 'Network error during validation'
        }
      });
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateOpenAIKey,
    isValidating,
    validationResults
  };
};
```

### Stream Processing Hooks

```typescript
// useStreamProcessor.ts - Server-Sent Events processing
export const useStreamProcessor = () => {
  const [streamData, setStreamData] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processStream = useCallback(async (
    stream: ReadableStream,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ) => {
    setIsStreaming(true);
    setError(null);

    try {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed: EventSourceData = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (parseError) {
              console.warn('Failed to parse stream data:', data);
            }
          }
        }
      }
    } catch (streamError) {
      setError(streamError.message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    processStream,
    streamData,
    isStreaming,
    error
  };
};
```

## Error Handling Patterns

### Global Error Boundaries

```typescript
// ApiErrorBoundary.tsx
interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ApiErrorBoundary extends Component<PropsWithChildren, ApiErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log API errors to monitoring service
    if (error.name === 'AuthenticationError') {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.name === 'RateLimitError') {
      // Show rate limit message
      toast.error('Rate limit exceeded. Please try again later.');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="api-error-boundary">
          <h2>Something went wrong with the API</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Retry Logic

```typescript
// retryUtils.ts
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry certain errors
      if (error.name === 'AuthenticationError' || error.name === 'ValidationError') {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

// Usage example
const fetchWithRetry = () => withRetry(
  () => fetchAuditLogs(params),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

## Performance Optimization

### Request Caching

```typescript
// apiCache.ts
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

// Usage in API functions
export const getCachedUserProfile = async (accessToken: string): Promise<UserResponse> => {
  const cacheKey = `user_profile_${accessToken}`;
  const cached = apiCache.get<UserResponse>(cacheKey);

  if (cached) {
    return cached;
  }

  const profile = await authAPI.getCurrentUser(accessToken);
  apiCache.set(cacheKey, profile, 600000); // 10 minutes
  return profile;
};
```

### Request Deduplication

```typescript
// requestDeduplication.ts
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Usage
export const getHealthStatus = () => requestDeduplicator.dedupe(
  'health_status',
  () => checkSystemHealth()
);
```

## Security Considerations

### Token Management

```typescript
// tokenManager.ts
class TokenManager {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  setTokens(accessToken: string, refreshToken: string): void {
    // Use secure storage in production
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export const tokenManager = new TokenManager();
```

### Input Sanitization

```typescript
// sanitization.ts
export const sanitizeApiInput = <T extends Record<string, any>>(input: T): T => {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key as keyof T] = value
        .replace(/[<>]/g, '')
        .trim() as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeApiInput(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
};
```

## Testing Patterns

### API Client Testing

```typescript
// authAPI.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authAPI } from '@api/auth-api';

// Mock fetch globally
global.fetch = vi.fn();

describe('AuthAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateLogin', () => {
    it('should return auth URL for valid provider', async () => {
      const mockResponse = {
        auth_url: 'https://accounts.google.com/oauth/authorize?...',
        provider: 'google',
        state: 'random_state'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authAPI.initiateLogin('google');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?provider=google'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should throw error for invalid provider', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(authAPI.initiateLogin('invalid' as any))
        .rejects
        .toThrow('Login initiation failed: Bad Request');
    });
  });
});
```

### Hook Testing

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@hooks/useAuth';

describe('useAuth', () => {
  it('should handle login flow', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.login('google');
    });

    // Verify redirect or state change
    expect(window.location.href).toContain('accounts.google.com');
  });
});
```

## Integration Examples

### Component Integration

```typescript
// UserProfile.tsx
import React from 'react';
import { useAuth } from '@hooks/useAuth';
import { useApiValidation } from '@hooks/useApiValidation';

export const UserProfile: React.FC = () => {
  const { user, logout, loading, error } = useAuth();
  const { validateOpenAIKey, isValidating, validationResults } = useApiValidation();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div className="user-profile">
      <h2>Welcome, {user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Provider: {user.provider}</p>

      {user.role === 'admin' && (
        <button onClick={() => window.location.href = '/admin/audit'}>
          View Audit Logs
        </button>
      )}

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};
```

This comprehensive documentation provides a complete reference for TypeScript API client usage in the AI-Doc-Editor application, covering authentication, data fetching, error handling, performance optimization, and security considerations.