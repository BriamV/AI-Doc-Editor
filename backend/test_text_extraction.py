"""
Quick test script for TextExtractionService.

This demonstrates basic usage of the text extraction service.
For production use, add comprehensive unit tests in backend/tests/.

T-04 ST2: Text Extraction and Chunking Service
"""

import asyncio

from app.services.text_extraction_service import TextExtractionService


async def test_basic_extraction():
    """Test basic text extraction functionality."""
    service = TextExtractionService(chunk_size=500, overlap=100)

    print("TextExtractionService Initialization:")
    print(f"  Chunk size: {service.chunk_size}")
    print(f"  Overlap: {service.overlap}")
    print("  Supported types: pdf, docx, md")

    # Test chunking with sample text
    sample_text = (
        """
    This is a test document for the RAG pipeline.
    It contains multiple sentences to demonstrate text extraction.
    The service will chunk this text into smaller pieces.
    Each chunk will have some overlap with the next one.
    This helps maintain context when processing embeddings.
    """
        * 5
    )  # Repeat to make it longer

    chunks = service.chunk_text(sample_text, chunk_size=200, overlap=50)

    print("\nChunking Test:")
    print(f"  Original text length: {len(sample_text)} characters")
    print(f"  Number of chunks: {len(chunks)}")
    print(f"  First chunk preview: {chunks[0][:100]}...")
    if len(chunks) > 1:
        print(f"  Last chunk preview: {chunks[-1][:100]}...")


async def main():
    """Run tests."""
    print("=" * 60)
    print("TextExtractionService Test")
    print("=" * 60)

    await test_basic_extraction()

    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
