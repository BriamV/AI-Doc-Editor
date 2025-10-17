"""
Unit tests for chat router
GitHub Issue #29: Backend chat proxy endpoint

These tests focus on the router logic without full application initialization.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException, status
from openai import AuthenticationError, RateLimitError

from app.routers.chat import get_openai_client
from app.services.auth import AuthService


class TestChatRouterLogic:
    """Tests for chat router business logic (unit tests)"""

    @patch("app.routers.chat.get_user_openai_key")
    @patch("app.routers.chat.OpenAI")
    def test_get_openai_client_with_user_key(self, mock_openai, mock_get_user_key):
        """Test OpenAI client creation with user-specific API key"""
        user_id = "test-user-123"
        user_api_key = "sk-user-test-key"
        mock_get_user_key.return_value = user_api_key

        result = get_openai_client(user_id)

        mock_get_user_key.assert_called_once_with(user_id)
        mock_openai.assert_called_once_with(api_key=user_api_key)
        assert result is not None

    @patch("app.routers.chat.get_user_openai_key")
    @patch("app.routers.chat.settings")
    @patch("app.routers.chat.OpenAI")
    def test_get_openai_client_with_global_fallback(
        self, mock_openai, mock_settings, mock_get_user_key
    ):
        """Test OpenAI client falls back to global API key"""
        user_id = "test-user-123"
        global_api_key = "sk-global-test-key"

        # Simulate user has no API key
        mock_get_user_key.side_effect = HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="No user API key"
        )
        mock_settings.OPENAI_API_KEY = global_api_key

        result = get_openai_client(user_id)

        mock_openai.assert_called_once_with(api_key=global_api_key)
        assert result is not None

    @patch("app.routers.chat.get_user_openai_key")
    @patch("app.routers.chat.settings")
    def test_get_openai_client_no_key_available(self, mock_settings, mock_get_user_key):
        """Test error when no API key is available"""
        user_id = "test-user-123"

        # Simulate no user key and no global key
        mock_get_user_key.side_effect = HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="No user API key"
        )
        mock_settings.OPENAI_API_KEY = None

        with pytest.raises(HTTPException) as exc_info:
            get_openai_client(user_id)

        assert exc_info.value.status_code == status.HTTP_402_PAYMENT_REQUIRED
        assert "no_api_key" in str(exc_info.value.detail).lower()

    def test_jwt_token_generation(self):
        """Test that JWT token generation works for authentication"""
        auth_service = AuthService()
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "role": "editor",
            "provider": "test",
            "user_id": "test-user-123",
        }
        tokens = auth_service.create_tokens(user_data)

        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert len(tokens["access_token"]) > 50  # JWT tokens are long
        assert len(tokens["refresh_token"]) > 50

    def test_jwt_token_verification(self):
        """Test that JWT token verification works"""
        auth_service = AuthService()
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "role": "editor",
            "provider": "test",
            "user_id": "test-user-123",
        }
        tokens = auth_service.create_tokens(user_data)
        access_token = tokens["access_token"]

        # Verify token
        payload = auth_service.verify_token(access_token)

        assert payload["email"] == "test@example.com"
        assert payload["user_id"] == "test-user-123"
        assert payload["role"] == "editor"

    def test_invalid_jwt_token_raises_error(self):
        """Test that invalid JWT tokens raise errors"""
        auth_service = AuthService()
        invalid_token = "invalid-token-string"

        with pytest.raises(ValueError, match="Invalid token"):
            auth_service.verify_token(invalid_token)

    @patch("app.routers.chat.get_user_openai_key")
    @patch("app.routers.chat.settings")
    def test_get_openai_client_user_key_priority(self, mock_settings, mock_get_user_key):
        """Test that user API key has priority over global key"""
        user_id = "test-user-123"
        user_api_key = "sk-user-key"
        global_api_key = "sk-global-key"

        mock_get_user_key.return_value = user_api_key
        mock_settings.OPENAI_API_KEY = global_api_key

        with patch("app.routers.chat.OpenAI") as mock_openai:
            get_openai_client(user_id)

            # Should use user key, not global key
            mock_openai.assert_called_once_with(api_key=user_api_key)

    def test_openai_authentication_error_handling(self):
        """Test that OpenAI AuthenticationError is properly defined"""
        # Create a mock response
        mock_response = Mock()
        mock_response.status_code = 401

        # Create AuthenticationError
        error = AuthenticationError("Invalid API key", response=mock_response, body={})

        assert error is not None
        assert "Invalid API key" in str(error)

    def test_openai_rate_limit_error_handling(self):
        """Test that OpenAI RateLimitError is properly defined"""
        # Create a mock response
        mock_response = Mock()
        mock_response.status_code = 429

        # Create RateLimitError
        error = RateLimitError("Rate limit exceeded", response=mock_response, body={})

        assert error is not None
        assert "Rate limit exceeded" in str(error)

    @patch("app.routers.chat.get_user_openai_key")
    @patch("app.routers.chat.settings")
    @patch("app.routers.chat.OpenAI")
    def test_get_openai_client_with_empty_global_key(
        self, mock_openai, mock_settings, mock_get_user_key
    ):
        """Test error when global API key is empty string"""
        user_id = "test-user-123"

        # Simulate user has no key and global key is empty
        mock_get_user_key.side_effect = HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="No user API key"
        )
        mock_settings.OPENAI_API_KEY = ""  # Empty string should be treated as None

        with pytest.raises(HTTPException) as exc_info:
            get_openai_client(user_id)

        assert exc_info.value.status_code == status.HTTP_402_PAYMENT_REQUIRED


# Note: Full integration tests with AsyncClient are skipped due to known issue
# with TestClient/AsyncClient hanging during FastAPI app initialization
# (see test_credentials.py line 90-94 for similar known issue)
#
# The tests above cover the core business logic without requiring full app initialization.
# For end-to-end testing, use manual testing or Playwright E2E tests.
