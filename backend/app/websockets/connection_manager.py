"""
WebSocket Connection Manager
T-06 ST1: Multi-tenant connection management

Singleton connection manager for WebSocket connections with multi-tenancy support.
Manages active connections, message routing, and connection lifecycle.
"""

import logging
from typing import Dict, Optional
from fastapi import WebSocket
import json

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Singleton WebSocket connection manager.

    Manages active WebSocket connections with multi-tenancy support.
    Each connection is identified by (user_id, document_id) pair.

    Thread Safety:
        Currently not thread-safe. For production use with multiple workers,
        consider using Redis-backed connection store or similar.

    Usage:
        manager = ConnectionManager()
        await manager.connect(user_id, document_id, websocket)
        await manager.send_message(user_id, document_id, message_dict)
        await manager.disconnect(user_id, document_id)
    """

    _instance: Optional["ConnectionManager"] = None

    def __new__(cls) -> "ConnectionManager":
        """Singleton pattern: ensure only one instance exists."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        """Initialize connection manager (only once due to singleton)."""
        if self._initialized:
            return

        # Active connections: {(user_id, document_id): WebSocket}
        self._connections: Dict[tuple[str, str], WebSocket] = {}

        # Connection metadata: {(user_id, document_id): metadata_dict}
        self._metadata: Dict[tuple[str, str], Dict] = {}

        self._initialized = True
        logger.info("ConnectionManager initialized (singleton)")

    async def connect(self, user_id: str, document_id: str, websocket: WebSocket) -> None:
        """
        Register a new WebSocket connection.

        Args:
            user_id: Authenticated user ID
            document_id: Document ID for this session
            websocket: FastAPI WebSocket instance

        Raises:
            ValueError: If connection already exists for this (user_id, document_id)
        """
        key = (user_id, document_id)

        # Check if connection already exists
        if key in self._connections:
            logger.warning(
                f"Connection already exists for user={user_id}, document={document_id}. "
                "Closing existing connection."
            )
            # Close existing connection before replacing
            await self.disconnect(user_id, document_id)

        # Accept WebSocket connection
        await websocket.accept()

        # Store connection
        self._connections[key] = websocket
        self._metadata[key] = {
            "user_id": user_id,
            "document_id": document_id,
            "connected_at": self._get_timestamp(),
        }

        logger.info(
            f"WebSocket connected: user={user_id}, document={document_id}, "
            f"total_connections={len(self._connections)}"
        )

    async def disconnect(self, user_id: str, document_id: str) -> None:
        """
        Remove a WebSocket connection.

        Args:
            user_id: User ID
            document_id: Document ID

        Notes:
            Safe to call even if connection doesn't exist.
            Closes WebSocket connection gracefully.
        """
        key = (user_id, document_id)

        if key not in self._connections:
            logger.debug(f"No connection to disconnect for user={user_id}, document={document_id}")
            return

        # Get WebSocket
        websocket = self._connections[key]

        # Close WebSocket connection
        try:
            await websocket.close()
        except Exception as e:
            logger.warning(
                f"Error closing WebSocket for user={user_id}, document={document_id}: {e}"
            )

        # Remove from storage
        del self._connections[key]
        if key in self._metadata:
            del self._metadata[key]

        logger.info(
            f"WebSocket disconnected: user={user_id}, document={document_id}, "
            f"remaining_connections={len(self._connections)}"
        )

    async def send_message(
        self, user_id: str, document_id: str, message: Dict, close_on_error: bool = False
    ) -> bool:
        """
        Send a JSON message to a specific WebSocket connection.

        Args:
            user_id: User ID
            document_id: Document ID
            message: Message dict to send (will be JSON-encoded)
            close_on_error: If True, disconnect on send error

        Returns:
            True if message sent successfully, False otherwise

        Notes:
            Automatically disconnects client on WebSocket errors if close_on_error=True.
        """
        key = (user_id, document_id)

        if key not in self._connections:
            logger.warning(f"No active connection for user={user_id}, document={document_id}")
            return False

        websocket = self._connections[key]

        try:
            # Convert message to JSON
            message_json = json.dumps(message)

            # Send message
            await websocket.send_text(message_json)

            logger.debug(
                f"Message sent to user={user_id}, document={document_id}, "
                f"type={message.get('type', 'unknown')}"
            )
            return True

        except Exception as e:
            logger.error(
                f"Error sending message to user={user_id}, document={document_id}: {e}",
                exc_info=True,
            )

            # Disconnect on error if requested
            if close_on_error:
                await self.disconnect(user_id, document_id)

            return False

    async def send_json(
        self, user_id: str, document_id: str, data: Dict, close_on_error: bool = False
    ) -> bool:
        """
        Alias for send_message (for compatibility with FastAPI WebSocket.send_json).

        Args:
            user_id: User ID
            document_id: Document ID
            data: Data dict to send
            close_on_error: If True, disconnect on send error

        Returns:
            True if message sent successfully, False otherwise
        """
        return await self.send_message(user_id, document_id, data, close_on_error)

    def get_connection(self, user_id: str, document_id: str) -> Optional[WebSocket]:
        """
        Get WebSocket connection for a specific (user_id, document_id).

        Args:
            user_id: User ID
            document_id: Document ID

        Returns:
            WebSocket instance if exists, None otherwise
        """
        key = (user_id, document_id)
        return self._connections.get(key)

    def has_connection(self, user_id: str, document_id: str) -> bool:
        """
        Check if a connection exists for (user_id, document_id).

        Args:
            user_id: User ID
            document_id: Document ID

        Returns:
            True if connection exists, False otherwise
        """
        key = (user_id, document_id)
        return key in self._connections

    def get_metadata(self, user_id: str, document_id: str) -> Optional[Dict]:
        """
        Get connection metadata.

        Args:
            user_id: User ID
            document_id: Document ID

        Returns:
            Metadata dict if connection exists, None otherwise
        """
        key = (user_id, document_id)
        return self._metadata.get(key)

    def get_total_connections(self) -> int:
        """
        Get total number of active connections.

        Returns:
            Number of active WebSocket connections
        """
        return len(self._connections)

    def get_user_connections(self, user_id: str) -> int:
        """
        Get number of connections for a specific user.

        Args:
            user_id: User ID

        Returns:
            Number of active connections for this user
        """
        return sum(1 for (uid, _) in self._connections.keys() if uid == user_id)

    @staticmethod
    def _get_timestamp() -> float:
        """
        Get current Unix timestamp.

        Returns:
            Unix timestamp (seconds since epoch)
        """
        import time

        return time.time()


# Global singleton instance
connection_manager = ConnectionManager()
