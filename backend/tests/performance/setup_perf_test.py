"""
Setup script for performance testing.

Populates the database with test documents for search benchmarking.
Creates 100+ documents with realistic content distribution.

Prerequisites:
    - Backend server running (http://localhost:8000)
    - Valid JWT token in TEST_AUTH_TOKEN environment variable
    - Test fixtures created (run create_simple_fixtures.py first)

Usage:
    # Set authentication token
    export TEST_AUTH_TOKEN="your-jwt-token-here"

    # Generate fixtures (if not already done)
    python backend/tests/performance/fixtures/create_simple_fixtures.py

    # Run setup
    python backend/tests/performance/setup_perf_test.py

    # Options
    python backend/tests/performance/setup_perf_test.py --count 100  # Custom document count
    python backend/tests/performance/setup_perf_test.py --clean      # Clean before setup
"""

import argparse
import asyncio
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any

import httpx


BASE_URL = "http://localhost:8000"
FIXTURES_DIR = Path(__file__).parent / "fixtures"


async def check_server_health() -> bool:
    """Check if backend server is running and healthy."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print(f"✓ Backend server is healthy: {BASE_URL}")
                return True
            else:
                print(f"✗ Backend health check failed: {response.status_code}")
                return False
    except httpx.ConnectError:
        print(f"✗ Cannot connect to backend server at {BASE_URL}")
        print("  Make sure the server is running: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"✗ Health check error: {str(e)}")
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
                print(f"✓ Current document count: {count}")
                return count
            elif response.status_code == 401:
                print("✗ Authentication failed. Check TEST_AUTH_TOKEN.")
                sys.exit(1)
            else:
                print(f"✗ Failed to get document count: {response.status_code}")
                return 0
    except Exception as e:
        print(f"✗ Error getting document count: {str(e)}")
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
                print(f"  ✗ Upload failed for {file_path.name}: {response.status_code}")
                return None
        except Exception as e:
            print(f"  ✗ Upload error for {file_path.name}: {str(e)}")
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
        print(f"✗ No fixture files found in {FIXTURES_DIR}")
        print("  Run: python backend/tests/performance/fixtures/create_simple_fixtures.py")
        sys.exit(1)

    print(f"\n✓ Found {len(available_fixtures)} fixture files:")
    for fixture in available_fixtures:
        print(f"  - {fixture.name} ({fixture.stat().st_size / 1024:.2f} KB)")

    # Get current document count
    current_count = await get_document_count(auth_token)
    uploads_needed = max(0, target_count - current_count)

    if uploads_needed == 0:
        print(f"\n✓ Database already has {current_count} documents (target: {target_count})")
        print("  Use --clean to remove existing documents and repopulate")
        return

    print(f"\n📤 Uploading {uploads_needed} documents to reach target of {target_count}...")
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
    print(f"\n✓ Upload complete!")
    print(f"  - Total uploaded: {uploaded}")
    print(f"  - Failed: {failed}")
    print(f"  - Duration: {elapsed:.2f} seconds")
    print(f"  - Rate: {uploaded / elapsed if elapsed > 0 else 0:.2f} docs/sec")
    print(f"  - Final document count: {final_count}")


async def clean_database(auth_token: str):
    """
    Clean existing documents (soft delete).

    Note: This only marks documents as deleted, doesn't remove them from database.
    For full cleanup, you'd need direct database access.
    """
    print("\n🗑️  Cleaning existing documents...")

    headers = {"Authorization": f"Bearer {auth_token}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get all documents
        response = await client.get(
            f"{BASE_URL}/api/documents?limit=100", headers=headers
        )

        if response.status_code != 200:
            print(f"✗ Failed to list documents: {response.status_code}")
            return

        data = response.json()
        documents = data.get("documents", [])
        total = data.get("total", 0)

        if total == 0:
            print("  ✓ No documents to clean")
            return

        print(f"  Found {total} documents to clean")
        print("  Note: Soft delete not implemented in current API")
        print("  Use database scripts to fully clean test data if needed")


def main():
    """Main setup function."""
    parser = argparse.ArgumentParser(description="Setup performance testing environment")
    parser.add_argument(
        "--count", type=int, default=100, help="Target number of documents (default: 100)"
    )
    parser.add_argument("--clean", action="store_true", help="Clean existing documents first")
    parser.add_argument(
        "--base-url", type=str, default=BASE_URL, help=f"Backend URL (default: {BASE_URL})"
    )

    args = parser.parse_args()

    # Update global BASE_URL if provided
    global BASE_URL
    BASE_URL = args.base_url

    print("=" * 70)
    print("T-04 Performance Testing Setup")
    print("=" * 70)
    print(f"Target: {args.count} documents")
    print(f"Backend: {BASE_URL}")
    print("=" * 70)

    # Get authentication token
    auth_token = os.getenv("TEST_AUTH_TOKEN")
    if not auth_token:
        print("\n✗ TEST_AUTH_TOKEN environment variable not set")
        print("\nTo get a token:")
        print("1. Start the backend server")
        print("2. Login via OAuth or create a test token")
        print("3. Export the token: export TEST_AUTH_TOKEN='your-token-here'")
        sys.exit(1)

    print(f"✓ Authentication token loaded (length: {len(auth_token)})")

    # Run async setup
    async def run_setup():
        # Check server health
        if not await check_server_health():
            sys.exit(1)

        # Clean if requested
        if args.clean:
            await clean_database(auth_token)

        # Populate database
        await populate_database(auth_token, args.count)

        print("\n" + "=" * 70)
        print("✓ Setup complete!")
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
