# API Contracts and Interface Documentation

Esta sección documenta todos los contratos de API, esquemas de datos y especificaciones de interfaces entre los componentes del sistema AI Document Editor.

## 📋 Contratos Documentados

### 🌐 [Frontend-Backend API](./frontend-backend-api.md)
Contratos REST entre Frontend (React) y Backend (FastAPI):
- Endpoints de autenticación y usuarios
- CRUD de documentos y contenido
- APIs de búsqueda y filtrado
- Health checks y status
- Esquemas de request/response

### 🔧 [Desktop-Frontend IPC](./desktop-frontend-ipc.md)
Comunicación Inter-Process entre Electron y Frontend:
- Eventos de ventana y menús
- Gestión de archivos locales
- Configuración y preferencias
- Auto-updater y notificaciones
- Sincronización de estado

### 🤖 [OpenAI Integration](./openai-integration.md)
Contratos con APIs de OpenAI y servicios de AI:
- Chat completion endpoints
- Embeddings y vectorización
- Text generation y processing
- Rate limiting y quotas
- Error handling específico

### 📊 [Schemas and Validation](./schemas-validation.md)
Esquemas de datos y estrategias de validación:
- Modelos de datos compartidos
- Validación frontend (Zod)
- Validación backend (Pydantic)
- Transformaciones y mapeos
- Versionado de esquemas

### 📝 [API Versioning Strategy](./versioning-strategy.md)
Estrategia de versionado y evolución de APIs:
- Semantic versioning para APIs
- Backward compatibility guidelines
- Deprecation strategy
- Migration patterns
- Version negotiation

## 🏗️ Arquitectura de APIs

### Capas de Abstracción
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │  Desktop App    │    │  External APIs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Frontend Services│    │    IPC Layer    │    │  API Adapters   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │    │   IPC Handlers  │    │ HTTP Clients    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    Backend FastAPI                           │
└──────────────────────────────────────────────────────────────┘
```

### Patrones de Diseño
- **Repository Pattern**: Abstracción de datos
- **Service Layer**: Lógica de negocio
- **DTO Pattern**: Data Transfer Objects
- **Adapter Pattern**: Integración con APIs externas
- **Observer Pattern**: Eventos y notificaciones

## 📡 Protocolos de Comunicación

### HTTP/REST APIs
```
GET /api/v1/documents              # Listar documentos
POST /api/v1/documents             # Crear documento
GET /api/v1/documents/{id}         # Obtener documento
PUT /api/v1/documents/{id}         # Actualizar documento
DELETE /api/v1/documents/{id}      # Eliminar documento
```

### WebSocket Events
```
document:updated                   # Documento actualizado
user:joined                        # Usuario se unió
user:left                          # Usuario se fue
cursor:moved                       # Cursor movido
typing:start                       # Inicio de escritura
typing:stop                        # Fin de escritura
```

### IPC Messages (Electron)
```
auth:login                         # Iniciar sesión
auth:logout                        # Cerrar sesión
file:open                          # Abrir archivo
file:save                          # Guardar archivo
window:minimize                    # Minimizar ventana
app:quit                           # Cerrar aplicación
```

## 🔒 Seguridad en APIs

### Autenticación
- **Bearer Tokens**: JWT para APIs REST
- **API Keys**: Para servicios externos
- **Session Cookies**: Para algunas operaciones
- **CSRF Tokens**: Protección contra ataques

### Autorización
- **Role-Based Access**: Roles de usuario
- **Resource-Based**: Permisos por recurso
- **Context-Aware**: Basado en contexto
- **Rate Limiting**: Límites por usuario/IP

### Validación
- **Input Validation**: Validación de entrada
- **Schema Validation**: Validación de esquemas
- **Sanitization**: Limpieza de datos
- **Type Safety**: Seguridad de tipos

## 📊 Estándares de API

### Naming Conventions
```javascript
// REST Endpoints
GET /api/v1/documents              // Plural nouns
GET /api/v1/documents/{id}         // Singular parameter
POST /api/v1/documents             // Creation
PUT /api/v1/documents/{id}         // Full update
PATCH /api/v1/documents/{id}       // Partial update

// Query Parameters
?page=1&limit=20&sort=created_at   // Pagination
?search=query&filter[status]=active // Filtering
?include=user,tags                 // Related data
```

### Response Formats
```json
{
  "data": {
    "id": "doc_123",
    "type": "document",
    "attributes": {
      "title": "My Document",
      "content": "Document content..."
    },
    "relationships": {
      "user": {
        "data": { "id": "user_456", "type": "user" }
      }
    }
  },
  "meta": {
    "timestamp": "2025-09-22T10:00:00Z",
    "version": "1.0"
  }
}
```

### Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  },
  "meta": {
    "request_id": "req_789",
    "timestamp": "2025-09-22T10:00:00Z"
  }
}
```

## 🧪 Testing Strategies

### Contract Testing
```typescript
// Pact consumer test
describe('Document API Contract', () => {
  it('should create document successfully', async () => {
    await provider
      .given('user is authenticated')
      .uponReceiving('a request to create document')
      .withRequest({
        method: 'POST',
        path: '/api/v1/documents',
        headers: {
          'Authorization': 'Bearer token123',
          'Content-Type': 'application/json'
        },
        body: {
          title: 'Test Document',
          content: 'Document content'
        }
      })
      .willRespondWith({
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          id: Matchers.string(),
          title: 'Test Document',
          content: 'Document content'
        }
      });

    const result = await documentService.createDocument({
      title: 'Test Document',
      content: 'Document content'
    });

    expect(result.id).toBeDefined();
  });
});
```

### Schema Validation Testing
```python
# Backend schema tests
def test_document_schema_validation():
    valid_data = {
        "title": "Test Document",
        "content": "Document content",
        "tags": ["test", "document"]
    }

    # Should pass validation
    document = DocumentCreate(**valid_data)
    assert document.title == "Test Document"

    # Should fail validation
    with pytest.raises(ValidationError):
        DocumentCreate(title="", content="")  # Empty title
```

## 📈 Performance Guidelines

### API Response Times
- **Authentication**: < 200ms
- **Document CRUD**: < 500ms
- **Search/Filter**: < 1000ms
- **File Upload**: < 5000ms

### Optimization Strategies
- **Pagination**: Limit response sizes
- **Caching**: Cache frequent requests
- **Compression**: Gzip responses
- **CDN**: Static asset delivery

### Rate Limiting
```
Authentication:     5 requests/minute
Document CRUD:      100 requests/minute
Search:            50 requests/minute
File Upload:       10 requests/minute
```

## 🔍 Monitoring and Observability

### Metrics Collection
- **Request Count**: Número de requests por endpoint
- **Response Time**: Tiempo de respuesta promedio
- **Error Rate**: Porcentaje de errores
- **Throughput**: Requests por segundo

### Logging Standards
```json
{
  "timestamp": "2025-09-22T10:00:00Z",
  "level": "INFO",
  "service": "document-api",
  "endpoint": "POST /api/v1/documents",
  "user_id": "user_123",
  "request_id": "req_456",
  "duration_ms": 150,
  "status_code": 201
}
```

### Health Checks
```typescript
// Health check endpoint
GET /api/v1/health
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "openai": "healthy"
  }
}
```

## 📚 API Documentation

### OpenAPI/Swagger
- Documentación interactiva auto-generada
- Schemas TypeScript/Python sincronizados
- Examples y casos de uso
- Testing playground integrado

### Postman Collections
- Collections organizadas por feature
- Environment variables
- Test scripts automatizados
- Documentation embebida

## 🔄 Evolution and Versioning

### Breaking Changes
- Cambios en estructura de response
- Eliminación de endpoints
- Cambios en validación requerida
- Modificaciones de authentication

### Non-Breaking Changes
- Nuevos campos opcionales
- Nuevos endpoints
- Mejoras de performance
- Bug fixes

### Migration Path
1. **Deprecation Notice**: 90 días de aviso
2. **Parallel Support**: Soporte de ambas versiones
3. **Client Migration**: Actualización de clientes
4. **Sunset**: Eliminación de versión anterior

---

## 📚 Referencias

- [OpenAPI Specification](https://swagger.io/specification/)
- [JSON:API](https://jsonapi.org/)
- [RESTful API Design](https://restfulapi.net/)
- [Frontend API Integration](../../../src/docs/api/)
- [Backend API Documentation](../../backend/docs/api/)
- [Data Flow Patterns](../data-flow/)

---
*Contratos de API diseñados para escalabilidad, mantenibilidad y developer experience*