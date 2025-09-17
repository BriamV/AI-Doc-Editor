"""
Pydantic schemas for audit log API requests and responses
T-13: WORM audit system API contracts
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

from .audit import AuditActionType


class AuditLogCreate(BaseModel):
    """Schema for creating audit log entries (internal use only)"""

    action_type: AuditActionType
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: str = Field(..., min_length=1, max_length=1000)
    details: Optional[Dict[str, Any]] = None
    status: str = Field(default="success", pattern="^(success|failure|error)$")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "action_type": "document_create",
                "resource_type": "document",
                "resource_id": "doc_12345",
                "description": "User created new document 'Project Proposal'",
                "details": {
                    "document_title": "Project Proposal",
                    "document_size": 1024,
                    "template_used": "business_template",
                },
                "status": "success",
            }
        }
    )


class AuditLogResponse(BaseModel):
    """Schema for audit log responses (admin view only)"""

    id: str
    action_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    ip_address: Optional[str] = None
    description: str
    details: Optional[Dict[str, Any]] = None
    status: str
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "action_type": "login_success",
                "resource_type": None,
                "resource_id": None,
                "user_id": "user_12345",
                "user_email": "admin@example.com",
                "user_role": "admin",
                "ip_address": "192.168.1.100",
                "description": "User successfully logged in via Google OAuth",
                "details": {"provider": "google", "browser": "Chrome 91.0"},
                "status": "success",
                "timestamp": "2024-01-15T10:30:00Z",
                "created_at": "2024-01-15T10:30:00Z",
            }
        },
    )


class AuditLogQueryFilters(BaseModel):
    """Schema for audit log query filters"""

    user_id: Optional[str] = Field(None, description="Filter by user ID")
    user_email: Optional[str] = Field(None, description="Filter by user email")
    action_type: Optional[AuditActionType] = Field(None, description="Filter by action type")
    resource_type: Optional[str] = Field(None, description="Filter by resource type")
    resource_id: Optional[str] = Field(None, description="Filter by resource ID")
    ip_address: Optional[str] = Field(None, description="Filter by IP address")
    status: Optional[str] = Field(None, pattern="^(success|failure|error)$")
    date_from: Optional[datetime] = Field(None, description="Filter from date (inclusive)")
    date_to: Optional[datetime] = Field(None, description="Filter to date (inclusive)")

    # Pagination
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    page_size: int = Field(default=50, ge=1, le=1000, description="Items per page")

    # Sorting
    sort_by: str = Field(default="timestamp", pattern="^(timestamp|action_type|user_email|status)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_email": "admin@example.com",
                "action_type": "document_create",
                "date_from": "2024-01-01T00:00:00Z",
                "date_to": "2024-01-31T23:59:59Z",
                "page": 1,
                "page_size": 50,
                "sort_by": "timestamp",
                "sort_order": "desc",
            }
        }
    )


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log responses"""

    logs: List[AuditLogResponse]
    total_count: int = Field(..., description="Total number of audit logs matching filters")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_previous: bool = Field(..., description="Whether there are previous pages")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "logs": [],  # List of AuditLogResponse objects
                "total_count": 150,
                "page": 1,
                "page_size": 50,
                "total_pages": 3,
                "has_next": True,
                "has_previous": False,
            }
        }
    )


class AuditLogSummaryResponse(BaseModel):
    """Schema for audit log summary/statistics"""

    date: datetime
    action_type: str
    user_id: Optional[str] = None
    count: int

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "date": "2024-01-15T00:00:00Z",
                "action_type": "login_success",
                "user_id": "user_12345",
                "count": 5,
            }
        },
    )


class AuditLogStatsResponse(BaseModel):
    """Schema for audit log statistics and metrics"""

    total_events: int
    events_today: int
    events_this_week: int
    events_this_month: int
    top_actions: List[Dict[str, Any]]
    top_users: List[Dict[str, Any]]
    security_events: int
    failed_logins: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_events": 1250,
                "events_today": 45,
                "events_this_week": 320,
                "events_this_month": 890,
                "top_actions": [
                    {"action_type": "document_view", "count": 450},
                    {"action_type": "login_success", "count": 125},
                ],
                "top_users": [
                    {"user_email": "admin@example.com", "count": 85},
                    {"user_email": "editor@example.com", "count": 72},
                ],
                "security_events": 12,
                "failed_logins": 8,
            }
        }
    )


class AuditConfigResponse(BaseModel):
    """Schema for audit system configuration"""

    retention_days: int = Field(default=365, description="Days to retain audit logs")
    max_log_size: int = Field(default=1000000, description="Maximum log entries before archival")
    auto_archive: bool = Field(default=True, description="Enable automatic archival")
    integrity_checks: bool = Field(default=True, description="Enable integrity verification")
    real_time_alerts: bool = Field(default=True, description="Enable real-time security alerts")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "retention_days": 365,
                "max_log_size": 1000000,
                "auto_archive": True,
                "integrity_checks": True,
                "real_time_alerts": True,
            }
        }
    )
