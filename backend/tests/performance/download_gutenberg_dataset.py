"""
Download Project Gutenberg dataset for RAG pipeline performance testing.

Downloads 10-15 classic books (public domain) from Project Gutenberg for
realistic search benchmarking. Books are selected for genre diversity and
will be chunked into ~100 documents for PERF-004 testing.

Features:
    - Downloads 10-15 classic books in plain text format
    - Removes Project Gutenberg headers/footers
    - Handles encoding issues (UTF-8)
    - Retry logic for network errors
    - Progress reporting

Prerequisites:
    - httpx library (already in requirements.txt)
    - Internet connection

Usage:
    # Download all books
    python backend/tests/performance/download_gutenberg_dataset.py

    # Download specific books
    python backend/tests/performance/download_gutenberg_dataset.py --book-ids 1342 11 1661

    # Skip existing files
    python backend/tests/performance/download_gutenberg_dataset.py --skip-existing

Output:
    - Text files saved to backend/tests/performance/fixtures/gutenberg/
    - Book metadata saved to gutenberg_metadata.json
"""

import argparse
import asyncio
import json
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

import httpx


# Book catalog with metadata
GUTENBERG_BOOKS = [
    {
        "id": 1342,
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "genre": "Romance",
        "year": 1813,
        "expected_size_kb": 700,
    },
    {
        "id": 11,
        "title": "Alice's Adventures in Wonderland",
        "author": "Lewis Carroll",
        "genre": "Fantasy",
        "year": 1865,
        "expected_size_kb": 170,
    },
    {
        "id": 1661,
        "title": "The Adventures of Sherlock Holmes",
        "author": "Arthur Conan Doyle",
        "genre": "Mystery",
        "year": 1892,
        "expected_size_kb": 580,
    },
    {
        "id": 84,
        "title": "Frankenstein",
        "author": "Mary Shelley",
        "genre": "Gothic/Sci-Fi",
        "year": 1818,
        "expected_size_kb": 440,
    },
    {
        "id": 98,
        "title": "A Tale of Two Cities",
        "author": "Charles Dickens",
        "genre": "Historical",
        "year": 1859,
        "expected_size_kb": 780,
    },
    {
        "id": 2701,
        "title": "Moby Dick",
        "author": "Herman Melville",
        "genre": "Adventure",
        "year": 1851,
        "expected_size_kb": 1200,
    },
    {
        "id": 16,
        "title": "Peter Pan",
        "author": "J.M. Barrie",
        "genre": "Children's",
        "year": 1911,
        "expected_size_kb": 320,
    },
    {
        "id": 74,
        "title": "The Adventures of Tom Sawyer",
        "author": "Mark Twain",
        "genre": "Adventure",
        "year": 1876,
        "expected_size_kb": 410,
    },
    {
        "id": 1952,
        "title": "The Yellow Wallpaper",
        "author": "Charlotte Perkins Gilman",
        "genre": "Short Story",
        "year": 1892,
        "expected_size_kb": 30,
    },
    {
        "id": 1080,
        "title": "A Modest Proposal",
        "author": "Jonathan Swift",
        "genre": "Satire",
        "year": 1729,
        "expected_size_kb": 30,
    },
]

BASE_URL = "https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt"
ALTERNATIVE_URL = "https://www.gutenberg.org/files/{book_id}/{book_id}.txt"
OUTPUT_DIR = Path(__file__).parent / "fixtures" / "gutenberg"

# Regex patterns to remove Gutenberg headers/footers
HEADER_PATTERNS = [
    r"^\*\*\* START OF (THIS|THE) PROJECT GUTENBERG.*?\*\*\*",
    r"^The Project Gutenberg eBook.*?(?=^[A-Z])",
    r"^This eBook is for the use of anyone.*?(?=^[A-Z])",
]

FOOTER_PATTERNS = [
    r"\*\*\* END OF (THIS|THE) PROJECT GUTENBERG.*?\*\*\*.*$",
    r"End of (the )?Project Gutenberg.*$",
]


def clean_gutenberg_text(text: str) -> str:
    """
    Remove Project Gutenberg headers and footers from text.

    Args:
        text: Raw text from Gutenberg

    Returns:
        Cleaned text without headers/footers
    """
    # Remove header (everything before "*** START OF")
    for pattern in HEADER_PATTERNS:
        match = re.search(pattern, text, re.MULTILINE | re.DOTALL | re.IGNORECASE)
        if match:
            text = text[match.end() :].lstrip()
            break

    # Remove footer (everything after "*** END OF")
    for pattern in FOOTER_PATTERNS:
        match = re.search(pattern, text, re.MULTILINE | re.DOTALL | re.IGNORECASE)
        if match:
            text = text[: match.start()].rstrip()
            break

    # Clean up excessive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


async def download_book(
    book_id: int,
    book_info: Dict,
    output_dir: Path,
    client: httpx.AsyncClient,
    max_retries: int = 3,
    skip_existing: bool = False,
) -> Optional[Dict]:
    """
    Download a single book from Project Gutenberg.

    Args:
        book_id: Gutenberg book ID
        book_info: Book metadata dictionary
        output_dir: Directory to save text file
        client: httpx AsyncClient instance
        max_retries: Maximum retry attempts
        skip_existing: Skip if file already exists

    Returns:
        Download result dictionary or None if failed
    """
    filename = f"{book_id:05d}_{book_info['title'].replace(' ', '_')}.txt"
    file_path = output_dir / filename

    # Check if already exists
    if skip_existing and file_path.exists():
        size_kb = file_path.stat().st_size / 1024
        print(f"  [SKIP] Already exists: {filename} ({size_kb:.1f} KB)")
        return {
            "book_id": book_id,
            "title": book_info["title"],
            "author": book_info["author"],
            "file_path": str(file_path),
            "size_kb": size_kb,
            "status": "skipped",
        }

    # Try primary URL first, then fallback
    urls = [
        BASE_URL.format(book_id=book_id),
        ALTERNATIVE_URL.format(book_id=book_id),
    ]

    for retry in range(max_retries):
        for url_idx, url in enumerate(urls):
            try:
                print(f"  [DOWN] Downloading: {book_info['title']} (ID: {book_id})...")

                response = await client.get(url, timeout=30.0, follow_redirects=True)

                if response.status_code == 200:
                    # Decode content (try UTF-8 first, then Latin-1)
                    try:
                        text = response.content.decode("utf-8")
                    except UnicodeDecodeError:
                        text = response.content.decode("latin-1")

                    # Clean Gutenberg headers/footers
                    cleaned_text = clean_gutenberg_text(text)

                    # Save to file
                    file_path.write_text(cleaned_text, encoding="utf-8")

                    size_kb = len(cleaned_text.encode("utf-8")) / 1024

                    print(
                        f"  [OK] Downloaded: {filename} ({size_kb:.1f} KB) "
                        f"[{book_info['genre']}]"
                    )

                    return {
                        "book_id": book_id,
                        "title": book_info["title"],
                        "author": book_info["author"],
                        "genre": book_info["genre"],
                        "year": book_info["year"],
                        "file_path": str(file_path),
                        "size_kb": size_kb,
                        "word_count": len(cleaned_text.split()),
                        "status": "downloaded",
                    }

                elif response.status_code == 404 and url_idx == 0:
                    # Try alternative URL
                    continue
                else:
                    print(f"  [ERROR] HTTP {response.status_code}: {url}")

            except httpx.TimeoutException:
                print(f"  [WARN] Timeout on attempt {retry + 1}/{max_retries}")
                if retry < max_retries - 1:
                    await asyncio.sleep(2**retry)  # Exponential backoff
            except Exception as e:
                print(f"  [ERROR] Error: {str(e)}")

    print(f"  [FAIL] Failed after {max_retries} retries: {book_info['title']}")
    return None


async def download_dataset(
    book_ids: Optional[List[int]] = None,
    skip_existing: bool = False,
):
    """
    Download complete Gutenberg dataset.

    Args:
        book_ids: Optional list of specific book IDs to download
        skip_existing: Skip files that already exist
    """
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Filter books if specific IDs requested
    books_to_download = GUTENBERG_BOOKS
    if book_ids:
        books_to_download = [b for b in GUTENBERG_BOOKS if b["id"] in book_ids]
        if not books_to_download:
            print(f"✗ No matching books found for IDs: {book_ids}")
            return

    print("=" * 80)
    print("Project Gutenberg Dataset Downloader")
    print("=" * 80)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Books to download: {len(books_to_download)}")
    print(f"Skip existing: {skip_existing}")
    print("=" * 80)

    start_time = time.time()
    results = []

    async with httpx.AsyncClient() as client:
        for idx, book_info in enumerate(books_to_download, 1):
            print(f"\n[{idx}/{len(books_to_download)}]")
            result = await download_book(
                book_info["id"],
                book_info,
                OUTPUT_DIR,
                client,
                skip_existing=skip_existing,
            )

            if result:
                results.append(result)

            # Small delay between downloads (be respectful to Gutenberg servers)
            if idx < len(books_to_download):
                await asyncio.sleep(1)

    # Save metadata
    metadata_path = OUTPUT_DIR / "gutenberg_metadata.json"
    metadata = {
        "dataset": "Project Gutenberg Classic Books",
        "purpose": "RAG pipeline performance testing (PERF-004)",
        "download_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_books": len(results),
        "total_size_kb": sum(r["size_kb"] for r in results),
        "total_words": sum(r.get("word_count", 0) for r in results),
        "books": results,
    }

    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    # Print summary
    elapsed = time.time() - start_time
    downloaded = len([r for r in results if r["status"] == "downloaded"])
    skipped = len([r for r in results if r["status"] == "skipped"])

    print("\n" + "=" * 80)
    print("Download Summary")
    print("=" * 80)
    print(f"  Total books: {len(results)}")
    print(f"  Downloaded: {downloaded}")
    print(f"  Skipped: {skipped}")
    print(f"  Failed: {len(books_to_download) - len(results)}")
    print(f"  Total size: {metadata['total_size_kb']:.1f} KB")
    print(f"  Total words: {metadata['total_words']:,}")
    print(f"  Duration: {elapsed:.2f} seconds")
    print(f"\n  Metadata: {metadata_path}")
    print("=" * 80)

    if len(results) < len(books_to_download):
        print("\n[WARN] Some downloads failed. You may want to retry.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All books downloaded successfully!")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Download Project Gutenberg dataset for performance testing"
    )
    parser.add_argument(
        "--book-ids",
        type=int,
        nargs="+",
        help="Specific book IDs to download (default: all 10 books)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip files that already exist",
    )

    args = parser.parse_args()

    try:
        asyncio.run(download_dataset(args.book_ids, args.skip_existing))
    except KeyboardInterrupt:
        print("\n\n[INTERRUPT] Download interrupted by user")
        sys.exit(1)


if __name__ == "__main__":
    main()
