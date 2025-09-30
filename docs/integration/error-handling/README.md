# Cross-System Error Handling Strategy

Esta sección documenta la estrategia completa de manejo de errores distribuida entre todos los componentes del sistema AI Document Editor, incluyendo propagación, recuperación y feedback al usuario.

## 📋 Documentación de Error Handling

### ⚡ [Error Propagation](./error-propagation.md)
Propagación de errores entre sistemas:
- Backend → Frontend → Desktop → User
- Error transformation y contexto
- Error correlation y tracing
- Rollback automático de operaciones

### 🔄 [Retry Mechanisms](./retry-mechanisms.md)
Estrategias de reintentos y recuperación:
- Exponential backoff patterns
- Circuit breaker implementation
- Idempotency handling
- Graceful degradation

### 👤 [User Feedback](./user-feedback.md)
Manejo de errores en interfaz de usuario:
- Error message design patterns
- Progressive disclosure
- Contextual help y recovery actions
- Accessibility considerations

### 📝 [Logging Strategy](./logging-strategy.md)
Estrategia de logging cross-system:
- Structured logging standards
- Log correlation across services
- Privacy y security considerations
- Performance impact mitigation

### 🛡️ [Fallback Patterns](./fallback-patterns.md)
Patrones de fallback y degradación:
- Offline-first strategies
- Service degradation levels
- Data consistency patterns
- Emergency recovery procedures

## 🏗️ Error Handling Architecture

### Error Flow Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ External    │    │  Backend    │    │  Frontend   │    │  Desktop    │
│ Services    │    │  (FastAPI)  │    │  (React)    │    │ (Electron)  │
│ (OpenAI)    │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Error Source │    │Error Logger │    │Error Store  │    │User Feedback│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       └─────────────────► │ ◄─────────────────┴───────────────────┘
                           │
                           ▼
                  ┌─────────────┐
                  │Centralized  │
                  │Error        │
                  │Management   │
                  └─────────────┘
```

### Error Categories
1. **Network Errors**: Conectividad, timeouts, DNS
2. **Authentication Errors**: Tokens, permisos, OAuth
3. **Validation Errors**: Input inválido, esquemas
4. **Business Logic Errors**: Reglas de negocio, conflictos
5. **External Service Errors**: APIs terceros, AI services
6. **System Errors**: Memoria, storage, performance

## 🎯 Error Classification System

### Error Severity Levels
```typescript
enum ErrorSeverity {
  LOW = 'low',           // No impacta UX, logging only
  MEDIUM = 'medium',     // Degraded UX, show warning
  HIGH = 'high',         // Blocked UX, show error
  CRITICAL = 'critical'  // System failure, emergency response
}
```

### Error Types
```typescript
interface BaseError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code: string;
  timestamp: string;
  context: ErrorContext;
  correlationId: string;
  userId?: string;
  sessionId?: string;
}

enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}
```

### Error Context
```typescript
interface ErrorContext {
  component: string;      // Component where error occurred
  action: string;         // Action being performed
  resource?: string;      // Resource being accessed
  metadata: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  requestId?: string;
}
```

## 🔄 Error Propagation Flow

### 1. Error Origin → Backend
```python
# backend/utils/error_handler.py
from enum import Enum
from typing import Optional, Dict, Any
import logging
import traceback
from uuid import uuid4

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AppError(Exception):
    def __init__(
        self,
        message: str,
        code: str,
        error_type: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Optional[Dict[str, Any]] = None,
        cause: Optional[Exception] = None
    ):
        self.id = str(uuid4())
        self.message = message
        self.code = code
        self.error_type = error_type
        self.severity = severity
        self.context = context or {}
        self.cause = cause
        self.correlation_id = self.context.get('correlation_id', str(uuid4()))

        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "message": self.message,
            "code": self.code,
            "type": self.error_type,
            "severity": self.severity.value,
            "context": self.context,
            "correlation_id": self.correlation_id,
            "timestamp": datetime.utcnow().isoformat()
        }

# Error handler middleware
async def error_handler_middleware(request: Request, call_next):
    correlation_id = request.headers.get('X-Correlation-ID', str(uuid4()))

    try:
        response = await call_next(request)
        return response
    except AppError as e:
        # Log structured error
        logger.error(f"Application error: {e.message}", extra={
            "error_id": e.id,
            "error_code": e.code,
            "correlation_id": e.correlation_id,
            "context": e.context
        })

        # Return structured error response
        return JSONResponse(
            status_code=get_status_code_for_error(e),
            content={
                "error": e.to_dict(),
                "meta": {
                    "request_id": correlation_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
    except Exception as e:
        # Handle unexpected errors
        error_id = str(uuid4())
        logger.critical(f"Unexpected error: {str(e)}", extra={
            "error_id": error_id,
            "correlation_id": correlation_id,
            "stack_trace": traceback.format_exc()
        })

        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "id": error_id,
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "type": "system",
                    "severity": "critical"
                }
            }
        )
```

### 2. Backend → Frontend
```typescript
// src/services/api/errorHandler.ts
export class APIErrorHandler {
  static handleResponse(error: AxiosError): AppError {
    if (error.response) {
      const { status, data } = error.response;
      const errorData = data.error || {};

      return new AppError({
        id: errorData.id || generateId(),
        code: errorData.code || `HTTP_${status}`,
        message: errorData.message || 'An error occurred',
        type: errorData.type || 'unknown',
        severity: errorData.severity || 'medium',
        context: {
          ...errorData.context,
          httpStatus: status,
          endpoint: error.config?.url,
          method: error.config?.method
        },
        correlationId: errorData.correlation_id
      });
    }

    if (error.request) {
      // Network error
      return new AppError({
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        type: 'network',
        severity: 'high',
        context: {
          url: error.config?.url,
          timeout: error.code === 'ECONNABORTED'
        }
      });
    }

    // Request setup error
    return new AppError({
      code: 'REQUEST_CONFIG_ERROR',
      message: 'Failed to configure request',
      type: 'system',
      severity: 'medium',
      context: { originalError: error.message }
    });
  }
}

// Error interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    const appError = APIErrorHandler.handleResponse(error);

    // Add to error store
    useErrorStore.getState().addError(appError);

    // Log error
    logger.error('API Error', appError.toObject());

    return Promise.reject(appError);
  }
);
```

### 3. Frontend → Desktop
```typescript
// Frontend: Send error to desktop
window.electronAPI?.reportError({
  error: appError.toObject(),
  context: {
    component: 'frontend',
    url: window.location.href,
    userAgent: navigator.userAgent
  }
});

// Desktop: Handle error from frontend
// electron/main.js
ipcMain.on('error-report', (event, errorData) => {
  // Log error in desktop context
  console.error('Frontend Error:', errorData);

  // Show desktop notification if critical
  if (errorData.severity === 'critical') {
    new Notification('Application Error', {
      body: 'A critical error occurred. Please check the application.',
      icon: path.join(__dirname, 'assets/error-icon.png')
    });
  }

  // Send to crash reporter
  crashReporter.addExtraParameter('frontend_error', JSON.stringify(errorData));

  // Store in local error log
  logErrorToFile(errorData);
});
```

## 🎯 Recovery Strategies

### Automatic Recovery
```typescript
// src/hooks/useErrorRecovery.ts
export const useErrorRecovery = (error: AppError) => {
  const recover = useCallback(async () => {
    switch (error.type) {
      case 'network':
        // Retry with exponential backoff
        return await retryWithBackoff(error.context.originalRequest);

      case 'authentication':
        // Attempt token refresh
        return await useAuthStore.getState().refreshToken();

      case 'validation':
        // Clear invalid data and prompt user
        return await clearInvalidDataAndPrompt(error.context.field);

      case 'external_service':
        // Use fallback service or cached data
        return await useFallbackOrCache(error.context.service);

      default:
        // Generic recovery
        return await genericErrorRecovery(error);
    }
  }, [error]);

  return { recover };
};

// Exponential backoff implementation
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Manual Recovery Actions
```typescript
// src/components/errors/ErrorRecoveryActions.tsx
interface RecoveryAction {
  label: string;
  action: () => Promise<void>;
  primary?: boolean;
}

export const ErrorRecoveryActions: React.FC<{ error: AppError }> = ({ error }) => {
  const getRecoveryActions = (error: AppError): RecoveryAction[] => {
    switch (error.type) {
      case 'network':
        return [
          {
            label: 'Retry',
            action: () => retryFailedOperation(error),
            primary: true
          },
          {
            label: 'Work Offline',
            action: () => switchToOfflineMode()
          }
        ];

      case 'authentication':
        return [
          {
            label: 'Login Again',
            action: () => redirectToLogin(),
            primary: true
          }
        ];

      case 'validation':
        return [
          {
            label: 'Fix Input',
            action: () => focusInvalidField(error.context.field),
            primary: true
          }
        ];

      default:
        return [
          {
            label: 'Refresh Page',
            action: () => window.location.reload(),
            primary: true
          },
          {
            label: 'Report Issue',
            action: () => openIssueReport(error)
          }
        ];
    }
  };

  const actions = getRecoveryActions(error);

  return (
    <div className="error-recovery-actions">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={action.primary ? 'primary' : 'secondary'}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
```

## 📊 Error Monitoring and Alerting

### Error Metrics Collection
```typescript
// src/utils/errorMetrics.ts
class ErrorMetrics {
  private metrics = new Map<string, {
    count: number;
    lastOccurrence: Date;
    severity: ErrorSeverity;
  }>();

  track(error: AppError) {
    const key = `${error.type}:${error.code}`;
    const current = this.metrics.get(key) || {
      count: 0,
      lastOccurrence: new Date(),
      severity: error.severity
    };

    this.metrics.set(key, {
      count: current.count + 1,
      lastOccurrence: new Date(),
      severity: error.severity
    });

    // Check for error spikes
    this.checkErrorSpike(key, current.count + 1);
  }

  private checkErrorSpike(errorKey: string, currentCount: number) {
    // Alert if error count exceeds threshold in time window
    const threshold = 10;
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    if (currentCount >= threshold) {
      this.sendAlert({
        type: 'error_spike',
        message: `Error spike detected: ${errorKey}`,
        count: currentCount,
        timeWindow
      });
    }
  }

  private sendAlert(alert: AlertData) {
    // Send to monitoring service
    console.warn('Error Alert:', alert);

    // Could integrate with services like Sentry, DataDog, etc.
    if (window.electronAPI) {
      window.electronAPI.sendAlert(alert);
    }
  }

  getErrorReport() {
    return Array.from(this.metrics.entries()).map(([key, data]) => ({
      errorKey: key,
      ...data
    }));
  }
}
```

### Health Check Integration
```python
# backend/routers/health.py
@router.get("/health")
async def health_check():
    # Check various system components
    health_status = {
        "status": "healthy",
        "components": {},
        "error_rates": {}
    }

    # Database check
    try:
        await check_database_connection()
        health_status["components"]["database"] = "healthy"
    except Exception as e:
        health_status["components"]["database"] = "unhealthy"
        health_status["status"] = "degraded"

    # External services check
    for service in ["openai", "storage", "redis"]:
        try:
            await check_external_service(service)
            health_status["components"][service] = "healthy"
        except Exception:
            health_status["components"][service] = "unhealthy"
            health_status["status"] = "degraded"

    # Error rate check
    error_rates = await get_recent_error_rates()
    health_status["error_rates"] = error_rates

    if any(rate > 0.05 for rate in error_rates.values()):  # 5% threshold
        health_status["status"] = "degraded"

    return health_status
```

## 🔍 Error Testing Strategies

### Error Simulation
```typescript
// src/utils/errorSimulator.ts (dev only)
export class ErrorSimulator {
  static simulateNetworkError(): Promise<never> {
    return Promise.reject(new Error('NETWORK_ERROR'));
  }

  static simulateValidationError(field: string): AppError {
    return new AppError({
      code: 'VALIDATION_ERROR',
      message: `Invalid ${field}`,
      type: 'validation',
      context: { field }
    });
  }

  static simulateServerError(): AppError {
    return new AppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server error',
      type: 'system',
      severity: 'critical'
    });
  }
}

// Usage in development
if (process.env.NODE_ENV === 'development') {
  window.simulateError = ErrorSimulator;
}
```

### Error Boundary Testing
```typescript
// src/components/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('should catch and display component errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should log error details', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary caught an error'),
      expect.any(Error)
    );
  });
});
```

## 📚 Error Documentation

### Error Code Registry
Mantener un registro centralizado de todos los códigos de error:

```typescript
// src/constants/errorCodes.ts
export const ERROR_CODES = {
  // Authentication
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_LENGTH_EXCEEDED: 'VALIDATION_LENGTH_EXCEEDED',

  // Business Logic
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  DOCUMENT_ACCESS_DENIED: 'DOCUMENT_ACCESS_DENIED',
  DOCUMENT_VERSION_CONFLICT: 'DOCUMENT_VERSION_CONFLICT',

  // External Services
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_CONTENT_FILTERED: 'AI_CONTENT_FILTERED',

  // System
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  SERVER_OVERLOADED: 'SERVER_OVERLOADED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED'
} as const;
```

## 📈 Performance Considerations

### Error Handling Performance
- **Lazy Error Creation**: Create error objects only when needed
- **Error Deduplication**: Avoid logging duplicate errors
- **Async Error Processing**: Handle errors asynchronously when possible
- **Memory Management**: Clean up error stores periodically

### Monitoring Impact
- **Sampling**: Log only subset of non-critical errors
- **Batch Processing**: Batch error reports to reduce overhead
- **Local Caching**: Cache error metadata locally before sending

---

## 📚 Referencias

- [Frontend Error Handling](../../../src/docs/architecture/error-handling.md)
- [Backend Error Management](../../backend/docs/api/error-responses.md)
- [Logging Strategy](./logging-strategy.md)
- [Monitoring Setup](../monitoring/)
- [Recovery Patterns](./fallback-patterns.md)

---
*Error handling strategy designed for resilience, observability, and excellent user experience*