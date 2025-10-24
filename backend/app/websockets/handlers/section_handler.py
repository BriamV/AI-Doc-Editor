"""
Section Generation WebSocket Handler
T-06 ST1: WebSocket connection lifecycle and message handling skeleton
T-06 ST2: Section generation logic integration

Handles WebSocket connections for real-time document section generation.
ST1: Connection management
ST2: Section generation with streaming
"""

import logging
import time
import uuid
from typing import Optional
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth import User
from app.services.planner_service import PlannerService
from app.services.section_generation_service import SectionGenerationService
from app.websockets.connection_manager import ConnectionManager
from app.websockets.schemas.messages import (
    ConnectedMessage,
    ErrorMessage,
    ClientActionMessage,
)

logger = logging.getLogger(__name__)


class SectionHandler:
    """
    WebSocket handler for section generation.

    Manages WebSocket connection lifecycle and message handling for
    real-time document section generation with streaming.

    ST1 Implementation:
        - Connection establishment and authentication
        - Basic message handling skeleton
        - Connection lifecycle management
        - Error handling and cleanup

    ST2 Implementation (future):
        - Section generation logic integration
        - Streaming section content to client
        - Progress updates and summary messages

    Usage:
        handler = SectionHandler(connection_manager)
        await handler.handle_connection(websocket, user, document_id)
    """

    def __init__(
        self,
        connection_manager: ConnectionManager,
        planner_service: PlannerService,
        section_generation_service: SectionGenerationService,
        api_key_resolver,
        db: AsyncSession,  # T-06 ST3
    ):
        """
        Initialize section handler.

        Args:
            connection_manager: WebSocket connection manager instance
            planner_service: Planner service for outline retrieval
            section_generation_service: Section generation service
            api_key_resolver: Function to resolve user's OpenAI API key
            db: Database session for summary updates (T-06 ST3)
        """
        self.connection_manager = connection_manager
        self.planner_service = planner_service
        self.section_generation_service = section_generation_service
        self.api_key_resolver = api_key_resolver
        self.db = db
        logger.info("SectionHandler initialized with section generation + summary support")

    async def handle_connection(self, websocket: WebSocket, user: User, document_id: str) -> None:
        """
        Handle WebSocket connection lifecycle.

        Main entry point for WebSocket connections. Manages:
        1. Connection registration
        2. Connection confirmation message
        3. Message handling loop
        4. Graceful disconnection

        Args:
            websocket: FastAPI WebSocket instance (already authenticated)
            user: Authenticated user
            document_id: Document ID for this session

        Notes:
            - Connection manager handles WebSocket.accept() during connect()
            - Automatically disconnects on errors or client close
            - Logs all connection lifecycle events
        """
        user_id = user.id

        try:
            # Register connection with connection manager
            await self.connection_manager.connect(user_id, document_id, websocket)

            # Send connection confirmation
            await self._send_connected_message(user_id, document_id)

            # Handle messages until connection closes
            await self._message_loop(user_id, document_id, websocket)

        except Exception as e:
            logger.error(
                f"Error in WebSocket connection: user={user_id}, document={document_id}, error={e}",
                exc_info=True,
            )

            # Send error message if connection still active
            await self._send_error_message(
                user_id,
                document_id,
                error_code="CONNECTION_ERROR",
                error_message=f"WebSocket connection error: {str(e)}",
                fatal=True,
            )

        finally:
            # Always disconnect on exit
            await self.connection_manager.disconnect(user_id, document_id)
            logger.info(f"WebSocket connection closed: user={user_id}, document={document_id}")

    async def _send_connected_message(self, user_id: str, document_id: str) -> None:
        """
        Send connection confirmation message to client.

        Args:
            user_id: User ID
            document_id: Document ID
        """
        message = ConnectedMessage(
            document_id=document_id,
            user_id=user_id,
            message="WebSocket connection established",
            timestamp=time.time(),
        )

        await self.connection_manager.send_message(user_id, document_id, message.model_dump())

        logger.info(f"Sent connected message: user={user_id}, document={document_id}")

    async def _message_loop(self, user_id: str, document_id: str, websocket: WebSocket) -> None:
        """
        Handle incoming messages from client.

        Message Loop:
        1. Wait for client message
        2. Parse and validate message
        3. Handle message based on type
        4. Repeat until connection closes

        Args:
            user_id: User ID
            document_id: Document ID
            websocket: WebSocket instance

        Notes:
            - ST1: Basic message parsing skeleton
            - ST2: Will add section generation message handling
            - Exits on WebSocketDisconnect or connection close
        """
        logger.info(f"Starting message loop: user={user_id}, document={document_id}")

        try:
            while True:
                # Wait for client message
                data = await websocket.receive_text()

                logger.debug(
                    f"Received message: user={user_id}, document={document_id}, data={data}"
                )

                # Parse message
                try:
                    import json

                    message_dict = json.loads(data)
                    message_type = message_dict.get("type")

                    # Handle different message types
                    if message_type == "client_action":
                        await self._handle_client_action(user_id, document_id, message_dict)
                    else:
                        logger.warning(
                            f"Unknown message type: {message_type} from user={user_id}, document={document_id}"
                        )

                except json.JSONDecodeError as e:
                    logger.warning(
                        f"Invalid JSON from client: user={user_id}, document={document_id}, error={e}"
                    )

                    await self._send_error_message(
                        user_id,
                        document_id,
                        error_code="INVALID_MESSAGE",
                        error_message="Invalid JSON message",
                        fatal=False,
                    )

        except Exception as e:
            # WebSocketDisconnect or other connection errors
            logger.info(
                f"Message loop ended: user={user_id}, document={document_id}, reason={type(e).__name__}"
            )

    async def _handle_client_action(
        self, user_id: str, document_id: str, message_dict: dict
    ) -> None:
        """
        Handle client action messages (generate, pause, resume, cancel).

        ST2 Implementation: Full generation logic with streaming

        Args:
            user_id: User ID
            document_id: Document ID
            message_dict: Parsed message dictionary
        """
        try:
            # Validate message schema
            action_message = ClientActionMessage(**message_dict)

            logger.info(
                f"Client action received: user={user_id}, document={document_id}, "
                f"action={action_message.action}"
            )

            action = message_dict.get("action")

            if action == "generate":
                # Handle section generation
                await self._handle_generate_action(user_id, document_id, message_dict)

            elif action == "pause":
                # TODO (ST3): Implement pause logic
                logger.warning("Pause action not yet implemented")

            elif action == "resume":
                # TODO (ST3): Implement resume logic
                logger.warning("Resume action not yet implemented")

            elif action == "cancel":
                # TODO (ST3): Implement cancel logic
                logger.warning("Cancel action not yet implemented")

            else:
                logger.warning(f"Unknown action: {action}")
                await self._send_error_message(
                    user_id,
                    document_id,
                    error_code="UNKNOWN_ACTION",
                    error_message=f"Unknown action: {action}",
                    fatal=False,
                )

        except Exception as e:
            logger.error(
                f"Invalid client action message: user={user_id}, document={document_id}, error={e}",
                exc_info=True,
            )

            await self._send_error_message(
                user_id,
                document_id,
                error_code="INVALID_ACTION",
                error_message="Invalid client action message",
                fatal=False,
            )

    async def _handle_generate_action(
        self, user_id: str, document_id: str, message_data: dict
    ) -> None:
        """
        Handle section generation action (ST2).

        Expected message format:
        {
            "action": "generate",
            "data": {
                "outline_id": "uuid-string",
                "model": "gpt-4o-mini" (optional),
                "temperature": 0.7 (optional),
                "max_tokens": 600 (optional)
            }
        }

        Args:
            user_id: User ID
            document_id: Document ID
            message_data: Client message data
        """
        try:
            # Extract generation parameters
            data = message_data.get("data", {})
            outline_id_str = data.get("outline_id")

            if not outline_id_str:
                await self._send_error_message(
                    user_id,
                    document_id,
                    error_code="MISSING_OUTLINE_ID",
                    error_message="outline_id is required for generation",
                    fatal=False,
                )
                return

            outline_id = uuid.UUID(outline_id_str)
            user_uuid = uuid.UUID(user_id)
            document_uuid = uuid.UUID(document_id) if document_id else None

            # Optional parameters
            model = data.get("model")
            temperature = data.get("temperature")
            max_tokens = data.get("max_tokens")

            logger.info(
                f"Starting section generation: outline_id={outline_id}, "
                f"user_id={user_id}, document_id={document_id}"
            )

            # Retrieve outline from database
            outline = await self.planner_service.get_outline_by_id(outline_id, user_uuid)

            if not outline:
                await self._send_error_message(
                    user_id,
                    document_id,
                    error_code="OUTLINE_NOT_FOUND",
                    error_message=f"Outline {outline_id} not found",
                    fatal=True,
                )
                return

            # Resolve user's OpenAI API key
            api_key = await self.api_key_resolver(user_uuid)

            if not api_key:
                await self._send_error_message(
                    user_id,
                    document_id,
                    error_code="API_KEY_NOT_FOUND",
                    error_message="OpenAI API key not configured for user",
                    fatal=True,
                )
                return

            # Generate sections with streaming (T-06 ST3: db parameter for summaries)
            async for event in self.section_generation_service.generate_sections(
                outline=outline,
                outline_id=outline_id,
                user_id=user_uuid,
                api_key=api_key,
                db=self.db,  # T-06 ST3
                document_id=document_uuid,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            ):
                # Forward events to WebSocket client
                await self.connection_manager.send_message(user_id, document_id, event)

            logger.info(f"Section generation complete: outline_id={outline_id}")

        except ValueError as e:
            logger.error(f"Invalid UUID format: {e}")
            await self._send_error_message(
                user_id,
                document_id,
                error_code="INVALID_UUID",
                error_message=f"Invalid UUID format: {str(e)}",
                fatal=False,
            )

        except Exception as e:
            logger.error(
                f"Section generation failed: user={user_id}, document={document_id}, error={e}",
                exc_info=True,
            )

            await self._send_error_message(
                user_id,
                document_id,
                error_code="GENERATION_FAILED",
                error_message=f"Section generation failed: {str(e)}",
                fatal=True,
            )

    async def _send_error_message(
        self,
        user_id: str,
        document_id: str,
        error_code: str,
        error_message: str,
        fatal: bool = False,
        section_id: Optional[str] = None,
    ) -> None:
        """
        Send error message to client.

        Args:
            user_id: User ID
            document_id: Document ID
            error_code: Error code (e.g., 'GENERATION_FAILED')
            error_message: Human-readable error message
            fatal: If True, connection will close after this message
            section_id: Optional section ID if error is section-specific
        """
        message = ErrorMessage(
            error_code=error_code,
            error_message=error_message,
            section_id=section_id,
            fatal=fatal,
            timestamp=time.time(),
        )

        await self.connection_manager.send_message(
            user_id, document_id, message.model_dump(), close_on_error=fatal
        )

        logger.warning(
            f"Sent error message: user={user_id}, document={document_id}, "
            f"code={error_code}, fatal={fatal}"
        )
