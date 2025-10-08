"""
Integration tests for VectorStoreService
T-04-ST4: Validate ChromaDB upsert/search/delete operations and metadata handling
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4
import os

import pytest

os.environ.setdefault("CHROMA_TELEMETRY", "false")

from app.services.vector_store_service import VectorStoreService, VectorStoreError


@pytest.fixture()
def vector_store(tmp_path):
    """Provide isolated VectorStoreService instance backed by temporary storage"""
    persist_dir = tmp_path / "chromadb"
    persist_dir.mkdir()
    collection_name = f"test_vector_store_{uuid4().hex}"
    service = VectorStoreService(
        persist_directory=str(persist_dir),
        collection_name=collection_name,
    )

    yield service

    try:
        service.client.delete_collection(name=service.collection_name)
    except Exception:
        # Collection might already be deleted by the test; ignore cleanup errors
        pass


@pytest.mark.asyncio
async def test_upsert_and_search_returns_results(vector_store):
    """Upserting embeddings stores vectors and makes them searchable"""
    document_id = "doc-integrated-001"
    chunks = ["First chunk of text", "Second chunk of text"]
    embeddings = [
        [0.1, 0.2, 0.3, 0.4],
        [0.4, 0.3, 0.2, 0.1],
    ]
    metadata = {
        "document_name": "integration.pdf",
        "file_type": "pdf",
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    await vector_store.upsert_document(document_id, chunks, embeddings, metadata)

    results = await vector_store.search(embeddings[0], top_k=2)

    assert len(results) == 2
    for result in results:
        assert result["metadata"]["document_id"] == document_id
        assert result["metadata"]["document_name"] == metadata["document_name"]
        assert result["chunk_text"] in chunks


@pytest.mark.asyncio
async def test_upsert_replaces_existing_vectors(vector_store):
    """Re-uploading a document replaces stale vectors in the collection"""
    document_id = "doc-replace-001"
    initial_chunks = ["Old chunk A", "Old chunk B"]
    initial_embeddings = [
        [0.05, 0.1, 0.15, 0.2],
        [0.2, 0.15, 0.1, 0.05],
    ]
    updated_chunks = ["New chunk only"]
    updated_embeddings = [[0.9, 0.7, 0.5, 0.3]]

    await vector_store.upsert_document(
        document_id,
        initial_chunks,
        initial_embeddings,
        {
            "document_name": "old.docx",
            "file_type": "docx",
            "uploaded_at": datetime.utcnow().isoformat(),
        },
    )

    stored = vector_store.collection.get(where={"document_id": document_id}, include=[])
    assert len(stored["ids"]) == 2

    await vector_store.upsert_document(
        document_id,
        updated_chunks,
        updated_embeddings,
        {
            "document_name": "updated.docx",
            "file_type": "docx",
            "uploaded_at": datetime.utcnow().isoformat(),
        },
    )

    replaced = vector_store.collection.get(where={"document_id": document_id}, include=[])
    assert len(replaced["ids"]) == 1
    assert replaced["ids"][0] == f"{document_id}_chunk_0"

    updated_results = await vector_store.search(updated_embeddings[0], top_k=2)

    assert len(updated_results) == 1
    assert updated_results[0]["chunk_text"] == updated_chunks[0]
    assert updated_results[0]["metadata"]["chunk_index"] == 0


@pytest.mark.asyncio
async def test_delete_document_removes_all_vectors(vector_store):
    """Deleting a document clears all associated vectors"""
    document_id = "doc-delete-001"
    chunks = ["Vector A", "Vector B", "Vector C"]
    embeddings = [
        [0.11, 0.22, 0.33, 0.44],
        [0.44, 0.33, 0.22, 0.11],
        [0.21, 0.31, 0.41, 0.51],
    ]

    await vector_store.upsert_document(
        document_id,
        chunks,
        embeddings,
        {
            "document_name": "delete.md",
            "file_type": "md",
            "uploaded_at": datetime.utcnow().isoformat(),
        },
    )

    deleted_count = await vector_store.delete_document(document_id)

    assert deleted_count == len(chunks)
    remaining = vector_store.collection.get(where={"document_id": document_id}, include=[])
    assert not remaining.get("ids")


@pytest.mark.asyncio
async def test_search_respects_metadata_filters(vector_store):
    """Metadata filters limit search results to matching documents"""
    finance_id = "doc-finance-001"
    legal_id = "doc-legal-001"

    await vector_store.upsert_document(
        finance_id,
        ["Quarterly financial report"],
        [[0.6, 0.6, 0.6, 0.6]],
        {
            "document_name": "finance.pdf",
            "file_type": "pdf",
            "uploaded_at": datetime.utcnow().isoformat(),
            "category": "finance",
        },
    )

    await vector_store.upsert_document(
        legal_id,
        ["Legal compliance guidelines"],
        [[0.1, 0.2, 0.3, 0.4]],
        {
            "document_name": "legal.docx",
            "file_type": "docx",
            "uploaded_at": datetime.utcnow().isoformat(),
            "category": "legal",
        },
    )

    finance_probe = await vector_store.search(
        [0.6, 0.6, 0.6, 0.6],
        top_k=2,
    )
    assert any(result["metadata"].get("category") == "finance" for result in finance_probe)

    finance_results = await vector_store.search(
        [0.6, 0.6, 0.6, 0.6],
        top_k=2,
        filter_metadata={"category": {"$eq": "finance"}},
    )

    assert finance_results
    assert all(result["metadata"].get("category") == "finance" for result in finance_results)


@pytest.mark.asyncio
async def test_upsert_validates_input_lengths(vector_store):
    """Chunks and embeddings must have the same length"""
    with pytest.raises(VectorStoreError) as exc_info:
        await vector_store.upsert_document(
            "doc-error-001",
            ["Only one chunk"],
            [[0.1, 0.2, 0.3, 0.4], [0.4, 0.3, 0.2, 0.1]],
            {
                "document_name": "error.pdf",
                "file_type": "pdf",
                "uploaded_at": datetime.utcnow().isoformat(),
            },
        )

    assert "must match" in str(exc_info.value)
