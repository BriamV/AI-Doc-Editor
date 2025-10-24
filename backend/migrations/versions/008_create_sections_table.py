"""Create sections table for T-06 Section Generation

Revision ID: 008
Revises: 007
Create Date: 2025-10-21 00:00:00.000000

T-06: Section Generation - WebSocket-based document section streaming

Creates sections table for storing generated document sections that are
streamed via WebSocket in real-time. Each section corresponds to a heading
in an outline from T-05.

Features:
- Section content storage (title, level, content)
- Statistics tracking (word_count, tokens_used, generation_time_ms)
- Outline association (foreign key to outlines table)
- User ownership tracking (user_id)
- Section ordering (section_order for document assembly)
- Indexes for common query patterns
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create sections table and indexes"""

    # Create sections table
    op.create_table(
        "sections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "outline_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("outlines.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("section_title", sa.String(500), nullable=False),
        sa.Column("section_level", sa.Integer(), nullable=False),
        sa.Column("heading_id", sa.String(50), nullable=False),
        sa.Column("section_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("generation_time_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # Create indexes for common query patterns
    op.create_index("ix_sections_id", "sections", ["id"])
    op.create_index("ix_sections_document_id", "sections", ["document_id"])
    op.create_index("ix_sections_outline_id", "sections", ["outline_id"])
    op.create_index("ix_sections_user_id", "sections", ["user_id"])
    op.create_index("ix_sections_section_order", "sections", ["section_order"])
    op.create_index("ix_sections_created_at", "sections", ["created_at"])

    # Composite index for outline section listing (most common query)
    op.create_index(
        "ix_sections_outline_listing",
        "sections",
        ["outline_id", "section_order"],
        postgresql_using="btree",
    )

    # Composite index for user document sections
    op.create_index(
        "ix_sections_document_listing",
        "sections",
        ["document_id", "user_id", "section_order"],
        postgresql_using="btree",
    )


def downgrade() -> None:
    """Drop sections table and indexes"""

    # Drop indexes
    op.drop_index("ix_sections_document_listing", "sections")
    op.drop_index("ix_sections_outline_listing", "sections")
    op.drop_index("ix_sections_created_at", "sections")
    op.drop_index("ix_sections_section_order", "sections")
    op.drop_index("ix_sections_user_id", "sections")
    op.drop_index("ix_sections_outline_id", "sections")
    op.drop_index("ix_sections_document_id", "sections")
    op.drop_index("ix_sections_id", "sections")

    # Drop table
    op.drop_table("sections")
