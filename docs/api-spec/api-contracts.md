# API Contracts and Integration Specifications

## Overview

This document defines the formal contracts between different systems in the AI-Doc-Editor architecture. These contracts ensure consistent communication protocols, error handling, and data formats across all system boundaries.

## System Architecture

```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐
│                 │ ◄────────────► │                 │
│  React Frontend │                │ FastAPI Backend │
│  (TypeScript)   │                │   (Python)      │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
         │                                   │
         │ HTTP                              │ HTTP
         ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│                 │                │                 │
│ Electron Desktop│                │   OpenAI API    │
│   (Node.js)     │                │   (External)    │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
```

## 1. Frontend ↔ Backend Contract

### 1.1 Authentication Flow Contract

#### OAuth 2.0 Initiation
**Endpoint**: `POST /api/auth/login`

**Request Contract**:
```typescript
interface LoginRequest {
  provider: 'google' | 'microsoft';
}
```

**Response Contract**:
```typescript
interface LoginResponse {
  auth_url: string;          // OAuth provider authorization URL
  provider: string;          // Echo of provider
  state: string;            // CSRF protection state parameter
}
```

**Error Contract**:
```typescript
interface AuthError {
  error: 'invalid_provider' | 'service_unavailable';
  message: string;
  timestamp: string;
}
```

#### OAuth Callback Handling
**Endpoint**: `GET /api/auth/callback`

**Request Contract**:
```typescript
interface CallbackRequest {
  code: string;             // Authorization code from provider
  state: string;            // State parameter for CSRF validation
  provider: 'google' | 'microsoft';
}
```

**Response Contract**:
```typescript
interface TokenResponse {
  access_token: string;     // JWT access token (15min TTL)
  refresh_token: string;    // Refresh token (30d TTL)
  token_type: 'bearer';
  expires_in: number;       // Token expiration in seconds
  user: UserProfile;
}

interface UserProfile {
  id: string;               // Unique user identifier
  email: string;            // Verified email from OAuth provider
  name: string;             // Display name from OAuth provider
  role: 'editor' | 'admin'; // System role assignment
  provider: 'google' | 'microsoft';
  avatar?: string;          // Profile picture URL
  created_at: string;       // ISO timestamp
  last_login_at: string;    // ISO timestamp
}
```

#### Token Refresh
**Endpoint**: `POST /api/auth/refresh`

**Request Contract**:
```typescript
interface RefreshRequest {
  refresh_token: string;
}
```

**Response Contract**:
```typescript
interface RefreshResponse {
  access_token: string;
  refresh_token: string;    // New refresh token (rotation)
  token_type: 'bearer';
  expires_in: number;
}
```

### 1.2 Health Monitoring Contract

#### Comprehensive Health Check
**Endpoint**: `GET /api/health`

**Response Contract**:
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;        // ISO 8601 format
  version: string;          // Semantic version
  deps: {
    openai?: OpenAIDependency;
    storage?: StorageDependency;
    database?: DatabaseDependency;
    [key: string]: Dependency;
  };
}

interface OpenAIDependency {
  status: 'available' | 'error' | 'timeout' | 'not_configured';
  response_time_ms?: number;
  models_available?: number;
  api_version?: string;
  error?: string;
}

interface StorageDependency {
  status: 'available' | 'error';
  type?: 'filesystem' | 'cloud';
  writable?: boolean;
  error?: string;
}
```

### 1.3 User Credentials Management Contract

#### Store User Credentials
**Endpoint**: `POST /api/user/credentials`

**Request Contract**:
```typescript
interface CredentialsRequest {
  openai_api_key: string;   // Must match pattern: ^sk-[A-Za-z0-9]{20,}$
}
```

**Response Contract**:
```typescript
interface CredentialsResponse {
  has_api_key: boolean;
  key_preview: string;      // Format: "sk-****...1234"
  encrypted: boolean;       // Always true for security
  stored_at: string;        // ISO timestamp
}
```

**Security Requirements**:
- API keys must be encrypted at rest using AES-256
- Keys are never returned in full, only previews
- User authentication required via JWT

### 1.4 Audit System Contract

#### Audit Log Retrieval
**Endpoint**: `GET /api/audit/logs`

**Query Parameters Contract**:
```typescript
interface AuditQueryParams {
  user_id?: string;
  user_email?: string;
  action_type?: AuditActionType;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  status?: 'success' | 'failure' | 'error';
  date_from?: string;       // ISO 8601
  date_to?: string;         // ISO 8601
  page?: number;            // Default: 1, Min: 1
  page_size?: number;       // Default: 50, Min: 1, Max: 1000
  sort_by?: 'timestamp' | 'action_type' | 'user_email' | 'status';
  sort_order?: 'asc' | 'desc';
}
```

**Response Contract**:
```typescript
interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  filters_applied: AuditQueryParams;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;        // ISO 8601
  action_type: AuditActionType;
  description: string;
  user_id?: string;
  user_email?: string;
  user_role?: 'editor' | 'admin';
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'error';
  details?: Record<string, any>;
  integrity_hash: string;   // SHA-256 hash for WORM compliance
}

enum AuditActionType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTRATION = 'USER_REGISTRATION',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  API_KEY_UPDATE = 'API_KEY_UPDATE',
  DOCUMENT_CREATE = 'DOCUMENT_CREATE',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_SHARE = 'DOCUMENT_SHARE',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  ADMIN_ACTION = 'ADMIN_ACTION',
  SECURITY_EVENT = 'SECURITY_EVENT',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT'
}
```

**Authorization Contract**:
- Requires `admin` role in JWT token
- Rate limited: 100 requests per minute per admin user
- IP address logging mandatory for all audit access

## 2. Frontend → Backend Chat Proxy Contract

### Overview

All OpenAI API calls are proxied through the backend to ensure secure key management and proper authentication.

### Chat Completions Proxy

```typescript
interface ChatProxyContract {
  POST: {
    "/api/chat/completions": {
      request: {
        headers: {
          Authorization: string; // Bearer {JWT}
          "Content-Type": "application/json";
        };
        body: {
          messages: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }>;
          model?: string; // Default: "gpt-4o-mini"
          temperature?: number; // 0-2, default: 0.7
          max_tokens?: number;
          stream?: boolean; // Default: false
        };
      };
      response: {
        200: OpenAIChatResponse | StreamingResponse;
        401: UnauthorizedError;
        402: {
          error: "no_api_key";
          message: string;
        };
        500: InternalServerError;
      };
      security: {
        authentication: "JWT Bearer token";
        api_key_source: "user_credentials OR global_fallback";
        encryption: "AES-256 (Fernet)";
      };
      sla: {
        response_time: "< 30000ms"; // OpenAI call timeout
        availability: "99.9%";
      };
    };
  };
}
```

### API Key Resolution Flow

```typescript
/**
 * Backend resolves API key in this order:
 * 1. User's stored API key (from credentials table, encrypted)
 * 2. Global OPENAI_API_KEY from environment
 * 3. Error 402 if neither available
 */
```

### Error Handling

```typescript
interface ChatProxyErrors {
  401: "Invalid or expired JWT token";
  402: "No API key configured (user or global)";
  429: "OpenAI rate limit exceeded";
  500: "OpenAI API error or server error";
}
```

### Streaming Support

The proxy supports Server-Sent Events (SSE) for streaming responses:
```typescript
Content-Type: text/event-stream
Transfer-Encoding: chunked

data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" world"}}]}

data: [DONE]
```

## 3. Desktop ↔ Frontend Contract

### 3.1 Electron IPC Contract

#### Window Management
```typescript
interface WindowControls {
  minimize(): void;
  maximize(): void;
  close(): void;
  isMaximized(): Promise<boolean>;
}

// IPC Channel: 'window-controls'
```

#### File System Access
```typescript
interface FileSystemAPI {
  selectFile(filters?: FileFilter[]): Promise<string | null>;
  selectDirectory(): Promise<string | null>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  showSaveDialog(options: SaveDialogOptions): Promise<string | null>;
}

interface FileFilter {
  name: string;
  extensions: string[];
}

// IPC Channel: 'file-system'
```

#### Auto-Updater Contract
```typescript
interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  downloadURL: string;
}

interface UpdaterAPI {
  checkForUpdates(): Promise<UpdateInfo | null>;
  downloadUpdate(): Promise<void>;
  installUpdate(): void;
  onUpdateAvailable(callback: (info: UpdateInfo) => void): void;
  onUpdateDownloaded(callback: () => void): void;
}

// IPC Channel: 'auto-updater'
```

## 4. Error Handling Contracts

### 4.1 HTTP Error Response Format

**Standard Error Response**:
```typescript
interface StandardError {
  error: string;            // Machine-readable error code
  message: string;          // Human-readable error message
  details?: Record<string, any>; // Additional error context
  timestamp: string;        // ISO 8601 timestamp
  trace_id?: string;        // Request tracing identifier
  path?: string;           // Request path that caused error
  method?: string;         // HTTP method
}
```

**Error Code Classifications**:
```typescript
// Authentication Errors (4xx)
'auth_required'           // 401: Authentication required
'auth_invalid'           // 401: Invalid credentials
'auth_expired'           // 401: Token expired
'permission_denied'      // 403: Insufficient permissions
'resource_not_found'     // 404: Resource not found

// Client Errors (4xx)
'validation_error'       // 400: Request validation failed
'rate_limit_exceeded'    // 429: Rate limit exceeded
'payload_too_large'      // 413: Request body too large

// Server Errors (5xx)
'internal_error'         // 500: Internal server error
'service_unavailable'    // 503: Service temporarily unavailable
'dependency_error'       // 503: External dependency failure
```

### 4.2 Frontend Error Handling Contract

**Error Boundary Interface**:
```typescript
interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorHandler {
  handleError(error: Error, errorInfo?: ErrorInfo): void;
  reportError(error: Error, context: Record<string, any>): void;
  showUserError(message: string, type: 'error' | 'warning' | 'info'): void;
}
```

**API Error Recovery**:
```typescript
interface RetryConfig {
  maxAttempts: number;      // Default: 3
  baseDelay: number;        // Default: 1000ms
  maxDelay: number;         // Default: 10000ms
  backoffFactor: number;    // Default: 2
  retryableErrors: string[]; // Error codes that can be retried
}

// Non-retryable errors
const NON_RETRYABLE_ERRORS = [
  'auth_invalid',
  'auth_expired',
  'permission_denied',
  'validation_error',
  'resource_not_found'
];
```

## 5. Security Contracts

### 5.1 Authentication Security

**JWT Token Format**:
```typescript
interface JWTHeader {
  alg: 'RS256';            // RSA signature with SHA-256
  typ: 'JWT';
  kid: string;             // Key identifier
}

interface JWTPayload {
  iss: string;             // Issuer (API domain)
  sub: string;             // Subject (user ID)
  aud: string;             // Audience (client ID)
  exp: number;             // Expiration time (Unix timestamp)
  iat: number;             // Issued at (Unix timestamp)
  nbf: number;             // Not before (Unix timestamp)
  jti: string;             // JWT ID (unique identifier)

  // Custom claims
  email: string;
  name: string;
  role: 'editor' | 'admin';
  provider: 'google' | 'microsoft';
  permissions: string[];
}
```

**Token Lifecycle**:
- Access token TTL: 15 minutes
- Refresh token TTL: 30 days
- Refresh token rotation: Required on each refresh
- Automatic token refresh: 5 minutes before expiration

### 5.2 Rate Limiting Contract

**Rate Limit Headers**:
```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;      // Requests allowed per window
  'X-RateLimit-Remaining': string;  // Requests remaining in window
  'X-RateLimit-Reset': string;      // Window reset time (Unix timestamp)
  'X-RateLimit-Policy': string;     // Rate limit policy identifier
}
```

**Rate Limit Policies**:
```typescript
interface RateLimitPolicy {
  auth_endpoints: {
    limit: 10;              // requests per window
    window: 900;            // 15 minutes
  };

  api_endpoints: {
    limit: 1000;            // requests per window
    window: 3600;           // 1 hour
  };

  audit_endpoints: {
    limit: 100;             // requests per window (admin only)
    window: 60;             // 1 minute
  };

  openai_proxy: {
    limit: 50;              // requests per window
    window: 60;             // 1 minute
  };
}
```

### 5.3 Data Encryption Contract

**Encryption Standards**:
```typescript
interface EncryptionConfig {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: 100000;
  saltLength: 32;          // bytes
  ivLength: 12;            // bytes for GCM
  tagLength: 16;           // bytes for GCM
}

interface EncryptedData {
  ciphertext: string;      // Base64 encoded
  iv: string;             // Base64 encoded initialization vector
  tag: string;            // Base64 encoded authentication tag
  salt: string;           // Base64 encoded salt
}
```

## 6. Performance Contracts

### 6.1 Response Time SLAs

**API Endpoint SLAs**:
```typescript
interface PerformanceSLA {
  health_endpoints: {
    target: '< 100ms';
    max: '< 500ms';
  };

  auth_endpoints: {
    target: '< 200ms';
    max: '< 1000ms';
  };

  audit_endpoints: {
    target: '< 500ms';
    max: '< 2000ms';
  };

  openai_proxy: {
    target: '< 5000ms';     // Depends on OpenAI API
    max: '< 30000ms';
  };
}
```

### 6.2 Caching Contract

**Cache Headers**:
```typescript
interface CacheHeaders {
  'Cache-Control': string;  // e.g., 'max-age=300, private'
  'ETag': string;          // Resource version identifier
  'Last-Modified': string; // RFC 7231 date format
  'Vary': string;          // Headers affecting cache key
}
```

**Cache Policies**:
```typescript
interface CachePolicy {
  static_assets: {
    'Cache-Control': 'public, max-age=31536000, immutable';
  };

  api_responses: {
    'Cache-Control': 'private, max-age=300';
  };

  user_profile: {
    'Cache-Control': 'private, max-age=600';
  };

  health_status: {
    'Cache-Control': 'no-cache, must-revalidate';
  };
}
```

## 7. Monitoring and Observability Contracts

### 7.1 Logging Contract

**Structured Log Format**:
```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  service: string;          // Service name
  version: string;          // Service version
  environment: string;      // Environment name

  // Request context
  request_id?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;

  // Additional metadata
  tags?: Record<string, string>;
  extra?: Record<string, any>;

  // Error details
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### 7.2 Metrics Contract

**Performance Metrics**:
```typescript
interface PerformanceMetrics {
  request_duration_ms: number;
  response_size_bytes: number;
  database_query_count: number;
  database_query_duration_ms: number;
  cache_hit_ratio: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
}

interface BusinessMetrics {
  active_users: number;
  documents_created: number;
  api_calls_made: number;
  error_rate: number;
  user_satisfaction_score: number;
}
```

This comprehensive API contract documentation ensures consistent integration patterns, error handling, security measures, and performance standards across all system boundaries in the AI-Doc-Editor architecture.