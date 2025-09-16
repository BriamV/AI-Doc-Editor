"""
Audit middleware for automatic logging of critical operations
T-13: Transparent audit logging for security compliance
"""

import asyncio
from datetime import datetime
from typing import Callable, Dict, Any
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.services.audit import AuditService
from app.models.audit import AuditActionType
from app.middleware.audit_action_detector import AuditActionDetector
from app.middleware.audit_resource_utils import AuditResourceUtils


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware for automatic audit logging of HTTP requests

    Automatically logs critical operations like authentication,
    document operations, and configuration changes.
    """

    def __init__(self, app, audit_service: AuditService = None):
        super().__init__(app)
        self.audit_service = audit_service or AuditService()
        self.action_detector = AuditActionDetector()
        self.resource_utils = AuditResourceUtils()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and response, logging audit events as needed

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/endpoint in chain

        Returns:
            Response: HTTP response
        """

        start_time = datetime.utcnow()
        path = request.url.path
        method = request.method

        # Extract user context from headers/session
        user_context = await self.resource_utils.extract_user_context(request)

        # Determine if this request should be audited
        should_audit = self.action_detector.should_audit_request(path, method)
        audit_action = self.action_detector.determine_audit_action(path, method)

        # Process the request
        try:
            response = await call_next(request)

            # Log successful operations
            if should_audit and response.status_code < 400:
                await self._log_successful_operation(
                    request, response, audit_action, user_context, start_time
                )

            # Log failed operations
            elif should_audit and response.status_code >= 400:
                await self._log_failed_operation(
                    request, response, audit_action, user_context, start_time
                )

            return response

        except Exception as e:
            # Log exceptions
            if should_audit:
                await self._log_exception(request, e, audit_action, user_context, start_time)
            raise

    async def _log_successful_operation(
        self,
        request: Request,
        response: Response,
        action_type: AuditActionType,
        user_context: Dict[str, Any],
        start_time: datetime,
    ):
        """
        Log successful operation

        Args:
            request: HTTP request
            response: HTTP response
            action_type: Type of audit action
            user_context: User context information
            start_time: Request start time
        """

        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        description = self.action_detector.generate_description(
            request.url.path, action_type, "success", request.method
        )
        details = self.resource_utils.extract_request_details(
            request, response, duration_ms, response.status_code
        )

        # Extract resource information
        resource_type, resource_id = self.resource_utils.extract_resource_info(request)

        # Log asynchronously to avoid blocking response
        asyncio.create_task(
            self.audit_service.log_event(
                action_type=action_type,
                description=description,
                user_id=user_context["user_id"],
                user_email=user_context["user_email"],
                user_role=user_context["user_role"],
                resource_type=resource_type,
                resource_id=resource_id,
                session_id=user_context["session_id"],
                details=details,
                status="success",
                request=request,
            )
        )

    async def _log_failed_operation(
        self,
        request: Request,
        response: Response,
        action_type: AuditActionType,
        user_context: Dict[str, Any],
        start_time: datetime,
    ):
        """
        Log failed operation

        Args:
            request: HTTP request
            response: HTTP response
            action_type: Type of audit action
            user_context: User context information
            start_time: Request start time
        """

        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        # Determine if this is an authentication failure
        action_type = self.action_detector.determine_failure_action_type(response.status_code)

        description = self.action_detector.generate_description(
            request.url.path, action_type, "failure", request.method
        )
        details = self.resource_utils.extract_request_details(
            request, response, duration_ms, response.status_code
        )
        details["error_type"] = "http_error"

        # Extract resource information
        resource_type, resource_id = self.resource_utils.extract_resource_info(request)

        # Log asynchronously
        asyncio.create_task(
            self.audit_service.log_event(
                action_type=action_type,
                description=description,
                user_id=user_context["user_id"],
                user_email=user_context["user_email"],
                user_role=user_context["user_role"],
                resource_type=resource_type,
                resource_id=resource_id,
                session_id=user_context["session_id"],
                details=details,
                status="failure",
                request=request,
            )
        )

    async def _log_exception(
        self,
        request: Request,
        exception: Exception,
        action_type: AuditActionType,
        user_context: Dict[str, Any],
        start_time: datetime,
    ):
        """
        Log exception/error

        Args:
            request: HTTP request
            exception: Exception that occurred
            action_type: Type of audit action
            user_context: User context information
            start_time: Request start time
        """

        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        description = self.action_detector.generate_description(
            request.url.path, action_type, "error", request.method
        )
        details = self.resource_utils.extract_error_details(request, exception, duration_ms)

        # Extract resource information
        resource_type, resource_id = self.resource_utils.extract_resource_info(request)

        # Log asynchronously
        asyncio.create_task(
            self.audit_service.log_event(
                action_type=AuditActionType.SUSPICIOUS_ACTIVITY,
                description=description,
                user_id=user_context["user_id"],
                user_email=user_context["user_email"],
                user_role=user_context["user_role"],
                resource_type=resource_type,
                resource_id=resource_id,
                session_id=user_context["session_id"],
                details=details,
                status="error",
                request=request,
            )
        )
