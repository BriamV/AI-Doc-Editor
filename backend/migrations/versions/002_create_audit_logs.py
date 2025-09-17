"""Create audit logs table with WORM constraints

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 10:00:00.000000

T-13: WORM audit log system implementation
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create audit logs table with WORM enforcement"""
    
    # Create main audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=True),
        sa.Column("resource_id", sa.String(255), nullable=True),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("user_email", sa.String(255), nullable=True),
        sa.Column("user_role", sa.String(20), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="success"),
        sa.Column(
            "timestamp", 
            sa.DateTime, 
            nullable=False, 
            server_default=sa.func.current_timestamp()
        ),
        sa.Column(
            "created_at", 
            sa.DateTime, 
            nullable=False, 
            server_default=sa.func.current_timestamp()
        ),
        sa.Column("record_hash", sa.String(64), nullable=True),
    )
    
    # Create indexes for efficient querying
    op.create_index("idx_audit_action_type", "audit_logs", ["action_type"])
    op.create_index("idx_audit_user_id", "audit_logs", ["user_id"])
    op.create_index("idx_audit_user_email", "audit_logs", ["user_email"])
    op.create_index("idx_audit_resource_type", "audit_logs", ["resource_type"])
    op.create_index("idx_audit_resource_id", "audit_logs", ["resource_id"])
    op.create_index("idx_audit_ip_address", "audit_logs", ["ip_address"])
    op.create_index("idx_audit_timestamp", "audit_logs", ["timestamp"])
    op.create_index("idx_audit_user_action", "audit_logs", ["user_id", "action_type"])
    op.create_index("idx_audit_timestamp_user", "audit_logs", ["timestamp", "user_id"])
    op.create_index("idx_audit_resource", "audit_logs", ["resource_type", "resource_id"])
    op.create_index("idx_audit_ip_timestamp", "audit_logs", ["ip_address", "timestamp"])
    
    # Create audit_log_summary table for aggregated data
    op.create_table(
        "audit_log_summary",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("date", sa.DateTime, nullable=False),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("count", sa.Integer, nullable=False, server_default="1"),
    )
    
    # Create indexes for summary table
    op.create_index("idx_summary_date_action", "audit_log_summary", ["date", "action_type"])
    op.create_index("idx_summary_user_date", "audit_log_summary", ["user_id", "date"])
    
    # Insert initial system event BEFORE WORM constraints
    op.execute("""
        INSERT INTO audit_logs (
            id, action_type, description, status, user_email, user_role, timestamp, created_at, record_hash
        ) VALUES (
            lower(hex(randomblob(16))),
            'system_start',
            'Audit system initialized with WORM capabilities',
            'success',
            'system',
            'system',
            datetime('now'),
            datetime('now'),
            lower(hex(randomblob(32)))
        );
    """)
    
    # WORM enforcement: Create triggers to prevent updates and deletes
    # SQLite triggers for WORM compliance
    op.execute("""
        CREATE TRIGGER prevent_audit_log_update
        BEFORE UPDATE ON audit_logs
        FOR EACH ROW
        BEGIN
            SELECT RAISE(ABORT, 'WORM violation: Audit logs cannot be updated');
        END;
    """)
    
    op.execute("""
        CREATE TRIGGER prevent_audit_log_delete
        BEFORE DELETE ON audit_logs
        FOR EACH ROW
        BEGIN
            SELECT RAISE(ABORT, 'WORM violation: Audit logs cannot be deleted');
        END;
    """)
    
    # Create trigger to automatically update record_hash for integrity verification
    # This trigger is disabled since WORM prevents updates - hash should be generated in app
    # op.execute("""
    #     CREATE TRIGGER update_audit_log_hash
    #     AFTER INSERT ON audit_logs
    #     FOR EACH ROW
    #     BEGIN
    #         UPDATE audit_logs 
    #         SET record_hash = (
    #             SELECT lower(hex(randomblob(32)))
    #         )
    #         WHERE id = NEW.id AND record_hash IS NULL;
    #     END;
    # """)


def downgrade() -> None:
    """Remove audit logs system"""
    
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS prevent_audit_log_update;")
    op.execute("DROP TRIGGER IF EXISTS prevent_audit_log_delete;")
    op.execute("DROP TRIGGER IF EXISTS update_audit_log_hash;")
    
    # Drop indexes
    op.drop_index("idx_audit_action_type", "audit_logs")
    op.drop_index("idx_audit_user_id", "audit_logs")
    op.drop_index("idx_audit_user_email", "audit_logs")
    op.drop_index("idx_audit_resource_type", "audit_logs")
    op.drop_index("idx_audit_resource_id", "audit_logs")
    op.drop_index("idx_audit_ip_address", "audit_logs")
    op.drop_index("idx_audit_timestamp", "audit_logs")
    op.drop_index("idx_audit_user_action", "audit_logs")
    op.drop_index("idx_audit_timestamp_user", "audit_logs")
    op.drop_index("idx_audit_resource", "audit_logs")
    op.drop_index("idx_audit_ip_timestamp", "audit_logs")
    
    op.drop_index("idx_summary_date_action", "audit_log_summary")
    op.drop_index("idx_summary_user_date", "audit_log_summary")
    
    # Drop tables
    op.drop_table("audit_log_summary")
    op.drop_table("audit_logs")