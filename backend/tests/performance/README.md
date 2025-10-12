# Performance Testing for T-04 RAG Pipeline

**Purpose**: Load testing and KPI validation for document ingestion and search endpoints.

**KPIs**:
- **PERF-003**: Ingestion rate >= 100 documents/hour
- **PERF-004**: Search latency p95 < 500ms

---

## Quick Start

```bash
# 1. Install dependencies
pip install locust httpx python-docx

# 2. Generate test fixtures
python backend/tests/performance/fixtures/create_simple_fixtures.py

# 3. Start backend server
cd backend
uvicorn app.main:app --reload

# 4. Set authentication token
export TEST_AUTH_TOKEN="your-jwt-token-here"

# 5. Populate database (for search tests)
python backend/tests/performance/setup_perf_test.py --count 100

# 6. Run benchmarks
locust -f backend/tests/performance/locust_ingestion.py --host=http://localhost:8000
locust -f backend/tests/performance/locust_search.py --host=http://localhost:8000
```

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Test Fixtures](#test-fixtures)
5. [Database Setup](#database-setup)
6. [Running Benchmarks](#running-benchmarks)
7. [Interpreting Results](#interpreting-results)
8. [Troubleshooting](#troubleshooting)
9. [CI/CD Integration](#cicd-integration)
10. [Architecture](#architecture)

---

## Overview

This directory contains Locust-based load testing infrastructure for the T-04 RAG Pipeline:

**Test Scripts**:
- `locust_ingestion.py`: Tests document upload endpoint (PERF-003)
- `locust_search.py`: Tests semantic search endpoint (PERF-004)
- `setup_perf_test.py`: Populates database with test documents

**Test Fixtures**:
- `fixtures/sample_small.pdf`: 10KB PDF document
- `fixtures/sample_medium.pdf`: 50KB PDF document
- `fixtures/sample_large.pdf`: 100KB PDF document
- `fixtures/sample.docx`: 15KB Word document
- `fixtures/sample.md`: 5KB Markdown document
- `fixtures/create_simple_fixtures.py`: Fixture generator script

**Reports**:
- HTML reports generated in `reports/` directory (gitignored)

---

## Prerequisites

### System Requirements

**Software**:
- Python 3.11+
- Backend server running (FastAPI with RAG endpoints)
- PostgreSQL or SQLite database
- ChromaDB (for vector storage)
- OpenAI API key configured

**Dependencies**:
```bash
locust         # Load testing framework
httpx          # Async HTTP client
python-docx    # DOCX file generation (for fixtures)
```

### Backend Requirements

**Endpoints Must Be Available**:
- `POST /api/upload` - Document upload endpoint
- `POST /api/documents/search` - Semantic search endpoint
- `GET /api/documents` - Document listing endpoint
- `GET /health` - Health check endpoint
- `GET /api/upload/health` - Upload service health check

**Authentication**:
- Valid JWT token required for all endpoints
- Token must be set in `TEST_AUTH_TOKEN` environment variable

---

## Installation

### 1. Install Python Dependencies

**Option A: Using pip**:
```bash
pip install locust httpx python-docx
```

**Option B: Using requirements file**:
```bash
pip install -r backend/requirements.txt
```

### 2. Verify Installation

```bash
locust --version
# Expected: locust 2.x.x
```

### 3. Check Backend Server

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

---

## Test Fixtures

### Generating Fixtures

Test fixtures are sample documents used for load testing.

**Generate All Fixtures**:
```bash
python backend/tests/performance/fixtures/create_simple_fixtures.py
```

**Output**:
```
Generating fixtures in: backend/tests/performance/fixtures
======================================================================
Created: sample_small.pdf (10.24 KB)
Created: sample_medium.pdf (51.23 KB)
Created: sample_large.pdf (102.45 KB)
Created: sample.docx (15.67 KB)
Existing: sample.md (5.12 KB)
======================================================================
All fixtures generated successfully!
```

### Fixture Details

| File | Type | Size | Content | Usage |
|------|------|------|---------|-------|
| `sample_small.pdf` | PDF | ~10KB | AI/ML intro | 40% of ingestion tests |
| `sample_medium.pdf` | PDF | ~50KB | Extended AI content | 30% of ingestion tests |
| `sample_large.pdf` | PDF | ~100KB | Comprehensive AI docs | 20% of ingestion tests |
| `sample.docx` | DOCX | ~15KB | Structured AI content | 5% of ingestion tests |
| `sample.md` | Markdown | ~5KB | AI technical docs | 5% of ingestion tests |

**Note**: Fixtures contain realistic AI/ML technical content for semantic search testing.

---

## Database Setup

### Why Database Setup Is Needed

The search benchmark requires a populated database with multiple documents to test semantic search performance realistically.

### Setup Process

**1. Get Authentication Token**:
```bash
# Option A: OAuth login (production-like)
# Login via frontend and copy JWT token from browser developer tools

# Option B: Test token endpoint (development only)
# Create a test user and get token via API
```

**2. Export Token**:
```bash
export TEST_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**3. Run Setup Script**:
```bash
# Default: populate with 100 documents
python backend/tests/performance/setup_perf_test.py

# Custom count
python backend/tests/performance/setup_perf_test.py --count 200

# Clean existing documents first
python backend/tests/performance/setup_perf_test.py --clean --count 100

# Custom backend URL
python backend/tests/performance/setup_perf_test.py --base-url http://localhost:8080
```

**4. Verify Setup**:
```bash
# Check document count via API
curl -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
     http://localhost:8000/api/documents | jq '.total'
# Expected: 100 (or your target count)
```

### Setup Script Output

```
======================================================================
T-04 Performance Testing Setup
======================================================================
Target: 100 documents
Backend: http://localhost:8000
======================================================================
✓ Authentication token loaded (length: 245)
✓ Backend server is healthy: http://localhost:8000
✓ Current document count: 0

✓ Found 5 fixture files:
  - sample_small.pdf (10.24 KB)
  - sample_medium.pdf (51.23 KB)
  - sample_large.pdf (102.45 KB)
  - sample.docx (15.67 KB)
  - sample.md (5.12 KB)

📤 Uploading 100 documents to reach target of 100...
======================================================================
  Progress: 10/100 (10.0%) - Rate: 2.45 docs/sec
  Progress: 20/100 (20.0%) - Rate: 2.67 docs/sec
  ...
  Progress: 100/100 (100.0%) - Rate: 2.89 docs/sec
======================================================================

✓ Upload complete!
  - Total uploaded: 100
  - Failed: 0
  - Duration: 34.56 seconds
  - Rate: 2.89 docs/sec
  - Final document count: 100
```

---

## Running Benchmarks

### PERF-003: Ingestion Benchmark

**Objective**: Validate ingestion rate >= 100 documents/hour

**Test Configuration**:
- 10 concurrent users
- 5-minute duration
- Mixed document types (PDF, DOCX, MD)

**Command (Headless Mode)**:
```bash
locust -f backend/tests/performance/locust_ingestion.py \
       --host=http://localhost:8000 \
       --headless -u 10 -r 2 -t 5m \
       --html=backend/tests/performance/reports/ingestion_report.html \
       --csv=backend/tests/performance/reports/ingestion
```

**Command (Web UI Mode)**:
```bash
locust -f backend/tests/performance/locust_ingestion.py \
       --host=http://localhost:8000
```

Then open http://localhost:8089 and configure:
- Number of users: 10
- Spawn rate: 2 users/second
- Run time: 5 minutes

**Expected Output (Console)**:
```
======================================================================
PERF-003: Document Ingestion Load Test
======================================================================
Target KPI: >= 100 documents/hour
Test Configuration: 10 users, 5 minutes
Host: http://localhost:8000
======================================================================

[Running test...]

======================================================================
PERF-003: KPI VALIDATION RESULTS
======================================================================
Test Duration: 300.00 seconds (0.0833 hours)
Total Uploads: 150 documents
Successful Requests: 150
Failed Requests: 0

Throughput: 1800.00 documents/hour
Target KPI: >= 100 documents/hour

Latency Metrics:
  - Average: 245.67ms
  - p50: 189.23ms
  - p95: 456.78ms
  - p99: 589.34ms

KPI Status: PASS
======================================================================
```

### PERF-004: Search Benchmark

**Objective**: Validate p95 latency < 500ms for semantic search

**Test Configuration**:
- 20 concurrent users
- 5-minute duration
- Realistic search queries (AI/ML topics)
- Database with >= 100 documents

**Prerequisites**:
```bash
# Ensure database is populated
python backend/tests/performance/setup_perf_test.py --count 100
```

**Command (Headless Mode)**:
```bash
locust -f backend/tests/performance/locust_search.py \
       --host=http://localhost:8000 \
       --headless -u 20 -r 4 -t 5m \
       --html=backend/tests/performance/reports/search_report.html \
       --csv=backend/tests/performance/reports/search
```

**Command (Web UI Mode)**:
```bash
locust -f backend/tests/performance/locust_search.py \
       --host=http://localhost:8000
```

Then open http://localhost:8089 and configure:
- Number of users: 20
- Spawn rate: 4 users/second
- Run time: 5 minutes

**Expected Output (Console)**:
```
======================================================================
PERF-004: Document Search Load Test
======================================================================
Target KPI: p95 latency < 500ms
Test Configuration: 20 users, 5 minutes
Host: http://localhost:8000
======================================================================

[Running test...]

======================================================================
PERF-004: KPI VALIDATION RESULTS
======================================================================
Test Duration: 300.00 seconds
Total Searches: 2456 queries
Successful Requests: 2456
Failed Requests: 0
Error Rate: 0.00%

Throughput: 8.19 queries/second

Latency Metrics:
  - Average: 189.45ms
  - p50 (median): 156.78ms
  - p95: 387.23ms
  - p99: 478.90ms

Target KPI: p95 < 500ms
Measured p95: 387.23ms

KPI Status: PASS
======================================================================
```

---

## Interpreting Results

### Console Output

Both benchmarks print a final **KPI Validation Summary** with:
- Test duration and total operations
- Success/failure counts
- Latency percentiles (p50, p95, p99)
- KPI status: **PASS** or **FAIL**

**PASS Criteria**:
- **PERF-003**: Throughput >= 100 docs/hour AND success rate >= 95%
- **PERF-004**: p95 latency < 500ms AND error rate < 5%

### HTML Reports

HTML reports provide detailed metrics and charts:

**Open Reports**:
```bash
# Ingestion report
open backend/tests/performance/reports/ingestion_report.html

# Search report
open backend/tests/performance/reports/search_report.html
```

**Report Contents**:
- **Statistics**: Request counts, RPS, median/p95/p99 latencies
- **Charts**: Response time distribution, requests per second over time
- **Failures**: Detailed error logs (if any)
- **Download Data**: CSV export for further analysis

### CSV Output

For automated analysis, use CSV output:

```bash
# Files generated (with --csv=reports/ingestion):
reports/ingestion_stats.csv        # Per-endpoint statistics
reports/ingestion_stats_history.csv # Time-series data
reports/ingestion_failures.csv     # Failed requests (if any)
```

**Parse CSV in Python**:
```python
import pandas as pd

stats = pd.read_csv('reports/ingestion_stats.csv')
print(f"p95 latency: {stats['95%'].iloc[0]} ms")
```

### Key Metrics Explained

| Metric | Description | Target |
|--------|-------------|--------|
| **Total Requests** | Successful operations | High (more is better) |
| **Failures** | Failed operations | Low (< 5% acceptable) |
| **Average Latency** | Mean response time | Informational |
| **p50 (Median)** | 50% of requests faster than this | Informational |
| **p95** | 95% of requests faster than this | **< 500ms (PERF-004)** |
| **p99** | 99% of requests faster than this | Informational |
| **RPS** | Requests per second | Throughput indicator |
| **Throughput** | Operations per hour | **>= 100 docs/hr (PERF-003)** |

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `401 Unauthorized` or "Authentication failed - check TEST_AUTH_TOKEN"

**Solution**:
```bash
# Verify token is set
echo $TEST_AUTH_TOKEN

# If empty, export token
export TEST_AUTH_TOKEN="your-jwt-token-here"

# Verify token is valid
curl -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
     http://localhost:8000/api/documents
```

#### 2. Backend Server Not Running

**Error**: `ConnectError` or "Cannot connect to backend server"

**Solution**:
```bash
# Check if server is running
curl http://localhost:8000/health

# If not running, start server
cd backend
uvicorn app.main:app --reload
```

#### 3. Fixtures Not Found

**Error**: "Fixtures directory not found" or "No fixture files found"

**Solution**:
```bash
# Generate fixtures
python backend/tests/performance/fixtures/create_simple_fixtures.py

# Verify fixtures exist
ls -lh backend/tests/performance/fixtures/
```

#### 4. Database Empty (Search Tests)

**Error**: "Only 0 documents in database"

**Solution**:
```bash
# Populate database
python backend/tests/performance/setup_perf_test.py --count 100

# Verify document count
curl -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
     http://localhost:8000/api/documents | jq '.total'
```

#### 5. API Key Not Configured

**Error**: `402 Payment Required` or "API key not configured"

**Solution**:
- Ensure OpenAI API key is configured in backend
- Check user settings or global API key configuration
- See `backend/docs/configuration.md` for API key setup

#### 6. p95 Latency Too High

**Issue**: PERF-004 fails with p95 > 500ms

**Analysis**:
1. Check OpenAI API latency (external dependency)
2. Verify ChromaDB performance (collection size, indexing)
3. Review database query performance
4. Check network latency (if testing remote server)

**Optimization**:
- Implement result caching (Redis)
- Optimize ChromaDB configuration
- Add query caching for common searches
- Consider CDN for static results

#### 7. Ingestion Rate Too Low

**Issue**: PERF-003 fails with throughput < 100 docs/hour

**Analysis**:
1. Check text extraction performance (PyPDF2, python-docx)
2. Review embedding generation latency (OpenAI API)
3. Analyze database write performance
4. Check for background task bottlenecks

**Optimization**:
- Implement batch processing
- Add document processing queue (Celery, RQ)
- Optimize ChromaDB bulk insertion
- Consider async processing improvements

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM
  workflow_dispatch:     # Manual trigger

jobs:
  performance-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install locust httpx python-docx
          pip install -r backend/requirements.txt

      - name: Generate fixtures
        run: python backend/tests/performance/fixtures/create_simple_fixtures.py

      - name: Start backend
        run: |
          cd backend
          uvicorn app.main:app &
          sleep 10

      - name: Setup database
        env:
          TEST_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
        run: python backend/tests/performance/setup_perf_test.py --count 100

      - name: Run ingestion benchmark
        env:
          TEST_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
        run: |
          locust -f backend/tests/performance/locust_ingestion.py \
                 --host=http://localhost:8000 \
                 --headless -u 10 -r 2 -t 5m \
                 --html=reports/ingestion_report.html

      - name: Run search benchmark
        env:
          TEST_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
        run: |
          locust -f backend/tests/performance/locust_search.py \
                 --host=http://localhost:8000 \
                 --headless -u 20 -r 4 -t 5m \
                 --html=reports/search_report.html

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: reports/*.html
```

### Command-Line Exit Codes

Locust scripts exit with error codes for CI/CD integration:

- `0`: All KPIs passed
- `1`: One or more KPIs failed

**Example**:
```bash
locust -f locust_search.py --headless -u 20 -r 4 -t 5m
if [ $? -eq 0 ]; then
  echo "✅ Performance tests passed"
else
  echo "❌ Performance tests failed"
  exit 1
fi
```

---

## Architecture

### Locust Framework

**Why Locust?**
- Python-based (matches backend stack)
- Easy to write custom load tests
- Supports distributed load generation
- Real-time web UI for monitoring
- Comprehensive reporting (HTML, CSV)

**How It Works**:
1. Define `HttpUser` class with tasks
2. Tasks decorated with `@task(weight)`
3. Locust spawns concurrent users
4. Each user runs tasks randomly (weighted)
5. Metrics collected in real-time
6. Final report generated at test end

### Test Flow

**Ingestion Test (locust_ingestion.py)**:
```
1. User spawns → Authenticate (get JWT token)
2. Select random fixture (weighted distribution)
3. Upload document via POST /api/upload
4. Record latency + success/failure
5. Wait 1-3 seconds (think time)
6. Repeat until test duration ends
7. Calculate throughput (docs/hour)
8. Validate against KPI (>= 100 docs/hour)
```

**Search Test (locust_search.py)**:
```
1. User spawns → Authenticate (get JWT token)
2. Verify database has documents
3. Select random query (weighted distribution)
4. Search via POST /api/documents/search
5. Record latency + success/failure
6. Wait 0.5-2 seconds (think time)
7. Repeat until test duration ends
8. Calculate p95 latency
9. Validate against KPI (< 500ms)
```

### Metrics Collection

**Locust Built-in Metrics**:
- Request counts (total, successful, failed)
- Response times (min, max, avg, median, p95, p99)
- Requests per second (RPS)
- Error logs with details

**Custom Metrics**:
- Throughput calculation (docs/hour)
- KPI validation (PASS/FAIL)
- Success rate percentage
- Background task tracking

---

## Additional Resources

**Documentation**:
- **KPI Certification**: `docs/kpis/T-04-Performance-Certification.md`
- **Task Documentation**: `docs/project-management/tasks/T-04-rag-pipeline.md`
- **API Docs**: `backend/docs/api/rag-endpoints.md`
- **Locust Docs**: https://docs.locust.io/

**Related Tests**:
- **Unit Tests**: `backend/tests/unit/`
- **Integration Tests**: `backend/tests/integration/`
- **Security Tests**: `backend/tests/security/`

**Support**:
- Report issues: [GitHub Issues](https://github.com/BriamV/AI-Doc-Editor/issues)
- Tech Lead: [Contact information]

---

**Last Updated**: 2025-10-12
**Maintainer**: Performance Engineering Team
**Version**: 1.0
