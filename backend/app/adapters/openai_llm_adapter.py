"""
OpenAI LLM Adapter
T-05: Planner Service - Hexagonal Architecture

Implements LLMPort interface for OpenAI API integration.
Handles outline generation using GPT-4o/GPT-4-turbo/GPT-3.5-turbo.
"""

import json
import logging
import tiktoken
from typing import List, Dict, Any
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, AuthenticationError

from app.services.ports.llm_port import LLMPort
from app.models.planner import HeadingNode

logger = logging.getLogger(__name__)


class OpenAILLMAdapter(LLMPort):
    """
    OpenAI implementation of LLMPort.

    Integrates with OpenAI API to generate document outlines using GPT models.
    Implements structured JSON output for reliable outline parsing.
    """

    def __init__(self):
        """Initialize OpenAI adapter with supported models."""
        self.supported_models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]

        # System prompt for outline generation
        self.system_prompt = """You are an expert document planner. Generate structured document outlines in JSON format.

Your task: Create a hierarchical outline (H1, H2, H3 headings) based on the user's prompt.

Requirements:
1. Use proper hierarchy: H1 -> H2 -> H3 (no skipping levels)
2. Generate clear, descriptive heading text
3. Create logical flow and structure
4. Limit total headings to requested maximum

Output format (JSON):
{
  "headings": [
    {
      "level": 1,
      "text": "Main Section Title",
      "children": [
        {
          "level": 2,
          "text": "Subsection Title",
          "children": [
            {
              "level": 3,
              "text": "Sub-subsection Title",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no explanatory text."""

    async def generate_outline(
        self, prompt: str, max_headings: int, temperature: float, model: str, api_key: str
    ) -> Dict[str, Any]:
        """
        Generate document outline using OpenAI API.

        Args:
            prompt: User prompt describing desired document
            max_headings: Maximum number of headings to generate
            temperature: LLM temperature (0.0-2.0)
            model: OpenAI model identifier
            api_key: OpenAI API key

        Returns:
            Dict containing:
                - outline: List of HeadingNode objects
                - raw_response: Raw LLM response text
                - tokens_used: Total tokens consumed
                - model_used: Actual model used

        Raises:
            ValueError: Invalid parameters
            RuntimeError: OpenAI API error
        """
        if model not in self.supported_models:
            raise ValueError(
                f"Model {model} not supported. Use: {', '.join(self.supported_models)}"
            )

        # Build user prompt with constraints
        user_prompt = f"""{prompt}

Generate a document outline with maximum {max_headings} headings total.
Use hierarchical structure (H1 -> H2 -> H3).
Return ONLY valid JSON following the specified format."""

        try:
            logger.info(
                f"Generating outline with {model} (max_headings: {max_headings}, temp: {temperature})"
            )

            # Create OpenAI client
            client = AsyncOpenAI(api_key=api_key)

            # Generate outline with JSON mode
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=2000,  # Sufficient for outlines
                response_format={"type": "json_object"},  # Force JSON output
            )

            # Extract response
            raw_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None

            logger.info(f"Outline generated successfully (tokens: {tokens_used})")

            # Parse JSON response
            try:
                outline_data = json.loads(raw_response)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                raise RuntimeError(f"LLM returned invalid JSON: {str(e)}")

            # Convert to HeadingNode objects
            outline = self._parse_outline_data(outline_data)

            return {
                "outline": outline,
                "raw_response": raw_response,
                "tokens_used": tokens_used,
                "model_used": model,
            }

        except AuthenticationError as e:
            logger.error(f"OpenAI authentication failed: {e}")
            raise RuntimeError("Invalid OpenAI API key")

        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise RuntimeError("OpenAI API rate limit exceeded. Please try again later.")

        except APIConnectionError as e:
            logger.error(f"OpenAI connection error: {e}")
            raise RuntimeError(
                "Failed to connect to OpenAI API. Please check your internet connection."
            )

        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise RuntimeError(f"OpenAI API error: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error generating outline: {e}", exc_info=True)
            raise RuntimeError(f"Failed to generate outline: {str(e)}")

    def _parse_outline_data(self, data: Dict[str, Any]) -> List[HeadingNode]:
        """
        Parse JSON outline data into HeadingNode objects.

        Args:
            data: JSON data from LLM response

        Returns:
            List of HeadingNode objects

        Raises:
            ValueError: Invalid outline structure
        """
        if "headings" not in data:
            raise ValueError("Outline data missing 'headings' field")

        headings = data["headings"]
        if not isinstance(headings, list):
            raise ValueError("'headings' must be a list")

        try:
            return [self._parse_heading_node(h) for h in headings]
        except Exception as e:
            logger.error(f"Failed to parse heading nodes: {e}")
            raise ValueError(f"Invalid heading structure: {str(e)}")

    def _parse_heading_node(self, node: Dict[str, Any]) -> HeadingNode:
        """
        Parse single heading node from JSON.

        Args:
            node: JSON heading node data

        Returns:
            HeadingNode object

        Raises:
            ValueError: Invalid node structure
        """
        if not isinstance(node, dict):
            raise ValueError("Heading node must be a dict")

        if "level" not in node or "text" not in node:
            raise ValueError("Heading node missing required fields (level, text)")

        # Parse children recursively
        children = []
        if "children" in node and isinstance(node["children"], list):
            children = [self._parse_heading_node(child) for child in node["children"]]

        return HeadingNode(level=node["level"], text=node["text"], children=children)

    async def validate_api_key(self, api_key: str) -> bool:
        """
        Validate OpenAI API key.

        Args:
            api_key: OpenAI API key to validate

        Returns:
            True if API key is valid

        Raises:
            RuntimeError: API connectivity error
        """
        try:
            client = AsyncOpenAI(api_key=api_key)

            # Make minimal API call to validate key
            await client.models.list()

            logger.info("API key validation successful")
            return True

        except AuthenticationError:
            logger.warning("API key validation failed: invalid key")
            return False

        except Exception as e:
            logger.error(f"API key validation error: {e}")
            raise RuntimeError(f"Failed to validate API key: {str(e)}")

    def get_supported_models(self) -> List[str]:
        """
        Get list of supported OpenAI models.

        Returns:
            List of model identifiers
        """
        return self.supported_models

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for given text using tiktoken.

        Args:
            text: Text to estimate tokens for

        Returns:
            Estimated token count
        """
        try:
            # Use cl100k_base encoding (GPT-4o, GPT-4-turbo, GPT-3.5-turbo)
            encoding = tiktoken.get_encoding("cl100k_base")
            tokens = encoding.encode(text)
            return len(tokens)
        except Exception as e:
            logger.warning(f"Token estimation failed: {e}. Using fallback estimate.")
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4
