"""
Tests for T-41: User API Key Management
Security and functionality tests for credentials endpoints
"""

from fastapi.testclient import TestClient
from app.main import app
from app.services.credentials import credentials_service

client = TestClient(app)


class TestCredentialsService:
    """Test the credentials service encryption/decryption"""

    def test_encrypt_decrypt_api_key(self):
        """Test that API key encryption/decryption works correctly"""
        original_key = "sk-test1234567890abcdef1234567890abcdef123456"

        # Encrypt the key
        encrypted = credentials_service.encrypt_api_key(original_key)

        # Verify it's actually encrypted (different from original)
        assert encrypted != original_key

        # Decrypt and verify it matches original
        decrypted = credentials_service.decrypt_api_key(encrypted)
        assert decrypted == original_key

    def test_key_preview_generation(self):
        """Test that key preview is generated safely"""
        api_key = "sk-test1234567890abcdef1234567890abcdef123456"
        preview = credentials_service.get_key_preview(api_key)

        # Should show first 7 chars, "...", and last 4 chars
        assert preview == "sk-test...3456"
        assert len(preview) < len(api_key)

    def test_key_preview_short_key(self):
        """Test key preview with short key"""
        short_key = "sk-123"
        preview = credentials_service.get_key_preview(short_key)
        assert preview == "sk-...***"

    def test_openai_key_validation(self):
        """Test OpenAI API key format validation"""
        # Valid keys
        assert credentials_service.validate_openai_key_format(
            "sk-test1234567890abcdef1234567890abcdef123456"
        )
        assert credentials_service.validate_openai_key_format("sk-1234567890abcdef1234567890")

        # Invalid keys
        assert not credentials_service.validate_openai_key_format("invalid-key")
        assert not credentials_service.validate_openai_key_format("sk-123")  # too short
        assert not credentials_service.validate_openai_key_format(
            "pk-test123456789"
        )  # wrong prefix


class TestCredentialsAPI:
    """Test the credentials API endpoints"""

    def test_store_credentials_invalid_format(self):
        """Test storing credentials with invalid API key format"""
        # Mock authentication would be needed here
        # This is a basic structure for the test

        invalid_keys = ["invalid-key", "pk-wrong-prefix", "sk-too-short", ""]

        for invalid_key in invalid_keys:
            # This test is incomplete - would need proper authentication mocking
            # response = client.post(
            #     "/api/user/credentials",
            #     json={"openai_api_key": invalid_key},
            #     headers={"Authorization": "Bearer mock-token"}
            # )
            # assert response.status_code == 400
            pass  # Placeholder for future implementation

    def test_credentials_endpoints_require_auth(self):
        """Test that credentials endpoints require authentication"""
        # Test without auth token
        response = client.post(
            "/api/user/credentials",
            json={"openai_api_key": "sk-test1234567890abcdef1234567890abcdef123456"},
        )
        # Should return 401 or 403 for missing auth
        assert response.status_code in [
            401,
            403,
            422,
        ]  # 422 might be returned by FastAPI for missing deps

        response = client.get("/api/user/credentials")
        assert response.status_code in [401, 403, 422]

        response = client.delete("/api/user/credentials")
        assert response.status_code in [401, 403, 422]


if __name__ == "__main__":
    # Run basic service tests
    service_tests = TestCredentialsService()
    service_tests.test_encrypt_decrypt_api_key()
    service_tests.test_key_preview_generation()
    service_tests.test_key_preview_short_key()
    service_tests.test_openai_key_validation()

    print("✅ All credentials service tests passed!")

    # API tests would need proper auth mocking
    api_tests = TestCredentialsAPI()
    api_tests.test_credentials_endpoints_require_auth()

    print("✅ All credentials API security tests passed!")
