"""
Section Repository Adapter - SQLAlchemy implementation for section persistence.

T-06 ST2: Section Generation Service
Hexagonal Architecture - Adapter (Implementation) for section database operations.
"""

import logging
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.exc import SQLAlchemyError

from app.ports.section_repository_port import SectionRepositoryPort
from app.models.section import Section

logger = logging.getLogger(__name__)


class SectionRepositoryAdapter(SectionRepositoryPort):
    """
    SQLAlchemy adapter for section persistence.

    Implements section CRUD operations with multi-tenancy support (user_id isolation).
    """

    def __init__(self, db_session: AsyncSession):
        """
        Initialize section repository adapter.

        Args:
            db_session: AsyncSession for database operations
        """
        self.db = db_session
        logger.debug("SectionRepositoryAdapter initialized")

    async def save_section(self, section: Section) -> Section:
        """
        Save a generated section to database.

        Args:
            section: Section model instance to save

        Returns:
            Saved section with database ID

        Raises:
            RuntimeError: Database write error
        """
        try:
            self.db.add(section)
            await self.db.commit()
            await self.db.refresh(section)

            logger.info(
                f"Section saved: id={section.id}, title={section.section_title}, "
                f"outline_id={section.outline_id}"
            )

            return section

        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Failed to save section: {e}", exc_info=True)
            raise RuntimeError(f"Database error while saving section: {str(e)}")

    async def get_sections_by_outline(self, outline_id: UUID, user_id: UUID) -> List[Section]:
        """
        Get all sections for an outline (ordered by section_order).

        Args:
            outline_id: Outline UUID
            user_id: User UUID (for multi-tenancy)

        Returns:
            List of sections ordered by section_order

        Raises:
            RuntimeError: Database read error
        """
        try:
            query = (
                select(Section)
                .where(Section.outline_id == outline_id, Section.user_id == user_id)
                .order_by(Section.section_order)
            )

            result = await self.db.execute(query)
            sections = result.scalars().all()

            logger.debug(
                f"Retrieved {len(sections)} sections for outline_id={outline_id}, "
                f"user_id={user_id}"
            )

            return list(sections)

        except SQLAlchemyError as e:
            logger.error(f"Failed to retrieve sections by outline: {e}", exc_info=True)
            raise RuntimeError(f"Database error while retrieving sections: {str(e)}")

    async def get_sections_by_document(self, document_id: UUID, user_id: UUID) -> List[Section]:
        """
        Get all sections for a document (ordered by section_order).

        Args:
            document_id: Document UUID
            user_id: User UUID (for multi-tenancy)

        Returns:
            List of sections ordered by section_order

        Raises:
            RuntimeError: Database read error
        """
        try:
            query = (
                select(Section)
                .where(Section.document_id == document_id, Section.user_id == user_id)
                .order_by(Section.section_order)
            )

            result = await self.db.execute(query)
            sections = result.scalars().all()

            logger.debug(
                f"Retrieved {len(sections)} sections for document_id={document_id}, "
                f"user_id={user_id}"
            )

            return list(sections)

        except SQLAlchemyError as e:
            logger.error(f"Failed to retrieve sections by document: {e}", exc_info=True)
            raise RuntimeError(f"Database error while retrieving sections: {str(e)}")

    async def delete_sections_by_outline(self, outline_id: UUID, user_id: UUID) -> int:
        """
        Delete all sections for an outline.

        Args:
            outline_id: Outline UUID
            user_id: User UUID (for multi-tenancy)

        Returns:
            Number of sections deleted

        Raises:
            RuntimeError: Database delete error
        """
        try:
            query = delete(Section).where(
                Section.outline_id == outline_id, Section.user_id == user_id
            )

            result = await self.db.execute(query)
            await self.db.commit()

            deleted_count = result.rowcount

            logger.info(
                f"Deleted {deleted_count} sections for outline_id={outline_id}, "
                f"user_id={user_id}"
            )

            return deleted_count

        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Failed to delete sections: {e}", exc_info=True)
            raise RuntimeError(f"Database error while deleting sections: {str(e)}")
