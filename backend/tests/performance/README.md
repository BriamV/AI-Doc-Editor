# Performance Testing for T-04 RAG Pipeline

**Purpose**: Load testing and KPI validation for document ingestion and search endpoints.

**KPIs**:
- **PERF-003**: Ingestion rate >= 100 documents/hour
- **PERF-004**: Search latency p95 < 500ms

---

## Quick Start

### Simple Fixtures Mode (Quick Testing)

```bash
# 1. Install dependencies
pip install locust httpx python-docx

# 2. Generate test fixtures
python backend/tests/performance/fixtures/create_simple_fixtures.py

# 3. Start backend server
cd backend
uvicorn app.main:app --reload

# 4. Generate and set authentication token
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 4 --quiet)

# 5. Populate database with simple fixtures
python backend/tests/performance/setup_perf_test.py --count 100

# 6. Run benchmarks
locust -f backend/tests/performance/locust_ingestion.py --host=http://localhost:8000
locust -f backend/tests/performance/locust_search.py --host=http://localhost:8000
```

### Gutenberg Dataset Mode (Realistic RAG Testing)

```bash
# 1. Install dependencies (same as above)
pip install locust httpx python-docx

# 2. Download Gutenberg books (one-time setup, ~45 seconds)
python backend/tests/performance/download_gutenberg_dataset.py

# 3. Start backend server
cd backend
uvicorn app.main:app --reload

# 4. Generate and set authentication token
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 4 --quiet)

# 5. Chunk and upload Gutenberg dataset
python backend/tests/performance/setup_perf_test.py --gutenberg --target-chunks 100

# 6. Run search benchmark (with realistic diverse content)
locust -f backend/tests/performance/locust_search.py --host=http://localhost:8000
```

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Test Token Generator](#test-token-generator)
4. [Installation](#installation)
5. [Test Fixtures](#test-fixtures)
6. [Database Setup](#database-setup)
7. [Running Benchmarks](#running-benchmarks)
8. [Interpreting Results](#interpreting-results)
9. [Troubleshooting](#troubleshooting)
10. [CI/CD Integration](#cicd-integration)
11. [Architecture](#architecture)

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
- Use `get_test_token.py` to generate long-lived tokens for extended tests

---

## Test Token Generator

### Overview

The `get_test_token.py` script generates JWT tokens with custom expiration times, specifically designed for performance testing scenarios where standard 30-minute tokens would expire.

### Features

- **Custom Expiration**: Set token lifetime in hours (default: 2 hours)
- **No OAuth Flow**: Bypasses interactive OAuth login
- **Quiet Mode**: Output only the token for scripting
- **Persistent User**: Creates or reuses test user in database

### Usage

**Generate Token with Default 2-Hour Expiration**:
```bash
python backend/tests/performance/get_test_token.py
```

**Generate Token for Long-Running Tests**:
```bash
# 24-hour token for extended load tests
python backend/tests/performance/get_test_token.py --expires 24

# 4-hour token for medium-duration tests
python backend/tests/performance/get_test_token.py --expires 4
```

**Quiet Mode for Scripting (PowerShell)**:
```bash
$env:TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 2 --quiet)
```

**Quiet Mode for Scripting (Linux/Mac)**:
```bash
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 2 --quiet)
```

**Custom User**:
```bash
python backend/tests/performance/get_test_token.py \
  --email custom-test@example.com \
  --name "Custom Test User" \
  --expires 8
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `--expires` | int | 2 | Token expiration time in hours |
| `--email` | string | test-performance@example.com | Test user email |
| `--name` | string | Performance Test User | Test user name |
| `--quiet` | flag | false | Output only the token (for scripting) |

### Example Output (Full Mode)

```
======================================================================
JWT TOKEN GENERATED SUCCESSFULLY
======================================================================

User Email: test-performance@example.com
User ID: c1c7400a-5875-48e6-b234-9f6dccd3143b
User Role: editor

Token Expiration: 4 hours (240 minutes)

Access Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Refresh Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

======================================================================
USAGE INSTRUCTIONS
======================================================================

Windows PowerShell:
$env:TEST_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Linux/Mac:
export TEST_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Or add to .env file:
TEST_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

======================================================================
```

### Verification

To verify token expiration time:
```bash
# Generate token and save to file
python backend/tests/performance/get_test_token.py --expires 4 --quiet > token.txt

# Verify expiration using verification script
python backend/tests/performance/verify_token_expiration.py "$(cat token.txt)"
```

Expected output:
```
Token Expiration Details:
  Expires at: 2025-10-13 11:23:04
  Current time: 2025-10-13 07:23:05
  Time until expiry: 3:59:58
  Hours until expiry: 4.00
```

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

### Two Fixture Modes

The performance testing framework supports two fixture modes:

1. **Simple Fixtures**: Small generated documents for quick testing
2. **Gutenberg Dataset**: Chunked classic books for realistic RAG testing

### Mode 1: Simple Fixtures (Quick Testing)

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

**Fixture Details**:

| File | Type | Size | Content | Usage |
|------|------|------|---------|-------|
| `sample_small.pdf` | PDF | ~10KB | AI/ML intro | 40% of ingestion tests |
| `sample_medium.pdf` | PDF | ~50KB | Extended AI content | 30% of ingestion tests |
| `sample_large.pdf` | PDF | ~100KB | Comprehensive AI docs | 20% of ingestion tests |
| `sample.docx` | DOCX | ~15KB | Structured AI content | 5% of ingestion tests |
| `sample.md` | Markdown | ~5KB | AI technical docs | 5% of ingestion tests |

### Mode 2: Gutenberg Dataset (Realistic RAG Testing)

**Purpose**: Provides diverse, realistic content from classic literature for comprehensive semantic search testing.

**Features**:
- 10-15 classic books from Project Gutenberg (public domain, zero cost)
- Books chunked into ~100 documents (1000-2000 words each)
- Genre diversity: Romance, Fantasy, Mystery, Historical, Adventure, Satire
- Realistic document sizes matching production use cases
- Preserved book/chapter metadata for testing

**Download Dataset**:
```bash
python backend/tests/performance/download_gutenberg_dataset.py
```

**Expected Output**:
```
================================================================================
Project Gutenberg Dataset Downloader
================================================================================
Output directory: backend/tests/performance/fixtures/gutenberg
Books to download: 10
Skip existing: False
================================================================================

[1/10]
  ⬇ Downloading: Pride and Prejudice (ID: 1342)...
  ✓ Downloaded: 01342_Pride_and_Prejudice.txt (700.2 KB) [Romance]

[2/10]
  ⬇ Downloading: Alice's Adventures in Wonderland (ID: 11)...
  ✓ Downloaded: 00011_Alice's_Adventures_in_Wonderland.txt (167.8 KB) [Fantasy]

...

================================================================================
Download Summary
================================================================================
  Total books: 10
  Downloaded: 10
  Skipped: 0
  Failed: 0
  Total size: 4530.5 KB
  Total words: 756,234
  Duration: 45.23 seconds

  Metadata: backend/tests/performance/fixtures/gutenberg/gutenberg_metadata.json
================================================================================

✓ All books downloaded successfully!
```

**Book Catalog**:

| ID | Title | Author | Genre | Words | Size |
|----|-------|--------|-------|-------|------|
| 1342 | Pride and Prejudice | Jane Austen | Romance | ~125,000 | ~700KB |
| 11 | Alice's Adventures in Wonderland | Lewis Carroll | Fantasy | ~27,000 | ~170KB |
| 1661 | Sherlock Holmes | Arthur Conan Doyle | Mystery | ~105,000 | ~580KB |
| 84 | Frankenstein | Mary Shelley | Gothic/Sci-Fi | ~78,000 | ~440KB |
| 98 | A Tale of Two Cities | Charles Dickens | Historical | ~138,000 | ~780KB |
| 2701 | Moby Dick | Herman Melville | Adventure | ~215,000 | ~1200KB |
| 16 | Peter Pan | J.M. Barrie | Children's | ~57,000 | ~320KB |
| 74 | Tom Sawyer | Mark Twain | Adventure | ~72,000 | ~410KB |
| 1952 | The Yellow Wallpaper | Charlotte Perkins Gilman | Short Story | ~6,000 | ~30KB |
| 1080 | A Modest Proposal | Jonathan Swift | Satire | ~5,000 | ~30KB |

**Total**: ~828,000 words across 10 books, providing rich semantic diversity

**Dataset Features**:
- **Zero Cost**: Public domain content, no API charges
- **Diverse Genres**: Tests search across different writing styles
- **Realistic Length**: Books range from 5K to 215K words
- **Cleaned Text**: Gutenberg headers/footers automatically removed
- **Metadata**: JSON file with book info, word counts, genres

**Chunking Configuration**:
```bash
# Default: ~100 chunks at 1500 words each
python backend/tests/performance/setup_perf_test.py --gutenberg

# Custom chunk size (more chunks)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 1000 --target-chunks 150

# Larger chunks (fewer documents)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 2500 --target-chunks 80
```

**Chunk Format** (Markdown):
```markdown
# Pride and Prejudice

**Author**: Jane Austen
**Part**: 1 of 83
**Section**: Chapter I

---

It is a truth universally acknowledged, that a single man in possession
of a good fortune, must be in want of a wife...
```

**Why Gutenberg for PERF-004?**
- Real-world content complexity (not synthetic test data)
- Semantic diversity across genres and authors
- Historical context provides challenging search queries
- Public domain = reproducible benchmarks
- Industry-standard dataset for NLP testing

---

## Database Setup

### Why Database Setup Is Needed

The search benchmark requires a populated database with multiple documents to test semantic search performance realistically.

### Setup Process

**1. Get Authentication Token**:
```bash
# Recommended: Test token generator with custom expiration
# Generate a long-lived token that won't expire during extended test runs
python backend/tests/performance/get_test_token.py --expires 24 --quiet
```

**2. Export Token**:
```bash
# For long-running tests (e.g., 24-hour load tests)
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 24 --quiet)

# For shorter tests (default 2-hour expiration)
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --quiet)
```

**Note**: The `--expires` parameter accepts hours. For performance tests, use a value that exceeds your expected test duration.

**3. Choose Your Mode**:

### Mode 1: Simple Fixtures (Quick Testing)

Best for: Quick validation, CI/CD pipelines, development testing

```bash
# Generate fixtures
python backend/tests/performance/fixtures/create_simple_fixtures.py

# Populate database with 100 documents (repeating 5 fixture files)
python backend/tests/performance/setup_perf_test.py --count 100

# Custom count
python backend/tests/performance/setup_perf_test.py --count 200

# Clean existing documents first
python backend/tests/performance/setup_perf_test.py --clean --count 100
```

### Mode 2: Gutenberg Dataset (Realistic RAG Testing)

Best for: Production-like testing, semantic search validation, realistic benchmarks

```bash
# Step 1: Download Gutenberg books (one-time setup)
python backend/tests/performance/download_gutenberg_dataset.py

# Step 2: Chunk and upload books to database
python backend/tests/performance/setup_perf_test.py --gutenberg --target-chunks 100

# Custom chunk size (smaller chunks = more documents)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 1000 --target-chunks 150

# Clean and reload with Gutenberg dataset
python backend/tests/performance/setup_perf_test.py --gutenberg --clean --target-chunks 100
```

**Gutenberg Mode Output**:
```
================================================================================
T-04 Performance Testing Setup
================================================================================
Mode: Gutenberg Dataset (Chunked Books)
Target: 100 documents
Chunk size: 1500 words
Backend: http://localhost:8000
================================================================================
✓ Authentication token loaded (length: 245)
✓ Backend server is healthy: http://localhost:8000

✓ Found 10 Gutenberg books:
  - Pride and Prejudice by Jane Austen (125,234 words, 700.2 KB)
  - Alice's Adventures in Wonderland by Lewis Carroll (26,987 words, 167.8 KB)
  ...

📚 Chunking books into ~1500 word documents...
Target: 100 chunks
================================================================================
  Pride and Prejudice: 83 chunks (125,234 words → ~1508 words/chunk)
  Alice's Adventures in Wonderland: 18 chunks (26,987 words → ~1499 words/chunk)
  ...

✓ Created 120 chunks from 10 books
  Limiting to first 100 chunks (you can adjust --chunk-size to create more)

📤 Uploading 100 document chunks...
================================================================================
  Progress: 10/100 (10.0%) - Rate: 2.34 docs/sec
  Progress: 20/100 (20.0%) - Rate: 2.45 docs/sec
  ...
  Progress: 100/100 (100.0%) - Rate: 2.52 docs/sec
================================================================================

✓ Gutenberg chunk upload complete!
  - Total uploaded: 100
  - Failed: 0
  - Duration: 39.68 seconds
  - Rate: 2.52 docs/sec

✓ Final document count: 100
```

**Custom backend URL** (both modes):
```bash
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

# If empty, generate and export token (recommended)
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 4 --quiet)

# Verify token is valid
curl -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
     http://localhost:8000/api/documents
```

**Token Expired?**
If you see `401 Unauthorized` during a long test run, your token may have expired. Generate a new token with longer expiration:
```bash
# Generate 24-hour token for extended tests
export TEST_AUTH_TOKEN=$(python backend/tests/performance/get_test_token.py --expires 24 --quiet)
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
