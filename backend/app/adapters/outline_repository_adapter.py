"""
Outline Repository Adapter - SQLAlchemy implementation for outline persistence.

T-05/T-06 Integration: Outline persistence for section generation
Hexagonal Architecture - Adapter (Implementation) for outline database operations.
"""

import logging
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.exc import SQLAlchemyError

from app.ports.outline_repository_port import OutlineRepositoryPort
from app.models.outline import Outline

logger = logging.getLogger(__name__)


class OutlineRepositoryAdapter(OutlineRepositoryPort):
    """
    SQLAlchemy adapter for outline persistence.

    Implements outline CRUD operations with multi-tenancy support (user_id isolation).
    """

    def __init__(self, db_session: AsyncSession):
        """
        Initialize outline repository adapter.

        Args:
            db_session: AsyncSession for database operations
        """
        self.db = db_session
        logger.debug("OutlineRepositoryAdapter initialized")

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
        try:
            self.db.add(outline)
            await self.db.commit()
            await self.db.refresh(outline)

            logger.info(
                f"Outline saved: id={outline.id}, user_id={outline.user_id}, "
                f"quality_score={outline.quality_score}"
            )

            return outline

        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Failed to save outline: {e}", exc_info=True)
            raise RuntimeError(f"Database error while saving outline: {str(e)}")

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
        try:
            query = select(Outline).where(Outline.id == outline_id, Outline.user_id == user_id)

            result = await self.db.execute(query)
            outline = result.scalar_one_or_none()

            if outline:
                logger.debug(f"Retrieved outline: id={outline_id}, user_id={user_id}")
            else:
                logger.warning(f"Outline not found: id={outline_id}, user_id={user_id}")

            return outline

        except SQLAlchemyError as e:
            logger.error(f"Failed to retrieve outline: {e}", exc_info=True)
            raise RuntimeError(f"Database error while retrieving outline: {str(e)}")

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
        try:
            query = delete(Outline).where(Outline.id == outline_id, Outline.user_id == user_id)

            result = await self.db.execute(query)
            await self.db.commit()

            deleted = result.rowcount > 0

            if deleted:
                logger.info(f"Outline deleted: id={outline_id}, user_id={user_id}")
            else:
                logger.warning(
                    f"Outline not found for deletion: id={outline_id}, user_id={user_id}"
                )

            return deleted

        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Failed to delete outline: {e}", exc_info=True)
            raise RuntimeError(f"Database error while deleting outline: {str(e)}")
