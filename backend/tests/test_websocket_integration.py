"""
WebSocket Integration Tests
T-06 ST1: WebSocket handshake performance and authentication

Tests WebSocket infrastructure, authentication, and connection lifecycle.
Performance requirement: Handshake completion ≤150ms.
"""

import pytest
import json
import time
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.services.auth import auth_service
from app.routers.websocket_router import router as websocket_router


@pytest.fixture
def ws_app():
    """Create minimal FastAPI app for WebSocket testing (no database dependencies)."""
    app = FastAPI()
    app.include_router(websocket_router)
    return app


@pytest.fixture
def test_client(ws_app):
    """Create test client for WebSocket testing."""
    return TestClient(ws_app)


@pytest.fixture
def valid_jwt_token():
    """
    Generate valid JWT token for testing.

    Returns:
        str: Valid JWT token for test user
    """
    user_data = {
        "user_id": "test_user_123",
        "email": "test@example.com",
        "name": "Test User",
        "role": "editor",
        "provider": "test",
    }

    tokens = auth_service.create_tokens(user_data, access_expires_minutes=60)
    return tokens["access_token"]


@pytest.fixture
def invalid_jwt_token():
    """
    Generate invalid JWT token for testing.

    Returns:
        str: Invalid JWT token
    """
    return "invalid.jwt.token"


class TestWebSocketAuthentication:
    """Test WebSocket authentication and authorization."""

    def test_websocket_without_token(self, test_client):
        """
        Test WebSocket connection without token fails.

        Expected: Connection closes with policy violation (code 1008).
        """
        from starlette.websockets import WebSocketDisconnect

        document_id = "test_doc_123"

        # Connection should be rejected with WebSocketDisconnect
        # when trying to receive (server closes after accepting)
        try:
            with test_client.websocket_connect(f"/api/ws/sections/{document_id}") as websocket:
                # Try to receive - should immediately disconnect
                websocket.receive_text()
                pytest.fail("Should have disconnected")
        except WebSocketDisconnect as exc:
            # Verify close code is policy violation (1008)
            assert exc.code == 1008, f"Expected code 1008, got {exc.code}"

    def test_websocket_with_invalid_token(self, test_client, invalid_jwt_token):
        """
        Test WebSocket connection with invalid token fails.

        Expected: Connection closes with policy violation (code 1008).
        """
        from starlette.websockets import WebSocketDisconnect

        document_id = "test_doc_123"

        # Connection should be rejected with WebSocketDisconnect
        try:
            with test_client.websocket_connect(
                f"/api/ws/sections/{document_id}?token={invalid_jwt_token}"
            ) as websocket:
                # Try to receive - should immediately disconnect
                websocket.receive_text()
                pytest.fail("Should have disconnected")
        except WebSocketDisconnect as exc:
            # Verify close code is policy violation (1008)
            assert exc.code == 1008, f"Expected code 1008, got {exc.code}"

    def test_websocket_with_valid_token(self, test_client, valid_jwt_token):
        """
        Test WebSocket connection with valid token succeeds.

        Expected:
            - Connection established
            - Connected message received
            - Handshake completes in ≤150ms
        """
        document_id = "test_doc_123"

        # Measure handshake time
        start_time = time.time()

        with test_client.websocket_connect(
            f"/api/ws/sections/{document_id}?token={valid_jwt_token}"
        ) as websocket:
            # Receive connected message
            data = websocket.receive_text()
            handshake_time_ms = (time.time() - start_time) * 1000

            # Parse message
            message = json.loads(data)

            # Verify connected message
            assert message["type"] == "connected", "Should receive connected message"
            assert message["document_id"] == document_id, "Document ID should match"
            assert message["user_id"] == "test_user_123", "User ID should match"
            assert "timestamp" in message, "Should include timestamp"

            # Performance requirement: ≤150ms handshake
            assert (
                handshake_time_ms <= 150
            ), f"Handshake took {handshake_time_ms:.2f}ms, should be ≤150ms"

            print(f"\nHandshake performance: {handshake_time_ms:.2f}ms (target: ≤150ms)")


class TestWebSocketConnectionLifecycle:
    """Test WebSocket connection lifecycle management."""

    def test_connection_and_disconnection(self, test_client, valid_jwt_token):
        """
        Test normal connection and disconnection flow.

        Expected:
            - Connection established
            - Connected message received
            - Clean disconnection
        """
        document_id = "test_doc_lifecycle"

        with test_client.websocket_connect(
            f"/api/ws/sections/{document_id}?token={valid_jwt_token}"
        ) as websocket:
            # Receive connected message
            data = websocket.receive_text()
            message = json.loads(data)

            assert message["type"] == "connected"
            assert message["document_id"] == document_id

        # Connection should close cleanly (no exception)

    def test_multiple_connections_same_user(self, test_client, valid_jwt_token):
        """
        Test multiple connections for same user/document.

        Expected:
            - Second connection replaces first
            - First connection closes
            - Second connection receives connected message
        """
        document_id = "test_doc_multi"

        # First connection
        with test_client.websocket_connect(
            f"/api/ws/sections/{document_id}?token={valid_jwt_token}"
        ) as ws1:
            data1 = ws1.receive_text()
            msg1 = json.loads(data1)
            assert msg1["type"] == "connected"

            # Second connection (should replace first)
            with test_client.websocket_connect(
                f"/api/ws/sections/{document_id}?token={valid_jwt_token}"
            ) as ws2:
                data2 = ws2.receive_text()
                msg2 = json.loads(data2)
                assert msg2["type"] == "connected"

                # First connection should be closed (TestClient might not reflect this)

    def test_different_documents_same_user(self, test_client, valid_jwt_token):
        """
        Test connections to different documents for same user.

        Expected:
            - Both connections active simultaneously
            - Each receives connected message with correct document_id
        """
        doc_id_1 = "test_doc_1"
        doc_id_2 = "test_doc_2"

        with test_client.websocket_connect(
            f"/api/ws/sections/{doc_id_1}?token={valid_jwt_token}"
        ) as ws1:
            data1 = ws1.receive_text()
            msg1 = json.loads(data1)
            assert msg1["type"] == "connected"
            assert msg1["document_id"] == doc_id_1

            with test_client.websocket_connect(
                f"/api/ws/sections/{doc_id_2}?token={valid_jwt_token}"
            ) as ws2:
                data2 = ws2.receive_text()
                msg2 = json.loads(data2)
                assert msg2["type"] == "connected"
                assert msg2["document_id"] == doc_id_2

                # Both connections should be active


class TestWebSocketMessageHandling:
    """Test WebSocket message handling (ST1 skeleton)."""

    def test_client_action_message_parsing(self, test_client, valid_jwt_token):
        """
        Test client action message parsing.

        ST1: Basic parsing skeleton (no actual logic yet)
        Expected: No error on valid client action message
        """
        document_id = "test_doc_action"

        with test_client.websocket_connect(
            f"/api/ws/sections/{document_id}?token={valid_jwt_token}"
        ) as websocket:
            # Receive connected message
            websocket.receive_text()

            # Send client action message
            action_message = {
                "type": "client_action",
                "action": "pause",
                "section_id": "section_1",
                "reason": "User requested pause",
                "timestamp": time.time(),
            }

            websocket.send_text(json.dumps(action_message))

            # ST1: No response expected yet (just validates parsing)
            # Connection should remain open

    def test_invalid_message_handling(self, test_client, valid_jwt_token):
        """
        Test invalid message handling.

        Expected: Error message sent, connection remains open
        """
        document_id = "test_doc_invalid"

        with test_client.websocket_connect(
            f"/api/ws/sections/{document_id}?token={valid_jwt_token}"
        ) as websocket:
            # Receive connected message
            websocket.receive_text()

            # Send invalid JSON
            websocket.send_text("{invalid json")

            # Should receive error message
            data = websocket.receive_text()
            message = json.loads(data)

            assert message["type"] == "error"
            assert message["error_code"] == "INVALID_MESSAGE"
            assert message["fatal"] is False


class TestWebSocketHealth:
    """Test WebSocket health endpoint."""

    def test_websocket_health_endpoint(self, test_client):
        """
        Test WebSocket health check endpoint.

        Expected: Returns connection statistics
        """
        response = test_client.get("/api/ws/health")

        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "total_connections" in data
        assert data["websocket_enabled"] is True


class TestWebSocketPerformance:
    """Test WebSocket performance requirements."""

    def test_handshake_performance_multiple_connections(self, test_client, valid_jwt_token):
        """
        Test handshake performance with multiple sequential connections.

        Performance Requirement: Each handshake ≤150ms

        Expected: All handshakes complete within time limit
        """
        document_ids = [f"test_doc_perf_{i}" for i in range(5)]
        handshake_times = []

        for doc_id in document_ids:
            start_time = time.time()

            with test_client.websocket_connect(
                f"/api/ws/sections/{doc_id}?token={valid_jwt_token}"
            ) as websocket:
                websocket.receive_text()  # Connected message
                handshake_time_ms = (time.time() - start_time) * 1000
                handshake_times.append(handshake_time_ms)

        # Check all handshakes meet performance requirement
        for i, hs_time in enumerate(handshake_times):
            assert hs_time <= 150, f"Handshake {i+1} took {hs_time:.2f}ms, should be ≤150ms"

        # Print statistics
        avg_time = sum(handshake_times) / len(handshake_times)
        max_time = max(handshake_times)
        print(f"\nHandshake performance statistics ({len(handshake_times)} connections):")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        print("  All ≤150ms: ✓")


# Run tests with pytest:
# pytest backend/tests/test_websocket_integration.py -v -s
