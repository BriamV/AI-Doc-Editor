"""
Key Management Data Models for T-12 Credential Store Security

Implements database models for automated key rotation system with support for:
- KEK (Key Encryption Key) and DEK (Data Encryption Key) hierarchy
- Key versioning and lifecycle management
- Rotation policies and scheduling
- HSM integration metadata
- Comprehensive audit trails

Security Design:
- No plaintext keys stored in database
- Encrypted key storage with metadata separation
- Immutable audit logs for compliance
- HSM pointer references for external key storage
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, BYTEA
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import uuid

Base = declarative_base()


class KeyType(str, Enum):
    """Types of encryption keys in the system"""

    KEK = "kek"  # Key Encryption Key (Master Key)
    DEK = "dek"  # Data Encryption Key (Application Key)
    TLS = "tls"  # TLS Certificate Key
    HSM = "hsm"  # HSM-managed Key
    BACKUP = "backup"  # Backup/Archive Key


class KeyStatus(str, Enum):
    """Key lifecycle status"""

    PENDING = "pending"  # Key created but not activated
    ACTIVE = "active"  # Currently active for new operations
    ROTATED = "rotated"  # Rotated but retained for existing data
    EXPIRED = "expired"  # Past retention period
    REVOKED = "revoked"  # Emergency revocation
    ARCHIVED = "archived"  # Long-term storage


class RotationTrigger(str, Enum):
    """Triggers for key rotation"""

    SCHEDULED = "scheduled"  # Time-based rotation
    USAGE_COUNT = "usage_count"  # Operation count threshold
    SECURITY_INCIDENT = "security_incident"  # Emergency rotation
    COMPLIANCE = "compliance"  # Regulatory requirement
    MANUAL = "manual"  # Administrative action


class HSMProvider(str, Enum):
    """Supported HSM providers"""

    AWS_CLOUDHSM = "aws_cloudhsm"
    AZURE_DEDICATED_HSM = "azure_dedicated_hsm"
    GOOGLE_CLOUD_HSM = "google_cloud_hsm"
    THALES_LUNA = "thales_luna"
    UTIMACO = "utimaco"
    SOFTWARE_SIMULATION = "software_simulation"  # For testing


# Database Models


class KeyMaster(Base):
    """
    Master key registry - tracks all encryption keys in the system

    Security Note: No actual key material stored here, only metadata
    """

    __tablename__ = "key_masters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_id = Column(String(64), unique=True, nullable=False, index=True)
    key_type = Column(String(20), nullable=False)
    algorithm = Column(String(50), nullable=False)  # AES-256-GCM, RSA-4096, etc.
    key_size_bits = Column(Integer, nullable=False)

    # Lifecycle management
    status = Column(String(20), nullable=False, default=KeyStatus.PENDING)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    activated_at = Column(DateTime, nullable=True)
    rotated_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # Hierarchy relationships
    parent_key_id = Column(String(64), ForeignKey("key_masters.key_id"), nullable=True)
    derivation_path = Column(Text, nullable=True)  # For hierarchical key derivation

    # Usage tracking
    usage_count = Column(Integer, default=0, nullable=False)
    max_usage_count = Column(Integer, nullable=True)

    # HSM integration
    hsm_provider = Column(String(50), nullable=True)
    hsm_key_id = Column(String(255), nullable=True)  # HSM-specific key identifier
    hsm_metadata = Column(JSON, nullable=True)

    # Security metadata
    security_level = Column(String(20), nullable=False, default="HIGH")
    compliance_tags = Column(JSON, nullable=True)  # FIPS, Common Criteria, etc.

    # Relationships
    parent = relationship("KeyMaster", remote_side=[key_id])
    children = relationship("KeyMaster", back_populates="parent")
    versions = relationship("KeyVersion", back_populates="master")
    rotations = relationship("KeyRotation", back_populates="key_master")
    audit_logs = relationship("KeyAuditLog", back_populates="key_master")

    # Indexes for performance
    __table_args__ = (
        Index("idx_key_status_type", "status", "key_type"),
        Index("idx_key_expires_at", "expires_at"),
        Index("idx_key_hsm_provider", "hsm_provider"),
    )


class KeyVersion(Base):
    """
    Key version tracking for rotation history

    Security Note: Encrypted key material stored separately from metadata
    """

    __tablename__ = "key_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_id = Column(String(64), ForeignKey("key_masters.key_id"), nullable=False)
    version_number = Column(Integer, nullable=False)

    # Encrypted key storage (only if not using HSM)
    encrypted_key_data = Column(BYTEA, nullable=True)  # KEK-encrypted DEK
    key_checksum = Column(String(64), nullable=False)  # SHA-256 hash for integrity
    encryption_metadata = Column(JSON, nullable=False)  # Nonce, algorithm, etc.

    # Version lifecycle
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    activated_at = Column(DateTime, nullable=True)
    deactivated_at = Column(DateTime, nullable=True)

    # Performance and security metrics
    generation_time_ms = Column(Integer, nullable=True)
    entropy_score = Column(Integer, nullable=True)  # 0-100 key strength score

    # Relationships
    master = relationship("KeyMaster", back_populates="versions")

    # Unique constraint: one version number per key
    __table_args__ = (
        Index("idx_key_version_unique", "key_id", "version_number", unique=True),
        Index("idx_key_version_activated", "activated_at"),
    )


class RotationPolicy(Base):
    """
    Automated key rotation policies and schedules
    """

    __tablename__ = "rotation_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_name = Column(String(100), unique=True, nullable=False)
    key_type = Column(String(20), nullable=False)

    # Time-based rotation
    rotation_interval_days = Column(Integer, nullable=True)
    max_key_age_days = Column(Integer, nullable=True)

    # Usage-based rotation
    max_operations = Column(Integer, nullable=True)
    max_data_volume_mb = Column(Integer, nullable=True)

    # Security triggers
    rotate_on_security_incident = Column(Boolean, default=True)
    rotate_on_compliance_requirement = Column(Boolean, default=True)

    # Execution parameters
    rotation_window_start = Column(String(5), nullable=True)  # HH:MM format
    rotation_window_end = Column(String(5), nullable=True)
    timezone = Column(String(50), default="UTC")

    # Notification settings
    notify_before_rotation_hours = Column(Integer, default=24)
    notification_channels = Column(JSON, nullable=True)  # email, slack, etc.

    # Policy metadata
    is_active = Column(Boolean, default=True)
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    rotations = relationship("KeyRotation", back_populates="policy")


class KeyRotation(Base):
    """
    Key rotation execution history and status
    """

    __tablename__ = "key_rotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_id = Column(String(64), ForeignKey("key_masters.key_id"), nullable=False)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("rotation_policies.id"), nullable=True)

    # Rotation details
    trigger = Column(String(50), nullable=False)  # RotationTrigger enum
    trigger_details = Column(JSON, nullable=True)  # Additional context

    # Execution tracking
    scheduled_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)

    # Version tracking
    old_version = Column(Integer, nullable=False)
    new_version = Column(Integer, nullable=True)

    # Execution status
    status = Column(
        String(20), nullable=False, default="SCHEDULED"
    )  # SCHEDULED, RUNNING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Performance metrics
    execution_time_ms = Column(Integer, nullable=True)
    affected_records = Column(Integer, nullable=True)

    # Security verification
    pre_rotation_checksum = Column(String(64), nullable=True)
    post_rotation_checksum = Column(String(64), nullable=True)
    rollback_available = Column(Boolean, default=True)

    # Relationships
    key_master = relationship("KeyMaster", back_populates="rotations")
    policy = relationship("RotationPolicy", back_populates="rotations")

    # Indexes
    __table_args__ = (
        Index("idx_rotation_scheduled", "scheduled_at"),
        Index("idx_rotation_status", "status"),
        Index("idx_rotation_key_trigger", "key_id", "trigger"),
    )


class HSMConfiguration(Base):
    """
    Hardware Security Module configuration and connection details
    """

    __tablename__ = "hsm_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False)  # HSMProvider enum
    configuration_name = Column(String(100), unique=True, nullable=False)

    # Connection details (encrypted)
    endpoint_url = Column(String(255), nullable=True)
    authentication_config = Column(JSON, nullable=True)  # Encrypted connection details

    # HSM capabilities
    supported_algorithms = Column(JSON, nullable=False)
    max_key_size_bits = Column(Integer, nullable=False)
    supports_key_generation = Column(Boolean, default=True)
    supports_key_derivation = Column(Boolean, default=False)

    # Status and health
    is_active = Column(Boolean, default=True)
    last_health_check = Column(DateTime, nullable=True)
    health_status = Column(String(20), nullable=True)  # HEALTHY, DEGRADED, OFFLINE

    # Security settings
    require_dual_auth = Column(Boolean, default=False)
    audit_all_operations = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by = Column(String(100), nullable=False)


class KeyAuditLog(Base):
    """
    Comprehensive audit trail for all key operations

    Security Note: Immutable logging with cryptographic integrity
    """

    __tablename__ = "key_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_id = Column(String(64), ForeignKey("key_masters.key_id"), nullable=True)

    # Event details
    event_type = Column(String(50), nullable=False)  # CREATE, ROTATE, USE, DELETE, etc.
    event_category = Column(String(20), nullable=False)  # LIFECYCLE, SECURITY, COMPLIANCE
    event_description = Column(Text, nullable=False)

    # Context information
    user_id = Column(String(100), nullable=True)
    session_id = Column(String(100), nullable=True)
    client_ip = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Timing
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    duration_ms = Column(Integer, nullable=True)

    # Security metadata
    security_level = Column(String(20), nullable=False)
    risk_score = Column(Integer, nullable=True)  # 0-100 risk assessment

    # Compliance and retention
    compliance_tags = Column(JSON, nullable=True)
    retention_period_days = Column(Integer, default=2555)  # 7 years default

    # Cryptographic integrity
    log_hash = Column(String(64), nullable=False)  # SHA-256 of log entry
    previous_hash = Column(String(64), nullable=True)  # Chain integrity

    # Additional context
    additional_metadata = Column(JSON, nullable=True)

    # Relationships
    key_master = relationship("KeyMaster", back_populates="audit_logs")

    # Indexes for query performance
    __table_args__ = (
        Index("idx_audit_timestamp", "timestamp"),
        Index("idx_audit_event_type", "event_type"),
        Index("idx_audit_key_id", "key_id"),
        Index("idx_audit_user_id", "user_id"),
        Index("idx_audit_security_level", "security_level"),
    )


# Pydantic Models for API


class KeyMasterCreate(BaseModel):
    """Request model for creating a new key"""

    key_type: KeyType
    algorithm: str = "AES-256-GCM"
    key_size_bits: int = 256
    parent_key_id: Optional[str] = None
    max_usage_count: Optional[int] = None
    expires_at: Optional[datetime] = None
    hsm_provider: Optional[HSMProvider] = None
    security_level: Literal["HIGH", "MAXIMUM"] = "HIGH"
    compliance_tags: Optional[List[str]] = None


class KeyMasterResponse(BaseModel):
    """Response model for key metadata"""

    id: str
    key_id: str
    key_type: KeyType
    algorithm: str
    key_size_bits: int
    status: KeyStatus
    created_at: datetime
    activated_at: Optional[datetime]
    expires_at: Optional[datetime]
    usage_count: int
    max_usage_count: Optional[int]
    security_level: str
    hsm_provider: Optional[HSMProvider]
    current_version: Optional[int]

    class Config:
        from_attributes = True


class RotationPolicyCreate(BaseModel):
    """Request model for creating rotation policy"""

    policy_name: str = Field(..., min_length=1, max_length=100)
    key_type: KeyType
    rotation_interval_days: Optional[int] = Field(None, gt=0, le=365)
    max_operations: Optional[int] = Field(None, gt=0)
    max_data_volume_mb: Optional[int] = Field(None, gt=0)
    rotation_window_start: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    rotation_window_end: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    notify_before_rotation_hours: int = Field(24, ge=1, le=168)
    notification_channels: Optional[Dict[str, Any]] = None

    @validator("rotation_interval_days", "max_operations")
    def validate_at_least_one_trigger(cls, v, values):
        """At least one rotation trigger must be specified"""
        if not v and not values.get("max_operations"):
            raise ValueError("At least one rotation trigger must be specified")
        return v


class RotationPolicyResponse(BaseModel):
    """Response model for rotation policy"""

    id: str
    policy_name: str
    key_type: KeyType
    rotation_interval_days: Optional[int]
    max_operations: Optional[int]
    is_active: bool
    created_at: datetime
    next_scheduled_rotation: Optional[datetime]

    class Config:
        from_attributes = True


class KeyRotationRequest(BaseModel):
    """Request model for manual key rotation"""

    key_id: str
    trigger: RotationTrigger = RotationTrigger.MANUAL
    trigger_details: Optional[Dict[str, Any]] = None
    force_rotation: bool = False  # Override safety checks
    scheduled_at: Optional[datetime] = None  # Schedule for later


class KeyRotationResponse(BaseModel):
    """Response model for rotation status"""

    id: str
    key_id: str
    trigger: RotationTrigger
    scheduled_at: datetime
    status: str
    old_version: int
    new_version: Optional[int]
    execution_time_ms: Optional[int]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class HSMConfigurationCreate(BaseModel):
    """Request model for HSM configuration"""

    provider: HSMProvider
    configuration_name: str = Field(..., min_length=1, max_length=100)
    endpoint_url: Optional[str] = None
    authentication_config: Dict[str, Any]
    supported_algorithms: List[str]
    max_key_size_bits: int = Field(..., ge=128, le=4096)
    require_dual_auth: bool = False


class HSMConfigurationResponse(BaseModel):
    """Response model for HSM configuration"""

    id: str
    provider: HSMProvider
    configuration_name: str
    is_active: bool
    health_status: Optional[str]
    last_health_check: Optional[datetime]
    supported_algorithms: List[str]
    max_key_size_bits: int

    class Config:
        from_attributes = True


class KeyAuditEntry(BaseModel):
    """Audit log entry"""

    id: str
    key_id: Optional[str]
    event_type: str
    event_description: str
    user_id: Optional[str]
    timestamp: datetime
    security_level: str
    risk_score: Optional[int]
    additional_metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class KeyHealthStatus(BaseModel):
    """Key health and status information"""

    key_id: str
    status: KeyStatus
    health_score: int  # 0-100
    usage_percentage: float  # % of max usage
    time_until_rotation: Optional[timedelta]
    last_used: Optional[datetime]
    security_warnings: List[str]
    recommendations: List[str]


class KeyStatistics(BaseModel):
    """System-wide key management statistics"""

    total_keys: int
    active_keys: int
    keys_due_for_rotation: int
    hsm_keys: int
    average_key_age_days: float
    total_rotations_last_30_days: int
    failed_rotations_last_30_days: int
    security_incidents_last_30_days: int
