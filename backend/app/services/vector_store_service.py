"""
Vector Store Service for RAG Pipeline
T-04 ST4: ChromaDB Integration

Manages vector storage and retrieval using ChromaDB.
Handles collection management, document indexing, and similarity search.
"""

import logging
from typing import List, Dict, Any
from pathlib import Path
import chromadb

logger = logging.getLogger(__name__)


class VectorStoreService:
    """
    Service for managing vector storage with ChromaDB.

    Features:
    - Persistent storage in local directory
    - Collection management (create, get, delete)
    - Document indexing with metadata
    - Similarity search with filters
    - Batch operations for efficiency
    """

    def __init__(self, persist_directory: str = None):
        """
        Initialize vector store service.

        Args:
            persist_directory: Directory for persistent storage (default: ./chroma_db)
        """
        if persist_directory is None:
            # Use backend/chroma_db by default
            persist_directory = str(Path(__file__).parent.parent.parent / "chroma_db")

        self.persist_directory = persist_directory
        self.client = self._initialize_client()
        logger.info(f"ChromaDB initialized with persistence at: {persist_directory}")

    def _initialize_client(self) -> chromadb.Client:
        """Initialize ChromaDB client with persistence."""
        try:
            # Create persistent client using new API
            client = chromadb.PersistentClient(path=self.persist_directory)
            return client
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB client: {str(e)}")
            raise

    def get_or_create_collection(
        self, collection_name: str, embedding_dimension: int = 1536
    ) -> Any:
        """
        Get existing collection or create new one.

        Args:
            collection_name: Name of the collection
            embedding_dimension: Dimension of embeddings (default: 1536 for text-embedding-3-small)

        Returns:
            ChromaDB collection object
        """
        try:
            # Try to get existing collection
            collection = self.client.get_collection(name=collection_name)
            logger.info(f"Retrieved existing collection: {collection_name}")
            return collection
        except Exception:
            # Create new collection if it doesn't exist
            collection = self.client.create_collection(
                name=collection_name,
                metadata={"dimension": embedding_dimension, "hnsw:space": "cosine"},
            )
            logger.info(f"Created new collection: {collection_name}")
            return collection

    def add_documents(
        self,
        collection_name: str,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str] = None,
    ) -> Dict[str, Any]:
        """
        Add documents to collection.

        Args:
            collection_name: Name of the collection
            texts: List of text chunks
            embeddings: List of embedding vectors
            metadatas: List of metadata dicts for each chunk
            ids: Optional list of IDs (generated if not provided)

        Returns:
            Dict with operation status and count

        Raises:
            ValueError: If inputs are invalid or mismatched
        """
        if not texts or not embeddings or not metadatas:
            raise ValueError("texts, embeddings, and metadatas cannot be empty")

        if not (len(texts) == len(embeddings) == len(metadatas)):
            raise ValueError(
                f"Length mismatch: texts={len(texts)}, "
                f"embeddings={len(embeddings)}, metadatas={len(metadatas)}"
            )

        # Generate IDs if not provided
        if ids is None:
            ids = [f"chunk_{i}" for i in range(len(texts))]

        if len(ids) != len(texts):
            raise ValueError(f"IDs length ({len(ids)}) doesn't match texts ({len(texts)})")

        collection = self.get_or_create_collection(collection_name)

        try:
            # Add documents to collection
            collection.add(documents=texts, embeddings=embeddings, metadatas=metadatas, ids=ids)

            logger.info(f"Added {len(texts)} documents to collection: {collection_name}")

            return {"status": "success", "count": len(texts), "collection": collection_name}

        except Exception as e:
            logger.error(f"Failed to add documents to {collection_name}: {str(e)}")
            raise

    def query_similar(
        self,
        collection_name: str,
        query_embedding: List[float],
        n_results: int = 5,
        where: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Query for similar documents.

        Args:
            collection_name: Name of the collection
            query_embedding: Query vector
            n_results: Number of results to return
            where: Optional metadata filters

        Returns:
            Dict with query results including documents, distances, and metadatas

        Raises:
            ValueError: If collection doesn't exist or query is invalid
        """
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception as e:
            raise ValueError(f"Collection '{collection_name}' not found") from e

        try:
            results = collection.query(
                query_embeddings=[query_embedding], n_results=n_results, where=where
            )

            logger.info(
                f"Query returned {len(results['documents'][0])} results from {collection_name}"
            )

            return {
                "documents": results["documents"][0] if results["documents"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "ids": results["ids"][0] if results["ids"] else [],
            }

        except Exception as e:
            logger.error(f"Query failed on {collection_name}: {str(e)}")
            raise

    def delete_collection(self, collection_name: str) -> Dict[str, str]:
        """
        Delete a collection.

        Args:
            collection_name: Name of the collection to delete

        Returns:
            Dict with status message
        """
        try:
            self.client.delete_collection(name=collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            return {"status": "success", "message": f"Collection '{collection_name}' deleted"}
        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {str(e)}")
            raise

    def list_collections(self) -> List[str]:
        """
        List all collections.

        Returns:
            List of collection names
        """
        try:
            collections = self.client.list_collections()
            collection_names = [col.name for col in collections]
            logger.info(f"Found {len(collection_names)} collections")
            return collection_names
        except Exception as e:
            logger.error(f"Failed to list collections: {str(e)}")
            raise

    def get_collection_count(self, collection_name: str) -> int:
        """
        Get number of documents in collection.

        Args:
            collection_name: Name of the collection

        Returns:
            Number of documents in collection
        """
        try:
            collection = self.client.get_collection(name=collection_name)
            count = collection.count()
            logger.info(f"Collection '{collection_name}' has {count} documents")
            return count
        except Exception as e:
            logger.error(f"Failed to get count for {collection_name}: {str(e)}")
            raise

    def delete_documents(self, collection_name: str, ids: List[str]) -> Dict[str, Any]:
        """
        Delete specific documents from collection.

        Args:
            collection_name: Name of the collection
            ids: List of document IDs to delete

        Returns:
            Dict with status and count
        """
        try:
            collection = self.client.get_collection(name=collection_name)
            collection.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} documents from {collection_name}")
            return {"status": "success", "count": len(ids)}
        except Exception as e:
            logger.error(f"Failed to delete documents from {collection_name}: {str(e)}")
            raise

    def update_documents(
        self,
        collection_name: str,
        ids: List[str],
        embeddings: List[List[float]] = None,
        metadatas: List[Dict[str, Any]] = None,
        documents: List[str] = None,
    ) -> Dict[str, Any]:
        """
        Update existing documents in collection.

        Args:
            collection_name: Name of the collection
            ids: List of document IDs to update
            embeddings: Optional new embeddings
            metadatas: Optional new metadata
            documents: Optional new document texts

        Returns:
            Dict with status and count
        """
        try:
            collection = self.client.get_collection(name=collection_name)
            collection.update(
                ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents
            )
            logger.info(f"Updated {len(ids)} documents in {collection_name}")
            return {"status": "success", "count": len(ids)}
        except Exception as e:
            logger.error(f"Failed to update documents in {collection_name}: {str(e)}")
            raise
