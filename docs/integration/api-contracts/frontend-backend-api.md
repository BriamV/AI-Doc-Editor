# Frontend-Backend API Contracts

Esta documentación especifica los contratos de API REST entre el Frontend (React + TypeScript) y el Backend (FastAPI + Python), incluyendo endpoints, esquemas de datos y ejemplos de uso.

## 🏗️ API Architecture

### Base Configuration
- **Base URL**: `https://api.ai-doc-editor.com/api/v1`
- **Authentication**: Bearer JWT tokens
- **Content-Type**: `application/json`
- **Rate Limiting**: Variable por endpoint
- **API Version**: v1 (current)

### Common Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <unique_request_id>
X-Client-Version: <frontend_version>
```

## 🔐 Authentication Endpoints

### POST /auth/login
Intercambio de código OAuth por JWT token.

#### Request
```typescript
interface LoginRequest {
  provider: 'google' | 'github' | 'microsoft';
  code: string;
  redirect_uri: string;
  state?: string;
}
```

#### Response (201 Created)
```typescript
interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    provider: string;
    created_at: string;
    updated_at: string;
  };
}
```

#### Example
```typescript
// Frontend usage
const loginResponse = await authService.exchangeCodeForToken({
  provider: 'google',
  code: 'auth_code_from_oauth',
  redirect_uri: 'http://localhost:3000/auth/callback'
});

// Store token and user data
authStore.login(loginResponse.access_token, loginResponse.user);
```

### POST /auth/refresh
Renovar JWT token expirado.

#### Request
```typescript
interface RefreshRequest {
  refresh_token: string;
}
```

#### Response (200 OK)
```typescript
interface RefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string; // New refresh token if rotated
}
```

### POST /auth/logout
Invalidar tokens del usuario.

#### Request
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

#### Response (204 No Content)
```http
HTTP/1.1 204 No Content
```

## 📄 Document Management Endpoints

### GET /documents
Listar documentos del usuario con paginación y filtros.

#### Query Parameters
```typescript
interface DocumentListParams {
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  search?: string;         // Search in title/content
  sort?: 'created_at' | 'updated_at' | 'title';
  order?: 'asc' | 'desc';  // Default: 'desc'
  tag?: string[];          // Filter by tags
  status?: 'draft' | 'published' | 'archived';
}
```

#### Response (200 OK)
```typescript
interface DocumentListResponse {
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  meta: {
    search_query?: string;
    filters_applied: string[];
    total_filtered: number;
  };
}

interface Document {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  word_count: number;
  reading_time: number; // minutes
  created_at: string;
  updated_at: string;
  user_id: string;
  version: number;
  ai_generated: boolean;
}
```

#### Example
```typescript
// Frontend usage
const documents = await documentService.getDocuments({
  page: 1,
  limit: 20,
  search: 'machine learning',
  sort: 'updated_at',
  order: 'desc',
  tag: ['ai', 'research']
});

// Update store
documentStore.setDocuments(documents.data);
documentStore.setPagination(documents.pagination);
```

### POST /documents
Crear nuevo documento.

#### Request
```typescript
interface CreateDocumentRequest {
  title: string;
  content?: string;        // Default: empty string
  status?: 'draft' | 'published'; // Default: 'draft'
  tags?: string[];
  template_id?: string;    // Use predefined template
  ai_prompt?: string;      // Generate with AI
}
```

#### Response (201 Created)
```typescript
interface CreateDocumentResponse {
  document: Document;
  ai_metadata?: {
    model_used: string;
    tokens_consumed: number;
    generation_time_ms: number;
  };
}
```

#### Example
```typescript
// Create document manually
const newDocument = await documentService.createDocument({
  title: 'My New Document',
  content: 'Initial content...',
  tags: ['project', 'draft']
});

// Create with AI assistance
const aiDocument = await documentService.createDocument({
  title: 'AI Generated Report',
  ai_prompt: 'Create a technical report about machine learning trends in 2025',
  tags: ['ai', 'report']
});
```

### GET /documents/{id}
Obtener documento específico.

#### Response (200 OK)
```typescript
interface DocumentResponse {
  document: Document;
  collaborators?: {
    id: string;
    name: string;
    avatar_url?: string;
    last_seen: string;
    cursor_position?: number;
  }[];
  revision_history?: {
    id: string;
    version: number;
    changes_summary: string;
    created_at: string;
    created_by: string;
  }[];
}
```

### PUT /documents/{id}
Actualizar documento completo.

#### Request
```typescript
interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  version: number;         // For optimistic locking
}
```

#### Response (200 OK)
```typescript
interface UpdateDocumentResponse {
  document: Document;
  conflicts?: {
    field: string;
    current_value: any;
    attempted_value: any;
  }[];
}
```

#### Error Response (409 Conflict)
```typescript
interface ConflictResponse {
  error: {
    code: 'DOCUMENT_CONFLICT';
    message: 'Document was modified by another user';
    details: {
      current_version: number;
      your_version: number;
      conflicting_fields: string[];
    };
  };
}
```

### PATCH /documents/{id}
Actualización parcial de documento.

#### Request
```typescript
interface PatchDocumentRequest {
  title?: string;
  content?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}
```

### DELETE /documents/{id}
Eliminar documento (soft delete).

#### Response (204 No Content)
```http
HTTP/1.1 204 No Content
```

## 🤖 AI Integration Endpoints

### POST /documents/{id}/ai/improve
Mejorar documento con AI.

#### Request
```typescript
interface AIImproveRequest {
  instruction: string;     // "Make it more formal", "Add examples"
  sections?: string[];     // Specific sections to improve
  preserve_tone?: boolean; // Keep original writing style
  max_tokens?: number;     // Limit AI generation
}
```

#### Response (200 OK)
```typescript
interface AIImproveResponse {
  improved_content: string;
  changes_made: {
    type: 'addition' | 'modification' | 'deletion';
    section: string;
    description: string;
  }[];
  ai_metadata: {
    model_used: string;
    tokens_consumed: number;
    confidence_score: number;
  };
}
```

### POST /documents/{id}/ai/summarize
Generar resumen del documento.

#### Request
```typescript
interface AISummarizeRequest {
  length: 'short' | 'medium' | 'long';
  style?: 'bullet_points' | 'paragraph' | 'executive';
  focus_areas?: string[];  // ["key_findings", "methodology", "conclusions"]
}
```

#### Response (200 OK)
```typescript
interface AISummarizeResponse {
  summary: string;
  key_points: string[];
  word_count: number;
  ai_metadata: {
    model_used: string;
    tokens_consumed: number;
    processing_time_ms: number;
  };
}
```

## 👥 User Management Endpoints

### GET /users/me
Obtener perfil del usuario actual.

#### Response (200 OK)
```typescript
interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    bio?: string;
    preferences: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      timezone: string;
      notifications: {
        email: boolean;
        desktop: boolean;
        collaboration: boolean;
      };
    };
    subscription: {
      plan: 'free' | 'pro' | 'enterprise';
      status: 'active' | 'cancelled' | 'expired';
      expires_at?: string;
      features: string[];
    };
    usage_stats: {
      documents_created: number;
      ai_tokens_used: number;
      storage_used_bytes: number;
    };
    created_at: string;
    updated_at: string;
  };
}
```

### PATCH /users/me
Actualizar perfil del usuario.

#### Request
```typescript
interface UpdateUserRequest {
  name?: string;
  bio?: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      desktop?: boolean;
      collaboration?: boolean;
    };
  };
}
```

## 🔍 Search and Analytics

### GET /search
Búsqueda global en documentos.

#### Query Parameters
```typescript
interface SearchParams {
  q: string;               // Search query
  type?: 'documents' | 'all';
  page?: number;
  limit?: number;
  filters?: {
    date_from?: string;
    date_to?: string;
    tags?: string[];
    status?: string[];
    ai_generated?: boolean;
  };
  sort?: 'relevance' | 'date' | 'title';
}
```

#### Response (200 OK)
```typescript
interface SearchResponse {
  results: {
    documents: {
      document: Document;
      highlights: {
        field: string;
        snippets: string[];
      }[];
      score: number;
    }[];
  };
  aggregations: {
    tags: { tag: string; count: number; }[];
    status: { status: string; count: number; }[];
    date_histogram: { date: string; count: number; }[];
  };
  pagination: PaginationInfo;
  query_time_ms: number;
  total_results: number;
}
```

### GET /analytics/dashboard
Dashboard de analytics del usuario.

#### Response (200 OK)
```typescript
interface AnalyticsDashboardResponse {
  overview: {
    total_documents: number;
    words_written: number;
    ai_assists_used: number;
    collaboration_sessions: number;
  };
  activity_trend: {
    date: string;
    documents_created: number;
    words_written: number;
    ai_requests: number;
  }[];
  popular_tags: {
    tag: string;
    usage_count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  ai_usage: {
    total_tokens_used: number;
    most_used_features: string[];
    efficiency_score: number;
  };
}
```

## 🏥 Health and Status

### GET /health
Health check del sistema.

#### Response (200 OK)
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime_seconds: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    openai: 'healthy' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
  };
  performance: {
    avg_response_time_ms: number;
    requests_per_minute: number;
    error_rate_percent: number;
  };
}
```

### GET /status
Estado del sistema y maintenance.

#### Response (200 OK)
```typescript
interface StatusResponse {
  operational: boolean;
  maintenance_mode: boolean;
  incidents: {
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    impact: 'minor' | 'major' | 'critical';
    created_at: string;
    updated_at: string;
  }[];
  scheduled_maintenance: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    impact: string;
  }[];
}
```

## ❌ Error Handling

### Standard Error Response
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    request_id: string;
    timestamp: string;
    path: string;
    method: string;
  };
}
```

### Common Error Codes
```typescript
enum APIErrorCode {
  // Authentication
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

### Error Examples
```typescript
// 400 Bad Request - Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field_errors": [
        {
          "field": "title",
          "message": "Title cannot be empty"
        },
        {
          "field": "content",
          "message": "Content exceeds maximum length"
        }
      ]
    }
  },
  "meta": {
    "request_id": "req_123456",
    "timestamp": "2025-09-22T10:00:00Z",
    "path": "/api/v1/documents",
    "method": "POST"
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "JWT token has expired",
    "details": {
      "expired_at": "2025-09-22T09:00:00Z",
      "current_time": "2025-09-22T10:00:00Z"
    }
  }
}

// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "1h",
      "retry_after": 3600
    }
  }
}
```

## 🔧 Frontend Integration

### API Service Layer
```typescript
// src/services/api/documentService.ts
export class DocumentService extends BaseAPIService {
  async getDocuments(params: DocumentListParams): Promise<DocumentListResponse> {
    return this.get('/documents', { params });
  }

  async createDocument(data: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    return this.post('/documents', data);
  }

  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<UpdateDocumentResponse> {
    return this.put(`/documents/${id}`, data);
  }

  async deleteDocument(id: string): Promise<void> {
    return this.delete(`/documents/${id}`);
  }
}

// Base service with common functionality
export abstract class BaseAPIService {
  protected async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.apiClient.get(url, config);
  }

  protected async post<T>(url: string, data?: any): Promise<T> {
    return this.apiClient.post(url, data);
  }

  // ... other HTTP methods
}
```

### Type-safe Request/Response
```typescript
// src/types/api.ts
export interface APIResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationInfo;
    request_id: string;
    timestamp: string;
  };
}

export type APICall<TRequest, TResponse> = (
  request: TRequest
) => Promise<APIResponse<TResponse>>;

// Usage with strong typing
const createDocument: APICall<CreateDocumentRequest, Document> = async (request) => {
  return documentService.createDocument(request);
};
```

## 📊 Performance Monitoring

### Request Timing
```typescript
// Add timing headers to track performance
interface ResponseTiming {
  'X-Response-Time': string;  // Total response time in ms
  'X-DB-Time': string;        // Database query time in ms
  'X-AI-Time': string;        // AI service time in ms
}
```

### Rate Limiting Headers
```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;     // Requests allowed per window
  'X-RateLimit-Remaining': string; // Requests remaining in window
  'X-RateLimit-Reset': string;     // Time when limit resets
  'X-RateLimit-Retry-After': string; // Seconds to wait if limited
}
```

## 📚 References

- [Backend API Implementation](../../backend/docs/api/)
- [Frontend API Integration](../../frontend/docs/api/)
- [OpenAPI Specification](../api-spec/)
- [Authentication Flow](../data-flow/authentication-flow.md)
- [Error Handling Strategy](../error-handling/)

---
*API contracts designed for type safety, performance, and developer experience*