"""
Chat proxy endpoint for OpenAI API
GitHub Issue #29: Backend chat proxy endpoint

Proxies chat requests to OpenAI using user's stored API key or global fallback.
Provides unified API key management and secure credential handling.
"""

import logging
import json
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer
from openai import OpenAI, APIError, RateLimitError, APIConnectionError, AuthenticationError

from app.models.chat import ChatRequest
from app.routers.credentials import get_user_openai_key
from app.routers.upload import get_current_user_id
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])
security = HTTPBearer()


def get_openai_client(user_id: str) -> OpenAI:
    """
    Get OpenAI client with appropriate API key.

    Priority:
    1. User's stored API key (from credentials system)
    2. Global API key from settings (fallback)

    Args:
        user_id: User ID from JWT token

    Returns:
        Configured OpenAI client

    Raises:
        HTTPException 402: No API key configured (user or global)
    """
    api_key = None

    # Try to get user's API key first
    try:
        api_key = get_user_openai_key(user_id)
        logger.info(f"Using user-specific API key for chat (user: {user_id})")
    except HTTPException as e:
        if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
            # User hasn't configured their own key, try global fallback
            api_key = getattr(settings, "OPENAI_API_KEY", None)
            if api_key:
                logger.info(f"Using global API key for chat (user: {user_id})")
            else:
                # No API key available at all
                logger.warning(f"No API key available for user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error": "no_api_key",
                        "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator.",
                    },
                )
        else:
            # Re-raise unexpected HTTP exceptions
            raise

    # Validate that we have a key
    if not api_key:
        logger.warning(f"No API key available for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "no_api_key",
                "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator.",
            },
        )

    return OpenAI(api_key=api_key)


async def stream_openai_response(
    client: OpenAI, request: ChatRequest, user_id: str
) -> AsyncGenerator[str, None]:
    """
    Stream OpenAI chat completion response as Server-Sent Events.

    Args:
        client: Configured OpenAI client
        request: Chat request parameters
        user_id: User ID for logging

    Yields:
        SSE-formatted data chunks: "data: {json}\n\n"

    Format follows OpenAI's streaming format:
    - data: {chunk json}
    - data: [DONE]
    """
    try:
        logger.info(
            f"Starting streaming chat completion for user {user_id} "
            f"(model: {request.model}, messages: {len(request.messages)})"
        )

        # Create streaming completion
        stream = client.chat.completions.create(
            model=request.model,
            messages=[msg.model_dump() for msg in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
            top_p=request.top_p,
            frequency_penalty=request.frequency_penalty,
            presence_penalty=request.presence_penalty,
        )

        # Stream chunks as SSE
        chunk_count = 0
        for chunk in stream:
            chunk_count += 1
            # Convert chunk to dict and send as SSE
            chunk_dict = chunk.model_dump()
            yield f"data: {json.dumps(chunk_dict)}\n\n"

        # Send final [DONE] marker
        yield "data: [DONE]\n\n"

        logger.info(
            f"Streaming chat completion finished for user {user_id} " f"({chunk_count} chunks sent)"
        )

    except AuthenticationError as e:
        error_msg = "Invalid OpenAI API key"
        logger.error(f"Authentication error for user {user_id}: {str(e)}")
        error_data = {"error": "authentication_failed", "message": error_msg}
        yield f"data: {json.dumps(error_data)}\n\n"

    except RateLimitError as e:
        error_msg = "OpenAI API rate limit exceeded. Please try again later."
        logger.warning(f"Rate limit exceeded for user {user_id}: {str(e)}")
        error_data = {"error": "rate_limit_exceeded", "message": error_msg}
        yield f"data: {json.dumps(error_data)}\n\n"

    except APIConnectionError as e:
        error_msg = "Failed to connect to OpenAI API. Please check your internet connection."
        logger.error(f"API connection error for user {user_id}: {str(e)}")
        error_data = {"error": "connection_error", "message": error_msg}
        yield f"data: {json.dumps(error_data)}\n\n"

    except APIError as e:
        error_msg = f"OpenAI API error: {str(e)}"
        logger.error(f"API error for user {user_id}: {str(e)}")
        error_data = {"error": "api_error", "message": error_msg}
        yield f"data: {json.dumps(error_data)}\n\n"

    except Exception as e:
        error_msg = "An unexpected error occurred during chat completion"
        logger.error(f"Unexpected error for user {user_id}: {str(e)}", exc_info=True)
        error_data = {"error": "internal_error", "message": error_msg}
        yield f"data: {json.dumps(error_data)}\n\n"


@router.post("/completions")
async def create_chat_completion(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a chat completion using OpenAI API.

    **Authorization:** Requires valid JWT token (Bearer token in Authorization header)

    **API Key Priority:**
    1. User's stored API key (from user settings)
    2. Global API key (fallback if user hasn't configured their own)

    **Request Body:**
    ```json
    {
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ],
      "model": "gpt-4o-mini",
      "temperature": 0.7,
      "max_tokens": 1000,
      "stream": false
    }
    ```

    **Response (Non-Streaming):**
    ```json
    {
      "id": "chatcmpl-...",
      "object": "chat.completion",
      "created": 1234567890,
      "model": "gpt-4o-mini",
      "choices": [{
        "index": 0,
        "message": {"role": "assistant", "content": "Hello! How can I help you?"},
        "finish_reason": "stop"
      }],
      "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20,
        "total_tokens": 30
      }
    }
    ```

    **Response (Streaming):**
    Server-Sent Events (SSE) stream with format:
    ```
    data: {"id": "chatcmpl-...", "choices": [{"delta": {"content": "Hello"}}]}

    data: {"id": "chatcmpl-...", "choices": [{"delta": {"content": "!"}}]}

    data: [DONE]
    ```

    **Errors:**
    - 400: Invalid request format
    - 401: Invalid/missing JWT token
    - 402: No API key configured (user or global)
    - 429: OpenAI rate limit exceeded
    - 500: Internal server error or OpenAI API error
    """
    try:
        # Get OpenAI client with appropriate API key
        client = get_openai_client(user_id)

        # Handle streaming vs non-streaming
        if request.stream:
            # Return streaming response (SSE)
            return StreamingResponse(
                stream_openai_response(client, request, user_id),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",  # Disable proxy buffering
                },
            )
        else:
            # Non-streaming completion
            logger.info(
                f"Creating non-streaming chat completion for user {user_id} "
                f"(model: {request.model}, messages: {len(request.messages)})"
            )

            response = client.chat.completions.create(
                model=request.model,
                messages=[msg.model_dump() for msg in request.messages],
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=False,
                top_p=request.top_p,
                frequency_penalty=request.frequency_penalty,
                presence_penalty=request.presence_penalty,
            )

            logger.info(
                f"Non-streaming chat completion finished for user {user_id} "
                f"(tokens: {response.usage.total_tokens})"
            )

            # Convert OpenAI response to dict and return
            return response.model_dump()

    except HTTPException:
        # Re-raise HTTP exceptions (already formatted)
        raise

    except AuthenticationError as e:
        logger.error(f"Authentication error for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "authentication_failed",
                "message": "Invalid OpenAI API key. Please update your API key in user settings.",
            },
        )

    except RateLimitError as e:
        logger.warning(f"Rate limit exceeded for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "rate_limit_exceeded",
                "message": "OpenAI API rate limit exceeded. Please try again later.",
            },
        )

    except APIConnectionError as e:
        logger.error(f"API connection error for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "connection_error",
                "message": "Failed to connect to OpenAI API. Please check your internet connection and try again.",
            },
        )

    except APIError as e:
        logger.error(f"OpenAI API error for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "api_error", "message": f"OpenAI API error: {str(e)}"},
        )

    except Exception as e:
        logger.error(f"Unexpected error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred. Please try again later.",
            },
        )


@router.get("/health")
async def chat_health_check():
    """
    Health check endpoint for chat service.

    Returns:
        Service status information
    """
    return {
        "service": "chat",
        "status": "operational",
        "supported_models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        "streaming_supported": True,
    }
