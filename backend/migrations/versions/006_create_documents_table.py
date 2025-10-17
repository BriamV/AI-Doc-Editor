"""Create documents table for RAG pipeline

Revision ID: 006
Revises: 005
Create Date: 2025-10-08 00:00:00.000000

T-49: Document Library UI - Knowledge Base Management
Creates documents table for storing metadata of uploaded files
to the RAG (Retrieval-Augmented Generation) pipeline.

Features:
- Document metadata storage (filename, file_type, mime_type, file_size)
- Processing status tracking (processing, completed, failed)
- User ownership tracking (user_id, user_email)
- Soft delete support (deleted_at)
- Indexes for common query patterns
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create documents table and indexes"""

    # Create documents table
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("file_type", sa.String(10), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("processing", "completed", "failed", name="document_status"),
            nullable=False,
            server_default="processing",
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_email", sa.String(255), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )

    # Create indexes for common query patterns
    op.create_index("ix_documents_id", "documents", ["id"])
    op.create_index("ix_documents_user_id", "documents", ["user_id"])
    op.create_index("ix_documents_status", "documents", ["status"])
    op.create_index("ix_documents_uploaded_at", "documents", ["uploaded_at"])
    op.create_index("ix_documents_deleted_at", "documents", ["deleted_at"])

    # Composite index for user document listing (most common query)
    op.create_index(
        "ix_documents_user_listing",
        "documents",
        ["user_id", "deleted_at", "uploaded_at"],
        postgresql_using="btree",
    )

    # Composite index for filtered listings
    op.create_index(
        "ix_documents_filtered_listing",
        "documents",
        ["user_id", "file_type", "status", "deleted_at"],
        postgresql_using="btree",
    )


def downgrade() -> None:
    """Drop documents table and indexes"""

    # Drop indexes
    op.drop_index("ix_documents_filtered_listing", "documents")
    op.drop_index("ix_documents_user_listing", "documents")
    op.drop_index("ix_documents_deleted_at", "documents")
    op.drop_index("ix_documents_uploaded_at", "documents")
    op.drop_index("ix_documents_status", "documents")
    op.drop_index("ix_documents_user_id", "documents")
    op.drop_index("ix_documents_id", "documents")

    # Drop table
    op.drop_table("documents")

    # Drop enum type
    op.execute("DROP TYPE document_status")
