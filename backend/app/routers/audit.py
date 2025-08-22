"""
Audit log endpoints for WORM audit system
T-13: Admin-only access to audit logs with comprehensive filtering and security hardening
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPBearer
from typing import Optional, List
import asyncio
import logging
import time

from app.services.audit import AuditService
from app.services.auth import AuthService
from app.models.audit import AuditActionType
from app.models.audit_schemas import (
    AuditLogQueryFilters,
    AuditLogListResponse,
    AuditLogStatsResponse,
    AuditConfigResponse,
)
from app.security.rate_limiter import SecurityLogger
from app.core.config import settings
from app.core.base_validators import BaseQueryValidator, BaseSecurityValidator
from app.core.base_crud import ValidationError, PermissionError

# Security-focused logging
logger = logging.getLogger(__name__)
security_logger = SecurityLogger()

router = APIRouter(prefix="/audit", tags=["audit"])
security = HTTPBearer()

# Initialize shared validators
query_validator = BaseQueryValidator()
security_validator = BaseSecurityValidator()


async def get_current_admin_user(token: str = Depends(security), request: Request = None):
    """
    Enhanced dependency to verify admin user access for audit endpoints with security logging

    Args:
        token: JWT token from Authorization header
        request: FastAPI request object for security logging

    Returns:
        dict: User data with admin role verification

    Raises:
        HTTPException: If user is not authenticated or not admin
    """
    client_ip = request.client.host if request and request.client else "unknown"

    try:
        auth_service = AuthService()
        user_data = auth_service.verify_token(token.credentials)

        # Use base security validator for role validation
        if not security_validator.validate_user_role(user_data.get("role"), ["admin"]):
            # Log unauthorized access attempt
            security_logger.log_security_event(
                "UNAUTHORIZED_AUDIT_ACCESS",
                {
                    "user_email": user_data.get("email", "unknown"),
                    "user_role": user_data.get("role", "unknown"),
                    "ip_address": client_ip,
                    "endpoint": request.url.path if request else "unknown",
                    "timestamp": time.time(),
                },
                "WARNING",
            )

            raise HTTPException(
                status_code=403, detail="Audit log access restricted to administrators"
            )

        # Log successful admin authentication for audit endpoints
        if settings.SECURITY_LOG_ENABLED:
            logger.info(f"Admin access granted to {user_data.get('email')} from IP {client_ip}")

        return user_data

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log authentication failure
        security_logger.log_security_event(
            "AUDIT_AUTH_FAILURE",
            {
                "error": str(e),
                "ip_address": client_ip,
                "endpoint": request.url.path if request else "unknown",
                "timestamp": time.time(),
            },
            "ERROR",
        )

        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    request: Request,
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    action_type: Optional[AuditActionType] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    status: Optional[str] = Query(
        None, regex="^(success|failure|error)$", description="Filter by status"
    ),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    sort_by: str = Query("timestamp", regex="^(timestamp|action_type|user_email|status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: dict = Depends(get_current_admin_user),
):
    """
    Retrieve audit logs with filtering and pagination (Admin only)

    This endpoint provides comprehensive access to audit logs for administrators.
    Supports filtering by user, action type, date range, and other criteria.
    """

    try:
        # Enhanced security logging for audit log access
        client_ip = request.client.host if request.client else "unknown"

        # Log security event
        security_logger.log_security_event(
            "AUDIT_LOG_ACCESS",
            {
                "admin_email": current_user["email"],
                "admin_id": current_user.get("user_id"),
                "ip_address": client_ip,
                "filters": {
                    "user_id": user_id,
                    "user_email": user_email,
                    "action_type": action_type.value if action_type else None,
                    "resource_type": resource_type,
                    "date_range": f"{date_from} to {date_to}" if date_from or date_to else None,
                },
                "page": page,
                "page_size": page_size,
                "timestamp": time.time(),
            },
            "INFO",
        )

        # Log the audit log access itself in audit system
        audit_service = AuditService()
        asyncio.create_task(
            audit_service.log_event(
                action_type=AuditActionType.SYSTEM_CONFIG_CHANGE,
                description=f"Admin {current_user['email']} accessed audit logs from IP {client_ip}",
                user_id=current_user.get("user_id"),
                user_email=current_user["email"],
                user_role=current_user["role"],
                details={
                    "filters_applied": bool(
                        any([user_id, user_email, action_type, resource_type, date_from, date_to])
                    ),
                    "page_requested": page,
                    "page_size": page_size,
                    "client_ip": client_ip,
                },
                request=request,
            )
        )

        # Validate pagination parameters using base validator
        pagination_validation = query_validator.validate_pagination(page, page_size)
        if not pagination_validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid pagination parameters: {', '.join(pagination_validation['errors'])}",
            )

        # Use validated pagination values
        page = pagination_validation["page"]
        page_size = pagination_validation["page_size"]

        # Validate sort parameters using base validator
        allowed_sort_fields = ["timestamp", "action_type", "user_email", "status"]
        sort_validation = query_validator.validate_sort_parameters(
            sort_by, sort_order, allowed_sort_fields
        )
        if not sort_validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sort parameters: {', '.join(sort_validation['errors'])}",
            )

        # Use validated sort parameters
        sort_by = sort_validation["sort_by"]
        sort_order = sort_validation["sort_order"]

        # Parse date filters
        from datetime import datetime

        parsed_date_from = None
        parsed_date_to = None

        if date_from:
            try:
                parsed_date_from = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Invalid date_from format. Use ISO format."
                )

        if date_to:
            try:
                parsed_date_to = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Invalid date_to format. Use ISO format."
                )

        # Create filter object
        filters = AuditLogQueryFilters(
            user_id=user_id,
            user_email=user_email,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            status=status,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        # Retrieve audit logs
        result = await audit_service.get_audit_logs(filters, current_user["role"])

        return result

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit logs: {str(e)}")


@router.get("/stats", response_model=AuditLogStatsResponse)
async def get_audit_statistics(
    request: Request, current_user: dict = Depends(get_current_admin_user)
):
    """
    Get audit log statistics and metrics (Admin only)

    Provides overview statistics including event counts, top actions,
    top users, and security event summaries.
    """

    try:
        # Log the statistics access
        audit_service = AuditService()
        asyncio.create_task(
            audit_service.log_event(
                action_type=AuditActionType.SYSTEM_CONFIG_CHANGE,
                description=f"Admin {current_user['email']} accessed audit statistics",
                user_id=current_user.get("user_id"),
                user_email=current_user["email"],
                user_role=current_user["role"],
                request=request,
            )
        )

        # Get statistics
        stats = await audit_service.get_audit_stats(current_user["role"])

        return stats

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve audit statistics: {str(e)}"
        )


@router.get("/verify/{log_id}")
async def verify_log_integrity(
    log_id: str, request: Request, current_user: dict = Depends(get_current_admin_user)
):
    """
    Verify the integrity of a specific audit log entry (Admin only)

    Recalculates the hash of the audit log entry and compares it with
    the stored hash to detect any tampering.
    """

    try:
        # Log the integrity verification
        audit_service = AuditService()
        asyncio.create_task(
            audit_service.log_event(
                action_type=AuditActionType.SYSTEM_CONFIG_CHANGE,
                description=f"Admin {current_user['email']} verified log integrity for {log_id}",
                user_id=current_user.get("user_id"),
                user_email=current_user["email"],
                user_role=current_user["role"],
                resource_type="audit_log",
                resource_id=log_id,
                request=request,
            )
        )

        # Verify integrity
        is_valid = await audit_service.verify_log_integrity(log_id)

        return {
            "log_id": log_id,
            "integrity_valid": is_valid,
            "verified_at": audit_service._session_factory().bind.dialect.name,
            "verified_by": current_user["email"],
        }

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify log integrity: {str(e)}")


@router.get("/actions", response_model=List[str])
async def get_audit_action_types(current_user: dict = Depends(get_current_admin_user)):
    """
    Get list of all available audit action types (Admin only)

    Returns all possible action types that can be used for filtering.
    """

    return [action.value for action in AuditActionType]


@router.get("/config", response_model=AuditConfigResponse)
async def get_audit_config(current_user: dict = Depends(get_current_admin_user)):
    """
    Get audit system configuration (Admin only)

    Returns current audit system settings and configuration.
    """

    # Return default configuration (in production, this would come from database)
    return AuditConfigResponse(
        retention_days=365,
        max_log_size=1000000,
        auto_archive=True,
        integrity_checks=True,
        real_time_alerts=True,
    )


@router.post("/test-event")
async def create_test_audit_event(
    request: Request, current_user: dict = Depends(get_current_admin_user)
):
    """
    Create a test audit event (Admin only - for testing purposes)

    Creates a test audit log entry to verify the system is working correctly.
    """

    try:
        audit_service = AuditService()

        # Create test event
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.SYSTEM_CONFIG_CHANGE,
            description=f"Test audit event created by admin {current_user['email']}",
            user_id=current_user.get("user_id"),
            user_email=current_user["email"],
            user_role=current_user["role"],
            details={"test_event": True, "created_via": "audit_api", "purpose": "system_testing"},
            request=request,
        )

        return {
            "success": True,
            "audit_id": audit_id,
            "message": "Test audit event created successfully",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create test event: {str(e)}")


# Helper endpoint for manual audit logging from other services
@router.post("/log-event")
async def log_manual_event(
    action_type: AuditActionType,
    description: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    status: str = "success",
    request: Request = None,
    current_user: dict = Depends(get_current_admin_user),
):
    """
    Manually log an audit event (Admin only - for system integration)

    Allows administrators to manually create audit log entries for
    system integration and testing purposes.
    """

    try:
        if status not in ["success", "failure", "error"]:
            raise HTTPException(status_code=400, detail="Status must be success, failure, or error")

        audit_service = AuditService()

        audit_id = await audit_service.log_event(
            action_type=action_type,
            description=description,
            user_id=current_user.get("user_id"),
            user_email=current_user["email"],
            user_role=current_user["role"],
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            status=status,
            request=request,
        )

        return {"success": True, "audit_id": audit_id, "message": "Audit event logged successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log audit event: {str(e)}")
