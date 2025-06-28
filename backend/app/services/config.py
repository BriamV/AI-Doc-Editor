"""Service for managing system configurations."""
from __future__ import annotations

from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.config import SystemConfiguration, ConfigEntry


class ConfigService:
    """CRUD operations for system configurations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize service with a database session."""
        self.session = session

    async def get_all(self) -> list[ConfigEntry]:
        """Return all configuration entries."""
        result = await self.session.execute(select(SystemConfiguration))
        configs = result.scalars().all()
        return [ConfigEntry.from_orm(cfg) for cfg in configs]

    async def upsert(self, key: str, value: str) -> ConfigEntry:
        """Create or update a configuration entry."""
        result = await self.session.execute(
            select(SystemConfiguration).where(SystemConfiguration.key == key)
        )
        config = result.scalar_one_or_none()
        if config:
            await self.session.execute(
                update(SystemConfiguration)
                .where(SystemConfiguration.id == config.id)
                .values(value=value)
            )
        else:
            await self.session.execute(
                insert(SystemConfiguration).values(key=key, value=value)
            )
        await self.session.commit()
        return ConfigEntry(key=key, value=value)
