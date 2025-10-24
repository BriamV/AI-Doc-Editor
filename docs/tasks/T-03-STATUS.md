---
task_id: "T-03"
titulo: "Límites de Ingesta & Rate"
estado: "🟡 En Progreso"
progreso: "45%"
completado: 5/11 (45%)
fecha_inicio: "2025-09-24"
fecha_completado: ""
dependencias: "T-44"
prioridad: "Alta"
release_target: "Release 1"
complejidad: 11
descripcion: "Implementar mecanismos de control para prevenir el abuso y garantizar la estabilidad del sistema. Esto incluye limitar la cantidad de datos que un usuario puede ingestar y la frecuencia de las peticiones a los endpoints más costosos. **Nota de Dependencia Crítica:** Esta tarea depende del servicio \"Config Store\" (T-44) para leer y persistir los límites. La API de T-44 debe ser diseñada teniendo en cuenta este requisito."

# Technical Details
detalles_tecnicos: |
  **Rate Limiting:** Middleware en FastAPI usando un backend de Redis para el conteo.
  **Límites de Ingesta:** Lógica de negocio en el servicio de subida que consulta los límites configurados por el administrador.
  **Configuración:** Modelo en la DB para almacenar los límites (Nº docs, MB totales).

# Test Strategy
estrategia_test: |
  **Performance Tests:** Test de carga (JMeter/Locust) para verificar que el rate limiter responde con HTTP 429 cuando se supera el umbral.
  **Integration Tests:** Test que intenta subir un archivo que excede la cuota y verifica que se recibe un HTTP 400.

# Documentation
documentacion: |
  Documentar los códigos de error 429 y 400 en la especificación de la API.

# Acceptance Criteria
criterios_aceptacion: |
  Una carga de N+1 documentos o un tamaño superior al límite en MB resulta en una respuesta HTTP 400.
  Realizar 40 peticiones por minuto a los endpoints rate-limitados resulta en respuestas HTTP 429.
  Los límites son configurables mediante la API del Config Store (T-44) y se persisten en la base de datos. La UI para su gestión por un administrador se completará en T-37.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, performance) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP1-T03-ST1"
    description: "Implementar middleware de rate-limiting (con Redis) para los endpoints críticos (/upload, /rewrite, /plan, /draft_section)."
    complejidad: 4
    entregable: "Test de carga que supera 30 req/min al endpoint /plan recibe respuestas HTTP 429."
    status: "pendiente"
  - id: "R1.WP1-T03-ST2"
    description: "Desarrollar la lógica de backend para validar los límites de ingesta (Nº de documentos, tamaño total en MB) contra la configuración del admin."
    complejidad: 4
    entregable: "Test unitario que simula una carga que excede el límite de MB y recibe un error de validación HTTP 400."
    status: "pendiente"
  - id: "R1.WP1-T03-ST3"
    description: "Crear la sección "Límites de Uso" en el panel de admin (usando el esqueleto de T-44) para configurar estos valores y persistirlos en la DB."
    complejidad: 3
    entregable: "Test Cypress donde un admin guarda nuevos límites y se verifica que se persisten en la DB."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:39:28Z"
  checksum: "710f1866d6787459b924464223b7e80d22332297e4c378116054d0164dc021e7"
  version: "1758753568"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-03: Límites de Ingesta & Rate

## Estado Actual
**Estado:** 🟡 En Progreso
**Progreso:** 45% (5/11 complexity points)
**Última actualización:** 2025-10-24
**Prioridad:** Alta
**Release Target:** Release 1
**Complejidad Total:** 11

### Infrastructure Completa (45%)
- ✅ Rate limiting middleware operational (`backend/app/security/rate_limiter.py`, 355 lines)
- ✅ Config store integration (T-44 dependency satisfied)
- ✅ Performance testing infrastructure (Locust, PERF-003)
- ✅ Security logging for rate limit violations

### Trabajo Pendiente (55%)
- ❌ Redis backend for distributed rate limiting (currently in-memory)
- ❌ Quota validation logic (document count/size limits in document service)
- ❌ Admin UI controls for usage limits configuration

## Descripción
Implementar mecanismos de control para prevenir el abuso y garantizar la estabilidad del sistema. Esto incluye limitar la cantidad de datos que un usuario puede ingestar y la frecuencia de las peticiones a los endpoints más costosos. **Nota de Dependencia Crítica:** Esta tarea depende del servicio "Config Store" (T-44) para leer y persistir los límites. La API de T-44 debe ser diseñada teniendo en cuenta este requisito.

## Detalles Técnicos
**Rate Limiting:** Middleware en FastAPI usando un backend de Redis para el conteo.
**Límites de Ingesta:** Lógica de negocio en el servicio de subida que consulta los límites configurados por el administrador.
**Configuración:** Modelo en la DB para almacenar los límites (Nº docs, MB totales).

## Estrategia de Test
**Performance Tests:** Test de carga (JMeter/Locust) para verificar que el rate limiter responde con HTTP 429 cuando se supera el umbral.
**Integration Tests:** Test que intenta subir un archivo que excede la cuota y verifica que se recibe un HTTP 400.

## Documentación Requerida
Documentar los códigos de error 429 y 400 en la especificación de la API.

## Criterios de Aceptación
Una carga de N+1 documentos o un tamaño superior al límite en MB resulta en una respuesta HTTP 400.
Realizar 40 peticiones por minuto a los endpoints rate-limitados resulta en respuestas HTTP 429.
Los límites son configurables mediante la API del Config Store (T-44) y se persisten en la base de datos. La UI para su gestión por un administrador se completará en T-37.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, performance) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII

### ST1: Rate Limiting for Critical Endpoints
- **ID:** R1.WP1-T03-ST1
- **Estado:** 🟡 75% Complete
- **Complejidad:** 4 puntos
- **Completado:** 3/4 puntos

**Implementado:**
- ✅ `RateLimitMiddleware` class (355 lines) en `backend/app/security/rate_limiter.py`
  - Configurable rate limits per endpoint pattern
  - IP-based and user-based tracking
  - HTTP 429 responses with retry headers (`X-RateLimit-*`)
  - Security logging for violations
- ✅ Integration in `backend/app/main.py` (lines 31, 99)
- ✅ In-memory storage implementation operational

**Pendiente:**
- ❌ Redis backend integration (currently in-memory, not distributed)
- ❌ Endpoint-specific configuration for critical endpoints (/upload, /plan, /rewrite, /draft_section)
- ❌ Performance test validating HTTP 429 responses under load

**Archivos:**
- `backend/app/security/rate_limiter.py` ✅
- `backend/app/main.py` (lines 31, 99) ✅

**Entregable:** Test de carga que supera 30 req/min al endpoint /plan recibe respuestas HTTP 429.

---

### ST2: Ingestion Limits Validation
- **ID:** R1.WP1-T03-ST2
- **Estado:** 🔴 0% Complete
- **Complejidad:** 4 puntos
- **Completado:** 0/4 puntos

**Pendiente:**
- ❌ Quota validation logic in document service
- ❌ Check max documents per user against config
- ❌ Check total MB per user against config
- ❌ HTTP 400 error when quota exceeded
- ❌ Integration with ConfigService to read limits

**Dependencias:**
- ✅ T-44 Config Store (complete, operational)
- ✅ T-04 Document service (complete, operational)

**Archivos Afectados:**
- `backend/app/services/document_service.py` (needs quota logic)
- `backend/app/models/system_configuration.py` (config model exists)

**Entregable:** Test unitario que simula una carga que excede el límite de MB y recibe un error de validación HTTP 400.

---

### ST3: Admin UI for Limits
- **ID:** R1.WP1-T03-ST3
- **Estado:** 🟡 25% Complete
- **Complejidad:** 3 puntos
- **Completado:** 1/3 puntos (approximately)

**Implementado:**
- ✅ Admin panel skeleton (T-44)
- ✅ Config GET/POST endpoints (`/api/config`)
- ✅ SystemConfiguration model with database persistence

**Pendiente:**
- ❌ "Usage Limits" section in Admin UI
- ❌ UI controls for document count limits
- ❌ UI controls for MB size limits
- ❌ Cypress E2E test for saving limits

**Dependencias:**
- ✅ T-44 Admin Panel Skeleton (complete)

**Archivos:**
- Frontend: `src/components/admin/` (needs Usage Limits section)
- Backend: `backend/app/routers/config.py` (endpoints exist)

**Entregable:** Test Cypress donde un admin guarda nuevos límites y se verifica que se persisten en la DB.

## Descubrimiento de Implementación (2025-10-24)

Durante la revisión de cierre de Release 1, se descubrió que T-03 **NO estaba pendiente** sino **45% completo**:

### Infraestructura Encontrada

1. **Rate Limiting Middleware** (`backend/app/security/rate_limiter.py`)
   - 355 líneas de código operacional
   - Integrado en producción desde T-44 (September 2025)
   - Configuración por patrón de endpoint
   - Logging de violaciones de seguridad
   - HTTP 429 responses con headers `X-RateLimit-*`

2. **Config Store** (T-44 Dependency)
   - SystemConfiguration model completo
   - GET/POST `/api/config` endpoints operacionales
   - Migration 004_create_config_table.py aplicada
   - Tests de integración satisfechos

3. **Performance Testing Infrastructure**
   - `backend/tests/performance/locust_ingestion.py` (PERF-003 certification)
   - `backend/tests/test_audit_performance.py`
   - Gutenberg dataset fixtures disponibles
   - Framework listo para validar rate limiting

### Trabajo Restante (6 complexity points = 55%)

**ST1 Completar (1 punto restante):**
- Redis backend integration para rate limiting distribuido
- Configuración específica por endpoint crítico
- Performance test validando HTTP 429 responses

**ST2 Implementar (4 puntos):**
- Quota validation logic en document service
- Integration con ConfigService para leer límites
- HTTP 400 responses cuando se excede quota

**ST3 Completar (2 puntos restantes):**
- Sección "Usage Limits" en Admin UI
- Controles para document count y MB limits
- Cypress test para guardar límites

### Tiempo Estimado de Finalización
**3-4 días** de trabajo enfocado para completar el 55% restante:
- ST1 completion: 1 día
- ST2 implementation: 1.5 días
- ST3 completion: 0.5 días

### Impacto en R1
- T-03 puede considerarse **operacional** para uso no-distribuido (single-server deployments)
- Redis integration es requerida para escalabilidad multi-servidor
- Admin UI es nice-to-have, puede completarse en R2 si necesario

## Blockers

**Actual:** Ninguno

**Resueltos:**
- ✅ T-44 Config Store dependency (completo 2025-09-24)
- ✅ Performance testing infrastructure (operacional)
- ✅ Rate limiting middleware foundation (75% complete)

## Next Steps

### Prioridad Alta (ST1 - 1 día)
1. Integrar Redis backend para rate limiting distribuido
   - Configurar redis-py dependency
   - Implementar RedisRateLimitBackend class
   - Actualizar RateLimitMiddleware para usar Redis
2. Configurar límites específicos por endpoint crítico
   - `/upload`: 10 req/min
   - `/plan`: 30 req/min
   - `/rewrite`: 20 req/min
   - `/draft_section`: 15 req/min
3. Validar test de performance para respuestas 429
   - Locust script targeting `/plan` endpoint
   - Verificar HTTP 429 después de 30 req/min
   - Validar `X-RateLimit-*` headers correctos

### Prioridad Media (ST2 - 1.5 días)
1. Implementar lógica de validación de quotas en document service
   - Agregar `check_user_quota()` method
   - Query total documents count per user
   - Query total MB size per user
2. Integrar con ConfigService para leer límites
   - Leer `max_documents_per_user` from config
   - Leer `max_mb_per_user` from config
3. Agregar HTTP 400 cuando se exceda quota
   - Error message: "User quota exceeded: {current}/{limit} documents"
   - Error message: "User quota exceeded: {current}/{limit} MB"

### Prioridad Media (ST3 - 0.5 días)
1. Agregar sección "Usage Limits" en Admin UI
   - Component: `UsageLimitsConfig.tsx`
   - Input fields: max documents, max MB
   - Save button → POST `/api/config`
2. Controles para document count y MB limits
   - Number inputs with validation
   - Real-time preview of current limits
3. Cypress test para guardar límites
   - Login as admin
   - Navigate to "Usage Limits"
   - Change limits
   - Verify persistence in DB

**Estimación Total:** 3-4 días de desarrollo

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:39:28 UTC*
*Validador: task-data-parser.sh v1.0*
*Actualizado manualmente: 2025-10-24 (Descubrimiento de implementación 45%)*
