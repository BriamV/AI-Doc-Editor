"""
WebSocket Router
T-06 ST1: WebSocket endpoint for real-time document section streaming
T-06 ST2: Section generation integration with dependency injection

Provides WebSocket endpoint for streaming document sections in real-time.
Integrates JWT authentication, connection management, and section generation.
"""

import logging
import uuid
from fastapi import APIRouter, WebSocket, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.websockets.middleware.auth_middleware import authenticate_websocket, close_with_auth_error
from app.websockets.handlers.section_handler import SectionHandler
from app.websockets.connection_manager import connection_manager
from app.services.planner_service import PlannerService
from app.services.section_generation_service import SectionGenerationService
from app.services.summary_service import SummaryService  # T-06 ST3
from app.adapters.openai_llm_adapter import OpenAILLMAdapter
from app.adapters.rule_based_validator import RuleBasedOutlineValidator
from app.adapters.openai_streaming_adapter import OpenAIStreamingAdapter
from app.adapters.outline_repository_adapter import OutlineRepositoryAdapter
from app.adapters.section_repository_adapter import SectionRepositoryAdapter
from app.adapters.summary_adapter import SummaryAdapter  # T-06 ST3
from app.db.session import get_db
from app.routers.credentials import get_user_openai_key
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def get_planner_service(db: AsyncSession) -> PlannerService:
    """
    Create PlannerService instance with outline persistence.

    Args:
        db: Database session

    Returns:
        PlannerService with repository port
    """
    llm_adapter = OpenAILLMAdapter()
    validator_adapter = RuleBasedOutlineValidator(
        min_headings=3, min_heading_length=5, max_heading_length=150, min_avg_heading_length=15
    )
    repository_adapter = OutlineRepositoryAdapter(db)

    service = PlannerService(
        llm_port=llm_adapter,
        validator_port=validator_adapter,
        repository_port=repository_adapter,
        quality_threshold=0.5,
        enable_fallback=True,
    )

    return service


def get_section_generation_service(db: AsyncSession) -> SectionGenerationService:
    """
    Create SectionGenerationService instance with summary support.

    T-06 ST3: Instantiates SummaryService for global document summaries.

    Args:
        db: Database session

    Returns:
        SectionGenerationService with summary support enabled
    """
    streaming_adapter = OpenAIStreamingAdapter()
    repository_adapter = SectionRepositoryAdapter(db)

    # T-06 ST3: Create summary service
    summary_adapter = SummaryAdapter(model="gpt-3.5-turbo")
    summary_service = SummaryService(
        summary_port=summary_adapter,
        section_repository_port=repository_adapter,
        max_summary_tokens=200,
    )

    service = SectionGenerationService(
        streaming_port=streaming_adapter,
        repository_port=repository_adapter,
        summary_service=summary_service,  # T-06 ST3
        default_model="gpt-4o-mini",
        default_temperature=0.7,
        default_max_tokens=600,
    )

    return service


async def resolve_user_api_key(user_id: uuid.UUID) -> str:
    """
    Resolve user's OpenAI API key.

    Priority:
    1. User's stored API key
    2. Global API key (fallback)

    Args:
        user_id: User UUID

    Returns:
        OpenAI API key or None if not configured

    Raises:
        None (returns None if no key available)
    """
    api_key = None

    # Try user's API key first
    try:
        api_key = get_user_openai_key(str(user_id))
        logger.info(f"Using user-specific API key (user: {user_id})")
    except HTTPException as e:
        if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
            # User hasn't configured key, try global fallback
            api_key = getattr(settings, "OPENAI_API_KEY", None)
            if api_key:
                logger.info(f"Using global API key (user: {user_id})")
        else:
            # Other errors - log and return None
            logger.error(f"Error retrieving API key for user {user_id}: {e}")

    return api_key


@router.websocket("/api/ws/sections/{document_id}")
async def websocket_section_endpoint(
    websocket: WebSocket,
    document_id: str,
    token: str = Query(None, description="JWT authentication token"),
) -> None:
    """
    WebSocket endpoint for real-time document section generation.

    Endpoint: ws://host/api/ws/sections/{document_id}?token=<jwt_token>

    Authentication:
        - Requires valid JWT token passed as query parameter
        - Uses existing JWT verification from T-02 (app.services.auth)
        - Closes connection with WS_1008_POLICY_VIOLATION on auth failure

    Flow:
        1. Authenticate user via JWT token
        2. Register WebSocket connection with connection manager
        3. Send connection confirmation message
        4. Handle incoming messages (pause, resume, cancel)
        5. Stream section generation (ST2 implementation)
        6. Disconnect on completion or error

    Args:
        websocket: FastAPI WebSocket instance
        document_id: Document ID to generate sections for
        token: JWT authentication token (query parameter)

    Returns:
        None (WebSocket connection, no HTTP response)

    WebSocket Messages (Server → Client):
        - connected: Connection established
        - section_start: Section generation started
        - section_chunk: Incremental section content
        - section_end: Section generation completed
        - summary_update: Progress summary
        - generation_complete: All sections complete
        - error: Error occurred

    WebSocket Messages (Client → Server):
        - client_action: Control generation (pause/resume/cancel)

    Error Codes:
        - WS_1008_POLICY_VIOLATION: Authentication failed
        - WS_1011_INTERNAL_ERROR: Server error during generation

    Performance Requirements:
        - Handshake completion: ≤150ms (target)
        - Message latency: ≤50ms (p95)
        - Concurrent connections: 100+ per worker

    Usage Example (JavaScript):
        const ws = new WebSocket('ws://localhost:8000/api/ws/sections/doc123?token=<jwt>');
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'section_chunk') {
                console.log('Chunk:', message.chunk);
            }
        };

    See Also:
        - app.websockets.schemas.messages: Message schemas
        - app.websockets.handlers.section_handler: Connection handler
        - app.websockets.middleware.auth_middleware: Authentication
    """
    # Authenticate WebSocket connection
    user = await authenticate_websocket(websocket, token)

    if not user:
        # Authentication failed
        await close_with_auth_error(websocket, "Invalid or missing JWT token")
        return

    logger.info(
        f"WebSocket connection authenticated: user={user.id}, document={document_id}, "
        f"email={user.email}"
    )

    # Create database session for this connection
    async for db in get_db():
        try:
            # Initialize services with dependencies
            planner_service = get_planner_service(db)
            section_generation_service = get_section_generation_service(db)

            # Initialize section handler with all dependencies (T-06 ST3: db for summaries)
            section_handler = SectionHandler(
                connection_manager=connection_manager,
                planner_service=planner_service,
                section_generation_service=section_generation_service,
                api_key_resolver=resolve_user_api_key,
                db=db,  # T-06 ST3
            )

            # Handle connection lifecycle
            await section_handler.handle_connection(websocket, user, document_id)

        except Exception as e:
            logger.error(
                f"WebSocket handler error: user={user.id}, document={document_id}, error={e}",
                exc_info=True,
            )

            # Try to close with error
            try:
                await websocket.close(
                    code=status.WS_1011_INTERNAL_ERROR, reason="Internal server error"
                )
            except Exception:
                # Connection might already be closed
                pass
        finally:
            # Database session cleanup handled by get_db() context manager
            pass


@router.get("/api/ws/health")
async def websocket_health() -> dict:
    """
    WebSocket health check endpoint.

    Returns connection manager statistics for monitoring.

    Returns:
        dict: Health status and connection statistics

    Example Response:
        {
            "status": "healthy",
            "total_connections": 5,
            "websocket_enabled": true
        }
    """
    return {
        "status": "healthy",
        "total_connections": connection_manager.get_total_connections(),
        "websocket_enabled": True,
    }
