# Frontend API Integration Documentation

This directory contains documentation for the frontend API integration layer, covering HTTP client configuration, authentication integration, error handling, and backend communication patterns.

## API Architecture Overview

### API Layer Structure

The frontend API layer consists of 4 core files that handle different aspects of backend communication:

#### 🔗 **Core API Files**
- **api.ts**: Main API client configuration and base HTTP operations
- **auth-api.ts**: Authentication and authorization API endpoints
- **google-api.ts**: Google Cloud services integration (OAuth, Drive, etc.)
- **helper.ts**: API utility functions and common operations

## API Client Configuration

### Base API Setup (api.ts)
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Authentication API (auth-api.ts)
**Purpose**: Handle user authentication, session management, and authorization
**Key Endpoints**:
- `POST /auth/login`: User authentication
- `POST /auth/logout`: Session termination
- `POST /auth/refresh`: Token refresh
- `GET /auth/profile`: User profile retrieval
- `PUT /auth/profile`: Profile updates

**Implementation Pattern**:
```typescript
export class AuthApi {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new ApiError('Login failed', error);
    }
  }

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
}
```

### Google API Integration (google-api.ts)
**Purpose**: Google Cloud services integration and OAuth management
**Key Features**:
- OAuth 2.0 authentication flow
- Google Drive integration
- Google Cloud Storage operations
- Real-time collaboration APIs

**Implementation Pattern**:
```typescript
export class GoogleApi {
  private gapi: any;

  async initializeGoogleAuth(): Promise<void> {
    await new Promise((resolve) => {
      gapi.load('auth2', resolve);
    });

    await gapi.auth2.init({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file'
    });
  }

  async authenticateUser(): Promise<GoogleAuthResponse> {
    const authInstance = gapi.auth2.getAuthInstance();
    const user = await authInstance.signIn();
    return {
      token: user.getAuthResponse().access_token,
      profile: user.getBasicProfile()
    };
  }
}
```

### API Helpers (helper.ts)
**Purpose**: Common utility functions and shared API operations
**Key Functions**:
- Request/response transformation
- Error handling utilities
- Data validation functions
- Retry mechanisms

## API Integration Patterns

### 1. Request/Response Transformation
```typescript
// Request transformation
export const transformRequest = (data: any): any => {
  return {
    ...data,
    timestamp: Date.now(),
    clientVersion: process.env.REACT_APP_VERSION
  };
};

// Response transformation
export const transformResponse = (response: AxiosResponse): any => {
  return {
    data: response.data,
    status: response.status,
    timestamp: Date.now()
  };
};
```

### 2. Error Handling Strategy
```typescript
export class ApiError extends Error {
  public status: number;
  public code: string;
  public details: any;

  constructor(message: string, error: any) {
    super(message);
    this.status = error.response?.status || 500;
    this.code = error.response?.data?.code || 'UNKNOWN_ERROR';
    this.details = error.response?.data?.details || {};
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError('An unexpected error occurred', error);
};
```

### 3. Retry Mechanism
```typescript
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};
```

### 4. Request Caching
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}
```

## API Endpoint Documentation

### Authentication Endpoints
```typescript
// User authentication
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, user: User, expiresIn: number }

// Token refresh
POST /api/auth/refresh
Request: { refreshToken: string }
Response: { token: string, expiresIn: number }

// User profile
GET /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Response: { user: User }
```

### Document Endpoints
```typescript
// Get documents
GET /api/documents
Headers: { Authorization: "Bearer <token>" }
Response: { documents: Document[] }

// Create document
POST /api/documents
Request: { title: string, content: string, type: string }
Response: { document: Document }

// Update document
PUT /api/documents/{id}
Request: { title?: string, content?: string }
Response: { document: Document }
```

### Chat/AI Endpoints
```typescript
// Send chat message
POST /api/chat/send
Request: { message: string, context?: string }
Response: { response: string, messageId: string }

// Get chat history
GET /api/chat/history
Response: { messages: ChatMessage[] }

// Stream AI response
POST /api/chat/stream
Request: { prompt: string, options?: StreamOptions }
Response: Server-Sent Events stream
```

## Integration with Frontend Stores

### Store Integration Pattern
```typescript
// Document store API integration
export const useDocumentApi = () => {
  const { setDocuments, addDocument, updateDocument } = useDocumentStore();
  const { showToast } = useToastStore();

  const fetchDocuments = async () => {
    try {
      const documents = await documentApi.getDocuments();
      setDocuments(documents);
    } catch (error) {
      showToast('Failed to fetch documents', 'error');
      throw error;
    }
  };

  const createDocument = async (documentData: CreateDocumentRequest) => {
    try {
      const newDocument = await documentApi.createDocument(documentData);
      addDocument(newDocument);
      showToast('Document created successfully', 'success');
      return newDocument;
    } catch (error) {
      showToast('Failed to create document', 'error');
      throw error;
    }
  };

  return { fetchDocuments, createDocument };
};
```

### Authentication Integration
```typescript
// Auth store API integration
export const useAuthApi = () => {
  const { setUser, clearUser, setToken } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    try {
      const authResponse = await authApi.login(credentials);
      setUser(authResponse.user);
      setToken(authResponse.token);
      return authResponse;
    } catch (error) {
      clearUser();
      throw error;
    }
  };

  return { login };
};
```

## Real-time Communication

### WebSocket Integration
```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    const token = getAuthToken();
    this.ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }
}
```

## Security Implementation

### Token Management
```typescript
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_KEY = 'refresh_token';

  static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, encrypt(token));
    localStorage.setItem(this.REFRESH_KEY, encrypt(refreshToken));
  }

  static getToken(): string | null {
    const encrypted = localStorage.getItem(this.TOKEN_KEY);
    return encrypted ? decrypt(encrypted) : null;
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }
}
```

### Request Validation
```typescript
export const validateApiRequest = (data: any, schema: any): boolean => {
  try {
    schema.parse(data);
    return true;
  } catch (error) {
    console.error('Request validation failed:', error);
    return false;
  }
};
```

## Testing Strategies

### API Testing with MSW
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'mock-token',
        user: { id: 1, email: 'test@example.com' }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Integration Testing
```typescript
import { render, waitFor } from '@testing-library/react';
import { DocumentList } from './DocumentList';

test('fetches and displays documents', async () => {
  render(<DocumentList />);

  await waitFor(() => {
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Request Batching
```typescript
class RequestBatcher {
  private batch: Promise<any>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  addRequest(request: Promise<any>): void {
    this.batch.push(request);

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, 100);
    }
  }

  private async executeBatch(): Promise<void> {
    const requests = [...this.batch];
    this.batch = [];
    this.batchTimeout = null;

    await Promise.allSettled(requests);
  }
}
```

## Cross-References

### Related Documentation
- **Backend API**: [../../backend/docs/api/](../../backend/docs/api/) for backend contract details
- **Authentication**: [../../docs/security/](../../docs/security/) for security architecture
- **State Management**: [../state/](../state/) for store integration patterns
- **Components**: [../components/](../components/) for API usage in components

### Source Code References
- **API Files**: [/src/api/](../../../src/api/)
- **API Tests**: [/src/api/**/*.test.ts](../../../src/api/)
- **API Types**: [/src/types/api.ts](../../../src/types/api.ts)

## Best Practices

### API Design
- Use TypeScript for type safety
- Implement proper error handling
- Use consistent naming conventions
- Document all endpoints and responses

### Performance
- Implement request caching
- Use request batching for multiple calls
- Implement proper retry mechanisms
- Monitor API performance metrics

### Security
- Always validate API responses
- Implement proper token management
- Use HTTPS for all communications
- Sanitize all user inputs before sending

Last updated: 2025-09-22