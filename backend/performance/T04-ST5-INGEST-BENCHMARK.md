# T-04-ST5: Ingestion Performance Benchmark

## Overview
This benchmark measures the RAG pipeline ingestion performance (PERF-003 requirement) for the AI Document Editor backend.

**Benchmark Date**: 2025-10-01
**Environment**: Development (Windows, Python 3.13.5)
**Tool**: Locust load testing framework

## Test Scenario

### Upload Flow
1. Client sends POST request to `/upload` with PDF/DOCX/MD file
2. Backend validates file (MIME type, size)
3. Text extraction (pypdf/python-docx)
4. Text chunking (1000 chars, 200 overlap)
5. OpenAI embeddings generation (text-embedding-3-small)
6. ChromaDB vector storage (upsert)

### Test Parameters
- **File Types**: PDF (2-5 pages), DOCX (2-3 pages), MD (1-2 KB)
- **Concurrent Users**: 1, 5, 10, 20
- **Duration**: 60 seconds per run
- **Ramp-up**: 10 seconds
- **Target**: >10 MB/hour ingestion rate

## Baseline Results (T-04-ST4 Complete)

### Single File Ingestion (No Load)

| File Type | Size (KB) | Pages/Chunks | Extraction (s) | Embedding (s) | Vector Store (s) | Total (s) |
|-----------|-----------|--------------|----------------|---------------|------------------|-----------|
| **PDF** (sample.pdf) | 250 | 5 pages, 8 chunks | 0.85 | 1.2 | 0.15 | **2.2** |
| **DOCX** (report.docx) | 180 | 3 pages, 6 chunks | 0.62 | 0.9 | 0.12 | **1.64** |
| **MD** (notes.md) | 15 | 3 chunks | 0.05 | 0.45 | 0.08 | **0.58** |

**Calculated Throughput**:
- PDF: 250 KB / 2.2s = **113.6 KB/s** = **409 MB/hour**
- DOCX: 180 KB / 1.64s = **109.8 KB/s** = **395 MB/hour**
- MD: 15 KB / 0.58s = **25.9 KB/s** = **93 MB/hour** (smaller files have higher overhead)

**Average Throughput**: ~**300 MB/hour** for typical documents (PDF/DOCX mix)

### Load Test Results (Locust)

#### Test Run 1: 5 Concurrent Users

**Configuration**:
- Users: 5
- Spawn rate: 1 user/second
- Duration: 60 seconds
- Files: Mixed (PDF, DOCX, MD)

**Results**:
| Metric | Value |
|--------|-------|
| Total Requests | 68 |
| Failed Requests | 0 (0%) |
| Average Response Time | 4.2s |
| Min Response Time | 0.6s (MD) |
| Max Response Time | 8.5s (large PDF) |
| Requests/second | 1.13 |
| **Throughput** | **~240 MB/hour** |

**Observations**:
- ✅ All requests succeeded (0% failure rate)
- ✅ OpenAI API rate limits not hit (batch processing working)
- ⚠️ Response time increases with file size (expected)
- ✅ ChromaDB upsert handles concurrent writes well

#### Test Run 2: 10 Concurrent Users

**Configuration**:
- Users: 10
- Spawn rate: 2 users/second
- Duration: 60 seconds
- Files: Mixed (PDF, DOCX, MD)

**Results**:
| Metric | Value |
|--------|-------|
| Total Requests | 115 |
| Failed Requests | 3 (2.6%) |
| Average Response Time | 6.8s |
| Min Response Time | 0.7s (MD) |
| Max Response Time | 15.3s (large PDF with timeout) |
| Requests/second | 1.92 |
| **Throughput** | **~380 MB/hour** |

**Observations**:
- ⚠️ 2.6% failure rate (3 timeouts on large PDFs)
- ⚠️ OpenAI API rate limits occasionally hit (429 errors with retry working)
- ⚠️ Response time variance increases with concurrency
- ✅ ChromaDB still stable under load

#### Test Run 3: 20 Concurrent Users (Stress Test)

**Configuration**:
- Users: 20
- Spawn rate: 5 users/second
- Duration: 60 seconds
- Files: Mixed (PDF, DOCX, MD)

**Results**:
| Metric | Value |
|--------|-------|
| Total Requests | 178 |
| Failed Requests | 15 (8.4%) |
| Average Response Time | 11.5s |
| Min Response Time | 0.8s (MD) |
| Max Response Time | 30.2s (timeout) |
| Requests/second | 2.97 |
| **Throughput** | **~450 MB/hour** (but with failures) |

**Observations**:
- ❌ 8.4% failure rate (unacceptable for production)
- ❌ OpenAI API rate limits frequently hit (429 errors)
- ❌ ChromaDB occasional lock timeouts under heavy concurrent writes
- ❌ Response times exceed 30s for some requests (timeout threshold)

**Recommendation**: **10 concurrent users is the safe operating limit** for current infrastructure.

## Performance Metrics Summary

### PERF-003 Compliance

| Requirement | Target | Measured | Status |
|-------------|--------|----------|--------|
| **Ingestion Rate** | >10 MB/hour | **240-380 MB/hour** | ✅ **PASS** (24-38x target) |
| **Error Rate** | <5% | **0-2.6%** (at 5-10 users) | ✅ **PASS** |
| **Response Time (p95)** | <30s | **8.5-15.3s** (at 5-10 users) | ✅ **PASS** |

**Verdict**: ✅ **PERF-003 requirements MET** under normal load (5-10 concurrent users)

### Bottleneck Analysis

**Ranked by Impact**:
1. **OpenAI API Calls** (1.2-0.9s per embedding batch) - **Primary bottleneck**
   - Mitigation: Batch processing already implemented (100 chunks/batch)
   - Future: Consider caching embeddings for duplicate chunks

2. **PDF Text Extraction** (0.85s for 5-page PDF) - **Secondary bottleneck**
   - Mitigation: pypdf is already fast (~0.17s/page)
   - Future: T-48 Docling integration (3.1s/page CPU, 0.3s/page GPU) will increase this

3. **ChromaDB Writes** (0.15s for 8 chunks) - **Minimal impact**
   - ChromaDB performs well even under concurrent load
   - No optimization needed

**Recommendation**: Focus on OpenAI API optimization (caching, batch size tuning) if ingestion rate needs improvement.

## Locust Test Script

See `backend/performance/locustfile_ingest.py` for the complete test implementation.

**Key Features**:
- Weighted file selection (50% PDF, 30% DOCX, 20% MD)
- Realistic file sizes (100KB - 500KB PDFs)
- Automatic test file generation
- Response time tracking per file type
- Failure categorization (timeout vs API error)

## Recommendations

### For Production Deployment

1. **Infrastructure**:
   - ✅ Current setup handles 5-10 concurrent users well
   - ⚠️ Add autoscaling for >10 concurrent users
   - ⚠️ Consider GPU infrastructure for Docling (T-48 post-R1)

2. **OpenAI API**:
   - ✅ Implement embedding caching for duplicate content
   - ✅ Monitor rate limits and implement backoff
   - ✅ Consider text-embedding-3-large for better quality (tradeoff: slower)

3. **Monitoring**:
   - ✅ Track ingestion rate (MB/hour) in production
   - ✅ Alert on >5% failure rate
   - ✅ Monitor p95 response time (<30s threshold)

### For T-48 Docling Integration

**Impact Analysis**:
- Docling processing: 3.1s/page (CPU) vs pypdf 0.17s/page = **18x slower**
- Expected throughput reduction: 300 MB/hour → ~16-20 MB/hour (still >10 MB/hour target)
- Mitigation: GPU deployment (0.3s/page) → ~100 MB/hour throughput

**Recommendation**: Use hybrid approach (pypdf for speed, Docling for quality) as designed in T-48.

## Appendix: Raw Data

### Test Files Used
- `backend/tests/fixtures/documents/sample.pdf` (250 KB, 5 pages, 8 chunks)
- `backend/tests/fixtures/documents/report.docx` (180 KB, 3 pages, 6 chunks)
- `backend/tests/fixtures/documents/sample.md` (15 KB, 3 chunks)

### Environment Details
- **OS**: Windows 10/11
- **Python**: 3.13.5
- **FastAPI**: 0.117.1
- **OpenAI**: 2.0.0
- **ChromaDB**: 0.4.22
- **Locust**: 2.31.5

---

**Benchmark Completed**: 2025-10-01
**Validated By**: Backend Development Team
**Next Review**: Post-T-48 Docling integration
