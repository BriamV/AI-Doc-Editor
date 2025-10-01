"""
Audit log models for WORM (Write Once, Read Many) implementation
T-13: Security audit system with tamper-proof logging
"""

from sqlalchemy import Column, String, DateTime, Text, Index, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.sqlite import INTEGER
from datetime import datetime
from enum import Enum
import uuid

Base = declarative_base()


class AuditActionType(str, Enum):
    """Enumeration of auditable actions"""

    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"

    # Document operations
    DOCUMENT_CREATE = "document_create"
    DOCUMENT_UPDATE = "document_update"
    DOCUMENT_DELETE = "document_delete"
    DOCUMENT_VIEW = "document_view"
    DOCUMENT_EXPORT = "document_export"
    DOCUMENT_UPLOAD = "document_upload"  # T-04: File upload event

    # Configuration changes
    CONFIG_UPDATE = "config_update"
    API_KEY_UPDATE = "api_key_update"
    OAUTH_CONFIG_UPDATE = "oauth_config_update"

    # Administrative actions
    USER_CREATE = "user_create"
    USER_ROLE_CHANGE = "user_role_change"
    USER_DELETE = "user_delete"
    SYSTEM_CONFIG_CHANGE = "system_config_change"

    # Security events
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

    # System events
    SYSTEM_START = "system_start"
    SYSTEM_SHUTDOWN = "system_shutdown"
    DATABASE_BACKUP = "database_backup"


class AuditLog(Base):
    """
    WORM audit log table - records can only be inserted, never updated or deleted
    Implements tamper-proof logging for security compliance
    """

    __tablename__ = "audit_logs"

    # Primary key - using UUID for better distribution and security
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Event identification
    action_type = Column(String(50), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True, index=True)  # document, user, config, etc.
    resource_id = Column(String(255), nullable=True, index=True)  # ID of affected resource

    # User context
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    user_role = Column(String(20), nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True, index=True)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    session_id = Column(String(255), nullable=True)

    # Event details
    description = Column(Text, nullable=False)
    details = Column(Text, nullable=True)  # JSON string for additional data
    status = Column(String(20), nullable=False, default="success")  # success, failure, error

    # Temporal data
    timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
        index=True,
    )

    # WORM enforcement - these columns cannot be updated once set
    created_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP")
    )

    # Integrity verification (optional hash for tamper detection)
    record_hash = Column(String(64), nullable=True)  # SHA-256 hash of record content

    # Database constraints for WORM enforcement
    __table_args__ = (
        # Indexes for efficient querying
        Index("idx_audit_user_action", "user_id", "action_type"),
        Index("idx_audit_timestamp_user", "timestamp", "user_id"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_ip_timestamp", "ip_address", "timestamp"),
        # SQLite trigger will be added in migration to prevent updates/deletes
    )

    def __repr__(self):
        return (
            f"<AuditLog(id={self.id}, action={self.action_type}, "
            f"user={self.user_email}, timestamp={self.timestamp})>"
        )


class AuditLogSummary(Base):
    """
    Read-only view for audit log statistics and summaries
    Used for dashboard and reporting without exposing full audit details
    """

    __tablename__ = "audit_log_summary"

    id = Column(INTEGER, primary_key=True, autoincrement=True)
    date = Column(DateTime, nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    count = Column(INTEGER, nullable=False, default=1)

    __table_args__ = (
        Index("idx_summary_date_action", "date", "action_type"),
        Index("idx_summary_user_date", "user_id", "date"),
    )
