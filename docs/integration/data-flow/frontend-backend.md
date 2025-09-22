# Frontend-Backend Communication Patterns

Esta documentación describe los patrones de comunicación entre el Frontend (React + Zustand) y el Backend (FastAPI), incluyendo llamadas a API, gestión de estado, y patrones de sincronización.

## 🏗️ Arquitectura de Comunicación

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Zustand + Axios
- **Backend**: FastAPI + SQLAlchemy + Pydantic v2
- **Protocolo**: HTTP/REST + WebSocket (tiempo real)
- **Formato**: JSON con validación de esquemas

### Patrones de Comunicación
```
[React Components] → [API Service Layer] → [Backend Endpoints]
        ↓                     ↓                    ↓
[Zustand Stores]  → [HTTP Interceptors] → [Database Layer]
        ↓
[UI Updates]
```

## 🔄 Flujo de Datos CRUD

### 1. Create Operations

#### Frontend Implementation
```typescript
// src/services/documentService.ts
export class DocumentService {
  private apiClient = createAPIClient();

  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const response = await this.apiClient.post<Document>('/documents', data);
    return response.data;
  }
}

// src/store/documentStore.ts
interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  createDocument: (data: CreateDocumentRequest) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  createDocument: async (data: CreateDocumentRequest) => {
    set({ isLoading: true, error: null });

    try {
      // Optimistic update
      const tempDocument = {
        id: `temp-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      set(state => ({
        documents: [...state.documents, tempDocument]
      }));

      // API call
      const newDocument = await documentService.createDocument(data);

      // Replace temporary document with real one
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === tempDocument.id ? newDocument : doc
        ),
        isLoading: false
      }));

    } catch (error) {
      // Rollback optimistic update
      set(state => ({
        documents: state.documents.filter(doc => !doc.id.startsWith('temp-')),
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }
}));
```

#### Backend Implementation
```python
# backend/routers/documents.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.schemas.document import DocumentCreate, DocumentResponse
from backend.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/", response_model=DocumentResponse)
async def create_document(
    document_data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new document for the authenticated user.
    """
    try:
        document_service = DocumentService(db)
        document = await document_service.create_document(
            data=document_data,
            user_id=current_user.id
        )
        return DocumentResponse.from_orm(document)

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Document creation failed: {e}")
        raise HTTPException(status_code=500, detail="Document creation failed")
```

### 2. Read Operations with Pagination

#### Frontend with Infinite Scroll
```typescript
// src/hooks/useInfiniteDocuments.ts
export const useInfiniteDocuments = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['documents'],
    queryFn: ({ pageParam = 0 }) =>
      documentService.getDocuments({
        offset: pageParam,
        limit: 20
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.data.length === 20 ? pages.length * 20 : undefined;
    }
  });

  const documents = useMemo(() =>
    data?.pages.flatMap(page => page.data) ?? [],
    [data]
  );

  return {
    documents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  };
};
```

#### Backend with Efficient Pagination
```python
# backend/services/document_service.py
class DocumentService:
    def __init__(self, db: Session):
        self.db = db

    async def get_documents(
        self,
        user_id: str,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ) -> PaginatedDocuments:
        """
        Get paginated documents with search and sorting.
        """
        query = self.db.query(Document).filter(Document.user_id == user_id)

        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    Document.title.ilike(f"%{search}%"),
                    Document.content.ilike(f"%{search}%")
                )
            )

        # Apply sorting
        sort_column = getattr(Document, sort_by, Document.updated_at)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Get total count for pagination metadata
        total_count = query.count()

        # Apply pagination
        documents = query.offset(offset).limit(limit).all()

        return PaginatedDocuments(
            data=documents,
            total=total_count,
            offset=offset,
            limit=limit,
            has_more=offset + limit < total_count
        )
```

### 3. Update Operations with Optimistic Updates

#### Frontend Optimistic Updates
```typescript
// src/store/documentStore.ts
export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // ... other properties

  updateDocument: async (id: string, updates: Partial<Document>) => {
    const originalDocument = get().documents.find(doc => doc.id === id);
    if (!originalDocument) return;

    // Optimistic update
    set(state => ({
      documents: state.documents.map(doc =>
        doc.id === id
          ? { ...doc, ...updates, updatedAt: new Date() }
          : doc
      )
    }));

    try {
      // API call
      const updatedDocument = await documentService.updateDocument(id, updates);

      // Confirm update with server response
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === id ? updatedDocument : doc
        )
      }));

    } catch (error) {
      // Rollback optimistic update
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === id ? originalDocument : doc
        ),
        error: error.message
      }));
      throw error;
    }
  }
}));
```

#### Backend with Conflict Resolution
```python
# backend/services/document_service.py
async def update_document(
    self,
    document_id: str,
    updates: DocumentUpdate,
    user_id: str,
    version: Optional[int] = None
) -> Document:
    """
    Update document with optimistic locking for conflict resolution.
    """
    document = self.db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check for conflicts using version
    if version and document.version != version:
        raise HTTPException(
            status_code=409,
            detail="Document was modified by another client"
        )

    # Apply updates
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(document, field, value)

    document.updated_at = datetime.utcnow()
    document.version += 1

    self.db.commit()
    self.db.refresh(document)

    return document
```

## 🔄 Real-time Communication

### WebSocket Implementation

#### Frontend WebSocket Client
```typescript
// src/services/websocketService.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    const wsUrl = `${WS_BASE_URL}/ws?token=${token}`;
    this.ws = new WebSocket(wsUrl);

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

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(message: WSMessage) {
    switch (message.type) {
      case 'document_updated':
        useDocumentStore.getState().syncDocumentFromServer(message.data);
        break;
      case 'user_joined':
        useCollaborationStore.getState().addUser(message.data);
        break;
      // ... other message types
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => this.connect(getAuthToken()), delay);
    }
  }

  sendMessage(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}
```

#### Backend WebSocket Handler
```python
# backend/websocket/manager.py
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    # Remove dead connections
                    self.active_connections[user_id].remove(connection)

# backend/routers/websocket.py
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    manager: ConnectionManager = Depends(get_connection_manager)
):
    user = await verify_websocket_token(token)
    if not user:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user.id)
    try:
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(data, user.id, manager)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
```

## 📡 API Client Configuration

### Axios Configuration with Interceptors
```typescript
// src/api/client.ts
export const createAPIClient = () => {
  const client = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracing
      config.headers['X-Request-ID'] = generateRequestId();

      // Add timestamp
      config.headers['X-Request-Time'] = new Date().toISOString();

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Log successful requests
      console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    async (error) => {
      const { response, config } = error;

      // Handle different error types
      if (response?.status === 401) {
        // Token expired, try refresh
        try {
          await useAuthStore.getState().refreshToken();
          return client.request(config); // Retry original request
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/auth/login';
        }
      }

      if (response?.status === 429) {
        // Rate limited, implement exponential backoff
        const retryAfter = response.headers['retry-after'] || 1;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return client.request(config);
      }

      // Log error for monitoring
      console.error(`API Error: ${config.method?.toUpperCase()} ${config.url}`, {
        status: response?.status,
        data: response?.data,
        headers: response?.headers
      });

      return Promise.reject(error);
    }
  );

  return client;
};
```

## 🎯 State Synchronization Patterns

### 1. Polling for Updates
```typescript
// src/hooks/usePollingSync.ts
export const usePollingSync = (documentId: string, interval = 30000) => {
  const updateDocument = useDocumentStore(state => state.syncDocumentFromServer);

  useEffect(() => {
    const pollForUpdates = async () => {
      try {
        const document = await documentService.getDocument(documentId);
        updateDocument(document);
      } catch (error) {
        console.error('Polling sync failed:', error);
      }
    };

    const intervalId = setInterval(pollForUpdates, interval);
    return () => clearInterval(intervalId);
  }, [documentId, interval, updateDocument]);
};
```

### 2. Event-driven Sync
```typescript
// src/hooks/useEventSync.ts
export const useEventSync = () => {
  const syncDocument = useDocumentStore(state => state.syncDocumentFromServer);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, sync data
        syncDocument();
      }
    };

    const handleOnline = () => {
      // Network came back, sync pending changes
      useDocumentStore.getState().syncPendingChanges();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncDocument]);
};
```

## 📊 Performance Optimization

### Request Batching
```typescript
// src/utils/requestBatcher.ts
class RequestBatcher {
  private queue: Map<string, Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>> = new Map();

  private flushTimeout: NodeJS.Timeout | null = null;

  batch<T>(key: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }

      this.queue.get(key)!.push({ data, resolve, reject });

      // Schedule flush if not already scheduled
      if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(() => this.flush(), 100);
      }
    });
  }

  private async flush() {
    const batches = new Map(this.queue);
    this.queue.clear();
    this.flushTimeout = null;

    for (const [key, requests] of batches) {
      try {
        const batchData = requests.map(req => req.data);
        const results = await this.processBatch(key, batchData);

        requests.forEach((req, index) => {
          req.resolve(results[index]);
        });
      } catch (error) {
        requests.forEach(req => req.reject(error));
      }
    }
  }

  private async processBatch(key: string, data: any[]): Promise<any[]> {
    // Process batch based on key
    switch (key) {
      case 'document-updates':
        return documentService.batchUpdateDocuments(data);
      case 'user-actions':
        return analyticsService.batchTrackActions(data);
      default:
        throw new Error(`Unknown batch key: ${key}`);
    }
  }
}
```

### Response Caching
```typescript
// src/utils/responseCache.ts
class ResponseCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();

  set(key: string, data: any, ttl = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## 🔍 Error Handling

### Centralized Error Management
```typescript
// src/store/errorStore.ts
interface ErrorState {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],

  addError: (error: AppError) =>
    set(state => ({
      errors: [...state.errors, { ...error, id: generateId() }]
    })),

  removeError: (id: string) =>
    set(state => ({
      errors: state.errors.filter(error => error.id !== id)
    })),

  clearErrors: () => set({ errors: [] })
}));

// Global error handler
export const handleAPIError = (error: AxiosError) => {
  const errorStore = useErrorStore.getState();

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        errorStore.addError({
          type: 'validation',
          message: data.detail || 'Datos inválidos',
          severity: 'error'
        });
        break;
      case 404:
        errorStore.addError({
          type: 'not_found',
          message: 'Recurso no encontrado',
          severity: 'warning'
        });
        break;
      case 500:
        errorStore.addError({
          type: 'server',
          message: 'Error interno del servidor',
          severity: 'error'
        });
        break;
      default:
        errorStore.addError({
          type: 'unknown',
          message: 'Error inesperado',
          severity: 'error'
        });
    }
  } else if (error.request) {
    // Network error
    errorStore.addError({
      type: 'network',
      message: 'Error de conexión',
      severity: 'error'
    });
  }
};
```

## 📈 Monitoring and Metrics

### API Performance Tracking
```typescript
// src/utils/apiMetrics.ts
class APIMetrics {
  private metrics: Map<string, {
    count: number;
    totalTime: number;
    errors: number;
  }> = new Map();

  trackRequest(endpoint: string, duration: number, success: boolean) {
    const key = `${endpoint}`;
    const current = this.metrics.get(key) || {
      count: 0,
      totalTime: 0,
      errors: 0
    };

    this.metrics.set(key, {
      count: current.count + 1,
      totalTime: current.totalTime + duration,
      errors: current.errors + (success ? 0 : 1)
    });
  }

  getMetrics() {
    const result = {};
    for (const [endpoint, data] of this.metrics) {
      result[endpoint] = {
        ...data,
        avgTime: data.totalTime / data.count,
        errorRate: data.errors / data.count
      };
    }
    return result;
  }
}
```

## 📚 Referencias

- [Frontend API Integration](../../../src/docs/api/)
- [Backend API Documentation](../../backend/docs/api/)
- [State Management Guide](../../../src/docs/state/)
- [Error Handling Strategy](../error-handling/)
- [Performance Optimization](../../docs/development/guides/performance.md)

---
*Patrones de comunicación optimizados para performance y confiabilidad*