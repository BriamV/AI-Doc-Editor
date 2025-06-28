"""Configuration API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.config import ConfigService
from app.models.config import ConfigEntry

router = APIRouter()


@router.get("/config", response_model=list[ConfigEntry])
async def read_config(session: AsyncSession = Depends(get_session)):
    """Return all configuration key-value pairs."""
    service = ConfigService(session)
    return await service.get_all()


@router.post("/config", response_model=ConfigEntry)
async def write_config(
    entry: ConfigEntry, session: AsyncSession = Depends(get_session)
) -> ConfigEntry:
    """Create or update a configuration entry."""
    service = ConfigService(session)
    return await service.upsert(entry.key, entry.value)
