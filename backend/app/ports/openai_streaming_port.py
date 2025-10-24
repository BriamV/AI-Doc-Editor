"""
OpenAI Streaming Port - Interface for LLM streaming operations.

T-06 ST2: Section Generation Service
Hexagonal Architecture - Port (Interface) for streaming content generation.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator


class OpenAIStreamingPort(ABC):
    """
    Port (interface) for OpenAI streaming operations.

    Defines the contract for streaming content generation from LLM providers.
    Business logic depends on this interface, not concrete implementations.

    Implementations:
        - OpenAIStreamingAdapter: Production implementation using OpenAI SDK
        - MockStreamingAdapter: Test implementation for unit tests
    """

    @abstractmethod
    async def stream_content(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
    ) -> AsyncIterator[str]:
        """
        Stream content generation from LLM.

        Yields content chunks as they arrive from the LLM API.
        Used for real-time streaming to WebSocket clients.

        Args:
            prompt: System + user prompt for content generation
            model: OpenAI model name (e.g., "gpt-4o", "gpt-4o-mini")
            temperature: LLM temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            api_key: OpenAI API key

        Yields:
            Content chunks (strings) as they arrive from LLM

        Raises:
            RuntimeError: API error, rate limiting, or network issues
        """
        pass

    @abstractmethod
    def estimate_tokens(self, text: str, model: str) -> int:
        """
        Estimate token count for text using model's tokenizer.

        Used for quota tracking and prompt optimization.

        Args:
            text: Text to estimate tokens for
            model: OpenAI model name (for tokenizer selection)

        Returns:
            Estimated token count

        Raises:
            ValueError: Invalid model name
        """
        pass
