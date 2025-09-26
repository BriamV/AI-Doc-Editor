"""
Simple script to create test database tables for validation
"""

import sys
import os

# Add backend root to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

import asyncio
from app.db.session import engine
from app.models.audit import Base as AuditBase
from app.models.config import Base as ConfigBase


async def create_tables():
    """Create all tables for testing"""
    async with engine.begin() as conn:
        # Create audit tables
        await conn.run_sync(AuditBase.metadata.create_all)
        # Create config tables
        await conn.run_sync(ConfigBase.metadata.create_all)
    print("Test database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(create_tables())
