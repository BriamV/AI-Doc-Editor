"""
Unit tests for chat router
GitHub Issue #29: Backend chat proxy endpoint
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from openai import AuthenticationError, RateLimitError, APIConnectionError, APIError

from app.main import app
from app.routers.chat import get_openai_client


client = TestClient(app)


class TestChatRouter:
    """Tests for chat proxy endpoint"""

    def test_health_check(self):
        """Test chat service health check endpoint"""
        response = client.get("/api/chat/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "chat"
        assert data["status"] == "operational"
        assert data["streaming_supported"] is True
        assert "supported_models" in data

    @patch("app.routers.chat.get_user_openai_key")
    @patch("app.routers.chat.OpenAI")
    def test_get_openai_client_with_user_key(self, mock_openai, mock_get_user_key):
        """Test OpenAI client creation with user-specific API key"""
        user_id = "test-user-123"
        user_api_key = "sk-user-test-key"
        mock_get_user_key.return_value = user_api_key

        client_instance = get_openai_client(user_id)

        mock_get_user_key.assert_called_once_with(user_id)
        mock_openai.assert_called_once_with(api_key=user_api_key)

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

        client_instance = get_openai_client(user_id)

        mock_openai.assert_called_once_with(api_key=global_api_key)

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

    @patch("app.routers.chat.get_current_user_id")
    @patch("app.routers.chat.get_openai_client")
    def test_create_chat_completion_non_streaming(self, mock_get_client, mock_get_user_id):
        """Test non-streaming chat completion"""
        user_id = "test-user-123"
        mock_get_user_id.return_value = user_id

        # Mock OpenAI response
        mock_completion = Mock()
        mock_completion.model_dump.return_value = {
            "id": "chatcmpl-test",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4o-mini",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": "Hello! How can I help you?"},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        }
        mock_completion.usage.total_tokens = 30

        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_completion
        mock_get_client.return_value = mock_client

        # Make request
        request_data = {
            "messages": [{"role": "user", "content": "Hello"}],
            "model": "gpt-4o-mini",
            "stream": False,
        }

        response = client.post(
            "/api/chat/completions",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "chatcmpl-test"
        assert data["choices"][0]["message"]["content"] == "Hello! How can I help you?"

    @patch("app.routers.chat.get_current_user_id")
    @patch("app.routers.chat.get_openai_client")
    def test_create_chat_completion_streaming(self, mock_get_client, mock_get_user_id):
        """Test streaming chat completion"""
        user_id = "test-user-123"
        mock_get_user_id.return_value = user_id

        # Mock streaming response
        mock_chunk1 = Mock()
        mock_chunk1.model_dump.return_value = {
            "id": "chatcmpl-test",
            "choices": [{"delta": {"content": "Hello"}}],
        }

        mock_chunk2 = Mock()
        mock_chunk2.model_dump.return_value = {
            "id": "chatcmpl-test",
            "choices": [{"delta": {"content": "!"}}],
        }

        mock_client = Mock()
        mock_client.chat.completions.create.return_value = iter([mock_chunk1, mock_chunk2])
        mock_get_client.return_value = mock_client

        # Make streaming request
        request_data = {
            "messages": [{"role": "user", "content": "Hello"}],
            "model": "gpt-4o-mini",
            "stream": True,
        }

        response = client.post(
            "/api/chat/completions",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    @patch("app.routers.chat.get_current_user_id")
    @patch("app.routers.chat.get_openai_client")
    def test_create_chat_completion_authentication_error(self, mock_get_client, mock_get_user_id):
        """Test handling of authentication errors"""
        user_id = "test-user-123"
        mock_get_user_id.return_value = user_id

        # Mock authentication error
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = AuthenticationError(
            "Invalid API key", response=Mock(), body={}
        )
        mock_get_client.return_value = mock_client

        request_data = {
            "messages": [{"role": "user", "content": "Hello"}],
            "model": "gpt-4o-mini",
            "stream": False,
        }

        response = client.post(
            "/api/chat/completions",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 401
        data = response.json()
        assert "authentication_failed" in data["detail"]["error"]

    @patch("app.routers.chat.get_current_user_id")
    @patch("app.routers.chat.get_openai_client")
    def test_create_chat_completion_rate_limit_error(self, mock_get_client, mock_get_user_id):
        """Test handling of rate limit errors"""
        user_id = "test-user-123"
        mock_get_user_id.return_value = user_id

        # Mock rate limit error
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = RateLimitError(
            "Rate limit exceeded", response=Mock(), body={}
        )
        mock_get_client.return_value = mock_client

        request_data = {
            "messages": [{"role": "user", "content": "Hello"}],
            "model": "gpt-4o-mini",
            "stream": False,
        }

        response = client.post(
            "/api/chat/completions",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 429
        data = response.json()
        assert "rate_limit_exceeded" in data["detail"]["error"]

    def test_create_chat_completion_invalid_request(self):
        """Test validation of invalid chat request"""
        request_data = {
            "messages": [],  # Empty messages list should fail validation
            "model": "gpt-4o-mini",
        }

        response = client.post(
            "/api/chat/completions",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        # Should fail due to validation
        assert response.status_code in [400, 422]

    def test_create_chat_completion_no_auth_token(self):
        """Test request without authentication token"""
        request_data = {
            "messages": [{"role": "user", "content": "Hello"}],
            "model": "gpt-4o-mini",
        }

        response = client.post("/api/chat/completions", json=request_data)

        # Should fail due to missing authentication
        assert response.status_code == 403
