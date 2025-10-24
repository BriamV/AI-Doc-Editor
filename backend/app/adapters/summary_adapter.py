"""
Summary Adapter - Production implementation for summary generation.

T-06 ST3: Global Summary Refresh
Hexagonal Architecture - Adapter (Implementation) for OpenAI-based summaries.
"""

import logging
from typing import List
import openai
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.ports.summary_port import SummaryPort

logger = logging.getLogger(__name__)


class SummaryAdapter(SummaryPort):
    """
    Production adapter for summary generation using OpenAI.

    Uses gpt-3.5-turbo for fast, cost-effective summaries.
    Implements incremental summary strategy for performance (<500ms target).

    Performance characteristics:
    - Model: gpt-3.5-turbo (faster than gpt-4)
    - Max tokens: 200 (concise summaries)
    - Retry: 2 attempts with exponential backoff
    - Target: p95 latency ≤500ms
    """

    DEFAULT_MODEL = "gpt-3.5-turbo"
    SUMMARY_TEMPERATURE = 0.3  # Lower temperature for consistent, factual summaries

    def __init__(self, model: str = DEFAULT_MODEL):
        """
        Initialize summary adapter.

        Args:
            model: OpenAI model for summaries (default: gpt-3.5-turbo)
        """
        self.model = model
        logger.info(f"SummaryAdapter initialized (model={model})")

    @retry(
        stop=stop_after_attempt(2),  # Only 2 attempts for performance
        wait=wait_exponential(multiplier=0.5, min=1, max=3),  # Fast retry: 1s, 3s
        retry=retry_if_exception_type(openai.RateLimitError),
        reraise=True,
    )
    async def generate_summary(
        self,
        sections: List[str],
        max_tokens: int,
        api_key: str,
        previous_summary: str | None = None,
    ) -> str:
        """
        Generate summary using OpenAI with incremental strategy.

        Incremental strategy (recommended):
        - If previous_summary exists: "Update this summary to include new sections"
        - Otherwise: "Summarize all these sections from scratch"

        This approach optimizes performance by processing only new content
        when possible, targeting <500ms p95 latency.

        Args:
            sections: List of section content strings
            max_tokens: Max tokens for summary (typically 200)
            api_key: OpenAI API key
            previous_summary: Optional previous summary for incremental update

        Returns:
            Generated summary text

        Raises:
            RuntimeError: API error after retries
        """
        if not sections:
            logger.warning("No sections provided for summary generation")
            return ""

        logger.info(
            f"Generating summary: {len(sections)} sections, "
            f"incremental={previous_summary is not None}, max_tokens={max_tokens}"
        )

        try:
            # Create async OpenAI client
            client = openai.AsyncOpenAI(api_key=api_key)

            # Build prompt based on strategy
            if previous_summary:
                # Incremental update (faster, only new sections)
                prompt = self._build_incremental_prompt(previous_summary, sections)
            else:
                # Fresh summary (all sections)
                prompt = self._build_fresh_prompt(sections)

            logger.debug(f"Summary prompt length: {len(prompt)} chars")

            # Generate summary
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional document summarizer. "
                        "Create concise, accurate summaries that capture key points.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=self.SUMMARY_TEMPERATURE,
                max_tokens=max_tokens,
            )

            summary = response.choices[0].message.content.strip()

            logger.info(
                f"Summary generated: {len(summary)} chars, "
                f"tokens_used={response.usage.total_tokens if response.usage else 'unknown'}"
            )

            return summary

        except openai.RateLimitError as e:
            logger.warning(f"Rate limit hit during summary generation: {e}. Retrying...")
            raise  # Retry handled by @retry decorator

        except openai.AuthenticationError as e:
            logger.error(f"Authentication failed during summary: {e}")
            raise RuntimeError(f"OpenAI authentication failed: {str(e)}")

        except openai.APIConnectionError as e:
            logger.error(f"API connection error during summary: {e}")
            raise RuntimeError(f"OpenAI API connection error: {str(e)}")

        except Exception as e:
            logger.error(f"Summary generation error: {e}", exc_info=True)
            raise RuntimeError(f"Summary generation failed: {str(e)}")

    def _build_incremental_prompt(self, previous_summary: str, new_sections: List[str]) -> str:
        """
        Build prompt for incremental summary update.

        Optimizes performance by only processing new sections.

        Args:
            previous_summary: Existing summary of earlier sections
            new_sections: New section content to incorporate

        Returns:
            Formatted prompt for LLM
        """
        # Combine new sections
        new_content = "\n\n---\n\n".join(new_sections)

        prompt = f"""Update the following document summary to incorporate the new sections below.

CURRENT SUMMARY:
{previous_summary}

NEW SECTIONS TO INCORPORATE:
{new_content}

INSTRUCTIONS:
- Update the summary to include key points from the new sections
- Keep the summary concise (2-3 sentences maximum)
- Maintain coherence with the existing summary
- Focus on the most important information

UPDATED SUMMARY:"""

        return prompt

    def _build_fresh_prompt(self, sections: List[str]) -> str:
        """
        Build prompt for fresh summary generation.

        Used when no previous summary exists.

        Args:
            sections: All section content to summarize

        Returns:
            Formatted prompt for LLM
        """
        # Combine all sections
        all_content = "\n\n---\n\n".join(sections)

        prompt = f"""Summarize the following document sections into a concise overview.

DOCUMENT SECTIONS:
{all_content}

INSTRUCTIONS:
- Create a summary that captures the main topics and key points
- Keep the summary concise (2-3 sentences maximum)
- Use clear, professional language
- Focus on the most important information

SUMMARY:"""

        return prompt
