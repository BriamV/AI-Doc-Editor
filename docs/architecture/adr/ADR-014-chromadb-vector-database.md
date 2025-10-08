# ADR-014: ChromaDB as Vector Database for RAG Pipeline

## Status

Accepted (Implemented in T-04-ST4)

## Context

The AI Document Editor requires a vector database to store document embeddings for semantic search in the RAG (Retrieval-Augmented Generation) pipeline. The system needs to:

1. **Store embeddings**: Persist OpenAI text-embedding-3-small vectors (1536 dimensions)
2. **Semantic search**: Perform fast cosine similarity search across thousands of document chunks
3. **Metadata filtering**: Support filtering by document_id, file_type, and custom metadata
4. **Upsert operations**: Update existing document vectors when documents are re-uploaded
5. **Development-friendly**: Easy local development without complex infrastructure

### Requirements from T-04

- **Performance**: Search latency p95 < 500ms (PERF-004)
- **Scale**: Support 10,000+ document chunks initially
- **Reliability**: Persistent storage, no data loss on restart
- **Integration**: Seamless integration with Python/FastAPI backend

### Evaluation Timeline

- **Evaluation Date**: October 2025
- **Implementation**: T-04-ST4 (RAG Pipeline - Vector Storage)
- **Decision Maker**: Backend Development Team

## Decision

We will use **ChromaDB v0.4.22** as the vector database for the RAG pipeline with the following configuration:

```python
# Configuration (backend/app/core/config.py)
CHROMA_PERSIST_DIRECTORY: str = "backend/chroma_db"
CHROMA_COLLECTION_NAME: str = "documents"

# ChromaDB Setup
client = chromadb.PersistentClient(
    path=settings.CHROMA_PERSIST_DIRECTORY,
    settings=Settings(anonymized_telemetry=False)
)

collection = client.get_or_create_collection(
    name=settings.CHROMA_COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"}  # Cosine similarity
)
```

### Key Implementation Details

1. **Storage Mode**: Persistent (local filesystem) for development, production-ready architecture
2. **Similarity Metric**: Cosine similarity (optimal for OpenAI embeddings)
3. **Indexing**: HNSW (Hierarchical Navigable Small World) for fast approximate nearest neighbor search
4. **Metadata Schema**:
   ```python
   {
       "document_id": str,        # Unique document identifier
       "chunk_index": int,        # Chunk position in document
       "document_name": str,      # Original filename
       "file_type": str,          # pdf, docx, md
       "created_at": str          # ISO 8601 timestamp
   }
   ```

5. **Upsert Pattern**: Delete existing + insert new (ensures clean updates)

## Consequences

### Benefits

✅ **Fast Development**: Zero-config local setup, no external dependencies
- Embedded database, runs in-process with FastAPI
- No Docker containers or external services required for development

✅ **Excellent Performance**: Benchmarked in T-04-ST6
- Search latency: 15-25ms for 10K vectors (ChromaDB component only)
- Scales logarithmically: O(log n) query time with HNSW index
- Total p95 latency: 350ms @ 10 concurrent users (meets PERF-004 target)

✅ **Production-Ready**:
- Persistent storage with ACID guarantees
- Concurrent read/write support
- Crash recovery and data integrity

✅ **Developer-Friendly**:
- Pythonic API (no SQL queries)
- Built-in embedding function support (not used, we use OpenAI directly)
- Comprehensive documentation and active community

✅ **Flexible Metadata Filtering**:
```python
# Filter by document type
results = collection.query(
    query_embeddings=[embedding],
    where={"file_type": {"$eq": "pdf"}}
)

# Filter by custom metadata
results = collection.query(
    query_embeddings=[embedding],
    where={"category": "finance"}
)
```

### Trade-offs

⚠️ **NumPy 2.0 Incompatibility** (Current Issue):
- ChromaDB 0.4.22 requires `numpy<2.0` (uses deprecated `np.float_` alias)
- **Mitigation**: Pin `numpy>=1.26,<2.0` in requirements.txt
- **Future**: ChromaDB v0.5+ will support NumPy 2.0

⚠️ **Embedded Database Limitations**:
- Single-process access (not suitable for multi-server distributed deployments)
- **Mitigation**: ChromaDB supports client/server mode for production scale-out
- **Future**: Migrate to ChromaDB server mode if horizontal scaling needed

⚠️ **Storage Overhead**:
- Each vector (1536 dimensions float32) = ~6KB storage
- 10,000 chunks ≈ 60MB disk space
- **Mitigation**: Acceptable for R1 scope, monitor growth

⚠️ **No Built-in Hybrid Search**:
- ChromaDB focuses on vector similarity (no keyword search integration)
- **Mitigation**: Acceptable for R1 pure semantic search
- **Future**: Consider Weaviate or Qdrant for hybrid search (R2+)

### Risks

🔴 **Vendor Lock-in** (Moderate):
- ChromaDB-specific API calls throughout codebase
- **Mitigation**: VectorStoreService abstraction layer isolates ChromaDB
  ```python
  class VectorStoreService(ABC):  # Abstract interface
      async def upsert_document(...)
      async def search(...)
      async def delete_document(...)
  ```
- Migration to another vector DB requires only VectorStoreService reimplementation

🟡 **Scaling Limitations** (Low Risk for R1):
- Embedded mode suitable for 100K-1M vectors
- Concurrent writes may bottleneck at high scale
- **Mitigation**: Sufficient for R1, plan server mode migration for R2+

## Alternatives Considered

### 1. Pinecone (Cloud-Native Vector Database)

**Pros**:
- Fully managed, zero infrastructure
- Excellent performance (sub-50ms queries)
- Horizontal auto-scaling
- Production-grade reliability

**Cons**:
- ❌ $70-100/month minimum cost (free tier limited)
- ❌ Vendor lock-in (proprietary API)
- ❌ Requires internet connectivity (no offline development)
- ❌ Data egress costs for large volumes

**Verdict**: **Rejected** - Cost prohibitive for R1, prefer self-hosted for flexibility

### 2. Weaviate (Open-Source Vector Database)

**Pros**:
- ✅ Open-source, self-hosted
- ✅ Hybrid search (vector + keyword)
- ✅ GraphQL API (type-safe queries)
- ✅ Built-in text vectorization modules

**Cons**:
- ❌ Requires Docker/Kubernetes deployment (complex setup)
- ❌ Higher resource overhead (Java/Go runtime)
- ❌ Steeper learning curve (GraphQL schema design)

**Verdict**: **Rejected** - Over-engineered for R1 requirements, reconsider for R2+ if hybrid search needed

### 3. Qdrant (Rust-Based Vector Database)

**Pros**:
- ✅ Open-source, high performance (Rust)
- ✅ Rich filtering capabilities
- ✅ REST + gRPC APIs
- ✅ Production-ready clustering

**Cons**:
- ❌ Requires separate service deployment
- ❌ More complex setup than ChromaDB
- ❌ Smaller community than Chroma/Weaviate

**Verdict**: **Rejected** - Good option but unnecessary complexity for R1 embedded use case

### 4. Milvus (Cloud-Native Vector Database)

**Pros**:
- ✅ Enterprise-grade (Zilliz backing)
- ✅ Excellent scalability (billion-scale)
- ✅ Multiple index types (HNSW, IVF, etc.)

**Cons**:
- ❌ Heavy infrastructure (Kubernetes, etcd, MinIO dependencies)
- ❌ Steep learning curve
- ❌ Overkill for R1 scale (optimized for 100M+ vectors)

**Verdict**: **Rejected** - Enterprise scale requirements far exceed R1 needs

### 5. PostgreSQL with pgvector Extension

**Pros**:
- ✅ Leverage existing PostgreSQL infrastructure
- ✅ Unified database (relational + vector data)
- ✅ ACID transactions across relational and vector data

**Cons**:
- ❌ Slower vector search vs specialized vector DBs (no HNSW in pgvector 0.4.x)
- ❌ Limited to 2000 dimensions (our embeddings are 1536, OK but tight)
- ❌ Requires PostgreSQL admin expertise

**Verdict**: **Rejected** - Performance gap significant, reconsider if unified DB becomes critical

### 6. FAISS (Facebook AI Similarity Search)

**Pros**:
- ✅ Extremely fast (C++/CUDA optimized)
- ✅ Battle-tested (Meta production use)
- ✅ No external dependencies

**Cons**:
- ❌ Library, not database (no persistence layer)
- ❌ Requires manual serialization/deserialization
- ❌ No metadata filtering built-in
- ❌ Complex API for production use

**Verdict**: **Rejected** - Too low-level, ChromaDB provides better developer experience with FAISS under the hood

## Comparison Matrix

| Feature | ChromaDB | Pinecone | Weaviate | Qdrant | pgvector |
|---------|----------|----------|----------|--------|----------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Medium | ⭐⭐⭐ Medium |
| **Search Performance** | ⭐⭐⭐⭐ Fast | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐⭐ Fast | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐ Good |
| **Cost (R1 Scale)** | ⭐⭐⭐⭐⭐ Free | ⭐⭐ $70-100/mo | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐⭐ Free |
| **Developer Experience** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐ OK | ⭐⭐⭐⭐ Good | ⭐⭐⭐ OK |
| **Metadata Filtering** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ OK |
| **Production Readiness** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good | ⭐⭐⭐ OK |
| **Scalability** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Limited |

**Winner**: ChromaDB for R1 - Best balance of ease-of-use, performance, and cost

## Related Decisions

### Previous ADRs
- **[ADR-013: Docling Integration Strategy](ADR-013-docling-integration-strategy.md)** - Text extraction quality improvement (post-R1)

### Task References
- **[T-04: RAG Pipeline](../../tasks/T-04-STATUS.md)** - Parent task this ADR supports
- **[T-04-ST4: ChromaDB Integration](../../tasks/T-04-STATUS.md#R1.WP1-T04-ST4)** - Implementation subtask (completed)
- **[T-04-ST6: Search Benchmarks](../../performance/T04-ST6-SEARCH-BENCHMARK.md)** - Performance validation

### Performance Documentation
- **[PERF-004 Compliance](../../../backend/performance/T04-ST6-SEARCH-BENCHMARK.md)** - Search latency benchmarks
- **[Vector Store Integration Tests](../../../backend/tests/integration/test_vector_store.py)** - 5/5 passing tests

### Implementation Files
- **[VectorStoreService](../../../backend/app/services/vector_store_service.py)** - ChromaDB abstraction layer
- **[Configuration](../../../backend/app/core/config.py)** - ChromaDB settings (lines 187-189)
- **[Requirements](../../../backend/requirements.txt)** - chromadb==0.4.22, numpy<2.0

## Migration Path (Future)

If ChromaDB limitations become critical in R2+, migration path to alternatives:

### Phase 1: Abstract Interface (Already Done ✅)
- `VectorStoreService` class isolates ChromaDB implementation
- All code depends on abstract interface, not ChromaDB directly

### Phase 2: Implement Alternative Backend (1-2 weeks)
```python
# Example: Qdrant implementation
class QdrantVectorStore(VectorStoreService):
    async def upsert_document(...):
        # Qdrant-specific implementation

    async def search(...):
        # Qdrant-specific implementation
```

### Phase 3: Data Migration (1 day)
- Export vectors from ChromaDB
- Import to new vector database
- Parallel running for validation

### Phase 4: Switch (1 day)
- Update configuration to use new implementation
- Monitor performance and errors
- Rollback capability via feature flag

**Estimated Total Effort**: 2-3 weeks for complete migration

## Validation Results

### Integration Tests (T-04-ST4)
```bash
$ pytest backend/tests/integration/test_vector_store.py -v
✅ test_upsert_and_search_returns_results PASSED
✅ test_upsert_replaces_existing_vectors PASSED
✅ test_delete_document_removes_all_vectors PASSED
✅ test_search_respects_metadata_filters PASSED
✅ test_upsert_validates_input_lengths PASSED

5/5 tests passing | 64% coverage | 0% failure rate
```

### Performance Benchmarks (T-04-ST6)
```
ChromaDB Search Component:
- 100 vectors: 12-18ms
- 1,000 vectors: 15-22ms
- 10,000 vectors: 18-28ms ✅ Target
- 100,000 vectors: 25-45ms (projected)

Total p95 Latency (@ 10 users):
- 350ms ✅ PASS (target: <500ms)
```

### Production Readiness
- ✅ Persistent storage validated
- ✅ Concurrent access tested (10 users)
- ✅ Upsert regression test passing
- ✅ Metadata filtering functional
- ✅ Error handling comprehensive

---

**Decision Made**: October 2025
**Decision Makers**: Backend Development Team
**Review Date**: Post-R1 (after production deployment)
**Status**: ✅ **Implemented and Validated**
