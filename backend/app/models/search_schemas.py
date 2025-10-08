"""Pydantic schemas for vector search endpoints (T-04-ST6)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class VectorSearchQuery(BaseModel):
    """Request payload for vector search."""

    query_embedding: Optional[List[float]] = Field(
        default=None,
        description="Embedding vector to use for similarity search (min length: 1).",
    )
    query_text: Optional[str] = Field(
        default=None,
        description="Raw text query. Requires OpenAI embeddings to be configured on the backend.",
    )
    top_k: int = Field(default=5, ge=1, le=50, description="Maximum number of results to return.")
    filter_metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata filter passed directly to the vector store.",
    )

    @field_validator("query_embedding")
    @classmethod
    def validate_embedding_length(cls, v):
        if v is not None and len(v) < 1:
            raise ValueError("query_embedding must have at least 1 element")
        return v

    @field_validator("query_text")
    @classmethod
    def validate_query_sources(cls, v, info):
        embedding = info.data.get("query_embedding")
        if not embedding and not v:
            raise ValueError("Either query_embedding or query_text must be provided")
        return v


class VectorSearchResult(BaseModel):
    """Single search result item."""

    id: str
    chunk_text: str
    metadata: Dict[str, Any]
    similarity: Optional[float] = None
    distance: Optional[float] = None


class VectorSearchResponse(BaseModel):
    """Response payload for vector search."""

    results: List[VectorSearchResult]
    took_ms: float = Field(
        ..., description="Approximate server-side processing time in milliseconds."
    )
