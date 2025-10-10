"""
RAG Processing Service - Complete Pipeline Orchestrator
T-04 ST3-ST4: RAG Pipeline Implementation

Orchestrates the complete RAG pipeline:
1. Text Extraction (from uploaded files)
2. Text Chunking (into manageable pieces)
3. Embedding Generation (OpenAI)
4. Vector Storage (ChromaDB)
5. Status Management (document processing state)
"""

import logging
from typing import Dict, Any
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.text_extraction_service import TextExtractionService
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from app.services.document_service import DocumentService

logger = logging.getLogger(__name__)


class RAGProcessingService:
    """
    Complete RAG pipeline orchestrator.

    Pipeline stages:
    1. Extract text from uploaded document
    2. Chunk text into smaller pieces
    3. Generate embeddings for each chunk
    4. Store embeddings in vector database
    5. Update document status to 'processed'
    """

    def __init__(self, api_key: str = None):
        """
        Initialize RAG processing service.

        Args:
            api_key: OpenAI API key (optional)
        """
        self.text_extractor = TextExtractionService()
        self.embedding_service = EmbeddingService(api_key=api_key)
        self.vector_store = VectorStoreService()
        self.document_service = DocumentService()

    def is_ready(self) -> Dict[str, bool]:
        """
        Check if all services are ready.

        Returns:
            Dict with service availability status
        """
        return {
            "text_extraction": True,  # Always available
            "embedding_service": self.embedding_service.is_available(),
            "vector_store": True,  # ChromaDB always available
        }

    async def process_document(
        self,
        db: AsyncSession,
        document_id: str,
        file_path: str,
        user_id: str,
        collection_name: str = "documents",
    ) -> Dict[str, Any]:
        """
        Process a document through the complete RAG pipeline.

        Args:
            db: Database session
            document_id: Document ID
            file_path: Path to the uploaded file
            user_id: User ID who uploaded the document
            collection_name: ChromaDB collection name (default: "documents")

        Returns:
            Dict with processing results and statistics

        Raises:
            ValueError: If document not found or processing fails
            Exception: If any pipeline stage fails
        """
        logger.info(f"Starting RAG processing for document: {document_id}")

        try:
            # Update status to 'processing'
            await self.document_service.update_document_status(
                db=db, document_id=document_id, status="processing"
            )

            # Stage 1: Extract text from file
            logger.info(f"[{document_id}] Stage 1: Extracting text...")
            extracted_text = self.text_extractor.extract_text(file_path)

            if not extracted_text or len(extracted_text.strip()) < 10:
                raise ValueError("Extracted text is empty or too short")

            logger.info(f"[{document_id}] Extracted {len(extracted_text)} characters from document")

            # Stage 2: Chunk text
            logger.info(f"[{document_id}] Stage 2: Chunking text...")
            chunks = self.text_extractor.chunk_text(
                text=extracted_text, chunk_size=500, chunk_overlap=50
            )

            logger.info(f"[{document_id}] Created {len(chunks)} chunks")

            # Stage 3: Generate embeddings
            logger.info(f"[{document_id}] Stage 3: Generating embeddings...")

            # Prepare metadata for each chunk
            chunk_metadatas = [
                {
                    "document_id": document_id,
                    "user_id": user_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "source_file": Path(file_path).name,
                }
                for i in range(len(chunks))
            ]

            # Generate embeddings
            embeddings_data = self.embedding_service.generate_embeddings(
                texts=chunks, metadata=chunk_metadatas
            )

            logger.info(f"[{document_id}] Generated {len(embeddings_data)} embeddings")

            # Stage 4: Store in vector database
            logger.info(f"[{document_id}] Stage 4: Storing in vector database...")

            # Prepare data for ChromaDB
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            embeddings_vectors = [data["embedding"] for data in embeddings_data]
            metadatas = [data["metadata"] for data in embeddings_data]

            # Add to vector store
            store_result = self.vector_store.add_documents(
                collection_name=collection_name,
                texts=chunks,
                embeddings=embeddings_vectors,
                metadatas=metadatas,
                ids=chunk_ids,
            )

            logger.info(f"[{document_id}] Stored {store_result['count']} chunks in vector DB")

            # Stage 5: Update document status
            logger.info(f"[{document_id}] Stage 5: Updating document status...")

            await self.document_service.update_document_status(
                db=db,
                document_id=document_id,
                status="processed",
                metadata={
                    "chunks_count": len(chunks),
                    "embeddings_count": len(embeddings_data),
                    "collection": collection_name,
                    "model": self.embedding_service.model,
                },
            )

            logger.info(f"[{document_id}] RAG processing completed successfully")

            return {
                "status": "success",
                "document_id": document_id,
                "chunks_created": len(chunks),
                "embeddings_generated": len(embeddings_data),
                "vectors_stored": store_result["count"],
                "collection": collection_name,
            }

        except Exception as e:
            logger.error(f"[{document_id}] RAG processing failed: {str(e)}")

            # Update status to 'failed'
            try:
                await self.document_service.update_document_status(
                    db=db,
                    document_id=document_id,
                    status="failed",
                    metadata={"error": str(e)},
                )
            except Exception as update_error:
                logger.error(f"Failed to update document status: {str(update_error)}")

            raise

    async def query_similar_documents(
        self,
        query_text: str,
        collection_name: str = "documents",
        n_results: int = 5,
        user_id: str = None,
    ) -> Dict[str, Any]:
        """
        Query for similar document chunks.

        Args:
            query_text: Text to search for
            collection_name: ChromaDB collection to search
            n_results: Number of results to return
            user_id: Optional user ID to filter results

        Returns:
            Dict with query results

        Raises:
            ValueError: If query is invalid or service not available
        """
        if not self.embedding_service.is_available():
            raise ValueError("Embedding service not available (API key not configured)")

        # Generate embedding for query
        query_embedding = self.embedding_service.generate_embedding(query_text)

        # Build metadata filter
        where_filter = {"user_id": user_id} if user_id else None

        # Query vector store
        results = self.vector_store.query_similar(
            collection_name=collection_name,
            query_embedding=query_embedding,
            n_results=n_results,
            where=where_filter,
        )

        return {
            "query": query_text,
            "results_count": len(results["documents"]),
            "chunks": [
                {
                    "text": doc,
                    "distance": dist,
                    "metadata": meta,
                    "id": chunk_id,
                }
                for doc, dist, meta, chunk_id in zip(
                    results["documents"],
                    results["distances"],
                    results["metadatas"],
                    results["ids"],
                )
            ],
        }

    async def delete_document_vectors(
        self, document_id: str, collection_name: str = "documents"
    ) -> Dict[str, Any]:
        """
        Delete all vectors associated with a document.

        Args:
            document_id: Document ID
            collection_name: ChromaDB collection name

        Returns:
            Dict with deletion status
        """
        try:
            # Find all chunk IDs for this document
            # ChromaDB doesn't support direct query by metadata, so we need to get all and filter
            # For now, we'll use the known pattern: {document_id}_chunk_{i}

            # Get collection count to estimate chunks
            try:
                count = self.vector_store.get_collection_count(collection_name)
                # Generate potential IDs (this is a limitation of current ChromaDB interface)
                # In production, you might want to store chunk IDs in your database
                potential_ids = [f"{document_id}_chunk_{i}" for i in range(count)]

                # Try to delete (ChromaDB will ignore non-existent IDs)
                result = self.vector_store.delete_documents(
                    collection_name=collection_name, ids=potential_ids
                )

                logger.info(f"Deleted vectors for document: {document_id}")
                return result

            except Exception as e:
                logger.warning(f"Could not delete vectors for {document_id}: {str(e)}")
                return {"status": "partial", "message": str(e)}

        except Exception as e:
            logger.error(f"Failed to delete vectors for {document_id}: {str(e)}")
            raise

    def get_processing_stats(self, collection_name: str = "documents") -> Dict[str, Any]:
        """
        Get statistics about the RAG pipeline.

        Args:
            collection_name: ChromaDB collection name

        Returns:
            Dict with processing statistics
        """
        try:
            collections = self.vector_store.list_collections()
            collection_stats = {}

            if collection_name in collections:
                count = self.vector_store.get_collection_count(collection_name)
                collection_stats[collection_name] = {"document_count": count}

            return {
                "services_ready": self.is_ready(),
                "collections": collections,
                "collection_stats": collection_stats,
                "embedding_model": self.embedding_service.model,
                "embedding_dimensions": self.embedding_service.get_embedding_dimensions(),
            }

        except Exception as e:
            logger.error(f"Failed to get processing stats: {str(e)}")
            raise
