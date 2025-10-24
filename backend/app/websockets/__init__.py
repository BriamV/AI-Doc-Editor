"""
WebSocket Infrastructure for Real-Time Document Section Streaming
T-06: WebSocket Server with Authentication

This package provides WebSocket infrastructure for streaming document sections
in real-time to connected clients with JWT authentication and multi-tenancy support.
"""

from app.websockets.connection_manager import ConnectionManager

__all__ = ["ConnectionManager"]
