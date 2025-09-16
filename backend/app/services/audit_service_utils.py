"""
Utility functions for audit service
T-13: Helper functions for audit operations, validation, and data processing
"""

import json
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import Request

from app.models.audit import AuditLog, AuditActionType, AuditLogSummary
from app.models.audit_schemas import AuditLogResponse


class AuditServiceUtils:
    """
    Utility functions for audit service operations

    Provides helper functions for data processing, validation, and conversion
    operations used throughout the audit system.
    """

    @staticmethod
    def generate_audit_id() -> str:
        """
        Generate unique audit log ID

        Returns:
            str: Unique audit log identifier
        """
        return str(uuid.uuid4())

    @staticmethod
    def serialize_details(details: Optional[Dict[str, Any]]) -> Optional[str]:
        """
        Serialize details dictionary to JSON string

        Args:
            details: Details dictionary to serialize

        Returns:
            str: JSON string or None if details is None
        """
        return json.dumps(details, default=str) if details else None

    @staticmethod
    def calculate_record_hash(audit_log: AuditLog) -> str:
        """
        Calculate SHA-256 hash of audit log record for integrity verification

        Args:
            audit_log: AuditLog instance

        Returns:
            str: SHA-256 hash of record content
        """
        # Create deterministic string representation
        hash_content = (
            f"{audit_log.id}|{audit_log.action_type}|{audit_log.user_id}|"
            f"{audit_log.user_email}|{audit_log.description}|{audit_log.timestamp}|"
            f"{audit_log.details or ''}|{audit_log.status}"
        )

        return hashlib.sha256(hash_content.encode("utf-8")).hexdigest()

    @staticmethod
    def extract_request_context(request: Optional[Request]) -> Dict[str, Optional[str]]:
        """
        Extract context information from FastAPI Request object

        Args:
            request: FastAPI Request object

        Returns:
            dict: Extracted context information
        """
        if not request:
            return {"ip_address": None, "user_agent": None, "session_id": None}

        return {
            "ip_address": AuditServiceUtils._extract_ip_address(request),
            "user_agent": request.headers.get("user-agent"),
            "session_id": request.headers.get("x-session-id"),
        }

    @staticmethod
    def _extract_ip_address(request: Request) -> Optional[str]:
        """
        Extract client IP address from request with proxy support

        Args:
            request: FastAPI Request object

        Returns:
            str: Client IP address
        """
        # Check for forwarded headers (proxy support)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct client IP
        return request.client.host if request.client else None

    @staticmethod
    def validate_admin_access(admin_user_role: str) -> None:
        """
        Validate that user has admin access for audit operations

        Args:
            admin_user_role: Role of requesting user

        Raises:
            PermissionError: If user is not admin
        """
        if admin_user_role != "admin":
            raise PermissionError("Audit log access restricted to administrators")

    @staticmethod
    def convert_logs_to_response(audit_logs: List[AuditLog]) -> List[AuditLogResponse]:
        """
        Convert list of AuditLog models to response objects

        Args:
            audit_logs: List of AuditLog models

        Returns:
            List[AuditLogResponse]: Converted response objects
        """
        return [
            AuditLogResponse(
                id=log.id,
                action_type=log.action_type,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                user_id=log.user_id,
                user_email=log.user_email,
                user_role=log.user_role,
                ip_address=log.ip_address,
                description=log.description,
                details=json.loads(log.details) if log.details else None,
                status=log.status,
                timestamp=log.timestamp,
                created_at=log.created_at,
            )
            for log in audit_logs
        ]

    @staticmethod
    def format_stats_results(result_rows: List[tuple], key_name: str) -> List[Dict[str, Any]]:
        """
        Format database result rows into statistics dictionaries

        Args:
            result_rows: Database result rows
            key_name: Name for the key field in result dictionaries

        Returns:
            List[Dict]: Formatted statistics
        """
        return [{key_name: row[0], "count": row[1]} for row in result_rows]

    @staticmethod
    def get_time_periods() -> Dict[str, datetime]:
        """
        Get standard time period boundaries for statistics

        Returns:
            dict: Dictionary of time boundaries
        """
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        return {
            "now": now,
            "today": today,
            "week_ago": now - timedelta(days=7),
            "month_ago": now - timedelta(days=30),
        }

    @staticmethod
    def get_security_action_types() -> List[str]:
        """
        Get list of action types considered security events

        Returns:
            List[str]: Security action types
        """
        return ["unauthorized_access", "permission_denied", "suspicious_activity"]

    @staticmethod
    def round_timestamp_to_day(timestamp: datetime) -> datetime:
        """
        Round timestamp to day boundary for aggregation

        Args:
            timestamp: Original timestamp

        Returns:
            datetime: Timestamp rounded to day
        """
        return timestamp.replace(hour=0, minute=0, second=0, microsecond=0)

    @staticmethod
    def create_summary_entry(
        date: datetime, action_type: AuditActionType, user_id: Optional[str]
    ) -> AuditLogSummary:
        """
        Create new audit log summary entry

        Args:
            date: Date for summary
            action_type: Type of action
            user_id: User ID

        Returns:
            AuditLogSummary: New summary entry
        """
        return AuditLogSummary(date=date, action_type=action_type.value, user_id=user_id, count=1)

    @staticmethod
    def log_critical_failure(error: Exception, context: str = "") -> None:
        """
        Log critical audit system failures

        Args:
            error: Exception that occurred
            context: Additional context information
        """
        print(f"CRITICAL: Audit logging failure{' - ' + context if context else ''} - {error}")

    @staticmethod
    def log_warning(message: str) -> None:
        """
        Log warning message for audit system

        Args:
            message: Warning message
        """
        print(f"Warning: {message}")

    @staticmethod
    def safe_default_value(value: Any, default: Any) -> Any:
        """
        Return value or default if value is None

        Args:
            value: Value to check
            default: Default value if None

        Returns:
            Any: Value or default
        """
        return value if value is not None else default
