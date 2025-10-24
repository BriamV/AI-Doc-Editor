"""Add summary fields to documents table

Revision ID: 009
Revises: 008
Create Date: 2025-10-21 00:00:00.000000

T-06 ST3: Global Summary Refresh
Adds global_summary and summary_updated_at columns to documents table
for storing AI-generated document summaries updated after each section completion.

Features:
- global_summary (Text): Stores concise AI-generated summary of document
- summary_updated_at (DateTime): Timestamp of last summary update
- Both nullable: Legacy documents without summaries remain valid
- No indexes: Summary fields are write-heavy, not used for filtering/sorting
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add summary columns to documents table"""

    # Add global_summary column (nullable, no default)
    op.add_column(
        "documents",
        sa.Column("global_summary", sa.Text(), nullable=True),
    )

    # Add summary_updated_at column (nullable, no default)
    op.add_column(
        "documents",
        sa.Column("summary_updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    """Remove summary columns from documents table"""

    # Drop summary columns
    op.drop_column("documents", "summary_updated_at")
    op.drop_column("documents", "global_summary")
