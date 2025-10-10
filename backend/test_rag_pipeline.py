"""
Test RAG Pipeline - Complete End-to-End Test
Tests all RAG services: TextExtraction → Embedding → VectorStore
"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.text_extraction_service import TextExtractionService
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from app.services.rag_processing_service import RAGProcessingService


async def test_text_extraction():
    """Test text extraction service."""
    print("\n=== Testing Text Extraction Service ===")

    service = TextExtractionService()

    # Test with a simple markdown text
    test_text = """
    # Test Document

    This is a test document for RAG pipeline.
    It contains multiple paragraphs to test chunking.

    ## Section 1
    This is section one with some content.

    ## Section 2
    This is section two with more content.
    """

    # Save as temporary file
    temp_file = Path("test_temp.md")
    temp_file.write_text(test_text)

    try:
        # Extract text
        extracted = await service.extract_text(Path(temp_file), file_type="md")
        print(f"[OK] Extracted {len(extracted)} characters")

        # Chunk text
        chunks = service.chunk_text(extracted, chunk_size=100, overlap=20)
        print(f"[OK] Created {len(chunks)} chunks")

        for i, chunk in enumerate(chunks[:3]):
            print(f"  Chunk {i + 1}: {chunk[:50]}...")

        return True
    finally:
        temp_file.unlink()


def test_embedding_service():
    """Test embedding service."""
    print("\n=== Testing Embedding Service ===")

    service = EmbeddingService()

    if not service.is_available():
        print("[WARN] Embedding service not available (API key not configured)")
        print("  Set OPENAI_API_KEY environment variable to test embeddings")
        return False

    # Test embedding generation
    test_texts = [
        "This is a test sentence for embedding.",
        "Another test sentence with different content.",
    ]

    try:
        embeddings = service.generate_embeddings(test_texts)
        print(f"[OK] Generated {len(embeddings)} embeddings")
        print(f"[OK] Embedding dimension: {embeddings[0]['dimensions']}")
        print(f"[OK] Model: {embeddings[0]['model']}")

        return True
    except Exception as e:
        print(f"[FAIL] Embedding generation failed: {str(e)}")
        return False


def test_vector_store():
    """Test vector store service."""
    print("\n=== Testing Vector Store Service ===")

    service = VectorStoreService()

    # Create test collection
    collection_name = "test_collection"

    try:
        # Clean up if exists
        try:
            service.delete_collection(collection_name)
        except Exception:
            pass

        # Add documents
        test_texts = ["First document", "Second document", "Third document"]
        test_embeddings = [
            [0.1] * 1536,  # Mock embeddings
            [0.2] * 1536,
            [0.3] * 1536,
        ]
        test_metadatas = [
            {"source": "test1"},
            {"source": "test2"},
            {"source": "test3"},
        ]

        result = service.add_documents(
            collection_name=collection_name,
            texts=test_texts,
            embeddings=test_embeddings,
            metadatas=test_metadatas,
        )

        print(f"[OK] Added {result['count']} documents to ChromaDB")

        # Query
        query_result = service.query_similar(
            collection_name=collection_name, query_embedding=[0.15] * 1536, n_results=2
        )

        print(f"[OK] Query returned {len(query_result['documents'])} results")

        # Cleanup
        service.delete_collection(collection_name)
        print(f"[OK] Cleaned up test collection")

        return True

    except Exception as e:
        print(f"[FAIL] Vector store test failed: {str(e)}")
        return False


def test_rag_service_readiness():
    """Test RAG service readiness."""
    print("\n=== Testing RAG Service Readiness ===")

    service = RAGProcessingService()

    readiness = service.is_ready()

    print(f"Text Extraction: {'[OK]' if readiness['text_extraction'] else '[FAIL]'}")
    print(f"Embedding Service: {'[OK]' if readiness['embedding_service'] else '[FAIL]'}")
    print(f"Vector Store: {'[OK]' if readiness['vector_store'] else '[FAIL]'}")

    # Get stats
    try:
        stats = service.get_processing_stats()
        print(f"\nProcessing Stats:")
        print(f"  Collections: {stats['collections']}")
        print(f"  Embedding Model: {stats['embedding_model']}")
        print(f"  Embedding Dimensions: {stats['embedding_dimensions']}")
    except Exception as e:
        print(f"[WARN] Could not get stats: {str(e)}")

    return all(readiness.values())


async def main():
    """Run all tests."""
    print("=" * 60)
    print("RAG Pipeline Test Suite")
    print("=" * 60)

    results = {
        "Text Extraction": await test_text_extraction(),
        "Vector Store": test_vector_store(),
        "Embedding Service": test_embedding_service(),
        "RAG Service Readiness": test_rag_service_readiness(),
    }

    print("\n" + "=" * 60)
    print("Test Results:")
    print("=" * 60)

    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{test_name}: {status}")

    all_passed = all(results.values())

    print("\n" + "=" * 60)
    if all_passed:
        print("[OK] All tests passed!")
    else:
        print("[WARN] Some tests failed or skipped")
    print("=" * 60)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
