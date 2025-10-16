"""
Setup script for performance testing.

Populates the database with test documents for search benchmarking.
Supports two modes:
    1. Simple fixtures: Upload existing PDF/DOCX/MD files repeatedly
    2. Gutenberg dataset: Chunk classic books into realistic documents

Prerequisites:
    - Backend server running (http://localhost:8000)
    - Valid JWT token in TEST_AUTH_TOKEN environment variable
    - Test fixtures created (run create_simple_fixtures.py or download_gutenberg_dataset.py)

Usage:
    # Set authentication token
    export TEST_AUTH_TOKEN="your-jwt-token-here"

    # Mode 1: Simple fixtures (for quick testing)
    python backend/tests/performance/fixtures/create_simple_fixtures.py
    python backend/tests/performance/setup_perf_test.py --count 100

    # Mode 2: Gutenberg dataset (for realistic RAG testing)
    python backend/tests/performance/download_gutenberg_dataset.py
    python backend/tests/performance/setup_perf_test.py --gutenberg --target-chunks 100

    # Options
    python backend/tests/performance/setup_perf_test.py --clean      # Clean before setup
    python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 1500  # Custom chunk size
"""

import argparse
import asyncio
import io
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx


BASE_URL = "http://localhost:8000"
FIXTURES_DIR = Path(__file__).parent / "fixtures"
GUTENBERG_DIR = FIXTURES_DIR / "gutenberg"


async def check_server_health() -> bool:
    """Check if backend server is running and healthy."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BASE_URL}/api/health")
            if response.status_code == 200:
                print(f"[OK] Backend server is healthy: {BASE_URL}")
                return True
            else:
                print(f"[ERROR] Backend health check failed: {response.status_code}")
                return False
    except httpx.ConnectError:
        print(f"[ERROR] Cannot connect to backend server at {BASE_URL}")
        print("  Make sure the server is running: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"[ERROR] Health check error: {str(e)}")
        return False


async def get_document_count(auth_token: str) -> int:
    """Get current document count for authenticated user."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BASE_URL}/api/documents", headers=headers)

            if response.status_code == 200:
                data = response.json()
                count = data.get("total", 0)
                print(f"[OK] Current document count: {count}")
                return count
            elif response.status_code == 401:
                print("[ERROR] Authentication failed. Check TEST_AUTH_TOKEN.")
                sys.exit(1)
            else:
                print(f"[ERROR] Failed to get document count: {response.status_code}")
                return 0
    except Exception as e:
        print(f"[ERROR] Error getting document count: {str(e)}")
        return 0


async def upload_document(
    auth_token: str, file_path: Path, client: httpx.AsyncClient
) -> Dict[str, Any]:
    """
    Upload a single document.

    Args:
        auth_token: JWT authentication token
        file_path: Path to document file
        client: httpx AsyncClient instance

    Returns:
        Upload response data or None if failed
    """
    headers = {"Authorization": f"Bearer {auth_token}"}

    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f, _get_mime_type(file_path.suffix))}

        try:
            response = await client.post(
                f"{BASE_URL}/api/upload", headers=headers, files=files, timeout=30.0
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"  [ERROR] Upload failed for {file_path.name}: {response.status_code}")
                return None
        except Exception as e:
            print(f"  [ERROR] Upload error for {file_path.name}: {str(e)}")
            return None


def _get_mime_type(extension: str) -> str:
    """Get MIME type for file extension."""
    mime_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".md": "text/markdown",
    }
    return mime_types.get(extension, "application/octet-stream")


async def populate_database(auth_token: str, target_count: int):
    """
    Populate database with test documents.

    Args:
        auth_token: JWT authentication token
        target_count: Target number of documents to create
    """
    # Check available fixtures
    available_fixtures = []
    for pattern in ["*.pdf", "*.docx", "*.md"]:
        available_fixtures.extend(list(FIXTURES_DIR.glob(pattern)))

    if not available_fixtures:
        print(f"[ERROR] No fixture files found in {FIXTURES_DIR}")
        print("  Run: python backend/tests/performance/fixtures/create_simple_fixtures.py")
        sys.exit(1)

    print(f"\n[OK] Found {len(available_fixtures)} fixture files:")
    for fixture in available_fixtures:
        print(f"  - {fixture.name} ({fixture.stat().st_size / 1024:.2f} KB)")

    # Get current document count
    current_count = await get_document_count(auth_token)
    uploads_needed = max(0, target_count - current_count)

    if uploads_needed == 0:
        print(f"\n[OK] Database already has {current_count} documents (target: {target_count})")
        print("  Use --clean to remove existing documents and repopulate")
        return

    print(f"\nUploading {uploads_needed} documents to reach target of {target_count}...")
    print("=" * 70)

    # Upload documents in batches
    uploaded = 0
    failed = 0
    start_time = time.time()

    async with httpx.AsyncClient() as client:
        for i in range(uploads_needed):
            # Rotate through available fixtures
            fixture = available_fixtures[i % len(available_fixtures)]

            # Upload document
            result = await upload_document(auth_token, fixture, client)

            if result:
                uploaded += 1
                if uploaded % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = uploaded / elapsed if elapsed > 0 else 0
                    print(
                        f"  Progress: {uploaded}/{uploads_needed} "
                        f"({uploaded / uploads_needed * 100:.1f}%) "
                        f"- Rate: {rate:.2f} docs/sec"
                    )
            else:
                failed += 1

            # Small delay to avoid overwhelming the server
            await asyncio.sleep(0.1)

    # Final statistics
    elapsed = time.time() - start_time
    final_count = await get_document_count(auth_token)

    print("=" * 70)
    print(f"\n[OK] Upload complete!")
    print(f"  - Total uploaded: {uploaded}")
    print(f"  - Failed: {failed}")
    print(f"  - Duration: {elapsed:.2f} seconds")
    print(f"  - Rate: {uploaded / elapsed if elapsed > 0 else 0:.2f} docs/sec")
    print(f"  - Final document count: {final_count}")


def chunk_text_by_words(
    text: str, chunk_size: int = 1500, overlap: int = 150
) -> List[str]:
    """
    Chunk text into approximately equal-sized pieces by word count.

    Args:
        text: Text to chunk
        chunk_size: Target words per chunk (default: 1500)
        overlap: Number of overlapping words between chunks (default: 150)

    Returns:
        List of text chunks
    """
    words = text.split()
    chunks = []

    if len(words) <= chunk_size:
        return [text]

    for i in range(0, len(words), chunk_size - overlap):
        chunk_words = words[i : i + chunk_size]
        if chunk_words:  # Don't add empty chunks
            chunk_text = " ".join(chunk_words)
            chunks.append(chunk_text)

        # Stop if we've consumed all words
        if i + chunk_size >= len(words):
            break

    return chunks


def extract_chapter_info(text: str, chunk_idx: int) -> Tuple[Optional[str], int]:
    """
    Try to extract chapter information from text chunk.

    Args:
        text: Text chunk to analyze
        chunk_idx: Index of this chunk

    Returns:
        Tuple of (chapter_title, chapter_number)
    """
    # Look for common chapter patterns in first 500 chars
    header = text[:500]

    # Pattern 1: "CHAPTER I", "CHAPTER 1", "Chapter One"
    chapter_match = re.search(
        r"(?:CHAPTER|Chapter)\s+([IVXLCDM]+|\d+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)",
        header,
        re.IGNORECASE,
    )

    if chapter_match:
        # Try to extract chapter title (usually on next line or after colon)
        title_match = re.search(
            r"(?:CHAPTER|Chapter)[^\n]*\n\s*([A-Z][^\n]{5,50})", header
        )
        if title_match:
            return title_match.group(1).strip(), chunk_idx + 1

        return f"Chapter {chapter_match.group(1)}", chunk_idx + 1

    # Pattern 2: Roman numerals or numbers at start
    numeral_match = re.match(r"^\s*([IVXLCDM]+|\d+)\s*$", header.split("\n")[0])
    if numeral_match:
        return f"Chapter {numeral_match.group(1)}", chunk_idx + 1

    # Default: No chapter detected
    return None, chunk_idx + 1


def create_markdown_chunk(
    book_title: str,
    author: str,
    chunk_text: str,
    chunk_idx: int,
    total_chunks: int,
) -> str:
    """
    Create a formatted Markdown document from a book chunk.

    Args:
        book_title: Title of the source book
        author: Author name
        chunk_text: Text content for this chunk
        chunk_idx: Index of this chunk (0-based)
        total_chunks: Total number of chunks

    Returns:
        Formatted Markdown string
    """
    # Extract chapter info
    chapter_title, chapter_num = extract_chapter_info(chunk_text, chunk_idx)

    # Build Markdown document
    lines = [
        f"# {book_title}",
        f"",
        f"**Author**: {author}",
        f"**Part**: {chunk_idx + 1} of {total_chunks}",
    ]

    if chapter_title:
        lines.append(f"**Section**: {chapter_title}")

    lines.extend(["", "---", "", chunk_text])

    return "\n".join(lines)


async def chunk_gutenberg_books(
    auth_token: str, target_chunks: int = 100, chunk_size: int = 1500
) -> int:
    """
    Chunk Gutenberg books and upload as separate documents.

    Args:
        auth_token: JWT authentication token
        target_chunks: Target number of document chunks to create
        chunk_size: Words per chunk (default: 1500)

    Returns:
        Number of chunks uploaded
    """
    # Check if Gutenberg directory exists
    if not GUTENBERG_DIR.exists():
        print(f"[ERROR] Gutenberg directory not found: {GUTENBERG_DIR}")
        print("  Run: python backend/tests/performance/download_gutenberg_dataset.py")
        sys.exit(1)

    # Load metadata
    metadata_path = GUTENBERG_DIR / "gutenberg_metadata.json"
    if not metadata_path.exists():
        print(f"[ERROR] Gutenberg metadata not found: {metadata_path}")
        print("  Run: python backend/tests/performance/download_gutenberg_dataset.py")
        sys.exit(1)

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    books = metadata.get("books", [])
    if not books:
        print("[ERROR] No books found in metadata")
        sys.exit(1)

    print(f"\n[OK] Found {len(books)} Gutenberg books:")
    for book in books:
        print(
            f"  - {book['title']} by {book['author']} "
            f"({book['word_count']:,} words, {book['size_kb']:.1f} KB)"
        )

    print(f"\nChunking books into ~{chunk_size} word documents...")
    print(f"Target: {target_chunks} chunks")
    print("=" * 70)

    all_chunks = []

    # Process each book
    for book in books:
        book_path = Path(book["file_path"])
        if not book_path.exists():
            print(f"  [ERROR] Book file not found: {book_path}")
            continue

        # Read book text
        text = book_path.read_text(encoding="utf-8")

        # Chunk the text
        chunks = chunk_text_by_words(text, chunk_size=chunk_size)

        print(
            f"  {book['title']}: {len(chunks)} chunks "
            f"({book['word_count']:,} words -> ~{book['word_count'] // len(chunks)} words/chunk)"
        )

        # Create Markdown documents for each chunk
        for idx, chunk_text in enumerate(chunks):
            markdown = create_markdown_chunk(
                book["title"],
                book["author"],
                chunk_text,
                idx,
                len(chunks),
            )

            all_chunks.append(
                {
                    "content": markdown,
                    "filename": f"{book['book_id']:05d}_{book['title'].replace(' ', '_')}_part{idx + 1:03d}.md",
                    "book_title": book["title"],
                    "author": book["author"],
                    "genre": book.get("genre", "Unknown"),
                    "part": idx + 1,
                    "total_parts": len(chunks),
                }
            )

    print(f"\n[OK] Created {len(all_chunks)} chunks from {len(books)} books")

    # Limit to target count if we have too many
    if len(all_chunks) > target_chunks:
        print(
            f"  Limiting to first {target_chunks} chunks (you can adjust --chunk-size to create more)"
        )
        all_chunks = all_chunks[:target_chunks]

    # Upload chunks
    print(f"\nUploading {len(all_chunks)} document chunks...")
    print("=" * 70)

    uploaded = 0
    failed = 0
    start_time = time.time()

    async with httpx.AsyncClient() as client:
        for idx, chunk_data in enumerate(all_chunks):
            # Create temporary Markdown file
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".md",
                delete=False,
                encoding="utf-8",
            ) as temp_file:
                temp_file.write(chunk_data["content"])
                temp_path = Path(temp_file.name)

            try:
                # Upload the chunk
                headers = {"Authorization": f"Bearer {auth_token}"}
                with open(temp_path, "rb") as f:
                    files = {
                        "file": (
                            chunk_data["filename"],
                            f,
                            "text/markdown",
                        )
                    }

                    response = await client.post(
                        f"{BASE_URL}/api/upload",
                        headers=headers,
                        files=files,
                        timeout=30.0,
                    )

                    if response.status_code == 200:
                        uploaded += 1
                        if uploaded % 10 == 0:
                            elapsed = time.time() - start_time
                            rate = uploaded / elapsed if elapsed > 0 else 0
                            print(
                                f"  Progress: {uploaded}/{len(all_chunks)} "
                                f"({uploaded / len(all_chunks) * 100:.1f}%) "
                                f"- Rate: {rate:.2f} docs/sec"
                            )
                    else:
                        failed += 1
                        if failed <= 5:  # Only print first 5 failures
                            print(
                                f"  [ERROR] Upload failed ({response.status_code}): "
                                f"{chunk_data['filename']}"
                            )

            except Exception as e:
                failed += 1
                if failed <= 5:
                    print(f"  [ERROR] Upload error: {str(e)}")
            finally:
                # Clean up temporary file
                temp_path.unlink(missing_ok=True)

            # Small delay to avoid overwhelming the server
            await asyncio.sleep(0.1)

    # Final statistics
    elapsed = time.time() - start_time

    print("=" * 70)
    print(f"\n[OK] Gutenberg chunk upload complete!")
    print(f"  - Total uploaded: {uploaded}")
    print(f"  - Failed: {failed}")
    print(f"  - Duration: {elapsed:.2f} seconds")
    print(f"  - Rate: {uploaded / elapsed if elapsed > 0 else 0:.2f} docs/sec")

    return uploaded


async def clean_database(auth_token: str):
    """
    Clean existing documents (soft delete).

    Note: This only marks documents as deleted, doesn't remove them from database.
    For full cleanup, you'd need direct database access.
    """
    print("\nCleaning existing documents...")

    headers = {"Authorization": f"Bearer {auth_token}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get all documents
        response = await client.get(
            f"{BASE_URL}/api/documents?limit=100", headers=headers
        )

        if response.status_code != 200:
            print(f"[ERROR] Failed to list documents: {response.status_code}")
            return

        data = response.json()
        documents = data.get("documents", [])
        total = data.get("total", 0)

        if total == 0:
            print("  [OK] No documents to clean")
            return

        print(f"  Found {total} documents to clean")
        print("  Note: Soft delete not implemented in current API")
        print("  Use database scripts to fully clean test data if needed")


def main():
    """Main setup function."""
    parser = argparse.ArgumentParser(description="Setup performance testing environment")

    # Mode selection
    parser.add_argument(
        "--gutenberg",
        action="store_true",
        help="Use Gutenberg dataset (chunked books) instead of simple fixtures",
    )

    # Simple fixture mode options
    parser.add_argument(
        "--count",
        type=int,
        default=100,
        help="Target number of documents (simple fixture mode, default: 100)",
    )

    # Gutenberg mode options
    parser.add_argument(
        "--target-chunks",
        type=int,
        default=100,
        help="Target number of document chunks (Gutenberg mode, default: 100)",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1500,
        help="Words per chunk (Gutenberg mode, default: 1500)",
    )

    # Common options
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clean existing documents first",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default="http://localhost:8000",
        help="Backend URL (default: http://localhost:8000)",
    )

    args = parser.parse_args()

    # Update global BASE_URL if provided
    global BASE_URL
    if args.base_url != "http://localhost:8000":
        BASE_URL = args.base_url

    # Display mode
    mode = "Gutenberg Dataset (Chunked Books)" if args.gutenberg else "Simple Fixtures"
    target = args.target_chunks if args.gutenberg else args.count

    print("=" * 70)
    print("T-04 Performance Testing Setup")
    print("=" * 70)
    print(f"Mode: {mode}")
    print(f"Target: {target} documents")
    if args.gutenberg:
        print(f"Chunk size: {args.chunk_size} words")
    print(f"Backend: {BASE_URL}")
    print("=" * 70)

    # Get authentication token
    auth_token = os.getenv("TEST_AUTH_TOKEN")
    if not auth_token:
        print("\n[ERROR] TEST_AUTH_TOKEN environment variable not set")
        print("\nTo get a token:")
        print("1. Start the backend server")
        print("2. Use: python backend/tests/performance/get_test_token.py")
        print("3. Export the token: export TEST_AUTH_TOKEN='your-token-here'")
        sys.exit(1)

    print(f"[OK] Authentication token loaded (length: {len(auth_token)})")

    # Run async setup
    async def run_setup():
        # Check server health
        if not await check_server_health():
            sys.exit(1)

        # Clean if requested
        if args.clean:
            await clean_database(auth_token)

        # Populate database based on mode
        if args.gutenberg:
            uploaded = await chunk_gutenberg_books(
                auth_token, args.target_chunks, args.chunk_size
            )
            final_count = await get_document_count(auth_token)
            print(f"\n[OK] Final document count: {final_count}")
        else:
            await populate_database(auth_token, args.count)

        print("\n" + "=" * 70)
        print("[OK] Setup complete!")
        print("\nNext steps:")
        print("1. Run ingestion benchmark:")
        print(
            "   locust -f backend/tests/performance/locust_ingestion.py "
            "--host=http://localhost:8000"
        )
        print("\n2. Run search benchmark:")
        print(
            "   locust -f backend/tests/performance/locust_search.py "
            "--host=http://localhost:8000"
        )
        print("=" * 70)

    asyncio.run(run_setup())


if __name__ == "__main__":
    main()
