"""
Planner Service - Domain Logic
T-05: Planner Service (/plan endpoint)

Hexagonal Architecture - Domain Layer
Coordinates outline generation, validation, and fallback logic.
"""

import logging
import time
from typing import Dict, Any, Optional

from app.services.ports.llm_port import LLMPort
from app.services.ports.outline_validator_port import OutlineValidatorPort
from app.models.planner import (
    PlanRequest,
    PlanResponse,
    DocumentOutline,
    QualityMetrics,
)

logger = logging.getLogger(__name__)


class PlannerService:
    """
    Planner Service - Domain Logic

    Implements "Outline-Guided Thought Generation" with quality-based fallback.

    Architecture:
    - Uses LLMPort for outline generation (adapter pattern)
    - Uses OutlineValidatorPort for quality validation (adapter pattern)
    - Implements domain logic: generation → validation → fallback if needed

    Workflow:
    1. Generate outline using LLM (outline-guided mode)
    2. Validate outline quality
    3. If quality < threshold, fallback to single-shot mode
    4. Return best outline with metadata
    """

    def __init__(
        self,
        llm_port: LLMPort,
        validator_port: OutlineValidatorPort,
        quality_threshold: float = 0.5,
        enable_fallback: bool = True,
    ):
        """
        Initialize planner service.

        Args:
            llm_port: LLM integration adapter
            validator_port: Outline validation adapter
            quality_threshold: Minimum quality score (0.0-1.0)
            enable_fallback: Whether to enable fallback to single-shot mode
        """
        self.llm_port = llm_port
        self.validator_port = validator_port
        self.quality_threshold = quality_threshold
        self.enable_fallback = enable_fallback

        logger.info(
            f"PlannerService initialized (quality_threshold={quality_threshold}, "
            f"fallback={'enabled' if enable_fallback else 'disabled'})"
        )

    async def generate_plan(self, request: PlanRequest, api_key: str) -> PlanResponse:
        """
        Generate document outline with quality validation and fallback.

        Args:
            request: Plan generation request
            api_key: OpenAI API key for LLM access

        Returns:
            PlanResponse with generated outline and metadata

        Raises:
            ValueError: Invalid request parameters
            RuntimeError: LLM API error or generation failure
        """
        logger.info(
            f"Generating plan for prompt: '{request.prompt[:50]}...' "
            f"(max_headings={request.max_headings}, model={request.model})"
        )

        start_time = time.time()

        # Try outline-guided generation first
        try:
            outline_result = await self._generate_outline_guided(
                prompt=request.prompt,
                max_headings=request.max_headings,
                temperature=request.temperature,
                model=request.model,
                api_key=api_key,
            )

            outline = outline_result["outline"]
            tokens_used = outline_result["tokens_used"]
            model_used = outline_result["model_used"]

            # Validate outline quality
            metrics = self.validator_port.validate_outline(outline)

            # Check if quality meets threshold
            if self.validator_port.meets_quality_threshold(metrics, self.quality_threshold):
                # Quality sufficient - return outline-guided result
                generation_time_ms = int((time.time() - start_time) * 1000)

                logger.info(
                    f"Outline-guided generation successful "
                    f"(quality={metrics.quality_score}, time={generation_time_ms}ms)"
                )

                return PlanResponse(
                    outline=outline,
                    quality_metrics=metrics,
                    generation_mode="outline-guided",
                    model_used=model_used,
                    tokens_used=tokens_used,
                    generation_time_ms=generation_time_ms,
                )

            else:
                # Quality insufficient - try fallback if enabled
                logger.warning(
                    f"Outline quality below threshold "
                    f"(score={metrics.quality_score}, threshold={self.quality_threshold})"
                )

                if not self.enable_fallback:
                    # Fallback disabled - return low-quality outline
                    generation_time_ms = int((time.time() - start_time) * 1000)

                    logger.warning("Fallback disabled, returning low-quality outline")

                    return PlanResponse(
                        outline=outline,
                        quality_metrics=metrics,
                        generation_mode="outline-guided",
                        model_used=model_used,
                        tokens_used=tokens_used,
                        generation_time_ms=generation_time_ms,
                    )

                # Try single-shot fallback
                return await self._generate_with_fallback(
                    request=request,
                    api_key=api_key,
                    original_metrics=metrics,
                    start_time=start_time,
                )

        except Exception as e:
            logger.error(f"Outline-guided generation failed: {e}", exc_info=True)

            # If fallback enabled, try single-shot mode
            if self.enable_fallback:
                logger.info("Attempting single-shot fallback after error")
                return await self._generate_with_fallback(
                    request=request, api_key=api_key, original_metrics=None, start_time=start_time
                )
            else:
                # No fallback - raise error
                raise RuntimeError(f"Outline generation failed: {str(e)}")

    async def _generate_outline_guided(
        self, prompt: str, max_headings: int, temperature: float, model: str, api_key: str
    ) -> Dict[str, Any]:
        """
        Generate outline using outline-guided mode.

        Args:
            prompt: User prompt
            max_headings: Maximum headings
            temperature: LLM temperature
            model: LLM model
            api_key: API key

        Returns:
            Dict with outline, tokens_used, model_used
        """
        logger.debug("Generating outline in outline-guided mode")

        # Generate outline using LLM
        llm_result = await self.llm_port.generate_outline(
            prompt=prompt,
            max_headings=max_headings,
            temperature=temperature,
            model=model,
            api_key=api_key,
        )

        # Convert list of HeadingNode to DocumentOutline
        headings = llm_result["outline"]

        # Count total headings
        def count_headings(nodes):
            count = len(nodes)
            for node in nodes:
                count += count_headings(node.children)
            return count

        total = count_headings(headings)

        outline = DocumentOutline(headings=headings, total_headings=total)

        return {
            "outline": outline,
            "tokens_used": llm_result["tokens_used"],
            "model_used": llm_result["model_used"],
        }

    async def _generate_with_fallback(
        self,
        request: PlanRequest,
        api_key: str,
        original_metrics: Optional[QualityMetrics],
        start_time: float,
    ) -> PlanResponse:
        """
        Generate outline using single-shot fallback mode.

        Single-shot mode uses simplified prompt without strict structure requirements.
        Intended as fallback when outline-guided mode produces low-quality results.

        Args:
            request: Original plan request
            api_key: API key
            original_metrics: Original quality metrics (if available)
            start_time: Generation start time

        Returns:
            PlanResponse with fallback result
        """
        logger.info("Attempting single-shot fallback generation")

        try:
            # Simplify prompt for single-shot mode
            fallback_prompt = f"""Generate a simple document outline for: {request.prompt}

Create a basic structure with main sections (H1) and subsections (H2).
Keep it straightforward and focused."""

            # Generate with lower temperature for more focused output
            fallback_result = await self._generate_outline_guided(
                prompt=fallback_prompt,
                max_headings=min(request.max_headings, 15),  # Reduce max headings
                temperature=max(request.temperature - 0.2, 0.3),  # Lower temperature
                model=request.model,
                api_key=api_key,
            )

            outline = fallback_result["outline"]
            tokens_used = fallback_result["tokens_used"]
            model_used = fallback_result["model_used"]

            # Validate fallback outline
            metrics = self.validator_port.validate_outline(outline)

            generation_time_ms = int((time.time() - start_time) * 1000)

            logger.info(
                f"Single-shot fallback successful "
                f"(quality={metrics.quality_score}, time={generation_time_ms}ms)"
            )

            return PlanResponse(
                outline=outline,
                quality_metrics=metrics,
                generation_mode="single-shot",
                model_used=model_used,
                tokens_used=tokens_used,
                generation_time_ms=generation_time_ms,
            )

        except Exception as e:
            logger.error(f"Single-shot fallback failed: {e}", exc_info=True)

            # If fallback also fails, return error
            raise RuntimeError(
                f"Both outline-guided and single-shot modes failed. " f"Original error: {str(e)}"
            )

    def get_validation_report(self, metrics: QualityMetrics) -> str:
        """
        Get human-readable validation report.

        Args:
            metrics: Quality metrics to report

        Returns:
            Validation report string
        """
        return self.validator_port.get_validation_report(metrics)

    def get_quality_issues(self, metrics: QualityMetrics) -> Dict[str, Any]:
        """
        Get specific quality issues detected.

        Args:
            metrics: Quality metrics to analyze

        Returns:
            Dict of quality issues
        """
        return self.validator_port.get_quality_issues(metrics)
