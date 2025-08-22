from __future__ import annotations

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

from app.core.config import settings
from app.models.config import Base
from app.models.audit import Base as AuditBase

# Combine metadata from both Base classes
import sqlalchemy
combined_metadata = sqlalchemy.MetaData()

# Merge tables from both bases
for table in Base.metadata.tables.values():
    table.to_metadata(combined_metadata)

# Import audit models to register tables
from app.models.audit import AuditLog  # noqa
from app.models.config import SystemConfiguration  # noqa

# Add audit tables to combined metadata
for table in AuditBase.metadata.tables.values():
    table.to_metadata(combined_metadata)

config = context.config

fileConfig(config.config_file_name)

target_metadata = combined_metadata


def run_migrations_offline() -> None:
    # Convert aiosqlite URL to sqlite for Alembic
    url = settings.DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite:///")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Convert aiosqlite URL to sqlite for Alembic
    sync_url = settings.DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite:///")
    connectable = engine_from_config(
        {"sqlalchemy.url": sync_url},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
