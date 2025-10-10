"""
Embedding Service for RAG Pipeline
T-04 ST3: OpenAI Embeddings Generation

Generates vector embeddings for text chunks using OpenAI's text-embedding-3-small model.
Handles batch processing, error recovery, and rate limiting.
"""

import logging
from typing import List, Dict, Any
from openai import OpenAI, APIError, RateLimitError, APIConnectionError
import time
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating text embeddings using OpenAI API.

    Features:
    - Uses text-embedding-3-small model (1536 dimensions)
    - Batch processing for efficiency
    - Automatic retry with exponential backoff
    - Rate limit handling
    - Cost tracking
    """

    def __init__(self, api_key: str = None):
        """
        Initialize embedding service.

        Args:
            api_key: OpenAI API key (optional, uses settings if not provided)
        """
        self.api_key = api_key or self._get_api_key()
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "text-embedding-3-small"  # 1536 dimensions, cost-effective
        self.max_tokens_per_request = 8191  # Model limit
        self.max_retries = 3
        self.retry_delay = 1.0  # Initial delay in seconds

    def _get_api_key(self) -> str:
        """Get OpenAI API key from settings or environment."""
        # Try to get from user-specific API keys first (T-41)
        # For now, use global setting
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            logger.warning("OpenAI API key not configured")
        return api_key

    def is_available(self) -> bool:
        """Check if embedding service is available."""
        return self.client is not None

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector

        Raises:
            ValueError: If service is not available or text is empty
            APIError: If OpenAI API fails after retries
        """
        if not self.is_available():
            raise ValueError("Embedding service not available (API key not configured)")

        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        embeddings = self.generate_embeddings([text])
        return embeddings[0]["embedding"]

    def generate_embeddings(
        self, texts: List[str], metadata: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate embeddings for multiple texts with retry logic.

        Args:
            texts: List of texts to embed
            metadata: Optional metadata for each text

        Returns:
            List of dicts with keys: 'text', 'embedding', 'metadata'

        Raises:
            ValueError: If service is not available or texts are invalid
            APIError: If OpenAI API fails after retries
        """
        if not self.is_available():
            raise ValueError("Embedding service not available (API key not configured)")

        if not texts:
            raise ValueError("Texts list cannot be empty")

        # Filter out empty texts
        valid_texts = [(i, text) for i, text in enumerate(texts) if text and text.strip()]

        if not valid_texts:
            raise ValueError("All texts are empty")

        logger.info(f"Generating embeddings for {len(valid_texts)} texts")

        # Prepare metadata
        if metadata is None:
            metadata = [{} for _ in texts]

        results = []
        for attempt in range(self.max_retries):
            try:
                # Create embeddings using OpenAI API
                response = self.client.embeddings.create(
                    model=self.model, input=[text for _, text in valid_texts]
                )

                # Process results
                for (original_idx, text), embedding_data in zip(valid_texts, response.data):
                    results.append(
                        {
                            "text": text,
                            "embedding": embedding_data.embedding,
                            "metadata": metadata[original_idx],
                            "model": self.model,
                            "dimensions": len(embedding_data.embedding),
                        }
                    )

                logger.info(
                    f"Successfully generated {len(results)} embeddings "
                    f"(tokens used: {response.usage.total_tokens})"
                )

                return results

            except RateLimitError as e:
                wait_time = self.retry_delay * (2**attempt)
                logger.warning(
                    f"Rate limit hit (attempt {attempt + 1}/{self.max_retries}). "
                    f"Waiting {wait_time}s..."
                )
                if attempt < self.max_retries - 1:
                    time.sleep(wait_time)
                else:
                    raise APIError(f"Rate limit exceeded after {self.max_retries} retries") from e

            except APIConnectionError as e:
                wait_time = self.retry_delay * (2**attempt)
                logger.warning(
                    f"Connection error (attempt {attempt + 1}/{self.max_retries}). "
                    f"Waiting {wait_time}s..."
                )
                if attempt < self.max_retries - 1:
                    time.sleep(wait_time)
                else:
                    raise APIError(
                        f"Connection failed after {self.max_retries} retries"
                    ) from e

            except APIError as e:
                logger.error(f"OpenAI API error: {str(e)}")
                raise

            except Exception as e:
                logger.error(f"Unexpected error generating embeddings: {str(e)}")
                raise APIError(f"Embedding generation failed: {str(e)}") from e

        raise APIError("Failed to generate embeddings after all retries")

    def get_embedding_dimensions(self) -> int:
        """Get the dimensionality of embeddings from this model."""
        return 1536  # text-embedding-3-small produces 1536-dimensional embeddings

    def estimate_cost(self, num_tokens: int) -> float:
        """
        Estimate cost for generating embeddings.

        Args:
            num_tokens: Number of tokens to embed

        Returns:
            Estimated cost in USD

        Note:
            text-embedding-3-small: $0.02 per 1M tokens
        """
        cost_per_million_tokens = 0.02
        return (num_tokens / 1_000_000) * cost_per_million_tokens
