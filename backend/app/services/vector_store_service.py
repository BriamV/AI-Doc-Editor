"""
Vector storage service for RAG pipeline using ChromaDB
T-04-ST4: ChromaDB vector storage integration
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.api.models.Collection import Collection

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreError(Exception):
    """Custom exception for vector store operations"""

    pass


class VectorStoreService:
    """
    Service for storing and retrieving document embeddings using ChromaDB
    Supports upsert (add/update), search, and delete operations
    """

    def __init__(
        self,
        persist_directory: Optional[str] = None,
        collection_name: Optional[str] = None,
    ):
        """
        Initialize ChromaDB vector store

        Args:
            persist_directory: Directory for persistent storage (default: from settings)
            collection_name: Name of the collection to use (default: from settings)
        """
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME

        # Initialize ChromaDB client
        try:
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True,  # Allow reset for testing
                ),
            )

            # Get or create collection with cosine similarity
            self.collection: Collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},  # Cosine similarity for search
            )

            logger.info(
                f"VectorStoreService initialized: "
                f"collection={self.collection_name}, "
                f"persist_dir={self.persist_directory}"
            )

        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB client: {str(e)}")
            raise VectorStoreError(f"ChromaDB initialization failed: {str(e)}")

    async def upsert_document(
        self,
        document_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        metadata: Dict[str, Any],
    ) -> None:
        """
        Upsert document embeddings (delete existing + insert new)
        This ensures that re-uploading a document replaces old vectors

        Args:
            document_id: Unique document identifier
            chunks: List of text chunks
            embeddings: List of embedding vectors (one per chunk)
            metadata: Document metadata (name, file_type, created_at, etc.)

        Raises:
            VectorStoreError: If upsert operation fails
        """
        if not document_id:
            raise VectorStoreError("document_id cannot be empty")

        if not chunks:
            raise VectorStoreError("chunks list cannot be empty")

        if len(chunks) != len(embeddings):
            raise VectorStoreError(
                f"Chunks count ({len(chunks)}) must match embeddings count ({len(embeddings)})"
            )

        logger.info(f"Upserting document: document_id={document_id}, chunks={len(chunks)}")

        try:
            # Step 1: Delete existing vectors for this document_id (if any)
            try:
                existing_ids = self.collection.get(where={"document_id": document_id}, include=[])
                if existing_ids and existing_ids.get("ids"):
                    self.collection.delete(where={"document_id": document_id})
                    logger.info(
                        f"Deleted {len(existing_ids['ids'])} existing vectors for document_id={document_id}"
                    )
            except Exception as exc:
                # Document doesn't exist or error getting it - that's fine, continue
                logger.debug(
                    f"No existing vectors found for document_id={document_id}", exc_info=exc
                )

            # Step 2: Insert new vectors
            ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            extra_metadata = {
                key: value
                for key, value in metadata.items()
                if key not in {"document_name", "file_type", "created_at"}
            }

            metadatas = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "document_name": metadata.get("document_name", ""),
                    "file_type": metadata.get("file_type", ""),
                    "created_at": metadata.get("created_at", datetime.utcnow().isoformat()),
                }
                chunk_metadata.update(extra_metadata)
                metadatas.append(chunk_metadata)

            self.collection.add(
                ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas
            )

            logger.info(f"Successfully upserted {len(chunks)} chunks for document_id={document_id}")

        except Exception as e:
            logger.error(f"Failed to upsert document {document_id}: {str(e)}")
            raise VectorStoreError(f"Upsert operation failed: {str(e)}")

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using query embedding

        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return (default: 5)
            filter_metadata: Optional metadata filters (e.g., {"document_id": "doc123"})

        Returns:
            List of search results with chunk_text, metadata, and similarity score

        Raises:
            VectorStoreError: If search operation fails
        """
        if not query_embedding:
            raise VectorStoreError("query_embedding cannot be empty")

        if top_k <= 0:
            raise VectorStoreError("top_k must be greater than 0")

        logger.info(f"Searching vector store: top_k={top_k}, filter={filter_metadata}")

        try:
            # Perform vector search
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_metadata,  # Optional metadata filter
                include=["documents", "metadatas", "distances"],
            )

            # Format results
            search_results = []
            if results and results.get("ids") and results["ids"][0]:
                for i in range(len(results["ids"][0])):
                    search_results.append(
                        {
                            "id": results["ids"][0][i],
                            "chunk_text": results["documents"][0][i],
                            "metadata": results["metadatas"][0][i],
                            "similarity": (
                                1 - results["distances"][0][i]
                            ),  # Convert distance to similarity
                            "distance": results["distances"][0][i],
                        }
                    )

            logger.info(f"Search complete: {len(search_results)} results found")

            return search_results

        except Exception as e:
            logger.error(f"Search operation failed: {str(e)}")
            raise VectorStoreError(f"Search failed: {str(e)}")

    async def delete_document(self, document_id: str) -> int:
        """
        Delete all vectors for a document

        Args:
            document_id: Document identifier

        Returns:
            Number of vectors deleted

        Raises:
            VectorStoreError: If delete operation fails
        """
        if not document_id:
            raise VectorStoreError("document_id cannot be empty")

        logger.info(f"Deleting document: document_id={document_id}")

        try:
            # Get existing IDs first to count them
            existing = self.collection.get(where={"document_id": document_id}, include=[])

            if not existing or not existing.get("ids"):
                logger.info(f"No vectors found for document_id={document_id}")
                return 0

            count = len(existing["ids"])

            # Delete all vectors for this document
            self.collection.delete(where={"document_id": document_id})

            logger.info(f"Deleted {count} vectors for document_id={document_id}")

            return count

        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {str(e)}")
            raise VectorStoreError(f"Delete operation failed: {str(e)}")

    def get_collection_info(self) -> Dict[str, Any]:
        """
        Get information about the vector store collection

        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.collection.count()
            metadata = self.collection.metadata

            return {
                "collection_name": self.collection_name,
                "vector_count": count,
                "metadata": metadata,
                "persist_directory": self.persist_directory,
            }

        except Exception as e:
            logger.error(f"Failed to get collection info: {str(e)}")
            return {
                "collection_name": self.collection_name,
                "error": str(e),
            }

    def reset_collection(self) -> None:
        """
        Reset the collection (delete all vectors)
        WARNING: This is destructive and should only be used for testing

        Raises:
            VectorStoreError: If reset operation fails
        """
        logger.warning(f"Resetting collection: {self.collection_name}")

        try:
            # Delete the collection and recreate it
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )

            logger.info(f"Collection {self.collection_name} reset successfully")

        except Exception as e:
            logger.error(f"Failed to reset collection: {str(e)}")
            raise VectorStoreError(f"Collection reset failed: {str(e)}")


# Global instance (can be customized per request if needed)
vector_store_service = VectorStoreService()
