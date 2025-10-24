"""
Section Repository Port - Interface for section persistence.

T-06 ST2: Section Generation Service
Hexagonal Architecture - Port (Interface) for section database operations.
"""

from abc import ABC, abstractmethod
from typing import List
from uuid import UUID

from app.models.section import Section


class SectionRepositoryPort(ABC):
    """
    Port (interface) for section persistence operations.

    Defines the contract for saving and retrieving generated sections.
    Business logic depends on this interface, not concrete implementations.

    Implementations:
        - SectionRepositoryAdapter: Production SQLAlchemy implementation
        - MockSectionRepository: Test implementation for unit tests
    """

    @abstractmethod
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
        pass

    @abstractmethod
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
        pass

    @abstractmethod
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
        pass

    @abstractmethod
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
        pass
