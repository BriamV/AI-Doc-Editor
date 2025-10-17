# Performance Testing Guide - T-04 RAG Pipeline

Guía rápida para ejecutar los benchmarks de performance del pipeline RAG.

## 📋 Pre-requisitos

- Backend corriendo (`uvicorn app.main:app --reload`)
- ChromaDB corriendo (Docker: `docker-compose up chromadb`)
- OpenAI API key válida
- JWT token de autenticación

## 🔧 Configuración (5 minutos)

### Paso 1: Configurar variables de entorno

```bash
# 1. Copiar archivo de ejemplo
cp .env.example .env

# 2. Editar .env y agregar:
# - OPENAI_API_KEY=sk-proj-tu-key-aqui
# - TEST_AUTH_TOKEN=tu-jwt-aqui
```

### Paso 2: Obtener JWT token (AUTOMÁTICO) ⚡

**Opción A - Automático (Recomendado):**
```bash
# Genera automáticamente un token de prueba
python backend/tests/performance/get_test_token.py

# O exporta directamente a variable de entorno (PowerShell)
$env:TEST_AUTH_TOKEN = $(python backend/tests/performance/get_test_token.py --quiet)

# Linux/Mac
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --quiet)
```

**Opción B - Manual (OAuth):**
1. Abrir frontend: `http://localhost:5173`
2. Login con Google/Microsoft OAuth
3. DevTools (F12) → Application → Local Storage
4. Copiar valor de `auth_token`
5. Configurar: `$env:TEST_AUTH_TOKEN="tu-token"`

**Nota**: Con tu Google OAuth configurado en `.env`, puedes usar ambas opciones.

## 🚀 Ejecutar Benchmarks

### Test 1: Ingestion Rate (PERF-003)

**Objetivo**: Validar que se pueden subir ≥100 documentos/hora

```bash
# 1. Asegurar backend corriendo
cd backend
uvicorn app.main:app --reload

# 2. En otra terminal, ejecutar benchmark (5 minutos)
cd d:\Projects\DEV\AI-Doc-Editor
locust -f backend/tests/performance/locust_ingestion.py \
       --host=http://localhost:8000 \
       --headless -u 10 -r 2 -t 5m \
       --html=backend/tests/performance/reports/ingestion_report.html
```

**Resultado esperado**:
- Throughput: ≥100 docs/hora
- Status: PASS/FAIL automático en consola
- Reporte HTML: `backend/tests/performance/reports/ingestion_report.html`

### Test 2: Search Latency (PERF-004)

**Objetivo**: Validar que p95 latency < 500ms

```bash
# 1. Poblar base de datos con 100 documentos
python backend/tests/performance/setup_perf_test.py --count 100

# 2. Ejecutar benchmark de búsqueda (5 minutos)
locust -f backend/tests/performance/locust_search.py \
       --host=http://localhost:8000 \
       --headless -u 20 -r 4 -t 5m \
       --html=backend/tests/performance/reports/search_report.html
```

**Resultado esperado**:
- p95 latency: < 500ms
- Status: PASS/FAIL automático en consola
- Reporte HTML: `backend/tests/performance/reports/search_report.html`

## 📊 Interpretar Resultados

### Validación Automática

Los scripts imprimen automáticamente:

```
======================================================================
PERF-003: KPI VALIDATION RESULTS
======================================================================
Test Duration: 300.00 seconds (0.0833 hours)
Total Uploads: 150 documents
Throughput: 1800.00 documents/hour
Target KPI: >= 100 documents/hour
KPI Status: PASS ✓
======================================================================
```

### Reportes HTML

Abrir en navegador:
- `backend/tests/performance/reports/ingestion_report.html`
- `backend/tests/performance/reports/search_report.html`

**Métricas clave**:
- Request count (total)
- Failures (debe ser <5%)
- p50/p95/p99 latency
- Requests/second

## 💰 Costos Estimados

**OpenAI API Usage**:
- Ingestion (100 docs): ~$0.15-0.25
- Search (5 min): ~$0.05-0.15
- **Total**: ~$0.20-0.40 USD por ejecución completa

## 🔍 Troubleshooting

### Error: "TEST_AUTH_TOKEN environment variable not set"
**Solución**: Configurar variable de entorno antes de ejecutar
```bash
$env:TEST_AUTH_TOKEN="tu-token"
```

### Error: "Health check failed: 401"
**Solución**: JWT token expirado, obtener uno nuevo

### Error: "API key not configured"
**Solución**: Agregar `OPENAI_API_KEY` al archivo `.env`

### Error: "Fixtures directory not found"
**Solución**: Los fixtures se crean automáticamente, verificar permisos

### Latencia muy alta (>1000ms)
**Causas posibles**:
- OpenAI API lenta (esperar o reintentar)
- Base de datos grande (limpiar con `rm backend/app.db`)
- ChromaDB no corriendo (iniciar con `docker-compose up`)

## 📝 Documentación Adicional

**Documentación completa**: `backend/tests/performance/README.md` (20KB)

**Certificación de KPIs**: `docs/kpis/T-04-Performance-Certification.md`

**Architecture**: `docs/tasks/T-04-STATUS.md`

## ✅ Checklist de Ejecución

- [ ] Backend corriendo en `http://localhost:8000`
- [ ] ChromaDB corriendo en `http://localhost:8001`
- [ ] `.env` configurado con `OPENAI_API_KEY`
- [ ] `TEST_AUTH_TOKEN` configurado
- [ ] Ingestion benchmark ejecutado (PASS)
- [ ] Setup de 100 documentos completado
- [ ] Search benchmark ejecutado (PASS)
- [ ] Reportes HTML generados
- [ ] KPIs documentados en certificación

---

**Fecha**: 2025-10-12
**Versión**: 1.0
**Status**: T-04 100% Completado
