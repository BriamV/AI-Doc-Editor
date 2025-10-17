"""
User database model for authentication and role management
Issue #27: User persistence and role management system
"""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.models.config import Base


class User(Base):
    """
    User model for persisting authenticated users with roles.

    Supports OAuth providers (Google, Microsoft) and role-based access control.
    First registered user automatically receives 'admin' role.
    """

    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    provider = Column(String(20), nullable=False)  # 'google' or 'microsoft'
    role = Column(String(20), nullable=False, default="editor")  # 'editor' or 'admin'
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
    last_login_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(email={self.email}, role={self.role}, provider={self.provider})>"
