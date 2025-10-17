"""
Unit tests for VectorStoreService (T-04 ST4).

Tests ChromaDB integration with proper mocking,
collection management, document operations, and querying.

Coverage areas:
- Collection management (create, get, delete, list)
- Document operations (add, update, delete, query)
- Error handling and validation
- Batch operations
"""

import pytest
from unittest.mock import Mock, patch

from app.services.vector_store_service import VectorStoreService


class TestVectorStoreServiceInitialization:
    """Test service initialization and client setup."""

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_init_with_default_directory(self, mock_persistent_client):
        """Test initialization with default persistence directory."""
        mock_client = Mock()
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()

        assert service.client == mock_client
        assert "chroma_db" in service.persist_directory
        mock_persistent_client.assert_called_once()

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_init_with_custom_directory(self, mock_persistent_client):
        """Test initialization with custom persistence directory."""
        mock_client = Mock()
        mock_persistent_client.return_value = mock_client
        custom_dir = "/custom/path/chroma"

        service = VectorStoreService(persist_directory=custom_dir)

        assert service.persist_directory == custom_dir
        assert service.client == mock_client
        mock_persistent_client.assert_called_once_with(path=custom_dir)

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_init_client_failure(self, mock_persistent_client):
        """Test initialization handles client creation failure."""
        mock_persistent_client.side_effect = Exception("ChromaDB initialization failed")

        with pytest.raises(Exception, match="ChromaDB initialization failed"):
            VectorStoreService()


class TestCollectionManagement:
    """Test collection creation, retrieval, and management."""

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_get_or_create_collection_existing(self, mock_persistent_client):
        """Test getting an existing collection."""
        mock_client = Mock()
        mock_collection = Mock()
        mock_collection.name = "test_collection"

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        collection = service.get_or_create_collection("test_collection")

        assert collection == mock_collection
        mock_client.get_collection.assert_called_once_with(name="test_collection")
        mock_client.create_collection.assert_not_called()

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_get_or_create_collection_new(self, mock_persistent_client):
        """Test creating a new collection when it doesn't exist."""
        mock_client = Mock()
        mock_collection = Mock()
        mock_collection.name = "new_collection"

        # Simulate collection not found
        mock_client.get_collection.side_effect = Exception("Collection not found")
        mock_client.create_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        collection = service.get_or_create_collection("new_collection")

        assert collection == mock_collection
        mock_client.get_collection.assert_called_once()
        mock_client.create_collection.assert_called_once_with(
            name="new_collection", metadata={"dimension": 1536, "hnsw:space": "cosine"}
        )

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_get_or_create_collection_custom_dimension(self, mock_persistent_client):
        """Test creating collection with custom embedding dimension."""
        mock_client = Mock()
        mock_collection = Mock()

        mock_client.get_collection.side_effect = Exception("Not found")
        mock_client.create_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        service.get_or_create_collection("test_collection", embedding_dimension=768)

        mock_client.create_collection.assert_called_once_with(
            name="test_collection", metadata={"dimension": 768, "hnsw:space": "cosine"}
        )

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_delete_collection(self, mock_persistent_client):
        """Test deleting a collection."""
        mock_client = Mock()
        mock_client.delete_collection.return_value = None
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        result = service.delete_collection("test_collection")

        assert result["status"] == "success"
        assert "deleted" in result["message"].lower()
        mock_client.delete_collection.assert_called_once_with(name="test_collection")

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_list_collections(self, mock_persistent_client):
        """Test listing all collections."""
        mock_client = Mock()

        # Create mock collections
        mock_col1 = Mock()
        mock_col1.name = "collection1"
        mock_col2 = Mock()
        mock_col2.name = "collection2"

        mock_client.list_collections.return_value = [mock_col1, mock_col2]
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        collections = service.list_collections()

        assert len(collections) == 2
        assert "collection1" in collections
        assert "collection2" in collections

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_get_collection_count(self, mock_persistent_client):
        """Test getting document count in collection."""
        mock_client = Mock()
        mock_collection = Mock()
        mock_collection.count.return_value = 42

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        count = service.get_collection_count("test_collection")

        assert count == 42
        mock_collection.count.assert_called_once()


class TestDocumentOperations:
    """Test document add, update, delete operations."""

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_add_documents_success(
        self, mock_persistent_client, sample_chunks, sample_embeddings, sample_metadata
    ):
        """Test successfully adding documents to collection."""
        mock_client = Mock()
        mock_collection = Mock()
        mock_collection.add.return_value = None

        mock_client.get_collection.return_value = mock_collection
        mock_client.create_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        result = service.add_documents(
            collection_name="test_collection",
            texts=sample_chunks,
            embeddings=sample_embeddings,
            metadatas=sample_metadata,
        )

        assert result["status"] == "success"
        assert result["count"] == len(sample_chunks)
        assert result["collection"] == "test_collection"
        mock_collection.add.assert_called_once()

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_add_documents_with_custom_ids(
        self, mock_persistent_client, sample_chunks, sample_embeddings, sample_metadata
    ):
        """Test adding documents with custom IDs."""
        mock_client = Mock()
        mock_collection = Mock()

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        custom_ids = ["doc1_chunk0", "doc1_chunk1", "doc1_chunk2"]

        service = VectorStoreService()
        result = service.add_documents(
            collection_name="test_collection",
            texts=sample_chunks,
            embeddings=sample_embeddings,
            metadatas=sample_metadata,
            ids=custom_ids,
        )

        assert result["status"] == "success"
        # Verify IDs were passed to collection.add
        call_args = mock_collection.add.call_args
        assert call_args.kwargs["ids"] == custom_ids

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_add_documents_generates_ids(
        self, mock_persistent_client, sample_chunks, sample_embeddings, sample_metadata
    ):
        """Test adding documents generates IDs when not provided."""
        mock_client = Mock()
        mock_collection = Mock()

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        service.add_documents(
            collection_name="test_collection",
            texts=sample_chunks,
            embeddings=sample_embeddings,
            metadatas=sample_metadata,
        )

        # Verify generated IDs were passed
        call_args = mock_collection.add.call_args
        generated_ids = call_args.kwargs["ids"]
        assert len(generated_ids) == len(sample_chunks)
        assert all(id.startswith("chunk_") for id in generated_ids)

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_add_documents_empty_inputs(self, mock_persistent_client):
        """Test add_documents fails with empty inputs."""
        mock_persistent_client.return_value = Mock()
        service = VectorStoreService()

        with pytest.raises(ValueError, match="cannot be empty"):
            service.add_documents(collection_name="test", texts=[], embeddings=[], metadatas=[])

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_add_documents_mismatched_lengths(
        self, mock_persistent_client, sample_chunks, sample_embeddings
    ):
        """Test add_documents fails with mismatched input lengths."""
        mock_persistent_client.return_value = Mock()
        service = VectorStoreService()

        # Provide fewer metadata items than texts
        mismatched_metadata = [{"test": "data"}]

        with pytest.raises(ValueError, match="Length mismatch"):
            service.add_documents(
                collection_name="test",
                texts=sample_chunks,
                embeddings=sample_embeddings,
                metadatas=mismatched_metadata,
            )

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_delete_documents(self, mock_persistent_client):
        """Test deleting specific documents by ID."""
        mock_client = Mock()
        mock_collection = Mock()
        mock_collection.delete.return_value = None

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        ids_to_delete = ["chunk_0", "chunk_1", "chunk_2"]
        result = service.delete_documents("test_collection", ids=ids_to_delete)

        assert result["status"] == "success"
        assert result["count"] == 3
        mock_collection.delete.assert_called_once_with(ids=ids_to_delete)

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_update_documents(self, mock_persistent_client):
        """Test updating existing documents."""
        mock_client = Mock()
        mock_collection = Mock()
        mock_collection.update.return_value = None

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        ids = ["chunk_0"]
        new_embeddings = [[0.5] * 1536]
        new_metadata = [{"updated": True}]

        result = service.update_documents(
            collection_name="test_collection",
            ids=ids,
            embeddings=new_embeddings,
            metadatas=new_metadata,
        )

        assert result["status"] == "success"
        assert result["count"] == 1
        mock_collection.update.assert_called_once()


class TestSimilarityQuery:
    """Test similarity search functionality."""

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_query_similar_success(self, mock_persistent_client):
        """Test successful similarity query."""
        mock_client = Mock()
        mock_collection = Mock()

        # Mock query results
        mock_collection.query.return_value = {
            "documents": [["Document 1 text", "Document 2 text"]],
            "distances": [[0.1, 0.2]],
            "metadatas": [[{"doc_id": "1"}, {"doc_id": "2"}]],
            "ids": [["chunk_0", "chunk_1"]],
        }

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        query_embedding = [0.3] * 1536

        results = service.query_similar(
            collection_name="test_collection", query_embedding=query_embedding, n_results=5
        )

        assert len(results["documents"]) == 2
        assert len(results["distances"]) == 2
        assert len(results["metadatas"]) == 2
        assert len(results["ids"]) == 2
        assert results["documents"][0] == "Document 1 text"
        assert results["distances"][0] == 0.1

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_query_similar_with_metadata_filter(self, mock_persistent_client):
        """Test similarity query with metadata filtering."""
        mock_client = Mock()
        mock_collection = Mock()

        mock_collection.query.return_value = {
            "documents": [["Filtered doc"]],
            "distances": [[0.1]],
            "metadatas": [[{"user_id": "user-123"}]],
            "ids": [["chunk_0"]],
        }

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        query_embedding = [0.3] * 1536
        metadata_filter = {"user_id": "user-123"}

        results = service.query_similar(
            collection_name="test_collection",
            query_embedding=query_embedding,
            n_results=5,
            where=metadata_filter,
        )

        assert len(results["documents"]) == 1
        # Verify filter was passed to query
        call_args = mock_collection.query.call_args
        assert call_args.kwargs["where"] == metadata_filter

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_query_similar_collection_not_found(self, mock_persistent_client):
        """Test query fails when collection doesn't exist."""
        mock_client = Mock()
        mock_client.get_collection.side_effect = Exception("Collection not found")
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        query_embedding = [0.3] * 1536

        with pytest.raises(ValueError, match="Collection .* not found"):
            service.query_similar(collection_name="nonexistent", query_embedding=query_embedding)

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_query_similar_empty_results(self, mock_persistent_client):
        """Test query with no matching results."""
        mock_client = Mock()
        mock_collection = Mock()

        # Mock empty results
        mock_collection.query.return_value = {
            "documents": [[]],
            "distances": [[]],
            "metadatas": [[]],
            "ids": [[]],
        }

        mock_client.get_collection.return_value = mock_collection
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()
        query_embedding = [0.3] * 1536

        results = service.query_similar(
            collection_name="test_collection", query_embedding=query_embedding
        )

        assert results["documents"] == []
        assert results["distances"] == []
        assert results["metadatas"] == []
        assert results["ids"] == []


class TestErrorHandling:
    """Test error handling in various operations."""

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_delete_collection_failure(self, mock_persistent_client):
        """Test delete_collection handles failures."""
        mock_client = Mock()
        mock_client.delete_collection.side_effect = Exception("Delete failed")
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()

        with pytest.raises(Exception, match="Delete failed"):
            service.delete_collection("test_collection")

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_list_collections_failure(self, mock_persistent_client):
        """Test list_collections handles failures."""
        mock_client = Mock()
        mock_client.list_collections.side_effect = Exception("List failed")
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()

        with pytest.raises(Exception, match="List failed"):
            service.list_collections()

    @patch("app.services.vector_store_service.chromadb.PersistentClient")
    def test_get_collection_count_failure(self, mock_persistent_client):
        """Test get_collection_count handles failures."""
        mock_client = Mock()
        mock_client.get_collection.side_effect = Exception("Collection not found")
        mock_persistent_client.return_value = mock_client

        service = VectorStoreService()

        with pytest.raises(Exception):
            service.get_collection_count("nonexistent")
