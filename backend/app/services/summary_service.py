"""
Summary Service - Business logic for global document summaries.

T-06 ST3: Global Summary Refresh
Hexagonal Architecture - Domain Layer
Coordinates summary generation, incremental updates, and document persistence.
"""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.ports.summary_port import SummaryPort
from app.ports.section_repository_port import SectionRepositoryPort
from app.models.document import Document

logger = logging.getLogger(__name__)


class SummaryService:
    """
    Summary Service - Domain Logic for global document summaries.

    Implements incremental summary generation after each section completion.

    Architecture:
    - Uses SummaryPort for LLM summary generation (adapter pattern)
    - Uses SectionRepositoryPort to fetch completed sections
    - Directly updates Document model for summary persistence

    Workflow:
    1. Fetch all completed sections for outline/document
    2. Get previous summary (if exists) for incremental update
    3. Generate new summary via SummaryPort
    4. Update document with new summary and timestamp
    5. Return summary metadata for WebSocket event

    Performance:
    - Target: ≤500ms (p95) via incremental strategy
    - Uses gpt-3.5-turbo for speed
    - Max 200 tokens for concise summaries
    """

    def __init__(
        self,
        summary_port: SummaryPort,
        section_repository_port: SectionRepositoryPort,
        max_summary_tokens: int = 200,
    ):
        """
        Initialize summary service.

        Args:
            summary_port: Summary generation adapter
            section_repository_port: Section repository adapter
            max_summary_tokens: Max tokens for generated summaries (default: 200)
        """
        self.summary_port = summary_port
        self.section_repository_port = section_repository_port
        self.max_summary_tokens = max_summary_tokens

        logger.info(f"SummaryService initialized (max_tokens={max_summary_tokens})")

    async def generate_global_summary(
        self,
        db: AsyncSession,
        outline_id: UUID,
        user_id: UUID,
        api_key: str,
        document_id: Optional[UUID] = None,
        sections_completed: int = 0,
        total_sections: int = 0,
    ) -> dict:
        """
        Generate or update global document summary after section completion.

        Implements incremental summary strategy:
        1. Fetch all completed sections (ordered by section_order)
        2. Get previous summary from document (if exists)
        3. Extract new sections since last summary update
        4. Generate updated summary via SummaryPort
        5. Save summary to document table with timestamp

        Args:
            db: Async database session
            outline_id: Outline UUID
            user_id: User UUID (multi-tenancy)
            api_key: OpenAI API key
            document_id: Optional document UUID
            sections_completed: Number of sections completed (for event metadata)
            total_sections: Total sections in outline (for event metadata)

        Returns:
            Summary metadata dict:
            {
                "summary": "The document covers...",
                "sections_completed": 5,
                "total_sections": 12,
                "overall_progress": 42,
                "estimated_time_remaining_sec": 180
            }

        Raises:
            RuntimeError: Summary generation or database error
        """
        logger.info(
            f"Generating global summary: outline_id={outline_id}, "
            f"sections_completed={sections_completed}/{total_sections}"
        )

        try:
            # 1. Fetch all completed sections (ordered)
            sections = await self.section_repository_port.get_sections_by_outline(
                outline_id=outline_id,
                user_id=user_id,
            )

            if not sections:
                logger.warning(f"No sections found for outline {outline_id}")
                return self._build_summary_metadata(
                    summary="",
                    sections=[],
                    sections_completed=0,
                    total_sections=total_sections,
                )

            # 2. Get previous summary and document
            document = None
            previous_summary = None

            if document_id:
                # Fetch document for previous summary
                result = await db.execute(
                    select(Document).where(
                        Document.id == document_id,
                        Document.user_id == user_id,
                    )
                )
                document = result.scalar_one_or_none()

                if document:
                    previous_summary = document.global_summary

            # 3. Extract section content
            section_contents = [section.content for section in sections]

            logger.debug(
                f"Fetched {len(section_contents)} sections "
                f"(incremental={previous_summary is not None})"
            )

            # 4. Generate summary
            summary = await self.summary_port.generate_summary(
                sections=section_contents,
                max_tokens=self.max_summary_tokens,
                api_key=api_key,
                previous_summary=previous_summary,
            )

            logger.info(f"Summary generated: {len(summary)} chars")

            # 5. Update document with summary
            if document_id:
                await self._update_document_summary(
                    db=db,
                    document_id=document_id,
                    user_id=user_id,
                    summary=summary,
                )

            # 6. Build summary metadata for WebSocket event
            return self._build_summary_metadata(
                summary=summary,
                sections=sections,
                sections_completed=len(sections),
                total_sections=total_sections,
            )

        except Exception as e:
            logger.error(
                f"Failed to generate global summary for outline {outline_id}: {e}",
                exc_info=True,
            )
            raise RuntimeError(f"Summary generation failed: {str(e)}")

    async def _update_document_summary(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        summary: str,
    ) -> None:
        """
        Update document with new summary and timestamp.

        Args:
            db: Async database session
            document_id: Document UUID
            user_id: User UUID (multi-tenancy)
            summary: Generated summary text

        Raises:
            RuntimeError: Database update error
        """
        try:
            # Update document summary
            stmt = (
                update(Document)
                .where(
                    Document.id == document_id,
                    Document.user_id == user_id,
                )
                .values(
                    global_summary=summary,
                    summary_updated_at=datetime.utcnow(),
                )
            )

            await db.execute(stmt)
            await db.commit()

            logger.debug(f"Document {document_id} updated with new summary")

        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to update document summary: {e}", exc_info=True)
            raise RuntimeError(f"Database update failed: {str(e)}")

    def _build_summary_metadata(
        self,
        summary: str,
        sections: list,
        sections_completed: int,
        total_sections: int,
    ) -> dict:
        """
        Build summary metadata for WebSocket event.

        Args:
            summary: Generated summary text
            sections: List of completed section objects
            sections_completed: Number of completed sections
            total_sections: Total sections in outline

        Returns:
            Summary metadata dict
        """
        # Calculate progress percentage
        overall_progress = (
            int((sections_completed / total_sections) * 100) if total_sections > 0 else 0
        )

        # Estimate remaining time (rough: 15s per section)
        sections_remaining = max(0, total_sections - sections_completed)
        estimated_time_remaining_sec = sections_remaining * 15

        # Calculate total statistics from completed sections
        total_words = sum(section.word_count for section in sections if section.word_count)
        total_tokens = sum(section.tokens_used for section in sections if section.tokens_used)

        return {
            "summary": summary,
            "sections_completed": sections_completed,
            "total_sections": total_sections,
            "overall_progress": overall_progress,
            "estimated_time_remaining_sec": estimated_time_remaining_sec,
            "total_words": total_words,
            "total_tokens": total_tokens,
            "summary_updated_at": datetime.utcnow().isoformat() + "Z",
        }
