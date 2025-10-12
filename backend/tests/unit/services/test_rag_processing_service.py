"""
Unit tests for RAGProcessingService (T-04 ST3-ST4).

Tests the complete RAG pipeline orchestration with mocked dependencies,
ensuring proper integration of text extraction, embedding, and vector storage.

Coverage areas:
- Service initialization and readiness checks
- Document processing pipeline (extract → chunk → embed → store)
- Query similar documents
- Error handling and status management
- Pipeline coordination
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path

from app.services.rag_processing_service import RAGProcessingService


class TestRAGProcessingServiceInitialization:
    """Test service initialization and readiness checks."""

    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    def test_init_with_api_key(
        self,
        mock_doc_service,
        mock_vector_store,
        mock_embedding_service,
        mock_text_extractor,
    ):
        """Test initialization with user API key."""
        service = RAGProcessingService(api_key="test-key")

        # Verify all services were initialized
        mock_text_extractor.assert_called_once()
        mock_embedding_service.assert_called_once_with(api_key="test-key")
        mock_vector_store.assert_called_once()
        mock_doc_service.assert_called_once()

    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    def test_init_without_api_key(
        self,
        mock_doc_service,
        mock_vector_store,
        mock_embedding_service,
        mock_text_extractor,
    ):
        """Test initialization without API key (uses global key)."""
        service = RAGProcessingService()

        mock_embedding_service.assert_called_once_with(api_key=None)

    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    def test_is_ready_all_available(
        self,
        mock_doc_service,
        mock_vector_store,
        mock_embedding_service,
        mock_text_extractor,
    ):
        """Test is_ready returns True when all services available."""
        mock_embedding_instance = Mock()
        mock_embedding_instance.is_available.return_value = True
        mock_embedding_service.return_value = mock_embedding_instance

        service = RAGProcessingService()
        status = service.is_ready()

        assert status["text_extraction"] is True
        assert status["embedding_service"] is True
        assert status["vector_store"] is True

    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    def test_is_ready_embedding_unavailable(
        self,
        mock_doc_service,
        mock_vector_store,
        mock_embedding_service,
        mock_text_extractor,
    ):
        """Test is_ready shows embedding service unavailable."""
        mock_embedding_instance = Mock()
        mock_embedding_instance.is_available.return_value = False
        mock_embedding_service.return_value = mock_embedding_instance

        service = RAGProcessingService()
        status = service.is_ready()

        assert status["text_extraction"] is True
        assert status["embedding_service"] is False
        assert status["vector_store"] is True


class TestDocumentProcessingPipeline:
    """Test the complete document processing pipeline."""

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_process_document_success(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test successful document processing through complete pipeline."""
        # Setup mocks
        mock_text_extractor = Mock()
        mock_text_extractor.extract_text.return_value = "Sample document text " * 100
        mock_text_extractor.chunk_text.return_value = [
            "Chunk 1 text",
            "Chunk 2 text",
            "Chunk 3 text",
        ]
        mock_text_extractor_class.return_value = mock_text_extractor

        mock_embedding_service = Mock()
        mock_embedding_service.model = "text-embedding-3-small"
        mock_embedding_service.generate_embeddings.return_value = [
            {"embedding": [0.1] * 1536, "metadata": {"chunk_index": 0}},
            {"embedding": [0.2] * 1536, "metadata": {"chunk_index": 1}},
            {"embedding": [0.3] * 1536, "metadata": {"chunk_index": 2}},
        ]
        mock_embedding_service_class.return_value = mock_embedding_service

        mock_vector_store = Mock()
        mock_vector_store.add_documents.return_value = {"count": 3}
        mock_vector_store_class.return_value = mock_vector_store

        mock_doc_service = Mock()
        mock_doc_service.update_document_status = AsyncMock()
        mock_doc_service_class.return_value = mock_doc_service

        # Create service and process document
        service = RAGProcessingService(api_key="test-key")
        mock_db = MagicMock()

        result = await service.process_document(
            db=mock_db,
            document_id="doc-123",
            file_path="/path/to/file.pdf",
            user_id="user-456",
            collection_name="test_collection",
        )

        # Verify result
        assert result["status"] == "success"
        assert result["document_id"] == "doc-123"
        assert result["chunks_created"] == 3
        assert result["embeddings_generated"] == 3
        assert result["vectors_stored"] == 3
        assert result["collection"] == "test_collection"

        # Verify pipeline stages were called
        mock_text_extractor.extract_text.assert_called_once()
        mock_text_extractor.chunk_text.assert_called_once()
        mock_embedding_service.generate_embeddings.assert_called_once()
        mock_vector_store.add_documents.assert_called_once()

        # Verify status updates
        assert mock_doc_service.update_document_status.call_count == 2
        # First call: status="processing"
        first_call = mock_doc_service.update_document_status.call_args_list[0]
        assert first_call.kwargs["status"] == "processing"
        # Second call: status="processed"
        second_call = mock_doc_service.update_document_status.call_args_list[1]
        assert second_call.kwargs["status"] == "processed"

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_process_document_extraction_failure(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test pipeline handles extraction failures."""
        mock_text_extractor = Mock()
        mock_text_extractor.extract_text.side_effect = Exception("Extraction failed")
        mock_text_extractor_class.return_value = mock_text_extractor

        mock_embedding_service_class.return_value = Mock()
        mock_vector_store_class.return_value = Mock()

        mock_doc_service = Mock()
        mock_doc_service.update_document_status = AsyncMock()
        mock_doc_service_class.return_value = mock_doc_service

        service = RAGProcessingService()
        mock_db = MagicMock()

        with pytest.raises(Exception, match="Extraction failed"):
            await service.process_document(
                db=mock_db,
                document_id="doc-123",
                file_path="/path/to/file.pdf",
                user_id="user-456",
            )

        # Verify status was updated to 'failed'
        final_call = mock_doc_service.update_document_status.call_args_list[-1]
        assert final_call.kwargs["status"] == "failed"

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_process_document_empty_text(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test pipeline rejects empty extracted text."""
        mock_text_extractor = Mock()
        mock_text_extractor.extract_text.return_value = ""  # Empty text
        mock_text_extractor_class.return_value = mock_text_extractor

        mock_embedding_service_class.return_value = Mock()
        mock_vector_store_class.return_value = Mock()

        mock_doc_service = Mock()
        mock_doc_service.update_document_status = AsyncMock()
        mock_doc_service_class.return_value = mock_doc_service

        service = RAGProcessingService()
        mock_db = MagicMock()

        with pytest.raises(ValueError, match="Extracted text is empty"):
            await service.process_document(
                db=mock_db,
                document_id="doc-123",
                file_path="/path/to/file.pdf",
                user_id="user-456",
            )


class TestQuerySimilarDocuments:
    """Test querying for similar document chunks."""

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_query_similar_documents_success(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test successful similarity query."""
        mock_text_extractor_class.return_value = Mock()

        mock_embedding_service = Mock()
        mock_embedding_service.is_available.return_value = True
        mock_embedding_service.generate_embedding.return_value = [0.3] * 1536
        mock_embedding_service_class.return_value = mock_embedding_service

        mock_vector_store = Mock()
        mock_vector_store.query_similar.return_value = {
            "documents": ["Doc 1 text", "Doc 2 text"],
            "distances": [0.1, 0.2],
            "metadatas": [{"doc_id": "1"}, {"doc_id": "2"}],
            "ids": ["chunk_0", "chunk_1"],
        }
        mock_vector_store_class.return_value = mock_vector_store

        mock_doc_service_class.return_value = Mock()

        service = RAGProcessingService(api_key="test-key")

        results = await service.query_similar_documents(
            query_text="Search query", collection_name="test_collection", n_results=5
        )

        assert results["query"] == "Search query"
        assert results["results_count"] == 2
        assert len(results["chunks"]) == 2
        assert results["chunks"][0]["text"] == "Doc 1 text"
        assert results["chunks"][0]["distance"] == 0.1

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_query_similar_documents_with_user_filter(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test similarity query with user ID filtering."""
        mock_text_extractor_class.return_value = Mock()

        mock_embedding_service = Mock()
        mock_embedding_service.is_available.return_value = True
        mock_embedding_service.generate_embedding.return_value = [0.3] * 1536
        mock_embedding_service_class.return_value = mock_embedding_service

        mock_vector_store = Mock()
        mock_vector_store.query_similar.return_value = {
            "documents": ["User doc"],
            "distances": [0.1],
            "metadatas": [{"user_id": "user-123"}],
            "ids": ["chunk_0"],
        }
        mock_vector_store_class.return_value = mock_vector_store

        mock_doc_service_class.return_value = Mock()

        service = RAGProcessingService(api_key="test-key")

        results = await service.query_similar_documents(
            query_text="Search query", user_id="user-123"
        )

        # Verify user filter was passed to vector store
        call_args = mock_vector_store.query_similar.call_args
        assert call_args.kwargs["where"] == {"user_id": "user-123"}

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_query_similar_documents_service_unavailable(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test query fails when embedding service unavailable."""
        mock_text_extractor_class.return_value = Mock()

        mock_embedding_service = Mock()
        mock_embedding_service.is_available.return_value = False
        mock_embedding_service_class.return_value = mock_embedding_service

        mock_vector_store_class.return_value = Mock()
        mock_doc_service_class.return_value = Mock()

        service = RAGProcessingService()

        with pytest.raises(ValueError, match="Embedding service not available"):
            await service.query_similar_documents(query_text="Search query")


class TestDeleteDocumentVectors:
    """Test deletion of document vectors."""

    @pytest.mark.asyncio
    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    async def test_delete_document_vectors_success(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test successful deletion of document vectors."""
        mock_text_extractor_class.return_value = Mock()
        mock_embedding_service_class.return_value = Mock()

        mock_vector_store = Mock()
        mock_vector_store.get_collection_count.return_value = 100
        mock_vector_store.delete_documents.return_value = {"status": "success", "count": 10}
        mock_vector_store_class.return_value = mock_vector_store

        mock_doc_service_class.return_value = Mock()

        service = RAGProcessingService()

        result = await service.delete_document_vectors(
            document_id="doc-123", collection_name="test_collection"
        )

        assert result["status"] == "success"
        mock_vector_store.delete_documents.assert_called_once()


class TestGetProcessingStats:
    """Test retrieval of processing statistics."""

    @patch("app.services.rag_processing_service.TextExtractionService")
    @patch("app.services.rag_processing_service.EmbeddingService")
    @patch("app.services.rag_processing_service.VectorStoreService")
    @patch("app.services.rag_processing_service.DocumentService")
    def test_get_processing_stats(
        self,
        mock_doc_service_class,
        mock_vector_store_class,
        mock_embedding_service_class,
        mock_text_extractor_class,
    ):
        """Test getting RAG pipeline statistics."""
        mock_text_extractor_class.return_value = Mock()

        mock_embedding_service = Mock()
        mock_embedding_service.is_available.return_value = True
        mock_embedding_service.model = "text-embedding-3-small"
        mock_embedding_service.get_embedding_dimensions.return_value = 1536
        mock_embedding_service_class.return_value = mock_embedding_service

        mock_vector_store = Mock()
        mock_vector_store.list_collections.return_value = ["documents", "archive"]
        mock_vector_store.get_collection_count.return_value = 42
        mock_vector_store_class.return_value = mock_vector_store

        mock_doc_service_class.return_value = Mock()

        service = RAGProcessingService(api_key="test-key")

        stats = service.get_processing_stats(collection_name="documents")

        assert "services_ready" in stats
        assert stats["services_ready"]["embedding_service"] is True
        assert "collections" in stats
        assert "documents" in stats["collections"]
        assert stats["embedding_model"] == "text-embedding-3-small"
        assert stats["embedding_dimensions"] == 1536
        assert "collection_stats" in stats
        assert stats["collection_stats"]["documents"]["document_count"] == 42
