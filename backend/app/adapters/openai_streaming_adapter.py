"""
OpenAI Streaming Adapter - Production implementation for LLM streaming.

T-06 ST2: Section Generation Service
Hexagonal Architecture - Adapter (Implementation) for OpenAI streaming.
"""

import logging
from typing import AsyncIterator
import openai
import tiktoken
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.ports.openai_streaming_port import OpenAIStreamingPort

logger = logging.getLogger(__name__)


class OpenAIStreamingAdapter(OpenAIStreamingPort):
    """
    Production adapter for OpenAI streaming operations.

    Uses OpenAI Python SDK for async streaming with retry logic for rate limits.
    Supports models: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, gpt-4o-mini.
    """

    SUPPORTED_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]

    def __init__(self):
        """Initialize OpenAI streaming adapter."""
        logger.info("OpenAIStreamingAdapter initialized")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(openai.RateLimitError),
        reraise=True,
    )
    async def stream_content(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
    ) -> AsyncIterator[str]:
        """
        Stream content generation from OpenAI API.

        Implements retry logic with exponential backoff for rate limits.
        - Attempt 1: Immediate
        - Attempt 2: Wait 2-4s
        - Attempt 3: Wait 4-10s

        Args:
            prompt: Full prompt (system + user context)
            model: OpenAI model name
            temperature: LLM temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            api_key: OpenAI API key

        Yields:
            Content chunks as they arrive from OpenAI

        Raises:
            ValueError: Invalid model or parameters
            RuntimeError: API error after retries
        """
        # Validate model
        if model not in self.SUPPORTED_MODELS:
            raise ValueError(
                f"Unsupported model: {model}. " f"Supported: {', '.join(self.SUPPORTED_MODELS)}"
            )

        # Validate parameters
        if not 0.0 <= temperature <= 2.0:
            raise ValueError(f"Invalid temperature: {temperature}. Must be 0.0-2.0")

        if max_tokens <= 0:
            raise ValueError(f"Invalid max_tokens: {max_tokens}. Must be > 0")

        logger.info(
            f"Streaming content from OpenAI: model={model}, "
            f"temperature={temperature}, max_tokens={max_tokens}"
        )

        try:
            # Create async OpenAI client
            client = openai.AsyncOpenAI(api_key=api_key)

            # Stream completion
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            # Yield chunks as they arrive
            chunk_count = 0
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    chunk_count += 1
                    yield content

            logger.info(f"Streaming complete: {chunk_count} chunks received")

        except openai.RateLimitError as e:
            logger.warning(f"Rate limit hit: {e}. Retrying with exponential backoff...")
            raise  # Retry handled by @retry decorator

        except openai.AuthenticationError as e:
            logger.error(f"Authentication failed: {e}")
            raise RuntimeError(f"OpenAI authentication failed: {str(e)}")

        except openai.APIConnectionError as e:
            logger.error(f"API connection error: {e}")
            raise RuntimeError(f"OpenAI API connection error: {str(e)}")

        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}", exc_info=True)
            raise RuntimeError(f"OpenAI streaming failed: {str(e)}")

    def estimate_tokens(self, text: str, model: str) -> int:
        """
        Estimate token count using tiktoken.

        Uses model-specific tokenizer for accurate estimates.

        Args:
            text: Text to tokenize
            model: OpenAI model name

        Returns:
            Estimated token count

        Raises:
            ValueError: Invalid model name
        """
        try:
            # Get encoding for model
            encoding = tiktoken.encoding_for_model(model)

            # Tokenize and count
            tokens = encoding.encode(text)
            token_count = len(tokens)

            logger.debug(f"Token estimate: {token_count} tokens for {len(text)} chars")

            return token_count

        except KeyError:
            # Fallback to cl100k_base for unknown models
            logger.warning(f"Unknown model '{model}' for tokenization, using cl100k_base fallback")
            encoding = tiktoken.get_encoding("cl100k_base")
            tokens = encoding.encode(text)
            return len(tokens)

        except Exception as e:
            logger.error(f"Token estimation error: {e}", exc_info=True)
            # Rough fallback: ~4 chars per token
            return len(text) // 4
