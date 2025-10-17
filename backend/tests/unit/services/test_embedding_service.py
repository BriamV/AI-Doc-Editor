"""
Unit tests for EmbeddingService (T-04 ST3).

Tests OpenAI embeddings generation with proper mocking,
error handling, retry logic, and batch processing.

Coverage areas:
- Single and batch embedding generation
- Service availability checks
- Error handling (rate limits, connection errors, API errors)
- Empty text validation
- Retry logic with exponential backoff
"""

import pytest
from unittest.mock import Mock, patch
from openai import APIError, RateLimitError, APIConnectionError

from app.services.embedding_service import EmbeddingService


class TestEmbeddingServiceInitialization:
    """Test service initialization with different API key configurations."""

    @patch("app.services.embedding_service.OpenAI")
    def test_init_with_user_api_key(self, mock_openai_class):
        """Test initialization with user-provided API key."""
        mock_client = Mock()
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="user-key-123")

        assert service.user_api_key == "user-key-123"
        assert service.api_key == "user-key-123"
        assert service.client == mock_client
        mock_openai_class.assert_called_once_with(api_key="user-key-123")

    @patch("app.services.embedding_service.OpenAI")
    @patch("app.services.embedding_service.settings")
    def test_init_with_global_api_key(self, mock_settings, mock_openai_class):
        """Test initialization falls back to global settings API key."""
        mock_settings.OPENAI_API_KEY = "global-key-456"
        mock_client = Mock()
        mock_openai_class.return_value = mock_client

        service = EmbeddingService()

        assert service.user_api_key is None
        assert service.api_key == "global-key-456"
        assert service.client == mock_client
        mock_openai_class.assert_called_once_with(api_key="global-key-456")

    @patch("app.services.embedding_service.OpenAI")
    @patch("app.services.embedding_service.settings")
    def test_init_without_api_key(self, mock_settings, mock_openai_class):
        """Test initialization without any API key configured."""
        mock_settings.OPENAI_API_KEY = None
        mock_openai_class.return_value = None

        service = EmbeddingService()

        assert service.api_key is None
        assert service.client is None
        # Should not call OpenAI constructor with None
        mock_openai_class.assert_not_called()

    def test_init_sets_correct_model_parameters(self):
        """Test initialization sets correct model and parameters."""
        service = EmbeddingService(api_key="test-key")

        assert service.model == "text-embedding-3-small"
        assert service.max_tokens_per_request == 8191
        assert service.max_retries == 3
        assert service.retry_delay == 1.0

    def test_get_embedding_dimensions(self):
        """Test get_embedding_dimensions returns correct value."""
        service = EmbeddingService(api_key="test-key")

        dimensions = service.get_embedding_dimensions()

        assert dimensions == 1536


class TestServiceAvailability:
    """Test service availability checks."""

    @patch("app.services.embedding_service.OpenAI")
    def test_is_available_with_api_key(self, mock_openai_class):
        """Test is_available returns True when API key is configured."""
        mock_openai_class.return_value = Mock()
        service = EmbeddingService(api_key="test-key")

        assert service.is_available() is True

    @patch("app.services.embedding_service.settings")
    def test_is_available_without_api_key(self, mock_settings):
        """Test is_available returns False when no API key configured."""
        mock_settings.OPENAI_API_KEY = None
        service = EmbeddingService()

        assert service.is_available() is False


class TestSingleEmbeddingGeneration:
    """Test generating embeddings for single texts."""

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embedding_success(self, mock_openai_class):
        """Test successful single embedding generation."""
        mock_client = Mock()
        mock_embedding_data = Mock()
        mock_embedding_data.embedding = [0.1] * 1536

        mock_response = Mock()
        mock_response.data = [mock_embedding_data]
        mock_response.usage.total_tokens = 10

        mock_client.embeddings.create.return_value = mock_response
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")
        embedding = service.generate_embedding("Test text")

        assert isinstance(embedding, list)
        assert len(embedding) == 1536
        assert all(isinstance(x, float) for x in embedding)
        mock_client.embeddings.create.assert_called_once()

    @patch("app.services.embedding_service.settings")
    def test_generate_embedding_not_available(self, mock_settings):
        """Test generate_embedding fails when service not available."""
        mock_settings.OPENAI_API_KEY = None
        service = EmbeddingService()

        with pytest.raises(ValueError, match="Embedding service not available"):
            service.generate_embedding("Test text")

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embedding_empty_text(self, mock_openai_class):
        """Test generate_embedding fails with empty text."""
        mock_openai_class.return_value = Mock()
        service = EmbeddingService(api_key="test-key")

        with pytest.raises(ValueError, match="Text cannot be empty"):
            service.generate_embedding("")

        with pytest.raises(ValueError, match="Text cannot be empty"):
            service.generate_embedding("   ")


class TestBatchEmbeddingGeneration:
    """Test generating embeddings for multiple texts."""

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_success(self, mock_openai_class, sample_chunks):
        """Test successful batch embedding generation."""
        mock_client = Mock()

        # Create multiple mock embedding responses
        mock_response_data = []
        for i in range(len(sample_chunks)):
            mock_data = Mock()
            mock_data.embedding = [0.1 * (i + 1)] * 1536
            mock_response_data.append(mock_data)

        mock_response = Mock()
        mock_response.data = mock_response_data
        mock_response.usage.total_tokens = 50

        mock_client.embeddings.create.return_value = mock_response
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")
        results = service.generate_embeddings(sample_chunks)

        assert isinstance(results, list)
        assert len(results) == len(sample_chunks)

        for i, result in enumerate(results):
            assert "text" in result
            assert "embedding" in result
            assert "metadata" in result
            assert "model" in result
            assert "dimensions" in result
            assert result["text"] == sample_chunks[i]
            assert len(result["embedding"]) == 1536
            assert result["model"] == "text-embedding-3-small"

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_with_metadata(
        self, mock_openai_class, sample_chunks, sample_metadata
    ):
        """Test batch embedding generation with custom metadata."""
        mock_client = Mock()

        mock_response_data = [Mock(embedding=[0.1] * 1536) for _ in sample_chunks]
        mock_response = Mock()
        mock_response.data = mock_response_data
        mock_response.usage.total_tokens = 50

        mock_client.embeddings.create.return_value = mock_response
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")
        results = service.generate_embeddings(sample_chunks, metadata=sample_metadata)

        assert len(results) == len(sample_chunks)
        for i, result in enumerate(results):
            assert result["metadata"] == sample_metadata[i]

    @patch("app.services.embedding_service.settings")
    def test_generate_embeddings_not_available(self, mock_settings):
        """Test generate_embeddings fails when service not available."""
        mock_settings.OPENAI_API_KEY = None
        service = EmbeddingService()

        with pytest.raises(ValueError, match="Embedding service not available"):
            service.generate_embeddings(["text1", "text2"])

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_empty_list(self, mock_openai_class):
        """Test generate_embeddings fails with empty text list."""
        mock_openai_class.return_value = Mock()
        service = EmbeddingService(api_key="test-key")

        with pytest.raises(ValueError, match="Texts list cannot be empty"):
            service.generate_embeddings([])

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_all_empty_texts(self, mock_openai_class):
        """Test generate_embeddings fails when all texts are empty."""
        mock_openai_class.return_value = Mock()
        service = EmbeddingService(api_key="test-key")

        with pytest.raises(ValueError, match="All texts are empty"):
            service.generate_embeddings(["", "  ", "\n\t"])

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_filters_empty_texts(self, mock_openai_class):
        """Test generate_embeddings filters out empty texts."""
        mock_client = Mock()

        # Only create response for valid (non-empty) texts
        mock_response_data = [
            Mock(embedding=[0.1] * 1536),
            Mock(embedding=[0.2] * 1536),
        ]
        mock_response = Mock()
        mock_response.data = mock_response_data
        mock_response.usage.total_tokens = 20

        mock_client.embeddings.create.return_value = mock_response
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")
        # Mix of valid and empty texts
        results = service.generate_embeddings(["text1", "", "text2", "  "])

        # Should only return results for valid texts
        assert len(results) == 2


class TestErrorHandling:
    """Test error handling and retry logic."""

    def _create_mock_rate_limit_error(self):
        """Helper to create properly structured RateLimitError."""
        mock_response = Mock()
        mock_response.status_code = 429
        return RateLimitError(
            "Rate limit exceeded",
            response=mock_response,
            body={"error": {"message": "Rate limit exceeded"}},
        )

    def _create_mock_connection_error(self):
        """Helper to create properly structured APIConnectionError."""
        return APIConnectionError(request=Mock())

    @patch("app.services.embedding_service.OpenAI")
    @patch("app.services.embedding_service.time.sleep")  # Mock sleep to speed up tests
    def test_generate_embeddings_rate_limit_retry(self, mock_sleep, mock_openai_class):
        """Test retry logic on rate limit errors."""
        mock_client = Mock()

        # Fail twice with rate limit, then succeed
        mock_response = Mock()
        mock_response.data = [Mock(embedding=[0.1] * 1536)]
        mock_response.usage.total_tokens = 10

        rate_limit_error = self._create_mock_rate_limit_error()

        mock_client.embeddings.create.side_effect = [
            rate_limit_error,
            rate_limit_error,
            mock_response,
        ]

        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")
        results = service.generate_embeddings(["Test text"])

        # Should succeed after retries
        assert len(results) == 1
        assert mock_client.embeddings.create.call_count == 3
        # Sleep should be called twice (for 2 failures)
        assert mock_sleep.call_count == 2

    @patch("app.services.embedding_service.OpenAI")
    @patch("app.services.embedding_service.time.sleep")
    def test_generate_embeddings_rate_limit_exhausted(self, mock_sleep, mock_openai_class):
        """Test failure after exhausting all retries on rate limits."""
        mock_client = Mock()
        rate_limit_error = self._create_mock_rate_limit_error()
        mock_client.embeddings.create.side_effect = rate_limit_error
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")

        with pytest.raises(Exception):  # Will raise generic Exception from retry logic
            service.generate_embeddings(["Test text"])

        # Should try max_retries times
        assert mock_client.embeddings.create.call_count == 3

    @patch("app.services.embedding_service.OpenAI")
    @patch("app.services.embedding_service.time.sleep")
    def test_generate_embeddings_connection_error_retry(self, mock_sleep, mock_openai_class):
        """Test retry logic on connection errors."""
        mock_client = Mock()

        mock_response = Mock()
        mock_response.data = [Mock(embedding=[0.1] * 1536)]
        mock_response.usage.total_tokens = 10

        connection_error = self._create_mock_connection_error()

        # Fail once with connection error, then succeed
        mock_client.embeddings.create.side_effect = [
            connection_error,
            mock_response,
        ]

        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")
        results = service.generate_embeddings(["Test text"])

        assert len(results) == 1
        assert mock_client.embeddings.create.call_count == 2

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_api_error_no_retry(self, mock_openai_class):
        """Test APIError (non-retryable) raises immediately."""
        mock_client = Mock()
        # Use properly structured APIError (body and request are required)
        mock_request = Mock()
        api_error = APIError("Invalid API key", body=None, request=mock_request)
        mock_client.embeddings.create.side_effect = api_error
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")

        with pytest.raises(APIError):
            service.generate_embeddings(["Test text"])

        # Should not retry on general API errors
        assert mock_client.embeddings.create.call_count == 1

    @patch("app.services.embedding_service.OpenAI")
    def test_generate_embeddings_unexpected_error(self, mock_openai_class):
        """Test unexpected errors are caught and logged."""
        mock_client = Mock()
        mock_client.embeddings.create.side_effect = Exception("Unexpected error")
        mock_openai_class.return_value = mock_client

        service = EmbeddingService(api_key="test-key")

        # The service catches unexpected errors and raises generic Exception
        with pytest.raises(Exception):
            service.generate_embeddings(["Test text"])


class TestCostEstimation:
    """Test cost estimation functionality."""

    def test_estimate_cost_small_batch(self):
        """Test cost estimation for small token counts."""
        service = EmbeddingService(api_key="test-key")

        cost = service.estimate_cost(1000)  # 1K tokens

        # text-embedding-3-small: $0.02 per 1M tokens
        expected_cost = (1000 / 1_000_000) * 0.02
        assert cost == expected_cost
        assert cost == 0.00002

    def test_estimate_cost_large_batch(self):
        """Test cost estimation for large token counts."""
        service = EmbeddingService(api_key="test-key")

        cost = service.estimate_cost(500_000)  # 500K tokens

        expected_cost = (500_000 / 1_000_000) * 0.02
        assert cost == expected_cost
        assert cost == 0.01

    def test_estimate_cost_zero_tokens(self):
        """Test cost estimation for zero tokens."""
        service = EmbeddingService(api_key="test-key")

        cost = service.estimate_cost(0)

        assert cost == 0.0
