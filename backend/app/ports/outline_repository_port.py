"""
Outline Repository Port - Interface for outline persistence.

T-05/T-06 Integration: Outline persistence for section generation
Hexagonal Architecture - Port (Interface) for outline database operations.
"""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.models.outline import Outline


class OutlineRepositoryPort(ABC):
    """
    Port (interface) for outline persistence operations.

    Defines the contract for saving and retrieving document outlines.
    Business logic depends on this interface, not concrete implementations.

    Implementations:
        - OutlineRepositoryAdapter: Production SQLAlchemy implementation
        - MockOutlineRepository: Test implementation for unit tests
    """

    @abstractmethod
    async def save_outline(self, outline: Outline) -> Outline:
        """
        Save a generated outline to database.

        Args:
            outline: Outline model instance to save

        Returns:
            Saved outline with database ID

        Raises:
            RuntimeError: Database write error
        """
        pass

    @abstractmethod
    async def get_outline_by_id(self, outline_id: UUID, user_id: UUID) -> Optional[Outline]:
        """
        Get outline by ID.

        Args:
            outline_id: Outline UUID
            user_id: User UUID (for multi-tenancy)

        Returns:
            Outline instance or None if not found

        Raises:
            RuntimeError: Database read error
        """
        pass

    @abstractmethod
    async def delete_outline(self, outline_id: UUID, user_id: UUID) -> bool:
        """
        Delete outline by ID.

        Args:
            outline_id: Outline UUID
            user_id: User UUID (for multi-tenancy)

        Returns:
            True if deleted, False if not found

        Raises:
            RuntimeError: Database delete error
        """
        pass
