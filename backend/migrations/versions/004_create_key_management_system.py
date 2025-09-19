"""Create Key Management System tables for T-12

Revision ID: 004
Revises: 003
Create Date: 2025-01-19 14:30:00.000000

T-12 Week 3: Comprehensive Key Management System Implementation
Creates all tables for automated key rotation, HSM integration, and audit trail.

Security Features:
- Encrypted key storage with KEK/DEK hierarchy
- WORM-compliant audit logs
- HSM integration metadata
- Automated rotation policies
- Performance-optimized indexes
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, BYTEA
from sqlalchemy import text

revision = "004"
down_revision = "003_optimize_audit_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all Key Management System tables with security constraints"""

    # 1. Create key_masters table - Master key registry
    op.create_table(
        "key_masters",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("key_id", sa.String(64), unique=True, nullable=False, index=True),
        sa.Column("key_type", sa.String(20), nullable=False),
        sa.Column("algorithm", sa.String(50), nullable=False),
        sa.Column("key_size_bits", sa.Integer, nullable=False),

        # Lifecycle management
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("activated_at", sa.DateTime, nullable=True),
        sa.Column("rotated_at", sa.DateTime, nullable=True),
        sa.Column("expires_at", sa.DateTime, nullable=True),

        # Hierarchy relationships
        sa.Column("parent_key_id", sa.String(64), nullable=True),
        sa.Column("derivation_path", sa.Text, nullable=True),

        # Usage tracking
        sa.Column("usage_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("max_usage_count", sa.Integer, nullable=True),

        # HSM integration
        sa.Column("hsm_provider", sa.String(50), nullable=True),
        sa.Column("hsm_key_id", sa.String(255), nullable=True),
        sa.Column("hsm_metadata", sa.JSON, nullable=True),

        # Security metadata
        sa.Column("security_level", sa.String(20), nullable=False, server_default="HIGH"),
        sa.Column("compliance_tags", sa.JSON, nullable=True),

        # Foreign key constraint for parent relationship
        sa.ForeignKeyConstraint(["parent_key_id"], ["key_masters.key_id"], name="fk_key_masters_parent"),

        # Check constraints for data integrity
        sa.CheckConstraint("key_size_bits > 0", name="ck_key_masters_key_size_positive"),
        sa.CheckConstraint("usage_count >= 0", name="ck_key_masters_usage_count_non_negative"),
        sa.CheckConstraint(
            "max_usage_count IS NULL OR max_usage_count > 0",
            name="ck_key_masters_max_usage_positive"
        ),
        sa.CheckConstraint(
            "key_type IN ('kek', 'dek', 'tls', 'hsm', 'backup')",
            name="ck_key_masters_valid_key_type"
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'active', 'rotated', 'expired', 'revoked', 'archived')",
            name="ck_key_masters_valid_status"
        ),
        sa.CheckConstraint(
            "security_level IN ('HIGH', 'MAXIMUM')",
            name="ck_key_masters_valid_security_level"
        ),
    )

    # Performance indexes for key_masters
    op.create_index("idx_key_status_type", "key_masters", ["status", "key_type"])
    op.create_index("idx_key_expires_at", "key_masters", ["expires_at"])
    op.create_index("idx_key_hsm_provider", "key_masters", ["hsm_provider"])
    op.create_index("idx_key_created_at", "key_masters", ["created_at"])
    op.create_index("idx_key_usage_count", "key_masters", ["usage_count"])

    # 2. Create key_versions table - Key version tracking
    op.create_table(
        "key_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("key_id", sa.String(64), nullable=False),
        sa.Column("version_number", sa.Integer, nullable=False),

        # Encrypted key storage (only if not using HSM)
        sa.Column("encrypted_key_data", BYTEA, nullable=True),
        sa.Column("key_checksum", sa.String(64), nullable=False),
        sa.Column("encryption_metadata", sa.JSON, nullable=False),

        # Version lifecycle
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("activated_at", sa.DateTime, nullable=True),
        sa.Column("deactivated_at", sa.DateTime, nullable=True),

        # Performance and security metrics
        sa.Column("generation_time_ms", sa.Integer, nullable=True),
        sa.Column("entropy_score", sa.Integer, nullable=True),

        # Foreign key constraints
        sa.ForeignKeyConstraint(["key_id"], ["key_masters.key_id"], name="fk_key_versions_master"),

        # Check constraints
        sa.CheckConstraint("version_number > 0", name="ck_key_versions_version_positive"),
        sa.CheckConstraint(
            "entropy_score IS NULL OR (entropy_score >= 0 AND entropy_score <= 100)",
            name="ck_key_versions_entropy_valid_range"
        ),
        sa.CheckConstraint(
            "generation_time_ms IS NULL OR generation_time_ms >= 0",
            name="ck_key_versions_generation_time_non_negative"
        ),

        # Unique constraint: one version number per key
        sa.UniqueConstraint("key_id", "version_number", name="uq_key_version_unique"),
    )

    # Performance indexes for key_versions
    op.create_index("idx_key_version_activated", "key_versions", ["activated_at"])
    op.create_index("idx_key_version_created", "key_versions", ["created_at"])
    op.create_index("idx_key_version_key_id", "key_versions", ["key_id"])

    # 3. Create rotation_policies table - Automated rotation policies
    op.create_table(
        "rotation_policies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("policy_name", sa.String(100), unique=True, nullable=False),
        sa.Column("key_type", sa.String(20), nullable=False),

        # Time-based rotation
        sa.Column("rotation_interval_days", sa.Integer, nullable=True),
        sa.Column("max_key_age_days", sa.Integer, nullable=True),

        # Usage-based rotation
        sa.Column("max_operations", sa.Integer, nullable=True),
        sa.Column("max_data_volume_mb", sa.Integer, nullable=True),

        # Security triggers
        sa.Column("rotate_on_security_incident", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("rotate_on_compliance_requirement", sa.Boolean, nullable=False, server_default="true"),

        # Execution parameters
        sa.Column("rotation_window_start", sa.String(5), nullable=True),
        sa.Column("rotation_window_end", sa.String(5), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),

        # Notification settings
        sa.Column("notify_before_rotation_hours", sa.Integer, nullable=False, server_default="24"),
        sa.Column("notification_channels", sa.JSON, nullable=True),

        # Policy metadata
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_by", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),

        # Check constraints
        sa.CheckConstraint(
            "rotation_interval_days IS NULL OR rotation_interval_days > 0",
            name="ck_rotation_policies_interval_positive"
        ),
        sa.CheckConstraint(
            "max_key_age_days IS NULL OR max_key_age_days > 0",
            name="ck_rotation_policies_max_age_positive"
        ),
        sa.CheckConstraint(
            "max_operations IS NULL OR max_operations > 0",
            name="ck_rotation_policies_max_ops_positive"
        ),
        sa.CheckConstraint(
            "max_data_volume_mb IS NULL OR max_data_volume_mb > 0",
            name="ck_rotation_policies_max_volume_positive"
        ),
        sa.CheckConstraint(
            "notify_before_rotation_hours > 0",
            name="ck_rotation_policies_notify_hours_positive"
        ),
        sa.CheckConstraint(
            "key_type IN ('kek', 'dek', 'tls', 'hsm', 'backup')",
            name="ck_rotation_policies_valid_key_type"
        ),
    )

    # Performance indexes for rotation_policies
    op.create_index("idx_rotation_policies_key_type", "rotation_policies", ["key_type"])
    op.create_index("idx_rotation_policies_active", "rotation_policies", ["is_active"])
    op.create_index("idx_rotation_policies_created_by", "rotation_policies", ["created_by"])

    # 4. Create key_rotations table - Rotation execution history
    op.create_table(
        "key_rotations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("key_id", sa.String(64), nullable=False),
        sa.Column("policy_id", UUID(as_uuid=True), nullable=True),

        # Rotation details
        sa.Column("trigger", sa.String(50), nullable=False),
        sa.Column("trigger_details", sa.JSON, nullable=True),

        # Execution tracking
        sa.Column("scheduled_at", sa.DateTime, nullable=False),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("failed_at", sa.DateTime, nullable=True),

        # Version tracking
        sa.Column("old_version", sa.Integer, nullable=False),
        sa.Column("new_version", sa.Integer, nullable=True),

        # Execution status
        sa.Column("status", sa.String(20), nullable=False, server_default="SCHEDULED"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("max_retries", sa.Integer, nullable=False, server_default="3"),

        # Performance metrics
        sa.Column("execution_time_ms", sa.Integer, nullable=True),
        sa.Column("affected_records", sa.Integer, nullable=True),

        # Security verification
        sa.Column("pre_rotation_checksum", sa.String(64), nullable=True),
        sa.Column("post_rotation_checksum", sa.String(64), nullable=True),
        sa.Column("rollback_available", sa.Boolean, nullable=False, server_default="true"),

        # Foreign key constraints
        sa.ForeignKeyConstraint(["key_id"], ["key_masters.key_id"], name="fk_key_rotations_master"),
        sa.ForeignKeyConstraint(["policy_id"], ["rotation_policies.id"], name="fk_key_rotations_policy"),

        # Check constraints
        sa.CheckConstraint("old_version > 0", name="ck_key_rotations_old_version_positive"),
        sa.CheckConstraint(
            "new_version IS NULL OR new_version > old_version",
            name="ck_key_rotations_new_version_greater"
        ),
        sa.CheckConstraint("retry_count >= 0", name="ck_key_rotations_retry_count_non_negative"),
        sa.CheckConstraint("max_retries >= 0", name="ck_key_rotations_max_retries_non_negative"),
        sa.CheckConstraint(
            "execution_time_ms IS NULL OR execution_time_ms >= 0",
            name="ck_key_rotations_execution_time_non_negative"
        ),
        sa.CheckConstraint(
            "affected_records IS NULL OR affected_records >= 0",
            name="ck_key_rotations_affected_records_non_negative"
        ),
        sa.CheckConstraint(
            "trigger IN ('scheduled', 'usage_count', 'security_incident', 'compliance', 'manual')",
            name="ck_key_rotations_valid_trigger"
        ),
        sa.CheckConstraint(
            "status IN ('SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED')",
            name="ck_key_rotations_valid_status"
        ),
    )

    # Performance indexes for key_rotations
    op.create_index("idx_rotation_scheduled", "key_rotations", ["scheduled_at"])
    op.create_index("idx_rotation_status", "key_rotations", ["status"])
    op.create_index("idx_rotation_key_trigger", "key_rotations", ["key_id", "trigger"])
    op.create_index("idx_rotation_policy_id", "key_rotations", ["policy_id"])
    op.create_index("idx_rotation_completed", "key_rotations", ["completed_at"])

    # 5. Create hsm_configurations table - HSM connection details
    op.create_table(
        "hsm_configurations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("configuration_name", sa.String(100), unique=True, nullable=False),

        # Connection details (encrypted)
        sa.Column("endpoint_url", sa.String(255), nullable=True),
        sa.Column("authentication_config", sa.JSON, nullable=True),

        # HSM capabilities
        sa.Column("supported_algorithms", sa.JSON, nullable=False),
        sa.Column("max_key_size_bits", sa.Integer, nullable=False),
        sa.Column("supports_key_generation", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("supports_key_derivation", sa.Boolean, nullable=False, server_default="false"),

        # Status and health
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_health_check", sa.DateTime, nullable=True),
        sa.Column("health_status", sa.String(20), nullable=True),

        # Security settings
        sa.Column("require_dual_auth", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("audit_all_operations", sa.Boolean, nullable=False, server_default="true"),

        # Metadata
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("created_by", sa.String(100), nullable=False),

        # Check constraints
        sa.CheckConstraint("max_key_size_bits > 0", name="ck_hsm_configs_max_key_size_positive"),
        sa.CheckConstraint(
            "provider IN ('aws_cloudhsm', 'azure_dedicated_hsm', 'google_cloud_hsm', 'thales_luna', 'utimaco', 'software_simulation')",
            name="ck_hsm_configs_valid_provider"
        ),
        sa.CheckConstraint(
            "health_status IS NULL OR health_status IN ('HEALTHY', 'DEGRADED', 'OFFLINE')",
            name="ck_hsm_configs_valid_health_status"
        ),
    )

    # Performance indexes for hsm_configurations
    op.create_index("idx_hsm_configs_provider", "hsm_configurations", ["provider"])
    op.create_index("idx_hsm_configs_active", "hsm_configurations", ["is_active"])
    op.create_index("idx_hsm_configs_health_status", "hsm_configurations", ["health_status"])

    # 6. Create key_audit_logs table - Comprehensive audit trail
    op.create_table(
        "key_audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("key_id", sa.String(64), nullable=True),

        # Event details
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("event_category", sa.String(20), nullable=False),
        sa.Column("event_description", sa.Text, nullable=False),

        # Context information
        sa.Column("user_id", sa.String(100), nullable=True),
        sa.Column("session_id", sa.String(100), nullable=True),
        sa.Column("client_ip", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),

        # Timing
        sa.Column("timestamp", sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("duration_ms", sa.Integer, nullable=True),

        # Security metadata
        sa.Column("security_level", sa.String(20), nullable=False),
        sa.Column("risk_score", sa.Integer, nullable=True),

        # Compliance and retention
        sa.Column("compliance_tags", sa.JSON, nullable=True),
        sa.Column("retention_period_days", sa.Integer, nullable=False, server_default="2555"),

        # Cryptographic integrity
        sa.Column("log_hash", sa.String(64), nullable=False),
        sa.Column("previous_hash", sa.String(64), nullable=True),

        # Additional context
        sa.Column("additional_metadata", sa.JSON, nullable=True),

        # Foreign key constraints
        sa.ForeignKeyConstraint(["key_id"], ["key_masters.key_id"], name="fk_key_audit_logs_master"),

        # Check constraints
        sa.CheckConstraint(
            "duration_ms IS NULL OR duration_ms >= 0",
            name="ck_key_audit_logs_duration_non_negative"
        ),
        sa.CheckConstraint(
            "risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)",
            name="ck_key_audit_logs_risk_score_valid_range"
        ),
        sa.CheckConstraint(
            "retention_period_days > 0",
            name="ck_key_audit_logs_retention_positive"
        ),
        sa.CheckConstraint(
            "event_category IN ('LIFECYCLE', 'SECURITY', 'COMPLIANCE')",
            name="ck_key_audit_logs_valid_event_category"
        ),
        sa.CheckConstraint(
            "security_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
            name="ck_key_audit_logs_valid_security_level"
        ),
    )

    # Performance indexes for key_audit_logs
    op.create_index("idx_key_audit_timestamp", "key_audit_logs", ["timestamp"])
    op.create_index("idx_key_audit_event_type", "key_audit_logs", ["event_type"])
    op.create_index("idx_key_audit_key_id", "key_audit_logs", ["key_id"])
    op.create_index("idx_key_audit_user_id", "key_audit_logs", ["user_id"])
    op.create_index("idx_key_audit_security_level", "key_audit_logs", ["security_level"])
    op.create_index("idx_key_audit_event_category", "key_audit_logs", ["event_category"])

    # Composite indexes for complex queries
    op.create_index("idx_key_audit_timestamp_event", "key_audit_logs", ["timestamp", "event_type"])
    op.create_index("idx_key_audit_key_timestamp", "key_audit_logs", ["key_id", "timestamp"])
    op.create_index("idx_key_audit_user_timestamp", "key_audit_logs", ["user_id", "timestamp"])

    # WORM enforcement triggers for key_audit_logs (immutable audit trail)
    op.execute("""
        CREATE TRIGGER prevent_key_audit_log_update
        BEFORE UPDATE ON key_audit_logs
        FOR EACH ROW
        BEGIN
            SELECT RAISE(ABORT, 'WORM violation: Key audit logs cannot be updated');
        END;
    """)

    op.execute("""
        CREATE TRIGGER prevent_key_audit_log_delete
        BEFORE DELETE ON key_audit_logs
        FOR EACH ROW
        BEGIN
            SELECT RAISE(ABORT, 'WORM violation: Key audit logs cannot be deleted');
        END;
    """)

    # Create view for active keys summary
    op.execute("""
        CREATE VIEW active_keys_summary AS
        SELECT
            key_type,
            COUNT(*) as total_keys,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_keys,
            COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now', '+30 days') THEN 1 END) as expiring_soon,
            AVG(usage_count) as avg_usage_count,
            MAX(created_at) as latest_created,
            hsm_provider
        FROM key_masters
        WHERE status IN ('active', 'rotated')
        GROUP BY key_type, hsm_provider;
    """)

    # Insert initial system event
    op.execute(text("""
        INSERT INTO key_audit_logs (
            id, event_type, event_category, event_description,
            security_level, user_id, timestamp, log_hash
        ) VALUES (
            lower(hex(randomblob(16))),
            'system_init',
            'LIFECYCLE',
            'Key Management System initialized with comprehensive security controls',
            'HIGH',
            'system',
            datetime('now'),
            lower(hex(randomblob(32)))
        );
    """))


def downgrade() -> None:
    """Remove all Key Management System tables and constraints"""

    # Drop WORM enforcement triggers
    op.execute("DROP TRIGGER IF EXISTS prevent_key_audit_log_update;")
    op.execute("DROP TRIGGER IF EXISTS prevent_key_audit_log_delete;")

    # Drop view
    op.execute("DROP VIEW IF EXISTS active_keys_summary;")

    # Drop tables in reverse dependency order
    op.drop_table("key_audit_logs")
    op.drop_table("hsm_configurations")
    op.drop_table("key_rotations")
    op.drop_table("rotation_policies")
    op.drop_table("key_versions")
    op.drop_table("key_masters")