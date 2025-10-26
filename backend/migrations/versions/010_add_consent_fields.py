"""Add consent fields to documents table

Revision ID: 010
Revises: 009
Create Date: 2025-10-24 00:00:00.000000

T-24 ST3: Consent Management Backend
Adds consent tracking fields to documents table for GDPR compliance
and audit trail of user consent for AI document processing.

Features:
- consent_given (Boolean): User's explicit consent to AI processing (required)
- consent_timestamp (DateTime): When consent was given/rejected
- consent_version (String): Version of consent agreement accepted
- consent_ip_address (String): IP address at time of consent (for audit trail)
- Index on consent_given for filtering/reporting
"""

from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add consent tracking columns to documents table"""

    # Add consent_given column (required, default False for safety)
    op.add_column(
        "documents",
        sa.Column(
            "consent_given",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Add consent_timestamp column (nullable - only set when consent given/rejected)
    op.add_column(
        "documents",
        sa.Column("consent_timestamp", sa.DateTime(), nullable=True),
    )

    # Add consent_version column (nullable, default "1.0")
    op.add_column(
        "documents",
        sa.Column(
            "consent_version",
            sa.String(20),
            nullable=True,
            server_default="1.0",
        ),
    )

    # Add consent_ip_address column (nullable, IPv6 support with 45 chars)
    op.add_column(
        "documents",
        sa.Column("consent_ip_address", sa.String(45), nullable=True),
    )

    # Create index on consent_given for filtering documents by consent status
    op.create_index(
        "ix_documents_consent_given",
        "documents",
        ["consent_given"],
    )


def downgrade() -> None:
    """Remove consent tracking columns from documents table"""

    # Drop index
    op.drop_index("ix_documents_consent_given", "documents")

    # Drop consent columns
    op.drop_column("documents", "consent_ip_address")
    op.drop_column("documents", "consent_version")
    op.drop_column("documents", "consent_timestamp")
    op.drop_column("documents", "consent_given")
