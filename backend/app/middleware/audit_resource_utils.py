"""
Resource extraction utilities for audit middleware
T-13: Resource identification and context extraction from HTTP requests
"""

from typing import Dict, Any, Optional, Tuple
from starlette.requests import Request

from app.core.base_request_utils import (
    BaseResourceExtractor,
    BaseAuthenticationExtractor,
    BaseRequestExtractor,
)


class AuditResourceUtils(BaseResourceExtractor):
    """
    Audit-specific utility class for extracting resource information and user context
    Inherits from base classes to eliminate code duplication
    """

    def __init__(self):
        super().__init__()
        # Add audit-specific resource patterns
        self.resource_patterns.update(
            {
                "audit": r"^/audit/(?P<action>[^/]+)",
                "credentials": r"^/credentials/(?P<id>[^/]+)?",
            }
        )

    def extract_resource_info(self, request: Request) -> Tuple[Optional[str], Optional[str]]:
        """
        Extract resource type and ID from request path
        Uses inherited logic with audit-specific patterns

        Args:
            request: HTTP request

        Returns:
            tuple: (resource_type, resource_id)
        """
        # Use inherited method which handles all the patterns
        return super().extract_resource_info(request)

    async def extract_user_context(self, request: Request) -> Dict[str, Any]:
        """
        Extract user context from request headers/session
        Uses inherited authentication extraction

        Args:
            request: HTTP request

        Returns:
            dict: User context information
        """
        auth_extractor = AuditAuthenticationExtractor()
        context = await auth_extractor.extract_user_context(request)

        # Convert to the expected format for backward compatibility
        return {
            "user_id": context.user_id,
            "user_email": context.user_email,
            "user_role": context.user_role,
            "session_id": context.session_id,
        }

    def extract_request_details(
        self, request: Request, response=None, duration_ms: float = None, status_code: int = None
    ) -> Dict[str, Any]:
        """
        Extract comprehensive request details for audit logging
        Uses inherited request extraction with audit-specific additions

        Args:
            request: HTTP request
            response: HTTP response (optional)
            duration_ms: Request duration in milliseconds (optional)
            status_code: HTTP status code (optional)

        Returns:
            dict: Request details for audit logging
        """
        # Get basic request details using inherited method
        details = {
            "method": request.method,
            "path": request.url.path,
            "query_params": self.extract_query_parameters(request),
        }

        # Add timing and response information
        if duration_ms is not None:
            details["duration_ms"] = round(duration_ms, 2)

        if status_code is not None:
            details["status_code"] = status_code

        if response is not None:
            details["response_size"] = response.headers.get("content-length")

        return details

    def extract_error_details(
        self, request: Request, exception: Exception, duration_ms: float
    ) -> Dict[str, Any]:
        """
        Extract error details for audit logging

        Args:
            request: HTTP request
            exception: Exception that occurred
            duration_ms: Request duration in milliseconds

        Returns:
            dict: Error details for audit logging
        """
        return {
            "method": request.method,
            "path": request.url.path,
            "exception_type": type(exception).__name__,
            "exception_message": str(exception),
            "duration_ms": round(duration_ms, 2),
            "error_type": "exception",
        }

    def extract_ip_address(self, request: Request) -> Optional[str]:
        """
        Extract client IP address from request with proxy support
        Uses inherited IP extraction

        Args:
            request: HTTP request

        Returns:
            str: Client IP address
        """
        extractor = BaseRequestExtractor()
        return extractor.extract_ip_address(request)

    def extract_user_agent(self, request: Request) -> Optional[str]:
        """
        Extract user agent from request headers
        Uses inherited user agent extraction

        Args:
            request: HTTP request

        Returns:
            str: User agent string
        """
        extractor = BaseRequestExtractor()
        return extractor.extract_user_agent(request)

    def extract_session_id(self, request: Request) -> Optional[str]:
        """
        Extract session ID from request headers

        Args:
            request: HTTP request

        Returns:
            str: Session ID
        """
        return request.headers.get("x-session-id")


class AuditAuthenticationExtractor(BaseAuthenticationExtractor):
    """
    Audit-specific authentication extractor
    Extends base authentication extractor for audit logging needs
    """

    async def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify authentication token using the application's auth service

        Args:
            token: Authentication token

        Returns:
            dict: User data or None if token is invalid
        """
        try:
            from app.services.auth import AuthService

            auth_service = AuthService()
            return auth_service.verify_token(token)
        except Exception:
            # Token verification failed - return None for unauthenticated context
            return None
