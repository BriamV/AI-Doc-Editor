"""System configuration models."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class SystemConfiguration(Base):
    """SQLAlchemy model for system configuration key-value pairs."""

    __tablename__ = "system_configurations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(String(1024), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConfigEntry(BaseModel):
    """Pydantic model for configuration entries."""

    key: str
    value: str

    class Config:
        orm_mode = True
