"""
WebSocket Middleware
T-06 ST1: Authentication and authorization for WebSocket connections
"""

from app.websockets.middleware.auth_middleware import authenticate_websocket

__all__ = ["authenticate_websocket"]
