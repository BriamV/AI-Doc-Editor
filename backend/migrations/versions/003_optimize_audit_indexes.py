"""Optimize audit log indexes for statistics performance

Revision ID: 003_optimize_audit_indexes
Revises: 002_create_audit_logs
Create Date: 2025-08-21 10:30:00.000000

Optimizes database indexes specifically for audit statistics queries
to eliminate N+1 patterns and improve dashboard performance.
"""

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '003_optimize_audit_indexes'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add optimized indexes for audit statistics queries
    
    These indexes are specifically designed to optimize the new
    consolidated statistics queries that eliminate N+1 patterns.
    """
    
    # Composite index for time-based aggregations (most important for dashboard)
    # Covers: timestamp + action_type for efficient conditional aggregation
    op.create_index(
        'idx_audit_timestamp_action_optimized',
        'audit_logs',
        ['timestamp', 'action_type'],
        postgresql_using='btree'
    )
    
    # Composite index for user activity analysis
    # Covers: user_email + timestamp for top users queries
    op.create_index(
        'idx_audit_user_timestamp_optimized', 
        'audit_logs',
        ['user_email', 'timestamp'],
        postgresql_using='btree'
    )
    
    # Specialized index for security events
    # Covers: action_type + status + timestamp for security metrics
    op.create_index(
        'idx_audit_security_events',
        'audit_logs', 
        ['action_type', 'status', 'timestamp'],
        postgresql_using='btree'
    )
    
    # Covering index for dashboard aggregations
    # Includes commonly accessed columns to avoid table lookups
    op.create_index(
        'idx_audit_dashboard_covering',
        'audit_logs',
        ['timestamp', 'action_type', 'user_email', 'status'],
        postgresql_using='btree'
    )
    
    # Partial index for failed logins (most selective)
    # Only indexes failed login attempts for efficiency
    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_failed_logins_partial
        ON audit_logs (timestamp, user_email)
        WHERE action_type = 'login_failure' AND status = 'failure'
    """))
    
    # Partial index for security actions
    # Only indexes security-related actions for faster security metrics
    # Using safe SQL construction to prevent injection vulnerabilities
    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_security_partial
        ON audit_logs (timestamp, action_type, user_id)
        WHERE action_type IN ('unauthorized_access', 'permission_denied', 'suspicious_activity')
    """))


def downgrade():
    """
    Remove optimized indexes
    """
    
    # Drop all the optimized indexes
    op.drop_index('idx_audit_timestamp_action_optimized', 'audit_logs')
    op.drop_index('idx_audit_user_timestamp_optimized', 'audit_logs')
    op.drop_index('idx_audit_security_events', 'audit_logs')
    op.drop_index('idx_audit_dashboard_covering', 'audit_logs')
    
    # Drop partial indexes
    op.execute(text("DROP INDEX IF EXISTS idx_audit_failed_logins_partial"))
    op.execute(text("DROP INDEX IF EXISTS idx_audit_security_partial"))