"""
Integration tests for EmbeddingService
T-04-ST3: OpenAI embeddings integration tests with mocked responses
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from openai import RateLimitError, APITimeoutError, APIError

from app.services.embedding_service import EmbeddingService, EmbeddingError


class TestEmbeddingService:
    """Test suite for EmbeddingService with mocked OpenAI API"""

    @pytest.fixture
    def mock_openai_client(self):
        """Create a mock OpenAI client"""
        client = AsyncMock()
        client.embeddings = AsyncMock()
        client.embeddings.create = AsyncMock()
        return client

    @pytest.fixture
    def embedding_service(self, mock_openai_client):
        """Create EmbeddingService instance with mocked client"""
        service = EmbeddingService(api_key="test-key")
        service.client = mock_openai_client
        return service

    @pytest.fixture
    def mock_embedding_response(self):
        """Create a mock embedding response"""
        mock_response = MagicMock()
        mock_response.data = [MagicMock()]
        mock_response.data[0].embedding = [0.1] * 1536  # Mock 1536-dimensional vector
        mock_response.usage = MagicMock()
        mock_response.usage.total_tokens = 10
        return mock_response

    @pytest.mark.asyncio
    async def test_generate_embedding_success(
        self, embedding_service, mock_openai_client, mock_embedding_response
    ):
        """Test successful single embedding generation"""
        # Mock API response
        mock_openai_client.embeddings.create.return_value = mock_embedding_response

        # Generate embedding
        text = "This is a test document for embedding generation."
        embedding = await embedding_service.generate_embedding(text)

        # Assertions
        assert len(embedding) == 1536
        assert all(isinstance(val, float) for val in embedding)
        mock_openai_client.embeddings.create.assert_called_once()
        call_args = mock_openai_client.embeddings.create.call_args
        assert call_args[1]["input"] == text
        assert call_args[1]["model"] == "text-embedding-3-small"

    @pytest.mark.asyncio
    async def test_generate_embedding_empty_text(self, embedding_service):
        """Test embedding generation with empty text"""
        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embedding("")

        assert "empty" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embedding_text_too_long(self, embedding_service):
        """Test embedding generation with text exceeding token limit"""
        # Create a very long text (>8191 tokens = ~32764 characters)
        long_text = "a" * 40000

        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embedding(long_text)

        assert "too long" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embedding_rate_limit_error(self, embedding_service, mock_openai_client):
        """Test handling of rate limit errors"""
        # Mock rate limit error
        mock_openai_client.embeddings.create.side_effect = RateLimitError(
            "Rate limit exceeded",
            response=MagicMock(status_code=429),
            body=None,
        )

        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embedding("Test text")

        assert "rate limit" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embedding_timeout_error(self, embedding_service, mock_openai_client):
        """Test handling of timeout errors"""
        # Mock timeout error
        mock_openai_client.embeddings.create.side_effect = APITimeoutError(request=MagicMock())

        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embedding("Test text")

        assert "timeout" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embedding_api_error(self, embedding_service, mock_openai_client):
        """Test handling of general API errors"""
        # Mock API error
        mock_openai_client.embeddings.create.side_effect = APIError(
            "API error",
            request=MagicMock(),
            body=None,
        )

        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embedding("Test text")

        assert "api error" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_success(
        self, embedding_service, mock_openai_client, mock_embedding_response
    ):
        """Test successful batch embedding generation"""
        # Mock API response for batch
        mock_batch_response = MagicMock()
        mock_batch_response.data = [MagicMock() for _ in range(3)]
        for item in mock_batch_response.data:
            item.embedding = [0.1] * 1536
        mock_batch_response.usage = MagicMock()
        mock_batch_response.usage.total_tokens = 30

        mock_openai_client.embeddings.create.return_value = mock_batch_response

        # Generate batch embeddings
        texts = [
            "First document text",
            "Second document text",
            "Third document text",
        ]
        embeddings = await embedding_service.generate_embeddings_batch(texts)

        # Assertions
        assert len(embeddings) == 3
        assert all(len(emb) == 1536 for emb in embeddings)
        mock_openai_client.embeddings.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_empty_list(self, embedding_service):
        """Test batch embedding generation with empty list"""
        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embeddings_batch([])

        assert "empty" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_invalid_text(self, embedding_service):
        """Test batch embedding generation with invalid text"""
        texts = ["Valid text", "", "Another valid text"]  # Second text is empty

        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embeddings_batch(texts)

        assert "invalid" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_multiple_batches(
        self, embedding_service, mock_openai_client
    ):
        """Test batch embedding generation with multiple API calls"""
        # Set small batch size
        embedding_service.max_batch_size = 2

        # Mock API responses for multiple batches
        def create_batch_response(num_items):
            mock_response = MagicMock()
            mock_response.data = [MagicMock() for _ in range(num_items)]
            for item in mock_response.data:
                item.embedding = [0.1] * 1536
            mock_response.usage = MagicMock()
            mock_response.usage.total_tokens = num_items * 10
            return mock_response

        mock_openai_client.embeddings.create.side_effect = [
            create_batch_response(2),  # First batch
            create_batch_response(2),  # Second batch
            create_batch_response(1),  # Third batch (remaining)
        ]

        # Generate embeddings for 5 texts (should be split into 3 batches)
        texts = [f"Text {i}" for i in range(5)]
        embeddings = await embedding_service.generate_embeddings_batch(texts)

        # Assertions
        assert len(embeddings) == 5
        assert mock_openai_client.embeddings.create.call_count == 3

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_rate_limit_retry(
        self, embedding_service, mock_openai_client, mock_embedding_response
    ):
        """Test batch embedding with rate limit retry logic"""
        # Mock rate limit error on first call, success on second
        mock_batch_response = MagicMock()
        mock_batch_response.data = [MagicMock() for _ in range(2)]
        for item in mock_batch_response.data:
            item.embedding = [0.1] * 1536
        mock_batch_response.usage = MagicMock()
        mock_batch_response.usage.total_tokens = 20

        mock_openai_client.embeddings.create.side_effect = [
            RateLimitError("Rate limit exceeded", response=MagicMock(status_code=429), body=None),
            mock_batch_response,  # Success on retry
        ]

        # Generate embeddings
        texts = ["Text 1", "Text 2"]
        embeddings = await embedding_service.generate_embeddings_batch(
            texts, retry_on_rate_limit=True, max_retries=3
        )

        # Assertions
        assert len(embeddings) == 2
        assert mock_openai_client.embeddings.create.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_rate_limit_no_retry(
        self, embedding_service, mock_openai_client
    ):
        """Test batch embedding rate limit without retry"""
        # Mock rate limit error
        mock_openai_client.embeddings.create.side_effect = RateLimitError(
            "Rate limit exceeded",
            response=MagicMock(status_code=429),
            body=None,
        )

        # Generate embeddings without retry
        texts = ["Text 1", "Text 2"]
        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embeddings_batch(
                texts, retry_on_rate_limit=False, max_retries=1
            )

        assert "rate limit" in str(exc_info.value).lower()
        assert mock_openai_client.embeddings.create.call_count == 1

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_max_retries_exceeded(
        self, embedding_service, mock_openai_client
    ):
        """Test batch embedding fails after max retries"""
        # Mock rate limit error on all attempts
        mock_openai_client.embeddings.create.side_effect = RateLimitError(
            "Rate limit exceeded",
            response=MagicMock(status_code=429),
            body=None,
        )

        # Generate embeddings
        texts = ["Text 1", "Text 2"]
        with pytest.raises(EmbeddingError) as exc_info:
            await embedding_service.generate_embeddings_batch(
                texts, retry_on_rate_limit=True, max_retries=3
            )

        assert "rate limit" in str(exc_info.value).lower()
        assert mock_openai_client.embeddings.create.call_count == 3

    def test_get_model_info(self, embedding_service):
        """Test model information retrieval"""
        info = embedding_service.get_model_info()

        assert info["model"] == "text-embedding-3-small"
        assert info["dimensions"] == 1536
        assert info["max_batch_size"] == 100
        assert info["api_key_configured"] is True

    def test_initialization_without_api_key(self):
        """Test service initialization without API key"""
        with patch.dict("os.environ", {}, clear=True):
            service = EmbeddingService(api_key=None)

            # Service should initialize but client should be None
            assert service.client is None
            assert service.model == "text-embedding-3-small"

    @pytest.mark.asyncio
    async def test_generate_embedding_without_api_key(self):
        """Test embedding generation without configured API key"""
        with patch.dict("os.environ", {}, clear=True):
            service = EmbeddingService(api_key=None)

            with pytest.raises(EmbeddingError) as exc_info:
                await service.generate_embedding("Test text")

            assert "not configured" in str(exc_info.value).lower()

    def test_validate_text_whitespace_only(self, embedding_service):
        """Test text validation with whitespace-only text"""
        with pytest.raises(EmbeddingError) as exc_info:
            embedding_service._validate_text("   \n\t   ")

        assert "empty" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_embedding_preserves_text_content(
        self, embedding_service, mock_openai_client, mock_embedding_response
    ):
        """Test that text content is preserved during embedding generation"""
        mock_openai_client.embeddings.create.return_value = mock_embedding_response

        # Test with text that has leading/trailing whitespace
        original_text = "  This is test text with whitespace.  "
        await embedding_service.generate_embedding(original_text)

        # Verify API was called with stripped text
        call_args = mock_openai_client.embeddings.create.call_args
        assert call_args[1]["input"] == original_text.strip()

    def test_custom_model_configuration(self):
        """Test service initialization with custom model"""
        custom_service = EmbeddingService(
            api_key="test-key",
            model="text-embedding-3-large",
            max_batch_size=50,
        )

        assert custom_service.model == "text-embedding-3-large"
        assert custom_service.max_batch_size == 50

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_maintains_order(
        self, embedding_service, mock_openai_client
    ):
        """Test that batch embeddings maintain input order"""
        # Create unique embeddings for each text
        mock_batch_response = MagicMock()
        mock_batch_response.data = [MagicMock() for _ in range(3)]
        mock_batch_response.data[0].embedding = [0.1] * 1536
        mock_batch_response.data[1].embedding = [0.2] * 1536
        mock_batch_response.data[2].embedding = [0.3] * 1536
        mock_batch_response.usage = MagicMock()
        mock_batch_response.usage.total_tokens = 30

        mock_openai_client.embeddings.create.return_value = mock_batch_response

        # Generate embeddings
        texts = ["First", "Second", "Third"]
        embeddings = await embedding_service.generate_embeddings_batch(texts)

        # Verify order is preserved
        assert embeddings[0][0] == 0.1
        assert embeddings[1][0] == 0.2
        assert embeddings[2][0] == 0.3
