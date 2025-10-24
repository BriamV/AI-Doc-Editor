"""
Summary Port - Interface for summary generation operations.

T-06 ST3: Global Summary Refresh
Hexagonal Architecture - Port (Interface) for summary generation.
"""

from abc import ABC, abstractmethod
from typing import List


class SummaryPort(ABC):
    """
    Port (interface) for summary generation operations.

    Defines the contract for generating document summaries from sections.
    Business logic depends on this interface, not concrete implementations.

    Implementations:
        - SummaryAdapter: Production implementation using OpenAI SDK
        - MockSummaryAdapter: Test implementation for unit tests
    """

    @abstractmethod
    async def generate_summary(
        self,
        sections: List[str],
        max_tokens: int,
        api_key: str,
        previous_summary: str | None = None,
    ) -> str:
        """
        Generate a concise summary from document sections.

        Implements incremental summary strategy:
        - If previous_summary exists: Update summary with new sections
        - If previous_summary is None: Create fresh summary from all sections

        Args:
            sections: List of section content strings to summarize
            max_tokens: Maximum tokens for generated summary
            api_key: OpenAI API key
            previous_summary: Optional previous summary for incremental updates

        Returns:
            Generated summary text (≤max_tokens)

        Raises:
            RuntimeError: API error, rate limiting, or network issues
        """
        pass
