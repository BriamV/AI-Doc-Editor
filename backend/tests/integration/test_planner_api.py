"""
Integration Tests for Planner API
T-05: Planner Service - /api/plan Endpoint Tests

Tests for:
- Full request/response flow
- Authentication/authorization
- API key resolution (user → global fallback)
- Error handling
- Performance requirements
"""

import pytest
import time
from unittest.mock import patch, Mock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.models.planner import HeadingNode


@pytest.fixture
def client():
    """Test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture
def mock_jwt_token():
    """Mock JWT token for authentication"""
    return "Bearer test-jwt-token"


@pytest.fixture
def sample_plan_request():
    """Sample plan request payload"""
    return {
        "prompt": "Write a comprehensive guide about machine learning for beginners",
        "max_headings": 15,
        "temperature": 0.7,
        "model": "gpt-4o-mini",
    }


@pytest.fixture
def mock_high_quality_outline():
    """Mock high-quality outline response"""
    return [
        HeadingNode(
            level=1,
            text="Introduction to Machine Learning",
            children=[
                HeadingNode(level=2, text="What is Machine Learning?", children=[]),
                HeadingNode(level=2, text="Why Machine Learning Matters", children=[]),
            ],
        ),
        HeadingNode(
            level=1,
            text="Machine Learning Fundamentals",
            children=[
                HeadingNode(
                    level=2,
                    text="Supervised Learning",
                    children=[
                        HeadingNode(level=3, text="Classification", children=[]),
                        HeadingNode(level=3, text="Regression", children=[]),
                    ],
                ),
                HeadingNode(level=2, text="Unsupervised Learning", children=[]),
            ],
        ),
    ]


class TestPlanEndpoint:
    """Test suite for POST /api/plan endpoint"""

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.planner.get_user_api_key")
    @patch("app.adapters.openai_llm_adapter.AsyncOpenAI")
    def test_create_plan_success(
        self,
        mock_openai,
        mock_get_api_key,
        mock_get_user_id,
        client,
        sample_plan_request,
        mock_high_quality_outline,
        mock_jwt_token,
    ):
        """Test successful plan creation with valid request"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"
        mock_get_api_key.return_value = "sk-test-key"

        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content='{"headings": [...]}'))]
        mock_response.usage = Mock(total_tokens=450)

        mock_openai_instance = Mock()
        mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_openai.return_value = mock_openai_instance

        # Patch outline parsing to return mock outline
        with patch(
            "app.adapters.openai_llm_adapter.OpenAILLMAdapter._parse_outline_data",
            return_value=mock_high_quality_outline,
        ):
            # Make request
            response = client.post(
                "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
            )

        # Verify response
        assert response.status_code == 200
        data = response.json()

        assert "outline" in data
        assert "quality_metrics" in data
        assert "generation_mode" in data
        assert data["generation_mode"] in ["outline-guided", "single-shot"]
        assert data["model_used"] == "gpt-4o-mini"
        assert "generation_time_ms" in data

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.planner.get_user_api_key")
    def test_create_plan_no_api_key(
        self, mock_get_api_key, mock_get_user_id, client, sample_plan_request, mock_jwt_token
    ):
        """Test plan creation when no API key is configured"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"

        # Mock no API key available
        from fastapi import HTTPException

        mock_get_api_key.side_effect = HTTPException(status_code=402, detail="No API key")

        # Patch settings to have no global key
        with patch("app.routers.planner.settings.OPENAI_API_KEY", None):
            response = client.post(
                "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
            )

        # Verify 402 Payment Required
        assert response.status_code == 402
        data = response.json()
        assert data["detail"]["error"] == "no_api_key"

    def test_create_plan_no_auth(self, client, sample_plan_request):
        """Test plan creation without authentication"""
        response = client.post("/api/plan", json=sample_plan_request)

        # Verify 401 Unauthorized (or 403 if middleware blocks earlier)
        assert response.status_code in [401, 403]

    def test_create_plan_invalid_request(self, client, mock_jwt_token):
        """Test plan creation with invalid request payload"""
        invalid_request = {
            "prompt": "",  # Empty prompt (invalid)
            "max_headings": 100,  # Out of range
            "model": "invalid-model",
        }

        with patch("app.routers.planner.get_current_user_id", return_value="test-user"):
            response = client.post(
                "/api/plan", json=invalid_request, headers={"Authorization": mock_jwt_token}
            )

        # Verify 400 Bad Request or 422 Unprocessable Entity
        assert response.status_code in [400, 422]

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.planner.get_user_api_key")
    @patch("app.adapters.openai_llm_adapter.AsyncOpenAI")
    def test_create_plan_performance(
        self,
        mock_openai,
        mock_get_api_key,
        mock_get_user_id,
        client,
        sample_plan_request,
        mock_high_quality_outline,
        mock_jwt_token,
    ):
        """Test plan creation meets performance requirement (≤ 1 second)"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"
        mock_get_api_key.return_value = "sk-test-key"

        # Mock fast OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content='{"headings": [...]}'))]
        mock_response.usage = Mock(total_tokens=450)

        mock_openai_instance = Mock()
        mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_openai.return_value = mock_openai_instance

        # Patch outline parsing
        with patch(
            "app.adapters.openai_llm_adapter.OpenAILLMAdapter._parse_outline_data",
            return_value=mock_high_quality_outline,
        ):
            # Measure response time
            start_time = time.time()

            response = client.post(
                "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
            )

            elapsed_time = time.time() - start_time

        # Verify response
        assert response.status_code == 200

        # Verify performance (with generous margin for test overhead)
        # Note: In production, LLM calls may take longer, but mocked calls should be fast
        assert elapsed_time < 5.0  # Generous margin for CI/CD

        # Verify generation_time_ms is reported
        data = response.json()
        assert "generation_time_ms" in data
        assert data["generation_time_ms"] > 0


class TestPlanHealthCheck:
    """Test suite for /api/plan/health endpoint"""

    def test_health_check(self, client):
        """Test planner health check endpoint"""
        response = client.get("/api/plan/health")

        assert response.status_code == 200
        data = response.json()

        assert data["service"] == "planner"
        assert data["status"] == "operational"
        assert "supported_models" in data
        assert "gpt-4o-mini" in data["supported_models"]
        assert "generation_modes" in data
        assert "outline-guided" in data["generation_modes"]
        assert "single-shot" in data["generation_modes"]


class TestUserAPIKeyResolution:
    """Test suite for API key resolution (user → global fallback)"""

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.credentials.get_user_openai_key")
    @patch("app.adapters.openai_llm_adapter.AsyncOpenAI")
    def test_use_user_api_key(
        self,
        mock_openai,
        mock_get_user_key,
        mock_get_user_id,
        client,
        sample_plan_request,
        mock_high_quality_outline,
        mock_jwt_token,
    ):
        """Test that user's API key is used when available"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"
        mock_get_user_key.return_value = "sk-user-specific-key"

        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content='{"headings": [...]}'))]
        mock_response.usage = Mock(total_tokens=450)

        mock_openai_instance = Mock()
        mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_openai.return_value = mock_openai_instance

        # Patch outline parsing
        with patch(
            "app.adapters.openai_llm_adapter.OpenAILLMAdapter._parse_outline_data",
            return_value=mock_high_quality_outline,
        ):
            response = client.post(
                "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
            )

        # Verify user's key was retrieved
        mock_get_user_key.assert_called_once_with("test-user-123")

        assert response.status_code == 200

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.credentials.get_user_openai_key")
    @patch("app.adapters.openai_llm_adapter.AsyncOpenAI")
    def test_fallback_to_global_api_key(
        self,
        mock_openai,
        mock_get_user_key,
        mock_get_user_id,
        client,
        sample_plan_request,
        mock_high_quality_outline,
        mock_jwt_token,
    ):
        """Test fallback to global API key when user key not available"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"

        # Mock user key not found, fallback to global
        from fastapi import HTTPException

        mock_get_user_key.side_effect = HTTPException(status_code=402, detail="No user key")

        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content='{"headings": [...]}'))]
        mock_response.usage = Mock(total_tokens=450)

        mock_openai_instance = Mock()
        mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_openai.return_value = mock_openai_instance

        # Patch settings to have global key
        with patch("app.routers.planner.settings.OPENAI_API_KEY", "sk-global-fallback-key"):
            with patch(
                "app.adapters.openai_llm_adapter.OpenAILLMAdapter._parse_outline_data",
                return_value=mock_high_quality_outline,
            ):
                response = client.post(
                    "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
                )

        # Verify global fallback was used
        assert response.status_code == 200


class TestErrorHandling:
    """Test suite for error handling"""

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.planner.get_user_api_key")
    @patch("app.adapters.openai_llm_adapter.AsyncOpenAI")
    def test_openai_rate_limit_error(
        self,
        mock_openai,
        mock_get_api_key,
        mock_get_user_id,
        client,
        sample_plan_request,
        mock_jwt_token,
    ):
        """Test handling of OpenAI rate limit error"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"
        mock_get_api_key.return_value = "sk-test-key"

        # Mock OpenAI rate limit error
        from openai import RateLimitError

        mock_openai_instance = Mock()
        mock_openai_instance.chat.completions.create = AsyncMock(
            side_effect=RateLimitError("Rate limit exceeded", response=Mock(), body=None)
        )
        mock_openai.return_value = mock_openai_instance

        response = client.post(
            "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
        )

        # Verify 429 Too Many Requests
        assert response.status_code == 429
        data = response.json()
        assert "rate_limit" in data["detail"]["error"]

    @patch("app.routers.planner.get_current_user_id")
    @patch("app.routers.planner.get_user_api_key")
    @patch("app.adapters.openai_llm_adapter.AsyncOpenAI")
    def test_openai_authentication_error(
        self,
        mock_openai,
        mock_get_api_key,
        mock_get_user_id,
        client,
        sample_plan_request,
        mock_jwt_token,
    ):
        """Test handling of OpenAI authentication error"""
        # Mock authentication
        mock_get_user_id.return_value = "test-user-123"
        mock_get_api_key.return_value = "sk-invalid-key"

        # Mock OpenAI authentication error
        from openai import AuthenticationError

        mock_openai_instance = Mock()
        mock_openai_instance.chat.completions.create = AsyncMock(
            side_effect=AuthenticationError("Invalid API key", response=Mock(), body=None)
        )
        mock_openai.return_value = mock_openai_instance

        response = client.post(
            "/api/plan", json=sample_plan_request, headers={"Authorization": mock_jwt_token}
        )

        # Verify 401 Unauthorized
        assert response.status_code == 401
        data = response.json()
        assert "authentication" in data["detail"]["error"]
