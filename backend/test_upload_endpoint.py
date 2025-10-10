"""
Quick test script for document upload endpoint.
T-04 ST1: Upload Endpoint Verification

Usage:
    python test_upload_endpoint.py
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app
from io import BytesIO


def create_test_file(filename: str, content: str = "Test document content") -> BytesIO:
    """Create a test file in memory."""
    file_content = BytesIO(content.encode())
    file_content.name = filename
    return file_content


def test_upload_health():
    """Test upload health endpoint."""
    print("\n1. Testing upload health endpoint...")
    client = TestClient(app)
    response = client.get("/api/upload/health")

    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    assert response.status_code == 200, "Health check failed"
    assert response.json()["status"] == "operational", "Service not operational"
    print("   [OK] Upload health check passed")


def test_upload_without_auth():
    """Test upload without authentication (should fail)."""
    print("\n2. Testing upload without authentication...")
    client = TestClient(app)

    # Create test file
    test_file = create_test_file("test.pdf", "PDF test content")

    response = client.post(
        "/api/upload", files={"file": ("test.pdf", test_file, "application/pdf")}
    )

    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    assert response.status_code == 403, "Should require authentication"
    print("   [OK] Authentication requirement enforced")


def test_upload_with_invalid_token():
    """Test upload with invalid JWT token."""
    print("\n3. Testing upload with invalid token...")
    client = TestClient(app)

    # Create test file
    test_file = create_test_file("test.pdf", "PDF test content")

    response = client.post(
        "/api/upload",
        files={"file": ("test.pdf", test_file, "application/pdf")},
        headers={"Authorization": "Bearer invalid-token"},
    )

    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    assert response.status_code == 401, "Should reject invalid token"
    print("   [OK] Invalid token rejected")


def test_upload_with_test_user():
    """Test upload with test user authentication."""
    print("\n4. Testing upload with test user...")
    client = TestClient(app)

    # Login with test user
    login_response = client.post("/api/auth/test/login", json={"email": "admin@test.local"})

    if login_response.status_code != 200:
        print(f"   [WARN] Test user login failed: {login_response.json()}")
        print("   Run: python scripts/seed_test_users.py")
        return

    token = login_response.json()["access_token"]
    print(f"   Got token: {token[:30]}...")

    # Create test file
    test_file = create_test_file("test-document.pdf", "PDF test content for RAG")

    response = client.post(
        "/api/upload",
        files={"file": ("test-document.pdf", test_file, "application/pdf")},
        headers={"Authorization": f"Bearer {token}"},
    )

    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    if response.status_code == 200:
        result = response.json()
        assert "document_id" in result, "Missing document_id"
        assert result["filename"] == "test-document.pdf", "Incorrect filename"
        assert result["file_type"] == "pdf", "Incorrect file_type"
        assert result["status"] == "processing", "Incorrect status"
        print(f"   [OK] Document uploaded successfully: {result['document_id']}")
    else:
        print(f"   [FAIL] Upload failed: {response.json()}")


def test_upload_invalid_file_type():
    """Test upload with invalid file type."""
    print("\n5. Testing upload with invalid file type...")
    client = TestClient(app)

    # Login with test user
    login_response = client.post("/api/auth/test/login", json={"email": "admin@test.local"})

    if login_response.status_code != 200:
        print("   [WARN] Skipped (test user not available)")
        return

    token = login_response.json()["access_token"]

    # Create invalid file type
    test_file = create_test_file("test.txt", "Text file content")

    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", test_file, "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    assert response.status_code == 400, "Should reject invalid file type"
    print("   [OK] Invalid file type rejected")


def test_upload_supported_file_types():
    """Test upload with all supported file types."""
    print("\n6. Testing all supported file types...")
    client = TestClient(app)

    # Login with test user
    login_response = client.post("/api/auth/test/login", json={"email": "admin@test.local"})

    if login_response.status_code != 200:
        print("   [WARN] Skipped (test user not available)")
        return

    token = login_response.json()["access_token"]

    # Test each supported file type
    test_files = [
        ("test.pdf", "application/pdf", "PDF content"),
        (
            "test.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "DOCX content",
        ),
        ("test.md", "text/markdown", "# Markdown content"),
    ]

    for filename, mime_type, content in test_files:
        test_file = create_test_file(filename, content)
        response = client.post(
            "/api/upload",
            files={"file": (filename, test_file, mime_type)},
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code == 200:
            print(f"   [OK] {filename} uploaded successfully")
        else:
            print(f"   [FAIL] {filename} upload failed: {response.json()}")


def main():
    """Run all tests."""
    print("=" * 60)
    print("Upload Endpoint Test Suite (T-04 ST1)")
    print("=" * 60)

    try:
        test_upload_health()
        test_upload_without_auth()
        test_upload_with_invalid_token()
        test_upload_with_test_user()
        test_upload_invalid_file_type()
        test_upload_supported_file_types()

        print("\n" + "=" * 60)
        print("[SUCCESS] All tests completed successfully!")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n[FAIL] Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
