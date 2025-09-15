"""
Action detection utilities for audit middleware
T-13: Specialized action type detection and classification
"""

from typing import Optional
from app.models.audit import AuditActionType


class AuditActionDetector:
    """
    Utility class for detecting audit action types from HTTP requests

    Handles classification of HTTP requests into appropriate audit action types
    based on URL patterns, HTTP methods, and endpoint characteristics.
    """

    def __init__(self):
        """Initialize action detector with endpoint patterns"""
        # Define which endpoints trigger specific audit logs
        self.audit_patterns = {
            # Authentication endpoints
            "/auth/login": AuditActionType.LOGIN_SUCCESS,
            "/auth/callback": AuditActionType.LOGIN_SUCCESS,
            "/auth/logout": AuditActionType.LOGOUT,
            "/auth/refresh": AuditActionType.TOKEN_REFRESH,
            # Document operations (would be implemented)
            "/documents": AuditActionType.DOCUMENT_CREATE,
            "/documents/": AuditActionType.DOCUMENT_UPDATE,
            # Configuration endpoints
            "/config": AuditActionType.CONFIG_UPDATE,
            "/credentials": AuditActionType.API_KEY_UPDATE,
            # Admin operations
            "/admin": AuditActionType.SYSTEM_CONFIG_CHANGE,
        }

        # Sensitive endpoints that always get logged
        self.always_audit = ["/auth/", "/admin/", "/config/", "/credentials/", "/audit/"]

    def should_audit_request(self, path: str, method: str) -> bool:
        """
        Determine if a request should be audited

        Args:
            path: Request path
            method: HTTP method

        Returns:
            bool: True if request should be audited
        """
        # Always audit sensitive endpoints
        for pattern in self.always_audit:
            if path.startswith(pattern):
                return True

        # Audit specific operations
        if method in ["POST", "PUT", "DELETE", "PATCH"]:
            return True

        # Audit specific GET endpoints
        if path in self.audit_patterns:
            return True

        return False

    def determine_audit_action(self, path: str, method: str) -> AuditActionType:
        """
        Determine the audit action type for a request

        Args:
            path: Request path
            method: HTTP method

        Returns:
            AuditActionType: Type of action to audit
        """
        # Check exact path matches first
        if path in self.audit_patterns:
            return self.audit_patterns[path]

        # Use endpoint-specific detection methods
        action_type = self.detect_auth_action(path)
        if action_type:
            return action_type

        action_type = self.detect_document_action(path, method)
        if action_type:
            return action_type

        action_type = self.detect_system_action(path)
        if action_type:
            return action_type

        # Default fallback
        return AuditActionType.SYSTEM_CONFIG_CHANGE

    def detect_auth_action(self, path: str) -> Optional[AuditActionType]:
        """
        Detect authentication-related audit actions

        Args:
            path: Request path

        Returns:
            AuditActionType: Auth action type or None if not auth-related
        """
        if not path.startswith("/auth/"):
            return None

        if "login" in path:
            return AuditActionType.LOGIN_SUCCESS
        elif "logout" in path:
            return AuditActionType.LOGOUT
        elif "refresh" in path:
            return AuditActionType.TOKEN_REFRESH
        else:
            return AuditActionType.LOGIN_SUCCESS

    def detect_document_action(self, path: str, method: str) -> Optional[AuditActionType]:
        """
        Detect document-related audit actions based on HTTP method

        Args:
            path: Request path
            method: HTTP method

        Returns:
            AuditActionType: Document action type or None if not document-related
        """
        if not path.startswith("/documents/"):
            return None

        if method == "POST":
            return AuditActionType.DOCUMENT_CREATE
        elif method in ["PUT", "PATCH"]:
            return AuditActionType.DOCUMENT_UPDATE
        elif method == "DELETE":
            return AuditActionType.DOCUMENT_DELETE
        else:
            return AuditActionType.DOCUMENT_VIEW

    def detect_system_action(self, path: str) -> Optional[AuditActionType]:
        """
        Detect system configuration and admin-related audit actions

        Args:
            path: Request path

        Returns:
            AuditActionType: System action type or None if not system-related
        """
        if path.startswith("/config/"):
            return AuditActionType.CONFIG_UPDATE
        elif path.startswith("/credentials/"):
            return AuditActionType.API_KEY_UPDATE
        elif path.startswith("/admin/") or path.startswith("/audit/"):
            return AuditActionType.SYSTEM_CONFIG_CHANGE

        return None

    def determine_failure_action_type(self, status_code: int) -> AuditActionType:
        """
        Determine audit action type for failed operations based on status code

        Args:
            status_code: HTTP status code

        Returns:
            AuditActionType: Appropriate action type for failure
        """
        if status_code == 401:
            return AuditActionType.LOGIN_FAILURE
        elif status_code == 403:
            return AuditActionType.PERMISSION_DENIED
        elif status_code >= 400:
            return AuditActionType.SUSPICIOUS_ACTIVITY
        else:
            return AuditActionType.SYSTEM_CONFIG_CHANGE

    def generate_description(
        self, path: str, action_type: AuditActionType, operation_status: str, method: str
    ) -> str:
        """
        Generate human-readable description for audit log

        Args:
            path: Request path
            action_type: Type of audit action
            operation_status: Operation status (success/failure/error)
            method: HTTP method

        Returns:
            str: Human-readable description
        """
        templates = {
            AuditActionType.LOGIN_SUCCESS: "User authentication {status} via {path}",
            AuditActionType.LOGIN_FAILURE: "User authentication failed via {path}",
            AuditActionType.LOGOUT: "User logout {status}",
            AuditActionType.DOCUMENT_CREATE: "Document creation {status}",
            AuditActionType.DOCUMENT_UPDATE: "Document update {status}",
            AuditActionType.DOCUMENT_DELETE: "Document deletion {status}",
            AuditActionType.CONFIG_UPDATE: "System configuration update {status}",
            AuditActionType.API_KEY_UPDATE: "API key configuration update {status}",
        }

        template = templates.get(action_type)
        if template:
            return template.format(status=operation_status, path=path)

        return f"{method} {path} operation {operation_status}"
