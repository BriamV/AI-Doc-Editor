"""Database session utilities."""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# Declarative base for ORM models
Base = declarative_base()

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    """Provide a scoped asynchronous session."""
    async with AsyncSessionLocal() as session:
        yield session


# Alias for backward compatibility
get_db = get_session
