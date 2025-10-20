"""
Planner Router - POST /api/plan
T-05: Planner Service (/plan endpoint)

FastAPI router for document outline generation.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.models.planner import PlanRequest, PlanResponse
from app.services.planner_service import PlannerService
from app.adapters.openai_llm_adapter import OpenAILLMAdapter
from app.adapters.rule_based_validator import RuleBasedOutlineValidator
from app.routers.credentials import get_user_openai_key
from app.routers.upload import get_current_user_id
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/plan", tags=["planner"])
security = HTTPBearer()


def get_planner_service() -> PlannerService:
    """
    Dependency injection for PlannerService.

    Creates service instance with configured adapters.

    Returns:
        PlannerService instance
    """
    # Initialize adapters
    llm_adapter = OpenAILLMAdapter()
    validator_adapter = RuleBasedOutlineValidator(
        min_headings=3, min_heading_length=5, max_heading_length=150, min_avg_heading_length=15
    )

    # Create service
    service = PlannerService(
        llm_port=llm_adapter,
        validator_port=validator_adapter,
        quality_threshold=0.5,  # Minimum quality score
        enable_fallback=True,  # Enable single-shot fallback
    )

    return service


def get_user_api_key(user_id: str) -> str:
    """
    Get OpenAI API key for user.

    Priority:
    1. User's stored API key
    2. Global API key (fallback)

    Args:
        user_id: User ID from JWT token

    Returns:
        OpenAI API key

    Raises:
        HTTPException 402: No API key configured
    """
    api_key = None

    # Try user's API key first
    try:
        api_key = get_user_openai_key(user_id)
        logger.info(f"Using user-specific API key for planner (user: {user_id})")
    except HTTPException as e:
        if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
            # User hasn't configured key, try global fallback
            api_key = getattr(settings, "OPENAI_API_KEY", None)
            if api_key:
                logger.info(f"Using global API key for planner (user: {user_id})")
            else:
                # No API key available
                logger.warning(f"No API key available for planner (user: {user_id})")
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error": "no_api_key",
                        "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator.",
                    },
                )
        else:
            # Re-raise unexpected errors
            raise

    # Validate key exists
    if not api_key:
        logger.warning(f"No API key available for planner (user: {user_id})")
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "no_api_key",
                "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator.",
            },
        )

    return api_key


@router.post("", response_model=PlanResponse, status_code=status.HTTP_200_OK)
async def create_plan(
    request: PlanRequest,
    user_id: str = Depends(get_current_user_id),
    service: PlannerService = Depends(get_planner_service),
):
    """
    Generate document outline from user prompt.

    **Authorization:** Requires valid JWT token (Bearer token in Authorization header)

    **API Key Priority:**
    1. User's stored API key (from user settings)
    2. Global API key (fallback if user hasn't configured their own)

    **Request Body:**
    ```json
    {
      "prompt": "Write a comprehensive guide about machine learning for beginners",
      "max_headings": 15,
      "temperature": 0.7,
      "model": "gpt-4o-mini"
    }
    ```

    **Response (Success):**
    ```json
    {
      "outline": {
        "headings": [
          {
            "level": 1,
            "text": "Introduction to Machine Learning",
            "children": [
              {
                "level": 2,
                "text": "What is Machine Learning?",
                "children": []
              }
            ]
          }
        ],
        "total_headings": 12
      },
      "quality_metrics": {
        "total_headings": 12,
        "h1_count": 3,
        "h2_count": 6,
        "h3_count": 3,
        "avg_heading_length": 45.5,
        "max_depth": 3,
        "is_hierarchical": true,
        "quality_score": 0.85
      },
      "generation_mode": "outline-guided",
      "model_used": "gpt-4o-mini",
      "tokens_used": 450,
      "generation_time_ms": 850
    }
    ```

    **Generation Modes:**
    - `outline-guided`: Primary mode with structured outline generation
    - `single-shot`: Fallback mode when outline-guided quality is insufficient

    **Quality Metrics:**
    - `quality_score`: Overall quality (0.0-1.0)
      - 0.8-1.0: Excellent
      - 0.6-0.8: Good
      - 0.4-0.6: Acceptable
      - <0.4: Poor (triggers fallback if enabled)
    - `is_hierarchical`: Whether outline has valid H1→H2→H3 structure
    - `total_headings`: Total number of headings across all levels

    **Performance Requirement:**
    - Target response time: ≤ 1 second

    **Errors:**
    - 400: Invalid request format or parameters
    - 401: Invalid/missing JWT token
    - 402: No API key configured (user or global)
    - 429: OpenAI rate limit exceeded
    - 500: Internal server error or outline generation failure
    """
    try:
        logger.info(
            f"Plan request from user {user_id}: "
            f"prompt_length={len(request.prompt)}, max_headings={request.max_headings}, "
            f"model={request.model}"
        )

        # Get API key (user or global fallback)
        api_key = get_user_api_key(user_id)

        # Generate plan
        response = await service.generate_plan(request, api_key)

        logger.info(
            f"Plan generated successfully for user {user_id}: "
            f"mode={response.generation_mode}, quality={response.quality_metrics.quality_score}, "
            f"time={response.generation_time_ms}ms"
        )

        return response

    except HTTPException:
        # Re-raise HTTP exceptions (already formatted)
        raise

    except ValueError as e:
        # Invalid request parameters
        logger.error(f"Invalid plan request from user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_request", "message": f"Invalid request: {str(e)}"},
        )

    except RuntimeError as e:
        # LLM API errors or generation failures
        error_msg = str(e)
        logger.error(f"Plan generation error for user {user_id}: {error_msg}")

        # Determine appropriate status code
        if "API key" in error_msg or "authentication" in error_msg.lower():
            status_code = status.HTTP_401_UNAUTHORIZED
            error_type = "authentication_failed"
        elif "rate limit" in error_msg.lower():
            status_code = status.HTTP_429_TOO_MANY_REQUESTS
            error_type = "rate_limit_exceeded"
        elif "connection" in error_msg.lower():
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            error_type = "connection_error"
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            error_type = "generation_failed"

        raise HTTPException(
            status_code=status_code, detail={"error": error_type, "message": error_msg}
        )

    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error generating plan for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred during plan generation. Please try again later.",
            },
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def planner_health_check():
    """
    Health check endpoint for planner service.

    Returns:
        Service status information
    """
    return {
        "service": "planner",
        "status": "operational",
        "supported_models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        "generation_modes": ["outline-guided", "single-shot"],
        "quality_threshold": 0.5,
        "fallback_enabled": True,
    }
