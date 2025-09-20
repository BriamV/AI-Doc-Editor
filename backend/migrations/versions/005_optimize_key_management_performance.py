"""Optimize Key Management System performance and security indexes

Revision ID: 005
Revises: 004
Create Date: 2025-01-19 15:00:00.000000

T-12 Week 3: Performance optimizations for Key Management System
Adds specialized indexes, materialized views, and security constraints
for production-grade performance and compliance.

Features:
- Covering indexes for hot queries
- Partial indexes for security events
- Materialized views for dashboards
- Additional security constraints
- Query performance optimizations
"""

from alembic import op
from sqlalchemy import text

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add performance optimizations and security enhancements"""

    # 1. Advanced covering indexes for frequent dashboard queries
    # Covering index for key status dashboard
    op.create_index(
        "idx_key_masters_dashboard_covering",
        "key_masters",
        ["status", "key_type", "created_at", "expires_at", "usage_count"],
        postgresql_using="btree"
    )

    # Covering index for rotation scheduling queries
    op.create_index(
        "idx_key_rotations_scheduling_covering",
        "key_rotations",
        ["status", "scheduled_at", "key_id", "trigger", "retry_count"],
        postgresql_using="btree"
    )

    # 2. Partial indexes for high-security scenarios
    # Index only active keys that are close to expiration (most critical)
    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_key_masters_expiring_partial
        ON key_masters (expires_at, key_id, key_type)
        WHERE status = 'active' AND expires_at IS NOT NULL
    """))

    # Index only failed rotations for incident response
    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_key_rotations_failed_partial
        ON key_rotations (failed_at, key_id, error_message)
        WHERE status = 'FAILED'
    """))

    # Index only high-risk audit events
    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_key_audit_high_risk_partial
        ON key_audit_logs (timestamp, key_id, event_type, risk_score)
        WHERE risk_score >= 70 OR security_level IN ('HIGH', 'CRITICAL')
    """))

    # Index only HSM-managed keys for specialized queries
    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_key_masters_hsm_partial
        ON key_masters (hsm_provider, hsm_key_id, status)
        WHERE hsm_provider IS NOT NULL
    """))

    # 3. Specialized indexes for compliance queries
    # Index for retention policy compliance
    op.create_index(
        "idx_key_audit_retention_compliance",
        "key_audit_logs",
        ["timestamp", "retention_period_days", "compliance_tags"],
        postgresql_using="btree"
    )

    # Index for key versioning queries
    op.create_index(
        "idx_key_versions_lifecycle",
        "key_versions",
        ["key_id", "version_number", "activated_at", "deactivated_at"],
        postgresql_using="btree"
    )

    # 4. Advanced composite indexes for complex security queries
    # Index for security incident correlation
    op.create_index(
        "idx_key_audit_security_correlation",
        "key_audit_logs",
        ["event_category", "security_level", "timestamp", "user_id"],
        postgresql_using="btree"
    )

    # Index for rotation policy effectiveness analysis
    op.create_index(
        "idx_rotation_effectiveness",
        "key_rotations",
        ["trigger", "status", "execution_time_ms", "scheduled_at"],
        postgresql_using="btree"
    )

    # 5. Create materialized view for key management dashboard
    # This view aggregates key statistics for fast dashboard queries
    op.execute("""
        CREATE VIEW key_management_dashboard AS
        WITH key_stats AS (
            SELECT
                key_type,
                status,
                hsm_provider,
                COUNT(*) as key_count,
                AVG(usage_count) as avg_usage,
                COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now', '+7 days') THEN 1 END) as expiring_this_week,
                COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now', '+30 days') THEN 1 END) as expiring_this_month,
                MAX(created_at) as latest_key,
                MIN(created_at) as oldest_key
            FROM key_masters
            WHERE status IN ('active', 'rotated', 'pending')
            GROUP BY key_type, status, hsm_provider
        ),
        rotation_stats AS (
            SELECT
                DATE(scheduled_at) as rotation_date,
                COUNT(*) as total_rotations,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful_rotations,
                COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_rotations,
                AVG(execution_time_ms) as avg_execution_time
            FROM key_rotations
            WHERE scheduled_at >= datetime('now', '-30 days')
            GROUP BY DATE(scheduled_at)
        ),
        security_events AS (
            SELECT
                DATE(timestamp) as event_date,
                event_category,
                security_level,
                COUNT(*) as event_count,
                AVG(COALESCE(risk_score, 0)) as avg_risk_score
            FROM key_audit_logs
            WHERE timestamp >= datetime('now', '-30 days')
            GROUP BY DATE(timestamp), event_category, security_level
        )
        SELECT
            'key_stats' as metric_type,
            json_object(
                'key_type', ks.key_type,
                'status', ks.status,
                'hsm_provider', ks.hsm_provider,
                'key_count', ks.key_count,
                'avg_usage', ks.avg_usage,
                'expiring_this_week', ks.expiring_this_week,
                'expiring_this_month', ks.expiring_this_month,
                'latest_key', ks.latest_key,
                'oldest_key', ks.oldest_key
            ) as metrics,
            datetime('now') as generated_at
        FROM key_stats ks
        UNION ALL
        SELECT
            'rotation_stats' as metric_type,
            json_object(
                'rotation_date', rs.rotation_date,
                'total_rotations', rs.total_rotations,
                'successful_rotations', rs.successful_rotations,
                'failed_rotations', rs.failed_rotations,
                'avg_execution_time', rs.avg_execution_time,
                'success_rate',
                CASE
                    WHEN rs.total_rotations > 0
                    THEN ROUND((rs.successful_rotations * 100.0 / rs.total_rotations), 2)
                    ELSE 0
                END
            ) as metrics,
            datetime('now') as generated_at
        FROM rotation_stats rs
        UNION ALL
        SELECT
            'security_events' as metric_type,
            json_object(
                'event_date', se.event_date,
                'event_category', se.event_category,
                'security_level', se.security_level,
                'event_count', se.event_count,
                'avg_risk_score', se.avg_risk_score
            ) as metrics,
            datetime('now') as generated_at
        FROM security_events se;
    """)

    # 6. Create view for key health monitoring
    op.execute("""
        CREATE VIEW key_health_monitor AS
        SELECT
            km.key_id,
            km.key_type,
            km.status,
            km.algorithm,
            km.created_at,
            km.expires_at,
            km.usage_count,
            km.max_usage_count,
            km.hsm_provider,
            -- Health Score Calculation (0-100)
            CASE
                WHEN km.status = 'revoked' THEN 0
                WHEN km.status = 'expired' THEN 10
                WHEN km.expires_at IS NOT NULL AND km.expires_at <= datetime('now') THEN 20
                WHEN km.expires_at IS NOT NULL AND km.expires_at <= datetime('now', '+7 days') THEN 30
                WHEN km.max_usage_count IS NOT NULL AND km.usage_count >= km.max_usage_count THEN 25
                WHEN km.max_usage_count IS NOT NULL AND km.usage_count >= (km.max_usage_count * 0.9) THEN 60
                WHEN km.expires_at IS NOT NULL AND km.expires_at <= datetime('now', '+30 days') THEN 70
                WHEN km.status = 'active' THEN 100
                WHEN km.status = 'pending' THEN 80
                ELSE 90
            END as health_score,
            -- Usage Percentage
            CASE
                WHEN km.max_usage_count IS NOT NULL AND km.max_usage_count > 0
                THEN ROUND((km.usage_count * 100.0 / km.max_usage_count), 2)
                ELSE NULL
            END as usage_percentage,
            -- Days until expiration
            CASE
                WHEN km.expires_at IS NOT NULL
                THEN ROUND(julianday(km.expires_at) - julianday('now'))
                ELSE NULL
            END as days_until_expiration,
            -- Last rotation info
            (
                SELECT MAX(completed_at)
                FROM key_rotations kr
                WHERE kr.key_id = km.key_id AND kr.status = 'COMPLETED'
            ) as last_rotation_date,
            -- Security warnings
            json_array(
                CASE WHEN km.expires_at IS NOT NULL AND km.expires_at <= datetime('now', '+7 days')
                     THEN 'KEY_EXPIRING_SOON' END,
                CASE WHEN km.max_usage_count IS NOT NULL AND km.usage_count >= (km.max_usage_count * 0.9)
                     THEN 'HIGH_USAGE_COUNT' END,
                CASE WHEN km.status = 'pending' AND km.created_at <= datetime('now', '-1 day')
                     THEN 'PENDING_TOO_LONG' END,
                CASE WHEN km.hsm_provider IS NULL AND km.security_level = 'MAXIMUM'
                     THEN 'NON_HSM_HIGH_SECURITY' END
            ) as security_warnings,
            -- Recent audit events count
            (
                SELECT COUNT(*)
                FROM key_audit_logs kal
                WHERE kal.key_id = km.key_id
                AND kal.timestamp >= datetime('now', '-24 hours')
                AND kal.security_level IN ('HIGH', 'CRITICAL')
            ) as recent_security_events
        FROM key_masters km
        WHERE km.status NOT IN ('archived');
    """)

    # 7. Add check constraint for key lifecycle consistency
    op.execute("""
        CREATE TRIGGER enforce_key_lifecycle_consistency
        BEFORE UPDATE OF status ON key_masters
        FOR EACH ROW
        WHEN NEW.status != OLD.status
        BEGIN
            -- Ensure valid status transitions
            SELECT CASE
                WHEN OLD.status = 'pending' AND NEW.status NOT IN ('active', 'revoked') THEN
                    RAISE(ABORT, 'Invalid status transition: pending can only go to active or revoked')
                WHEN OLD.status = 'active' AND NEW.status NOT IN ('rotated', 'expired', 'revoked') THEN
                    RAISE(ABORT, 'Invalid status transition: active can only go to rotated, expired, or revoked')
                WHEN OLD.status = 'rotated' AND NEW.status NOT IN ('expired', 'archived', 'revoked') THEN
                    RAISE(ABORT, 'Invalid status transition: rotated can only go to expired, archived, or revoked')
                WHEN OLD.status IN ('expired', 'revoked', 'archived') THEN
                    RAISE(ABORT, 'Invalid status transition: terminal states cannot be changed')
            END;

            -- Set activation timestamp when becoming active
            UPDATE key_masters
            SET activated_at = datetime('now')
            WHERE key_id = NEW.key_id AND NEW.status = 'active' AND OLD.status = 'pending';

            -- Set rotation timestamp when being rotated
            UPDATE key_masters
            SET rotated_at = datetime('now')
            WHERE key_id = NEW.key_id AND NEW.status = 'rotated' AND OLD.status = 'active';
        END;
    """)

    # 8. Create function-based index for expiration alerts
    # This index helps quickly find keys that need attention
    op.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_key_masters_expiration_priority
        ON key_masters (
            CASE
                WHEN expires_at IS NULL THEN 9999999
                ELSE ROUND(julianday(expires_at) - julianday('now'))
            END,
            key_type,
            security_level
        )
        WHERE status IN ('active', 'pending')
    """))

    # 9. Add additional security constraints
    # Ensure rotation policies have at least one trigger
    op.execute("""
        CREATE TRIGGER validate_rotation_policy_triggers
        BEFORE INSERT ON rotation_policies
        FOR EACH ROW
        WHEN (
            NEW.rotation_interval_days IS NULL AND
            NEW.max_operations IS NULL AND
            NEW.max_data_volume_mb IS NULL AND
            NEW.max_key_age_days IS NULL
        )
        BEGIN
            SELECT RAISE(ABORT, 'Rotation policy must have at least one trigger defined');
        END;
    """)

    # Ensure key versions maintain chronological order
    op.execute("""
        CREATE TRIGGER validate_key_version_chronology
        BEFORE INSERT ON key_versions
        FOR EACH ROW
        BEGIN
            SELECT CASE
                WHEN NEW.activated_at IS NOT NULL AND NEW.created_at > NEW.activated_at THEN
                    RAISE(ABORT, 'Key version cannot be activated before creation')
                WHEN NEW.deactivated_at IS NOT NULL AND
                     (NEW.activated_at IS NULL OR NEW.activated_at > NEW.deactivated_at) THEN
                    RAISE(ABORT, 'Key version cannot be deactivated before activation')
            END;
        END;
    """)

    # 10. Create indexes for audit trail integrity verification
    op.create_index(
        "idx_key_audit_hash_chain",
        "key_audit_logs",
        ["timestamp", "log_hash", "previous_hash"],
        postgresql_using="btree"
    )


def downgrade() -> None:
    """Remove performance optimizations and security enhancements"""

    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS enforce_key_lifecycle_consistency;")
    op.execute("DROP TRIGGER IF EXISTS validate_rotation_policy_triggers;")
    op.execute("DROP TRIGGER IF EXISTS validate_key_version_chronology;")

    # Drop views
    op.execute("DROP VIEW IF EXISTS key_management_dashboard;")
    op.execute("DROP VIEW IF EXISTS key_health_monitor;")

    # Drop specialized indexes
    op.drop_index("idx_key_masters_dashboard_covering", "key_masters")
    op.drop_index("idx_key_rotations_scheduling_covering", "key_rotations")
    op.drop_index("idx_key_audit_retention_compliance", "key_audit_logs")
    op.drop_index("idx_key_versions_lifecycle", "key_versions")
    op.drop_index("idx_key_audit_security_correlation", "key_audit_logs")
    op.drop_index("idx_rotation_effectiveness", "key_rotations")
    op.drop_index("idx_key_audit_hash_chain", "key_audit_logs")

    # Drop partial indexes
    op.execute(text("DROP INDEX IF EXISTS idx_key_masters_expiring_partial"))
    op.execute(text("DROP INDEX IF EXISTS idx_key_rotations_failed_partial"))
    op.execute(text("DROP INDEX IF EXISTS idx_key_audit_high_risk_partial"))
    op.execute(text("DROP INDEX IF EXISTS idx_key_masters_hsm_partial"))
    op.execute(text("DROP INDEX IF EXISTS idx_key_masters_expiration_priority"))