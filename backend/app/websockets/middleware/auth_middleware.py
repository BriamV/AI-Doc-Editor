"""
WebSocket Authentication Middleware
T-06 ST1: JWT authentication for WebSocket connections

Authenticates WebSocket connections using JWT tokens passed as query parameters.
Reuses existing JWT verification logic from T-02 (app.services.auth).
"""

import logging
from typing import Optional
from fastapi import WebSocket, status
from jose import JWTError

from app.services.auth import auth_service, User

logger = logging.getLogger(__name__)


async def authenticate_websocket(
    websocket: WebSocket, token: Optional[str] = None
) -> Optional[User]:
    """
    Authenticate WebSocket connection using JWT token.

    Authentication Flow:
        1. Extract token from query parameter (ws://...?token=xxx)
        2. Verify JWT signature and expiration using existing auth_service
        3. Extract user information from token payload
        4. Return User object if valid, None if invalid

    Args:
        websocket: FastAPI WebSocket instance
        token: JWT token from query parameter (optional)

    Returns:
        User object if authentication successful, None otherwise

    Notes:
        - Token should be passed as query parameter: ws://host/api/ws/sections/123?token=xxx
        - Uses existing auth_service.verify_token() from T-02
        - Does NOT close WebSocket connection (caller should handle)
        - Logs authentication failures for security monitoring

    Usage:
        @router.websocket("/ws/sections/{document_id}")
        async def websocket_endpoint(websocket: WebSocket, document_id: str, token: str = Query(...)):
            user = await authenticate_websocket(websocket, token)
            if not user:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
                return
            # Proceed with authenticated connection
    """
    # Check if token provided
    if not token:
        logger.warning(
            f"WebSocket authentication failed: Missing token (client={websocket.client.host})"
        )
        return None

    try:
        # Verify JWT token using existing auth service
        payload = auth_service.verify_token(token)

        # Extract user information from token payload
        user = User(
            id=payload.get("user_id", payload.get("sub", "")),
            email=payload.get("email", ""),
            name=payload.get("name", ""),
            role=payload.get("role", "editor"),
            provider=payload.get("provider", "unknown"),
        )

        logger.info(
            f"WebSocket authenticated: user_id={user.id}, email={user.email}, "
            f"client={websocket.client.host}"
        )

        return user

    except (ValueError, JWTError) as e:
        logger.warning(
            f"WebSocket authentication failed: Invalid token "
            f"(client={websocket.client.host}, error={type(e).__name__})"
        )
        return None

    except Exception as e:
        logger.error(
            f"WebSocket authentication error: {e} (client={websocket.client.host})", exc_info=True
        )
        return None


async def close_with_auth_error(
    websocket: WebSocket, reason: str = "Authentication failed"
) -> None:
    """
    Close WebSocket connection with authentication error.

    Sends proper WebSocket close code for policy violations (authentication/authorization).

    Args:
        websocket: FastAPI WebSocket instance
        reason: Error reason (default: "Authentication failed")

    Notes:
        - Uses WS_1008_POLICY_VIOLATION (proper code for auth failures)
        - Logs closure for security monitoring
        - Accepts connection before closing (required by FastAPI)

    Usage:
        user = await authenticate_websocket(websocket, token)
        if not user:
            await close_with_auth_error(websocket, "Invalid or missing token")
            return
    """
    try:
        # Accept the connection first (required before closing in FastAPI)
        await websocket.accept()

        # Then close with proper error code
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=reason)

        logger.warning(
            f"WebSocket closed due to auth error: {reason} (client={websocket.client.host})"
        )

    except Exception as e:
        # Connection might already be accepted or closed, log and continue
        logger.debug(f"Error closing WebSocket with auth error: {e}")


async def check_document_access(user: User, document_id: str) -> bool:
    """
    Check if user has access to a specific document.

    Authorization check for document-level access control.
    Currently simplified - will be enhanced in future tasks.

    Args:
        user: Authenticated user
        document_id: Document ID to check access for

    Returns:
        True if user has access, False otherwise

    Notes:
        - ST1 implementation: All authenticated users can access any document
        - ST3 will enhance with proper document ownership checks
        - TODO: Query database to verify document ownership/access rights

    Usage:
        if not await check_document_access(user, document_id):
            await close_with_auth_error(websocket, "Access denied to document")
            return
    """
    # ST1: Simplified authorization - all authenticated users have access
    # TODO (ST3): Add database query to check document ownership
    logger.debug(f"Authorization check: user={user.id}, document={document_id} (granted)")
    return True
