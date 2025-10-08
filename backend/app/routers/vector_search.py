"""Vector search endpoints for RAG queries (T-04-ST6)."""

from __future__ import annotations

import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.search_schemas import (
    VectorSearchQuery,
    VectorSearchResponse,
    VectorSearchResult,
)
from app.services.auth import User, get_current_user
from app.services.embedding_service import EmbeddingError, EmbeddingService, embedding_service
from app.services.vector_store_service import (
    VectorStoreError,
    VectorStoreService,
    vector_store_service,
)

router = APIRouter()


def get_vector_store_service() -> VectorStoreService:
    """Dependency helper to allow test overrides."""

    return vector_store_service


def get_embedding_service() -> EmbeddingService:
    """Dependency helper for embedding generation."""

    return embedding_service


@router.post(
    "/vector-search",
    response_model=VectorSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search vector store",
    description="""
    Perform similarity search over the vector store using an embedding vector or raw query text.

    - If `query_embedding` is provided, it is used directly.
    - Otherwise, `query_text` is embedded via OpenAI before querying the vector store.
    """,
)
async def vector_search(
    payload: VectorSearchQuery,
    current_user: User = Depends(get_current_user),  # noqa: ARG001 - enforced for access control
    store: VectorStoreService = Depends(get_vector_store_service),
    embedder: EmbeddingService = Depends(get_embedding_service),
) -> VectorSearchResponse:
    start_time = time.perf_counter()

    # Determine embedding source
    embedding: List[float]
    if payload.query_embedding is not None:
        embedding = list(payload.query_embedding)
    else:
        try:
            embedding = await embedder.generate_embedding(payload.query_text or "")
        except EmbeddingError as exc:  # pragma: no cover - network/API errors handled here
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

    try:
        results = await store.search(
            query_embedding=embedding,
            top_k=payload.top_k,
            filter_metadata=payload.filter_metadata,
        )
    except VectorStoreError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    took_ms = (time.perf_counter() - start_time) * 1000
    api_results = [VectorSearchResult(**item) for item in results]

    return VectorSearchResponse(results=api_results, took_ms=round(took_ms, 2))
