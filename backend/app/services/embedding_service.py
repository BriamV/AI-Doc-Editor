"""
Embedding service for OpenAI text embeddings
T-04-ST3: OpenAI embeddings integration for RAG pipeline
"""

import logging
import asyncio
from typing import List, Optional
from openai import AsyncOpenAI, OpenAIError, APIError, RateLimitError, APITimeoutError

from app.core.config import settings
from app.services.credentials import credentials_service

logger = logging.getLogger(__name__)


class EmbeddingError(Exception):
    """Custom exception for embedding generation failures"""

    pass


class EmbeddingService:
    """
    Service for generating text embeddings using OpenAI API
    Supports single and batch embedding generation with error handling
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        max_batch_size: Optional[int] = None,
    ):
        """
        Initialize embedding service with OpenAI client

        Args:
            api_key: OpenAI API key (if not provided, tries to get from credentials service)
            model: OpenAI embedding model to use (default: from settings)
            max_batch_size: Maximum batch size for embeddings (default: from settings)
        """
        # Get API key from credentials service or parameter
        self.api_key = api_key or self._get_api_key_from_credentials()

        if not self.api_key:
            logger.warning("No OpenAI API key configured - embedding generation will fail")

        # Initialize async OpenAI client
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

        # Configuration
        self.model = model or settings.OPENAI_EMBEDDING_MODEL
        self.max_batch_size = max_batch_size or settings.OPENAI_MAX_BATCH_SIZE
        self.embedding_dimensions = settings.OPENAI_EMBEDDING_DIMENSIONS

        logger.info(
            f"EmbeddingService initialized: model={self.model}, "
            f"max_batch_size={self.max_batch_size}, "
            f"dimensions={self.embedding_dimensions}"
        )

    def _get_api_key_from_credentials(self) -> Optional[str]:
        """
        Get OpenAI API key from credentials service

        Returns:
            Decrypted API key or None if not available
        """
        try:
            # TODO: Integration with T-41 credential storage
            # For now, try to get from environment via credentials service
            # This is a placeholder for future integration
            import os

            encrypted_key = os.getenv("OPENAI_API_KEY_ENCRYPTED")
            if encrypted_key:
                return credentials_service.decrypt_api_key(encrypted_key)

            # Fallback to plain API key (for development only)
            plain_key = os.getenv("OPENAI_API_KEY")
            if plain_key:
                logger.warning("Using plain OPENAI_API_KEY - should be encrypted in production")
                return plain_key

            return None

        except Exception as e:
            logger.error(f"Failed to get API key from credentials service: {str(e)}")
            return None

    def _validate_api_key(self) -> None:
        """
        Validate that API key is configured

        Raises:
            EmbeddingError: If API key is not configured
        """
        if not self.api_key or not self.client:
            raise EmbeddingError(
                "OpenAI API key not configured. Set OPENAI_API_KEY environment variable "
                "or configure via credentials service."
            )

    def _validate_text(self, text: str) -> None:
        """
        Validate input text

        Args:
            text: Text to validate

        Raises:
            EmbeddingError: If text is invalid
        """
        if not text or not text.strip():
            raise EmbeddingError("Text cannot be empty")

        # OpenAI token limit is ~8191 tokens for text-embedding-3-small
        # Rough estimate: 1 token ≈ 4 characters
        max_chars = 8191 * 4
        if len(text) > max_chars:
            raise EmbeddingError(
                f"Text too long: {len(text)} characters " f"(max ~{max_chars} for {self.model})"
            )

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text

        Args:
            text: Text to generate embedding for

        Returns:
            List of float values representing the embedding vector

        Raises:
            EmbeddingError: If embedding generation fails
        """
        self._validate_api_key()
        self._validate_text(text)

        logger.info(f"Generating embedding for text: {len(text)} characters")

        try:
            # Call OpenAI embeddings API
            response = await self.client.embeddings.create(
                model=self.model,
                input=text.strip(),
                encoding_format="float",  # Default format
            )

            # Extract embedding vector
            embedding = response.data[0].embedding

            logger.info(
                f"Embedding generated successfully: {len(embedding)} dimensions, "
                f"usage={response.usage.total_tokens} tokens"
            )

            return embedding

        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {str(e)}")
            raise EmbeddingError(f"Rate limit exceeded: {str(e)}")

        except APITimeoutError as e:
            logger.error(f"OpenAI API timeout: {str(e)}")
            raise EmbeddingError(f"API timeout: {str(e)}")

        except APIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise EmbeddingError(f"API error: {str(e)}")

        except OpenAIError as e:
            logger.error(f"OpenAI error: {str(e)}")
            raise EmbeddingError(f"OpenAI error: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error generating embedding: {str(e)}")
            raise EmbeddingError(f"Failed to generate embedding: {str(e)}")

    async def generate_embeddings_batch(
        self, texts: List[str], retry_on_rate_limit: bool = True, max_retries: int = 3
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts with batch processing

        Args:
            texts: List of texts to generate embeddings for
            retry_on_rate_limit: Whether to retry on rate limit errors
            max_retries: Maximum number of retries for rate limit errors

        Returns:
            List of embedding vectors (one per input text)

        Raises:
            EmbeddingError: If batch embedding generation fails
        """
        self._validate_api_key()

        if not texts:
            raise EmbeddingError("Text list cannot be empty")

        logger.info(f"Generating embeddings for batch: {len(texts)} texts")

        # Validate all texts
        for i, text in enumerate(texts):
            try:
                self._validate_text(text)
            except EmbeddingError as e:
                raise EmbeddingError(f"Text {i} is invalid: {str(e)}")

        # Process in batches if needed
        all_embeddings = []
        batch_count = (len(texts) + self.max_batch_size - 1) // self.max_batch_size

        for batch_idx in range(batch_count):
            start_idx = batch_idx * self.max_batch_size
            end_idx = min(start_idx + self.max_batch_size, len(texts))
            batch_texts = texts[start_idx:end_idx]

            logger.debug(
                f"Processing batch {batch_idx + 1}/{batch_count}: " f"{len(batch_texts)} texts"
            )

            # Retry logic for rate limits
            for attempt in range(max_retries):
                try:
                    # Call OpenAI embeddings API with batch
                    response = await self.client.embeddings.create(
                        model=self.model,
                        input=[text.strip() for text in batch_texts],
                        encoding_format="float",
                    )

                    # Extract embeddings (maintain input order)
                    batch_embeddings = [item.embedding for item in response.data]
                    all_embeddings.extend(batch_embeddings)

                    logger.info(
                        f"Batch {batch_idx + 1} complete: {len(batch_embeddings)} embeddings, "
                        f"usage={response.usage.total_tokens} tokens"
                    )

                    break  # Success - exit retry loop

                except RateLimitError as e:
                    if not retry_on_rate_limit or attempt == max_retries - 1:
                        logger.error(f"Rate limit exceeded after {attempt + 1} attempts")
                        raise EmbeddingError(f"Rate limit exceeded: {str(e)}")

                    # Exponential backoff: 1s, 2s, 4s
                    wait_time = 2**attempt
                    logger.warning(
                        f"Rate limit hit, retrying in {wait_time}s "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(wait_time)

                except (APITimeoutError, APIError, OpenAIError) as e:
                    logger.error(f"Error processing batch {batch_idx + 1}: {str(e)}")
                    raise EmbeddingError(f"Batch processing failed: {str(e)}")

        logger.info(f"Batch embedding generation complete: {len(all_embeddings)} embeddings")

        return all_embeddings

    def get_model_info(self) -> dict:
        """
        Get information about the configured embedding model

        Returns:
            Dictionary with model information
        """
        return {
            "model": self.model,
            "dimensions": self.embedding_dimensions,
            "max_batch_size": self.max_batch_size,
            "api_key_configured": bool(self.api_key),
        }


# Global instance (can be customized per request if needed)
embedding_service = EmbeddingService()
