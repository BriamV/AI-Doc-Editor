"""
Key Management API Endpoints for T-12 Credential Store Security

## Overview

Comprehensive RESTful API for enterprise-grade key management operations implementing
NIST SP 800-57 key lifecycle management best practices with support for:

- **Key Lifecycle Management**: Create, rotate, revoke, and archive encryption keys
- **Zero-Downtime Key Rotation**: Manual and automated rotation with version management
- **HSM Integration**: Hardware Security Module support for enterprise deployments
- **Policy-Driven Automation**: Configurable rotation policies and schedules
- **Comprehensive Monitoring**: Real-time metrics, health checks, and performance monitoring
- **Audit Compliance**: Immutable audit trails for regulatory compliance (SOX, HIPAA, PCI-DSS)

## Security Architecture

- **Authentication**: OAuth 2.0 with JWT tokens
- **Authorization**: Role-based access control (RBAC) with admin/user permissions
- **Rate Limiting**: Adaptive rate limiting per endpoint (5-100 req/min)
- **Input Validation**: Comprehensive Pydantic model validation
- **Error Handling**: Secure error responses without sensitive data leakage
- **Audit Logging**: Cryptographically signed audit trails with integrity verification

## Key Types Supported

- **KEK (Key Encryption Keys)**: Master keys for hierarchical key management
- **DEK (Data Encryption Keys)**: Application-level encryption keys
- **TLS Keys**: Certificate private keys for transport security
- **HSM Keys**: Hardware-backed key storage references
- **Backup Keys**: Archive and disaster recovery keys

## Integration Requirements

- **FastAPI**: Async/await support for high-performance operations
- **SQLAlchemy**: Advanced ORM with async database operations
- **PostgreSQL**: Primary database with ACID transactions
- **Redis**: Session management and rate limiting (optional)
- **HSM Providers**: AWS CloudHSM, Azure Dedicated HSM, Thales Luna, UTIMACO

## API Versioning

- **Version**: v1 (current)
- **Base Path**: `/api/v1/keys`
- **Content Type**: `application/json`
- **OpenAPI Spec**: Available at `/docs` and `/redoc`

## Rate Limiting

Different endpoints have different rate limits based on security impact:
- **High Security Operations** (create, rotate, revoke): 3-10 requests/minute
- **Read Operations** (list, get): 20-100 requests/minute
- **Monitoring/Health**: 20-50 requests/minute

## Error Codes

- **400**: Invalid request parameters or business logic violation
- **401**: Authentication required or token expired
- **403**: Insufficient permissions for requested operation
- **404**: Requested key or resource not found
- **409**: Conflict with existing resource (e.g., rotation in progress)
- **429**: Rate limit exceeded
- **500**: Internal server error (details logged, not exposed)
- **503**: Service unavailable (HSM disconnected, database down)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.db.session import get_session
from app.security.key_management.key_manager import KeyManager, KeyManagerError
from app.security.key_management.rotation_scheduler import RotationScheduler
from app.models.key_management import (
    RotationPolicy,
    HSMConfiguration,
    KeyMasterCreate,
    KeyMasterResponse,
    KeyRotationRequest,
    KeyRotationResponse,
    RotationPolicyCreate,
    RotationPolicyResponse,
    HSMConfigurationCreate,
    HSMConfigurationResponse,
    KeyAuditEntry,
    KeyHealthStatus,
    KeyStatistics,
    KeyType,
    KeyStatus,
    HSMProvider,
)
from app.security.rate_limiter import rate_limit
from app.services.auth import get_current_user
from app.models.auth import UserResponse

# Initialize router
router = APIRouter(
    prefix="/api/v1/keys",
    tags=["Key Management"],
    responses={
        401: {"description": "Authentication required"},
        403: {"description": "Insufficient permissions"},
        404: {"description": "Resource not found"},
        500: {"description": "Internal server error"},
    },
)
security = HTTPBearer()
logger = logging.getLogger(__name__)

# Dependencies
key_manager = KeyManager()
rotation_scheduler: Optional[RotationScheduler] = None  # Initialized in startup


# Dependency functions
async def get_key_manager() -> KeyManager:
    """Get key manager instance"""
    return key_manager


async def get_rotation_scheduler() -> RotationScheduler:
    """Get rotation scheduler instance"""
    if rotation_scheduler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rotation scheduler not available",
        )
    return rotation_scheduler


async def validate_admin_access(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Validate admin access for key management operations"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for key management operations",
        )
    return current_user


# Key Management Endpoints


@router.post(
    "/",
    response_model=KeyMasterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Encryption Key",
    description="Create a new encryption key with specified parameters and security settings",
    responses={
        201: {
            "description": "Key created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "01234567-89ab-cdef-0123-456789abcdef",
                        "key_id": "key_a1b2c3d4e5f6789012345678",
                        "key_type": "dek",
                        "algorithm": "AES-256-GCM",
                        "key_size_bits": 256,
                        "status": "active",
                        "created_at": "2024-01-15T10:30:00Z",
                        "activated_at": "2024-01-15T10:30:00Z",
                        "expires_at": "2025-01-15T10:30:00Z",
                        "usage_count": 0,
                        "max_usage_count": 1000000,
                        "security_level": "HIGH",
                        "hsm_provider": None,
                        "current_version": 1,
                    }
                }
            },
        },
        400: {"description": "Invalid key creation parameters"},
        409: {"description": "Key already exists"},
    },
)
@rate_limit(requests=10, window=60)  # 10 requests per minute
async def create_key(
    key_request: KeyMasterCreate,
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(validate_admin_access),
) -> KeyMasterResponse:
    """
    Create a new encryption key

    Requires admin privileges. Creates a new encryption key with the specified
    parameters including algorithm, key size, and security level.

    **Security Notes:**
    - Key material is never returned in API responses
    - All key creation events are audited
    - Keys are encrypted at rest using KEK hierarchy
    """
    try:
        logger.info(f"Creating new {key_request.key_type.value} key for user {current_user.id}")

        result = await key_mgr.create_key(session, key_request, current_user.id)

        logger.info(f"Successfully created key {result.key_id}")
        return result

    except KeyManagerError as e:
        logger.error(f"Key creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Key creation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during key creation",
        )


@router.get(
    "/",
    response_model=List[KeyMasterResponse],
    summary="List All Keys",
    description="Retrieve list of all encryption keys with filtering options",
)
@rate_limit(requests=30, window=60)  # 30 requests per minute
async def list_keys(
    key_type: Optional[KeyType] = Query(None, description="Filter by key type"),
    status_filter: Optional[KeyStatus] = Query(
        None, alias="status", description="Filter by key status"
    ),
    limit: int = Query(50, ge=1, le=1000, description="Maximum number of keys to return"),
    offset: int = Query(0, ge=0, description="Number of keys to skip"),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> List[KeyMasterResponse]:
    """
    List encryption keys with optional filtering

    Returns metadata for all keys accessible to the current user.
    Admin users can see all keys, regular users see only their keys.
    """
    try:
        # Check permissions - regular users can see only their keys, admins see all
        user_filter = None if current_user.role == "admin" else current_user.id

        logger.info(
            f"Listing keys for user {current_user.id} with filters: type={key_type}, status={status_filter}"
        )

        # Use key manager to list keys with filters
        keys = await key_mgr.list_keys(
            session,
            key_type=key_type,
            status_filter=status_filter,
            limit=limit,
            offset=offset,
            user_id=user_filter,
        )

        return keys

    except Exception as e:
        logger.error(f"Error listing keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving key list"
        )


@router.get(
    "/{key_id}",
    response_model=KeyMasterResponse,
    summary="Get Key Details",
    description="Retrieve detailed information about a specific encryption key",
)
@rate_limit(requests=100, window=60)  # 100 requests per minute
async def get_key(
    key_id: str = Path(..., description="Unique key identifier"),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> KeyMasterResponse:
    """
    Get encryption key details

    Returns metadata for the specified key. Does not return actual key material.
    """
    try:
        logger.info(f"Retrieving key {key_id} for user {current_user.id}")

        # Get key using key manager
        key_response = await key_mgr.get_key_by_id(session, key_id, current_user.id)

        if not key_response:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found")

        return key_response

    except KeyManagerError as e:
        logger.error(f"Error retrieving key {key_id}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found")


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke Key",
    description="Revoke an encryption key (mark as revoked, do not delete)",
)
@rate_limit(requests=5, window=60)  # 5 requests per minute
async def revoke_key(
    key_id: str = Path(..., description="Unique key identifier"),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(validate_admin_access),
) -> None:
    """
    Revoke an encryption key

    Marks the key as revoked but retains it for existing encrypted data.
    This is a security operation that requires admin privileges.
    """
    try:
        logger.warning(f"Revoking key {key_id} by user {current_user.id}")

        # Revoke the key using key manager
        success = await key_mgr.revoke_key(session, key_id, current_user.id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Key revocation failed"
            )

        logger.info(f"Successfully revoked key {key_id}")

    except KeyManagerError as e:
        logger.error(f"Error revoking key {key_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Key revocation failed: {str(e)}"
        )


# Key Rotation Endpoints


@router.post(
    "/{key_id}/rotate",
    response_model=KeyRotationResponse,
    summary="Rotate Key",
    description="Manually trigger key rotation for specified key",
    responses={
        200: {
            "description": "Key rotation completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "rotation_98765432-10ab-cdef-0123-456789abcdef",
                        "key_id": "key_a1b2c3d4e5f6789012345678",
                        "trigger": "manual",
                        "scheduled_at": "2024-01-15T11:00:00Z",
                        "status": "COMPLETED",
                        "old_version": 1,
                        "new_version": 2,
                        "execution_time_ms": 1250,
                        "error_message": None,
                    }
                }
            },
        },
        409: {"description": "Key rotation already in progress"},
    },
)
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
async def rotate_key(
    key_id: str = Path(..., description="Unique key identifier"),
    rotation_request: KeyRotationRequest = Body(...),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(validate_admin_access),
) -> KeyRotationResponse:
    """
    Manually rotate encryption key

    Triggers immediate key rotation for the specified key. This creates a new
    version of the key while retaining the old version for existing encrypted data.

    **Security Notes:**
    - Zero-downtime rotation strategy
    - Old key versions retained for backward compatibility
    - All rotation events are audited
    """
    try:
        logger.info(f"Manual rotation requested for key {key_id} by user {current_user.id}")

        # Update request with key_id
        rotation_request.key_id = key_id

        result = await key_mgr.rotate_key(session, rotation_request, current_user.id)

        logger.info(f"Successfully rotated key {key_id}")
        return result

    except KeyManagerError as e:
        logger.error(f"Key rotation failed for {key_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Key rotation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error rotating key {key_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during key rotation",
        )


@router.get(
    "/{key_id}/rotations",
    response_model=List[KeyRotationResponse],
    summary="Get Rotation History",
    description="Retrieve rotation history for a specific key",
)
@rate_limit(requests=30, window=60)  # 30 requests per minute
async def get_rotation_history(
    key_id: str = Path(..., description="Unique key identifier"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of rotations to return"),
    offset: int = Query(0, ge=0, description="Number of rotations to skip"),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> List[KeyRotationResponse]:
    """
    Get key rotation history

    Returns historical rotation events for the specified key.
    """
    try:
        logger.info(f"Retrieving rotation history for key {key_id}")

        # Get rotation history using key manager
        history = await key_mgr.get_rotation_history(session, key_id, limit, offset)
        return history

    except Exception as e:
        logger.error(f"Error retrieving rotation history for {key_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving rotation history",
        )


# Health and Monitoring Endpoints


@router.get(
    "/{key_id}/health",
    response_model=KeyHealthStatus,
    summary="Get Key Health Status",
    description="Retrieve comprehensive health information for a key",
)
@rate_limit(requests=50, window=60)  # 50 requests per minute
async def get_key_health(
    key_id: str = Path(..., description="Unique key identifier"),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> KeyHealthStatus:
    """
    Get key health status

    Returns comprehensive health information including:
    - Health score (0-100)
    - Usage statistics
    - Time until next rotation
    - Security warnings and recommendations
    """
    try:
        result = await key_mgr.get_key_health_status(session, key_id)
        return result

    except KeyManagerError as e:
        logger.error(f"Error getting health status for key {key_id}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found")


@router.get(
    "/system/statistics",
    response_model=KeyStatistics,
    summary="Get System Statistics",
    description="Retrieve system-wide key management statistics",
)
@rate_limit(requests=20, window=60)  # 20 requests per minute
async def get_system_statistics(
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(validate_admin_access),
) -> KeyStatistics:
    """
    Get system-wide key management statistics

    Returns comprehensive statistics about the key management system including:
    - Total number of keys by status
    - Rotation statistics
    - Health metrics
    - Security incident counts
    """
    try:
        result = await key_mgr.get_system_statistics(session)
        return result

    except Exception as e:
        logger.error(f"Error retrieving system statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving system statistics",
        )


# Rotation Policy Endpoints


@router.post(
    "/policies",
    response_model=RotationPolicyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Rotation Policy",
    description="Create automated key rotation policy",
)
@rate_limit(requests=5, window=60)  # 5 requests per minute
async def create_rotation_policy(
    policy_request: RotationPolicyCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UserResponse = Depends(validate_admin_access),
) -> RotationPolicyResponse:
    """
    Create rotation policy

    Creates an automated rotation policy that defines when and how keys should be rotated.
    """
    try:
        logger.info(
            f"Creating rotation policy '{policy_request.policy_name}' by user {current_user.id}"
        )

        # Create rotation policy record
        rotation_policy = RotationPolicy(
            policy_name=policy_request.policy_name,
            key_type=policy_request.key_type.value,
            rotation_interval_days=policy_request.rotation_interval_days,
            max_operations=policy_request.max_operations,
            max_data_volume_mb=policy_request.max_data_volume_mb,
            rotation_window_start=policy_request.rotation_window_start,
            rotation_window_end=policy_request.rotation_window_end,
            notify_before_rotation_hours=policy_request.notify_before_rotation_hours,
            notification_channels=policy_request.notification_channels,
            created_by=current_user.id,
        )

        session.add(rotation_policy)
        await session.commit()

        return RotationPolicyResponse(
            id=str(rotation_policy.id),
            policy_name=rotation_policy.policy_name,
            key_type=KeyType(rotation_policy.key_type),
            rotation_interval_days=rotation_policy.rotation_interval_days,
            max_operations=rotation_policy.max_operations,
            is_active=rotation_policy.is_active,
            created_at=rotation_policy.created_at,
            next_scheduled_rotation=None,  # Would be calculated based on policy
        )

    except Exception as e:
        logger.error(f"Error creating rotation policy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating rotation policy",
        )


@router.get(
    "/policies",
    response_model=List[RotationPolicyResponse],
    summary="List Rotation Policies",
    description="Retrieve all rotation policies",
)
@rate_limit(requests=30, window=60)  # 30 requests per minute
async def list_rotation_policies(
    session: AsyncSession = Depends(get_session),
    current_user: UserResponse = Depends(get_current_user),
) -> List[RotationPolicyResponse]:
    """
    List rotation policies

    Returns all configured rotation policies.
    """
    try:
        # Get all rotation policies
        result = await session.execute(select(RotationPolicy))
        policies = result.scalars().all()

        return [
            RotationPolicyResponse(
                id=str(policy.id),
                policy_name=policy.policy_name,
                key_type=KeyType(policy.key_type),
                rotation_interval_days=policy.rotation_interval_days,
                max_operations=policy.max_operations,
                is_active=policy.is_active,
                created_at=policy.created_at,
                next_scheduled_rotation=None,  # Would be calculated
            )
            for policy in policies
        ]

    except Exception as e:
        logger.error(f"Error listing rotation policies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving rotation policies",
        )


# Scheduler Management Endpoints


@router.get(
    "/scheduler/status",
    summary="Get Scheduler Status",
    description="Retrieve rotation scheduler status and metrics",
)
@rate_limit(requests=20, window=60)  # 20 requests per minute
async def get_scheduler_status(
    scheduler: RotationScheduler = Depends(get_rotation_scheduler),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get rotation scheduler status

    Returns current status, metrics, and configuration of the rotation scheduler.
    """
    try:
        return await scheduler.get_status()

    except Exception as e:
        logger.error(f"Error retrieving scheduler status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving scheduler status",
        )


@router.post(
    "/scheduler/pause",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Pause Scheduler",
    description="Pause the rotation scheduler",
)
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
async def pause_scheduler(
    scheduler: RotationScheduler = Depends(get_rotation_scheduler),
    current_user: UserResponse = Depends(validate_admin_access),
) -> None:
    """
    Pause rotation scheduler

    Temporarily pauses automatic key rotations. Active rotations continue to completion.
    """
    try:
        logger.warning(f"Pausing rotation scheduler by user {current_user.id}")
        await scheduler.pause()
        logger.info("Rotation scheduler paused")

    except Exception as e:
        logger.error(f"Error pausing scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error pausing scheduler"
        )


@router.post(
    "/scheduler/resume",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Resume Scheduler",
    description="Resume the rotation scheduler",
)
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
async def resume_scheduler(
    scheduler: RotationScheduler = Depends(get_rotation_scheduler),
    current_user: UserResponse = Depends(validate_admin_access),
) -> None:
    """
    Resume rotation scheduler

    Resumes automatic key rotations after being paused.
    """
    try:
        logger.info(f"Resuming rotation scheduler by user {current_user.id}")
        await scheduler.resume()
        logger.info("Rotation scheduler resumed")

    except Exception as e:
        logger.error(f"Error resuming scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error resuming scheduler"
        )


# HSM Management Endpoints


@router.get(
    "/hsm/status",
    summary="Get HSM Status",
    description="Get Hardware Security Module connection status and health",
    responses={
        200: {
            "description": "HSM status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "active",
                        "providers": [
                            {
                                "provider_id": "aws_cloudhsm_us-east-1_443",
                                "status": "healthy",
                                "message": {"status": "healthy", "cluster_state": "active"},
                                "last_check": "2024-01-15T12:00:00Z",
                            }
                        ],
                    }
                }
            },
        },
        503: {"description": "HSM service unavailable"},
    },
)
@rate_limit(requests=20, window=60)  # 20 requests per minute
async def get_hsm_status(
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get HSM connection status and health

    Returns current status of all configured HSM providers including:
    - Connection status
    - Health check results
    - Performance metrics
    """
    try:
        status = await key_mgr.get_hsm_status()
        return status

    except Exception as e:
        logger.error(f"Error getting HSM status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving HSM status"
        )


@router.post(
    "/hsm/migrate",
    summary="Migrate Keys to HSM",
    description="Migrate software keys to Hardware Security Module",
)
@rate_limit(requests=3, window=300)  # 3 requests per 5 minutes
async def migrate_keys_to_hsm(
    migration_request: Dict[str, Any] = Body(...),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(validate_admin_access),
) -> Dict[str, Any]:
    """
    Migrate software keys to HSM

    Migrates specified keys from software storage to Hardware Security Module.
    This is a high-security operation that requires admin privileges.

    **Security Notes:**
    - Keys are securely transferred to HSM
    - Original software keys are securely deleted
    - Full audit trail maintained
    """
    try:
        provider_id = migration_request.get("provider_id")
        key_ids = migration_request.get("key_ids", [])

        if not provider_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="HSM provider ID is required"
            )

        if not key_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="At least one key ID is required"
            )

        logger.info(
            f"Migrating {len(key_ids)} keys to HSM provider {provider_id} by user {current_user.id}"
        )

        result = await key_mgr.migrate_keys_to_hsm(session, provider_id, key_ids, current_user.id)

        logger.info(
            f"HSM migration completed: {result['successful_migrations']} successful, {result['failed_migrations']} failed"
        )
        return result

    except KeyManagerError as e:
        logger.error(f"HSM migration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"HSM migration failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during HSM migration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during HSM migration",
        )


@router.get(
    "/hsm/performance",
    summary="Get HSM Performance Metrics",
    description="Get Hardware Security Module performance metrics",
)
@rate_limit(requests=20, window=60)  # 20 requests per minute
async def get_hsm_performance(
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get HSM performance metrics

    Returns performance metrics for all configured HSM providers including:
    - Operations per second
    - Average latency
    - Error rates
    - Connection statistics
    """
    try:
        metrics = await key_mgr.get_hsm_performance_metrics()
        return metrics

    except Exception as e:
        logger.error(f"Error getting HSM performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving HSM performance metrics",
        )


@router.post(
    "/hsm/configurations",
    response_model=HSMConfigurationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create HSM Configuration",
    description="Configure Hardware Security Module integration",
)
@rate_limit(requests=3, window=300)  # 3 requests per 5 minutes
async def create_hsm_configuration(
    hsm_config: HSMConfigurationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UserResponse = Depends(validate_admin_access),
) -> HSMConfigurationResponse:
    """
    Create HSM configuration

    Configures integration with a Hardware Security Module for enhanced key security.
    """
    try:
        logger.info(
            f"Creating HSM configuration '{hsm_config.configuration_name}' by user {current_user.id}"
        )

        # Create HSM configuration record
        hsm_configuration = HSMConfiguration(
            provider=hsm_config.provider.value,
            configuration_name=hsm_config.configuration_name,
            endpoint_url=hsm_config.endpoint_url,
            authentication_config=hsm_config.authentication_config,
            supported_algorithms=hsm_config.supported_algorithms,
            max_key_size_bits=hsm_config.max_key_size_bits,
            require_dual_auth=hsm_config.require_dual_auth,
            created_by=current_user.id,
        )

        session.add(hsm_configuration)
        await session.commit()

        return HSMConfigurationResponse(
            id=str(hsm_configuration.id),
            provider=HSMProvider(hsm_configuration.provider),
            configuration_name=hsm_configuration.configuration_name,
            is_active=hsm_configuration.is_active,
            health_status=hsm_configuration.health_status,
            last_health_check=hsm_configuration.last_health_check,
            supported_algorithms=hsm_configuration.supported_algorithms,
            max_key_size_bits=hsm_configuration.max_key_size_bits,
        )

    except Exception as e:
        logger.error(f"Error creating HSM configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating HSM configuration",
        )


@router.get(
    "/hsm/configurations",
    response_model=List[HSMConfigurationResponse],
    summary="List HSM Configurations",
    description="Retrieve all HSM configurations",
)
@rate_limit(requests=20, window=60)  # 20 requests per minute
async def list_hsm_configurations(
    session: AsyncSession = Depends(get_session),
    current_user: UserResponse = Depends(validate_admin_access),
) -> List[HSMConfigurationResponse]:
    """
    List HSM configurations

    Returns all configured HSM integrations with their status.
    """
    try:
        # Get all HSM configurations
        result = await session.execute(select(HSMConfiguration))
        configurations = result.scalars().all()

        return [
            HSMConfigurationResponse(
                id=str(config.id),
                provider=HSMProvider(config.provider),
                configuration_name=config.configuration_name,
                is_active=config.is_active,
                health_status=config.health_status,
                last_health_check=config.last_health_check,
                supported_algorithms=config.supported_algorithms,
                max_key_size_bits=config.max_key_size_bits,
            )
            for config in configurations
        ]

    except Exception as e:
        logger.error(f"Error listing HSM configurations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving HSM configurations",
        )


# Monitoring and Health Endpoints


@router.get(
    "/metrics",
    summary="Get Key Usage Metrics",
    description="Get comprehensive key usage and performance metrics",
)
@rate_limit(requests=30, window=60)  # 30 requests per minute
async def get_key_metrics(
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get key usage metrics

    Returns comprehensive metrics including:
    - Key usage statistics
    - Performance metrics
    - Rotation statistics
    - Security metrics
    """
    try:
        # Get system statistics
        stats = await key_mgr.get_system_statistics(session)

        # Get performance metrics
        performance = await key_mgr.get_performance_metrics()

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "key_statistics": {
                "total_keys": stats.total_keys,
                "active_keys": stats.active_keys,
                "keys_due_for_rotation": stats.keys_due_for_rotation,
                "hsm_keys": stats.hsm_keys,
                "average_key_age_days": stats.average_key_age_days,
            },
            "rotation_statistics": {
                "total_rotations_last_30_days": stats.total_rotations_last_30_days,
                "failed_rotations_last_30_days": stats.failed_rotations_last_30_days,
                "rotation_success_rate": (
                    (
                        (stats.total_rotations_last_30_days - stats.failed_rotations_last_30_days)
                        / stats.total_rotations_last_30_days
                        * 100
                    )
                    if stats.total_rotations_last_30_days > 0
                    else 100.0
                ),
            },
            "security_statistics": {
                "security_incidents_last_30_days": stats.security_incidents_last_30_days
            },
            "performance_metrics": performance,
        }

    except Exception as e:
        logger.error(f"Error getting key metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving key metrics"
        )


@router.get(
    "/health", summary="System Health Check", description="Get comprehensive system health status"
)
@rate_limit(requests=20, window=60)  # 20 requests per minute
async def get_system_health(
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get system health status

    Returns comprehensive health information including:
    - Database connectivity
    - HSM status
    - Scheduler status
    - Performance indicators
    """
    try:
        health_status = {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "healthy",
            "components": {},
            "summary": {},
        }

        # Check database health
        try:
            await session.execute(text("SELECT 1"))
            health_status["components"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful",
                "response_time_ms": 5.0,  # Placeholder
            }
        except Exception as e:
            health_status["components"]["database"] = {
                "status": "critical",
                "message": f"Database connection failed: {e}",
                "response_time_ms": None,
            }
            health_status["overall_status"] = "critical"

        # Check HSM health
        hsm_status = await key_mgr.get_hsm_status()
        if hsm_status["status"] == "active":
            healthy_providers = sum(
                1 for provider in hsm_status["providers"] if provider["status"] == "healthy"
            )
            total_providers = len(hsm_status["providers"])

            if healthy_providers == total_providers:
                status_level = "healthy"
            elif healthy_providers > 0:
                status_level = "degraded"
            else:
                status_level = "critical"

            health_status["components"]["hsm"] = {
                "status": status_level,
                "message": f"{healthy_providers}/{total_providers} HSM providers healthy",
                "providers": hsm_status["providers"],
            }

            if status_level == "critical":
                health_status["overall_status"] = "critical"
            elif status_level == "degraded" and health_status["overall_status"] != "critical":
                health_status["overall_status"] = "degraded"
        else:
            health_status["components"]["hsm"] = {
                "status": "disabled",
                "message": "HSM not configured",
            }

        # Check scheduler health (if available)
        if rotation_scheduler:
            try:
                scheduler_status = await rotation_scheduler.get_status()
                health_status["components"]["scheduler"] = {
                    "status": "healthy" if scheduler_status.get("running", False) else "warning",
                    "message": (
                        "Scheduler running normally"
                        if scheduler_status.get("running", False)
                        else "Scheduler not running"
                    ),
                    "details": scheduler_status,
                }
            except Exception as e:
                health_status["components"]["scheduler"] = {
                    "status": "critical",
                    "message": f"Scheduler check failed: {e}",
                }
                health_status["overall_status"] = "critical"
        else:
            health_status["components"]["scheduler"] = {
                "status": "warning",
                "message": "Scheduler not initialized",
            }

        # Get performance metrics
        try:
            performance = await key_mgr.get_performance_metrics()
            health_status["performance"] = performance
        except Exception as e:
            logger.warning(f"Could not get performance metrics: {e}")

        # Summary
        component_statuses = [comp["status"] for comp in health_status["components"].values()]
        health_status["summary"] = {
            "total_components": len(component_statuses),
            "healthy_components": component_statuses.count("healthy"),
            "degraded_components": component_statuses.count("degraded"),
            "critical_components": component_statuses.count("critical"),
            "disabled_components": component_statuses.count("disabled"),
        }

        return health_status

    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving system health",
        )


# Audit and Compliance Endpoints


@router.get(
    "/{key_id}/audit",
    response_model=List[KeyAuditEntry],
    summary="Get Key Audit Log",
    description="Retrieve audit trail for a specific key",
)
@rate_limit(requests=30, window=60)  # 30 requests per minute
async def get_key_audit_log(
    key_id: str = Path(..., description="Unique key identifier"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of audit entries to return"),
    offset: int = Query(0, ge=0, description="Number of audit entries to skip"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    session: AsyncSession = Depends(get_session),
    key_mgr: KeyManager = Depends(get_key_manager),
    current_user: UserResponse = Depends(get_current_user),
) -> List[KeyAuditEntry]:
    """
    Get key audit log

    Returns audit trail for all operations performed on the specified key.
    """
    try:
        logger.info(f"Retrieving audit log for key {key_id}")

        # Get audit log using key manager
        audit_entries = await key_mgr.get_audit_log(session, key_id, limit, offset, event_type)

        # Convert to KeyAuditEntry models
        return [
            KeyAuditEntry(
                id=entry["id"],
                key_id=entry["key_id"],
                event_type=entry["event_type"],
                event_description=entry["event_description"],
                user_id=entry["user_id"],
                timestamp=entry["timestamp"],
                security_level=entry["security_level"],
                risk_score=entry["risk_score"],
                metadata=entry["metadata"],
            )
            for entry in audit_entries
        ]

    except Exception as e:
        logger.error(f"Error retrieving audit log for key {key_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving audit log"
        )


# Error handlers for this router
# Note: exception_handler should be added to the FastAPI app instance, not the router

# @app.exception_handler(KeyManagerError)
# async def key_manager_exception_handler(request, exc: KeyManagerError):
#     """Handle key manager specific errors"""
#     return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

# Startup/Shutdown handlers would be in main.py


async def initialize_rotation_scheduler(key_mgr: KeyManager) -> RotationScheduler:
    """Initialize rotation scheduler (called from main.py startup)"""
    global rotation_scheduler
    rotation_scheduler = RotationScheduler(key_mgr)
    await rotation_scheduler.start()
    return rotation_scheduler


async def shutdown_rotation_scheduler():
    """Shutdown rotation scheduler (called from main.py shutdown)"""
    if rotation_scheduler:
        await rotation_scheduler.stop()


# Week 4 Credential Monitoring Endpoints (60 LOC)


@router.get(
    "/credentials/monitoring/summary",
    summary="Get Credential Monitoring Summary",
    description="Get real-time credential access monitoring summary",
)
@rate_limit(requests=30, window=60)  # 30 requests per minute
async def get_credential_monitoring_summary(
    hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    session: AsyncSession = Depends(get_session),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get credential monitoring summary

    Returns real-time summary of credential access patterns and security alerts.
    """
    try:
        from app.security.key_management.credential_monitoring_week4 import (
            CredentialMonitorExtension,
        )

        # Get recent credential access summary
        monitor = CredentialMonitorExtension(alert_manager=None)  # Simplified for demo
        summary = monitor.get_recent_access_summary(hours=hours)

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "monitoring_window_hours": hours,
            "credential_access_summary": summary,
            "security_status": "active",
            "last_updated": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting credential monitoring summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving credential monitoring summary",
        )


@router.post(
    "/credentials/compliance/report",
    summary="Generate Compliance Report",
    description="Generate compliance report for credential usage (GDPR, SOX, HIPAA)",
)
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
async def generate_compliance_report(
    report_config: Dict[str, Any] = Body(...),
    session: AsyncSession = Depends(get_session),
    current_user: UserResponse = Depends(validate_admin_access),
) -> Dict[str, Any]:
    """
    Generate compliance report

    Generates comprehensive compliance reports for various frameworks including
    GDPR, SOX, HIPAA, and PCI-DSS based on credential access patterns.
    """
    try:
        from app.security.key_management.credential_monitoring_week4 import ComplianceReporter
        from app.db.session import get_session_factory

        framework = report_config.get("framework", "gdpr").lower()
        start_date = datetime.fromisoformat(report_config.get("start_date"))
        end_date = datetime.fromisoformat(report_config.get("end_date"))

        reporter = ComplianceReporter(get_session_factory())

        if framework == "gdpr":
            report = await reporter.generate_gdpr_report(start_date, end_date)
        elif framework == "sox":
            quarter = report_config.get("quarter", 1)
            year = report_config.get("year", datetime.utcnow().year)
            report = await reporter.generate_sox_report(quarter, year)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported compliance framework: {framework}",
            )

        logger.info(f"Generated {framework.upper()} compliance report by user {current_user.id}")
        return report

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date format: {e}"
        )
    except Exception as e:
        logger.error(f"Error generating compliance report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating compliance report",
        )


@router.post(
    "/credentials/security/scan",
    summary="Trigger Security Scan",
    description="Trigger automated security scan for credential leaks",
)
@rate_limit(requests=3, window=300)  # 3 requests per 5 minutes
async def trigger_credential_security_scan(
    scan_config: Dict[str, Any] = Body(...),
    current_user: UserResponse = Depends(validate_admin_access),
) -> Dict[str, Any]:
    """
    Trigger security scan for credential leaks

    Initiates automated scanning for credential leaks in repositories,
    logs, and configuration files. Integrates with existing security pipeline.
    """
    try:
        from app.security.key_management.credential_monitoring_week4 import CredentialScanAutomation

        scanner = CredentialScanAutomation()
        scope = scan_config.get("scope", "all")

        # Trigger different scan types based on scope
        findings = []

        if scope in ["all", "repository"]:
            repo_path = scan_config.get("repository_path", ".")
            repo_findings = await scanner.scan_repository_commits(repo_path)
            findings.extend(repo_findings)

        if scope in ["all", "logs"]:
            log_dir = scan_config.get("log_directory", "/var/log")
            log_findings = await scanner.scan_log_files(log_dir)
            findings.extend(log_findings)

        scan_result = {
            "scan_id": f"scan_{datetime.utcnow().timestamp()}",
            "initiated_by": current_user.id,
            "timestamp": datetime.utcnow().isoformat(),
            "scope": scope,
            "total_findings": len(findings),
            "findings": findings[:10],  # Limit response size
            "risk_level": "high" if any(f.get("severity") == "high" for f in findings) else "low",
            "status": "completed",
        }

        logger.warning(
            f"Security scan initiated by user {current_user.id}, found {len(findings)} potential issues"
        )
        return scan_result

    except Exception as e:
        logger.error(f"Error during security scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error during security scan"
        )
