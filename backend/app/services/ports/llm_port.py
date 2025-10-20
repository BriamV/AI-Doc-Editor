"""
LLM Port Interface
T-05: Planner Service - Hexagonal Architecture

Defines the contract for LLM integration.
Adapters implement this interface to integrate with specific LLM providers (OpenAI, etc.).
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class LLMPort(ABC):
    """
    Port interface for Large Language Model integration.

    This interface isolates the domain logic from specific LLM implementations.
    Adapters implement this interface to integrate with OpenAI, Anthropic, etc.
    """

    @abstractmethod
    async def generate_outline(
        self, prompt: str, max_headings: int, temperature: float, model: str, api_key: str
    ) -> Dict[str, Any]:
        """
        Generate document outline from user prompt.

        Args:
            prompt: User prompt describing desired document
            max_headings: Maximum number of headings to generate
            temperature: LLM temperature (0.0-2.0)
            model: LLM model identifier
            api_key: API key for authentication

        Returns:
            Dict containing:
                - outline: Parsed outline structure (list of heading nodes)
                - raw_response: Raw LLM response text
                - tokens_used: Total tokens consumed
                - model_used: Actual model used

        Raises:
            ValueError: Invalid parameters
            RuntimeError: LLM API error
        """
        pass

    @abstractmethod
    async def validate_api_key(self, api_key: str) -> bool:
        """
        Validate API key with LLM provider.

        Args:
            api_key: API key to validate

        Returns:
            True if API key is valid

        Raises:
            RuntimeError: API connectivity error
        """
        pass

    @abstractmethod
    def get_supported_models(self) -> List[str]:
        """
        Get list of supported LLM models.

        Returns:
            List of model identifiers (e.g., ["gpt-4o", "gpt-4o-mini"])
        """
        pass

    @abstractmethod
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for given text.

        Args:
            text: Text to estimate tokens for

        Returns:
            Estimated token count
        """
        pass
