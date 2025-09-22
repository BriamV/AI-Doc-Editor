# Integration Monitoring and Troubleshooting

Esta sección documenta las estrategias de monitoreo, métricas y troubleshooting para las integraciones entre todos los componentes del sistema AI Document Editor.

## 📋 Documentación de Monitoreo

### 🏥 [Health Checks](./health-checks.md)
Health checks entre sistemas:
- Endpoint monitoring y availability
- Database connection health
- External service status checks
- Real-time status dashboards
- Automated alerting thresholds

### ⚡ [Performance Monitoring](./performance-monitoring.md)
Monitoreo de rendimiento de integraciones:
- API response time tracking
- Database query performance
- Memory and CPU utilization
- Network latency monitoring
- Throughput and capacity metrics

### 🧪 [Integration Testing](./integration-testing.md)
Testing de integración end-to-end:
- Automated E2E test suites
- Contract testing strategies
- Load testing patterns
- Chaos engineering practices
- Continuous integration pipelines

### 🔍 [Troubleshooting Guide](./troubleshooting.md)
Guía de troubleshooting de integraciones:
- Common integration issues
- Diagnostic procedures
- Root cause analysis
- Resolution playbooks
- Escalation procedures

### 📊 [Metrics Collection](./metrics-collection.md)
Recolección de métricas cross-system:
- Application metrics (APM)
- Infrastructure monitoring
- Business metrics tracking
- Custom metrics implementation
- Data retention policies

## 🏗️ Monitoring Architecture

### Observability Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Desktop App   │     Frontend    │       Backend           │
│   (Electron)    │     (React)     │      (FastAPI)          │
└─────────────────┴─────────────────┴─────────────────────────┘
         │                 │                    │
         ▼                 ▼                    ▼
┌─────────────────┬─────────────────┬─────────────────────────┐
│  Local Metrics  │  Browser Metrics│   Server Metrics        │
│  & Logging      │  & Telemetry    │   & Telemetry           │
└─────────────────┴─────────────────┴─────────────────────────┘
         │                 │                    │
         └─────────────────┼────────────────────┘
                           ▼
         ┌─────────────────────────────────────────┐
         │        Centralized Monitoring           │
         │   • Logs Aggregation (ELK/Loki)        │
         │   • Metrics (Prometheus/Grafana)       │
         │   • Traces (Jaeger/Zipkin)             │
         │   • Alerts (AlertManager)              │
         └─────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │           Dashboards & Alerts           │
         │   • Operational Dashboards              │
         │   • SLA Monitoring                      │
         │   • Incident Response                   │
         │   • Performance Analytics              │
         └─────────────────────────────────────────┘
```

### Monitoring Layers
1. **Application Monitoring**: Code-level metrics y logging
2. **Infrastructure Monitoring**: Server, network, database
3. **User Experience Monitoring**: Frontend performance, UX metrics
4. **Business Monitoring**: Usage patterns, feature adoption
5. **Security Monitoring**: Threat detection, compliance

## 📊 Key Performance Indicators (KPIs)

### System Availability
```typescript
interface AvailabilityMetrics {
  uptime_percentage: number;        // 99.9% target
  mean_time_to_recovery: number;    // MTTR in minutes
  mean_time_between_failures: number; // MTBF in hours
  scheduled_downtime: number;       // Planned maintenance
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  api_response_time: {
    p50: number;    // 50th percentile < 200ms
    p95: number;    // 95th percentile < 500ms
    p99: number;    // 99th percentile < 1000ms
  };
  frontend_load_time: {
    first_contentful_paint: number;  // < 1.5s
    largest_contentful_paint: number; // < 2.5s
    cumulative_layout_shift: number;  // < 0.1
  };
  database_performance: {
    query_time_avg: number;          // < 100ms
    connection_pool_usage: number;   // < 80%
    deadlock_rate: number;           // < 0.1%
  };
}
```

### Business Metrics
```typescript
interface BusinessMetrics {
  user_engagement: {
    daily_active_users: number;
    session_duration_avg: number;
    feature_adoption_rate: number;
  };
  document_management: {
    documents_created_per_day: number;
    ai_assists_used: number;
    collaboration_sessions: number;
  };
  error_impact: {
    user_affected_percentage: number;
    business_critical_errors: number;
    customer_satisfaction_score: number;
  };
}
```

## 🔍 Monitoring Implementation

### Frontend Monitoring
```typescript
// src/utils/monitoring.ts
class FrontendMonitoring {
  private metrics: Map<string, any> = new Map();

  // Performance monitoring
  trackPageLoad() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      this.recordMetric('page_load_time', {
        dns_lookup: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp_connection: perfData.connectEnd - perfData.connectStart,
        request_response: perfData.responseEnd - perfData.requestStart,
        dom_processing: perfData.loadEventStart - perfData.responseEnd,
        total_load_time: perfData.loadEventEnd - perfData.navigationStart
      });
    });
  }

  // API call monitoring
  trackAPICall(endpoint: string, method: string, duration: number, success: boolean) {
    this.recordMetric('api_call', {
      endpoint,
      method,
      duration,
      success,
      timestamp: Date.now()
    });

    // Alert on slow API calls
    if (duration > 5000) {
      this.sendAlert('slow_api_call', {
        endpoint,
        duration,
        threshold: 5000
      });
    }
  }

  // User interaction monitoring
  trackUserAction(action: string, component: string, metadata?: any) {
    this.recordMetric('user_action', {
      action,
      component,
      metadata,
      timestamp: Date.now(),
      session_id: this.getSessionId()
    });
  }

  // Error monitoring
  trackError(error: Error, context: any) {
    this.recordMetric('frontend_error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: Date.now()
    });

    // Send critical errors immediately
    if (context.severity === 'critical') {
      this.sendImmediateAlert(error, context);
    }
  }

  // Web Vitals monitoring
  trackWebVitals() {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(metric => this.recordMetric('cls', metric.value));
      getFID(metric => this.recordMetric('fid', metric.value));
      getFCP(metric => this.recordMetric('fcp', metric.value));
      getLCP(metric => this.recordMetric('lcp', metric.value));
      getTTFB(metric => this.recordMetric('ttfb', metric.value));
    });
  }

  private recordMetric(name: string, data: any) {
    const metric = {
      name,
      data,
      timestamp: Date.now()
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);

    // Send to monitoring service
    this.sendToMonitoringService(metric);
  }

  private sendToMonitoringService(metric: any) {
    // Batch metrics for efficiency
    if (this.metricsBatch.length >= 10) {
      this.flushMetrics();
    }
  }
}

// Initialize monitoring
const monitoring = new FrontendMonitoring();
monitoring.trackPageLoad();
monitoring.trackWebVitals();
```

### Backend Monitoring
```python
# backend/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time
import logging
from functools import wraps

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

DATABASE_QUERY_DURATION = Histogram(
    'database_query_duration_seconds',
    'Database query duration',
    ['query_type', 'table']
)

AI_SERVICE_REQUESTS = Counter(
    'ai_service_requests_total',
    'Total AI service requests',
    ['service', 'model', 'status']
)

# Monitoring middleware
async def monitoring_middleware(request: Request, call_next):
    start_time = time.time()
    method = request.method
    endpoint = str(request.url.path)

    try:
        response = await call_next(request)
        status_code = response.status_code

        # Record metrics
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(time.time() - start_time)

        return response

    except Exception as e:
        # Record error metrics
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=500).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(time.time() - start_time)

        # Log error with context
        logger.error(f"Request failed: {method} {endpoint}", extra={
            "error": str(e),
            "duration": time.time() - start_time,
            "user_id": getattr(request.state, 'user_id', None)
        })

        raise

# Database monitoring decorator
def monitor_db_query(query_type: str, table: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                DATABASE_QUERY_DURATION.labels(query_type=query_type, table=table).observe(
                    time.time() - start_time
                )
                return result
            except Exception as e:
                logger.error(f"Database query failed: {query_type} on {table}", extra={
                    "error": str(e),
                    "duration": time.time() - start_time
                })
                raise
        return wrapper
    return decorator

# AI service monitoring
class AIServiceMonitor:
    @staticmethod
    def track_request(service: str, model: str, success: bool, duration: float, tokens_used: int):
        status = 'success' if success else 'error'
        AI_SERVICE_REQUESTS.labels(service=service, model=model, status=status).inc()

        # Log detailed information
        logger.info(f"AI service request completed", extra={
            "service": service,
            "model": model,
            "success": success,
            "duration": duration,
            "tokens_used": tokens_used
        })

# Health check endpoint
@router.get("/metrics")
async def get_metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Desktop Monitoring
```javascript
// electron/monitoring.js
const { app, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class DesktopMonitoring {
  constructor() {
    this.metrics = [];
    this.startTime = Date.now();
    this.setupMetricsCollection();
  }

  setupMetricsCollection() {
    // System metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    // Application event monitoring
    app.on('window-all-closed', () => {
      this.trackEvent('app_window_closed');
    });

    app.on('before-quit', () => {
      this.trackEvent('app_quit');
      this.flushMetrics();
    });

    // IPC monitoring
    ipcMain.on('*', (event, ...args) => {
      this.trackIPC(event.channel, args);
    });
  }

  collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory_usage: process.memoryUsage(),
      cpu_usage: process.getCPUUsage(),
      system_uptime: os.uptime(),
      app_uptime: (Date.now() - this.startTime) / 1000,
      platform: os.platform(),
      arch: os.arch(),
      node_version: process.version
    };

    this.recordMetric('system_metrics', metrics);

    // Alert on high memory usage
    const memoryUsageMB = metrics.memory_usage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) { // 500MB threshold
      this.sendAlert('high_memory_usage', {
        current: memoryUsageMB,
        threshold: 500
      });
    }
  }

  trackEvent(eventName, data = {}) {
    this.recordMetric('app_event', {
      event: eventName,
      data,
      timestamp: Date.now()
    });
  }

  trackIPC(channel, args) {
    this.recordMetric('ipc_communication', {
      channel,
      args_length: args.length,
      timestamp: Date.now()
    });
  }

  recordMetric(type, data) {
    const metric = {
      type,
      data,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Flush metrics periodically
    if (this.metrics.length >= 100) {
      this.flushMetrics();
    }
  }

  async flushMetrics() {
    if (this.metrics.length === 0) return;

    try {
      const logFile = path.join(app.getPath('userData'), 'metrics.log');
      const metricsData = this.metrics.splice(0); // Clear metrics array

      await fs.appendFile(logFile, JSON.stringify({
        batch_timestamp: Date.now(),
        metrics: metricsData
      }) + '\n');

    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  sendAlert(type, data) {
    console.warn(`Desktop Alert: ${type}`, data);

    // Could send to external monitoring service
    // or show user notification for critical issues
  }
}

module.exports = new DesktopMonitoring();
```

## 🚨 Alerting and Incident Response

### Alert Configuration
```yaml
# alerts.yml
groups:
  - name: ai-doc-editor.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API response time is slow"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseConnectionIssue
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection lost"
          description: "Cannot connect to PostgreSQL database"

      - alert: MemoryUsageHigh
        expr: process_resident_memory_bytes > 1e9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanize1024}}B"
```

### Incident Response Playbook
```typescript
// src/utils/incidentResponse.ts
interface IncidentSeverity {
  P1: 'critical';    // Service down, data loss
  P2: 'high';        // Major feature broken
  P3: 'medium';      // Minor feature issues
  P4: 'low';         // Cosmetic issues
}

class IncidentResponse {
  static async handleIncident(alert: Alert) {
    const incident = await this.createIncident(alert);

    switch (incident.severity) {
      case 'critical':
        await this.handleCriticalIncident(incident);
        break;
      case 'high':
        await this.handleHighIncident(incident);
        break;
      default:
        await this.handleStandardIncident(incident);
    }
  }

  static async handleCriticalIncident(incident: Incident) {
    // Immediate actions for critical incidents
    await Promise.all([
      this.notifyOnCallTeam(incident),
      this.activateIncidentRoom(incident),
      this.enableEnhancedMonitoring(incident),
      this.prepareCommunications(incident)
    ]);

    // Auto-remediation attempts
    if (incident.type === 'database_down') {
      await this.attemptDatabaseReconnection();
    }

    if (incident.type === 'high_error_rate') {
      await this.enableCircuitBreaker();
    }
  }

  static async createStatusPageUpdate(incident: Incident) {
    const update = {
      title: incident.title,
      status: 'investigating',
      affected_components: incident.affected_components,
      message: this.generatePublicMessage(incident)
    };

    // Update status page
    await this.updateStatusPage(update);

    // Notify users via email/notification
    await this.notifyAffectedUsers(update);
  }
}
```

## 📈 Performance Optimization

### Monitoring Performance Impact
```typescript
// Minimize monitoring overhead
class EfficientMonitoring {
  private metricsBuffer: any[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    // Batch metrics to reduce network overhead
    setInterval(() => this.flushMetrics(), this.flushInterval);
  }

  trackMetric(name: string, value: any, tags?: Record<string, string>) {
    // Sample non-critical metrics
    if (this.shouldSample(name)) {
      this.metricsBuffer.push({
        name,
        value,
        tags,
        timestamp: Date.now()
      });
    }

    // Always track critical metrics
    if (this.isCriticalMetric(name)) {
      this.sendImmediately({ name, value, tags });
    }
  }

  private shouldSample(metricName: string): boolean {
    // Sample based on metric type and current load
    const sampleRates = {
      'user_action': 0.1,      // 10% sampling
      'api_call': 1.0,         // 100% sampling
      'page_view': 0.5,        // 50% sampling
      'error': 1.0             // 100% sampling
    };

    const rate = sampleRates[metricName] || 1.0;
    return Math.random() < rate;
  }

  private isCriticalMetric(name: string): boolean {
    return ['error', 'critical_alert', 'security_event'].includes(name);
  }
}
```

## 📊 Dashboards and Visualization

### Operational Dashboard
```typescript
// Dashboard configuration
const operationalDashboard = {
  name: "AI Doc Editor - Operations",
  panels: [
    {
      title: "System Overview",
      type: "stat",
      targets: [
        { metric: "up", label: "Service Uptime" },
        { metric: "http_requests_total", label: "Total Requests" },
        { metric: "active_users", label: "Active Users" }
      ]
    },
    {
      title: "Response Time",
      type: "graph",
      targets: [
        { metric: "http_request_duration_seconds", percentiles: [50, 95, 99] }
      ]
    },
    {
      title: "Error Rate",
      type: "graph",
      targets: [
        { metric: "rate(http_requests_total{status_code=~'5..'}[5m])" }
      ]
    },
    {
      title: "Database Performance",
      type: "graph",
      targets: [
        { metric: "database_query_duration_seconds" },
        { metric: "database_connections_active" }
      ]
    }
  ]
};
```

## 🔍 Log Analysis and Correlation

### Structured Logging
```python
# Consistent log format across all services
import structlog

logger = structlog.get_logger()

# Log format
log_entry = {
    "timestamp": "2025-09-22T10:00:00Z",
    "level": "INFO",
    "service": "backend",
    "component": "document_service",
    "user_id": "user_123",
    "request_id": "req_456",
    "correlation_id": "corr_789",
    "message": "Document created successfully",
    "metadata": {
        "document_id": "doc_abc",
        "size_bytes": 1024,
        "processing_time_ms": 150
    }
}
```

### Log Correlation
```typescript
// Frontend log correlation
class LogCorrelation {
  private correlationId: string;

  constructor() {
    this.correlationId = this.generateCorrelationId();
  }

  trackUserFlow(action: string, metadata?: any) {
    logger.info('User action', {
      correlation_id: this.correlationId,
      action,
      metadata,
      timestamp: Date.now()
    });
  }

  trackAPICall(endpoint: string, method: string) {
    // Add correlation ID to API headers
    return {
      'X-Correlation-ID': this.correlationId,
      'X-Request-ID': this.generateRequestId()
    };
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 📚 Referencias

- [Health Check Implementation](./health-checks.md)
- [Performance Monitoring Setup](./performance-monitoring.md)
- [Error Handling Strategy](../error-handling/)
- [Integration Testing Guide](./integration-testing.md)
- [Frontend Monitoring](../../frontend/docs/architecture/monitoring.md)
- [Backend Monitoring](../../backend/docs/api/monitoring.md)

---
*Monitoring strategy designed for comprehensive observability and proactive issue detection*