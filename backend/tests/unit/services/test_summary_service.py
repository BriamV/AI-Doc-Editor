"""
Unit tests for Summary Service (T-06 ST3)

Tests SummaryService business logic with mocked dependencies.
Covers incremental summary generation, error handling, and database persistence.
"""

import pytest
import uuid
from unittest.mock import MagicMock
from datetime import datetime

from app.services.summary_service import SummaryService
from app.models.section import Section
from app.models.document import Document, DocumentStatus


class MockSummaryPort:
    """Mock summary port for testing"""

    def __init__(self, summary_text: str = "This is a test summary."):
        self.summary_text = summary_text
        self.generate_summary_called = False
        self.last_sections = None
        self.last_previous_summary = None

    async def generate_summary(
        self,
        sections: list[str],
        max_tokens: int,
        api_key: str,
        previous_summary: str | None = None,
    ) -> str:
        """Mock summary generation"""
        self.generate_summary_called = True
        self.last_sections = sections
        self.last_previous_summary = previous_summary
        return self.summary_text


class MockSectionRepositoryPort:
    """Mock section repository port for testing"""

    def __init__(self, sections: list[Section] = None):
        self.sections = sections or []

    async def save_section(self, section: Section) -> Section:
        """Mock save section"""
        self.sections.append(section)
        return section

    async def get_sections_by_outline(
        self, outline_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[Section]:
        """Mock get sections by outline"""
        return [s for s in self.sections if s.outline_id == outline_id and s.user_id == user_id]

    async def get_sections_by_document(
        self, document_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[Section]:
        """Mock get sections by document"""
        return [s for s in self.sections if s.document_id == document_id and s.user_id == user_id]

    async def delete_sections_by_outline(self, outline_id: uuid.UUID, user_id: uuid.UUID) -> int:
        """Mock delete sections by outline"""
        count = len(
            [s for s in self.sections if s.outline_id == outline_id and s.user_id == user_id]
        )
        self.sections = [
            s for s in self.sections if not (s.outline_id == outline_id and s.user_id == user_id)
        ]
        return count


class MockAsyncSession:
    """Mock async database session"""

    def __init__(self):
        self.committed = False
        self.rolled_back = False
        self.executed_statements = []
        self.mock_document = None

    async def execute(self, statement):
        """Mock execute"""
        self.executed_statements.append(statement)
        # Return mock result
        result = MagicMock()
        result.scalar_one_or_none.return_value = self.mock_document
        return result

    async def commit(self):
        """Mock commit"""
        self.committed = True

    async def rollback(self):
        """Mock rollback"""
        self.rolled_back = True


@pytest.fixture
def mock_summary_port():
    """Fixture for mock summary port"""
    return MockSummaryPort()


@pytest.fixture
def mock_section_repository_port():
    """Fixture for mock section repository port"""
    return MockSectionRepositoryPort()


@pytest.fixture
def mock_db():
    """Fixture for mock database session"""
    return MockAsyncSession()


@pytest.fixture
def summary_service(mock_summary_port, mock_section_repository_port):
    """Fixture for SummaryService with mocked dependencies"""
    return SummaryService(
        summary_port=mock_summary_port,
        section_repository_port=mock_section_repository_port,
        max_summary_tokens=200,
    )


@pytest.fixture
def sample_sections():
    """Fixture for sample sections"""
    outline_id = uuid.uuid4()
    user_id = uuid.uuid4()

    sections = [
        Section(
            id=uuid.uuid4(),
            document_id=None,
            outline_id=outline_id,
            section_title="Introduction",
            section_level=1,
            heading_id="H1",
            section_order=0,
            content="This is the introduction section with detailed content.",
            word_count=8,
            tokens_used=16,
            generation_time_ms=1200,
            user_id=user_id,
        ),
        Section(
            id=uuid.uuid4(),
            document_id=None,
            outline_id=outline_id,
            section_title="Background",
            section_level=2,
            heading_id="H1.1",
            section_order=1,
            content="This section covers the background information.",
            word_count=6,
            tokens_used=12,
            generation_time_ms=1000,
            user_id=user_id,
        ),
        Section(
            id=uuid.uuid4(),
            document_id=None,
            outline_id=outline_id,
            section_title="Methodology",
            section_level=1,
            heading_id="H2",
            section_order=2,
            content="This section describes the methodology used.",
            word_count=6,
            tokens_used=12,
            generation_time_ms=1100,
            user_id=user_id,
        ),
    ]

    return outline_id, user_id, sections


class TestSummaryService:
    """Test suite for SummaryService"""

    @pytest.mark.asyncio
    async def test_generate_global_summary_basic(
        self,
        summary_service,
        mock_summary_port,
        mock_section_repository_port,
        mock_db,
        sample_sections,
    ):
        """Test basic summary generation with sections"""
        outline_id, user_id, sections = sample_sections

        # Setup mock repository with sections
        mock_section_repository_port.sections = sections

        # Generate summary
        result = await summary_service.generate_global_summary(
            db=mock_db,
            outline_id=outline_id,
            user_id=user_id,
            api_key="test-api-key",
            document_id=None,
            sections_completed=3,
            total_sections=5,
        )

        # Verify summary port was called
        assert mock_summary_port.generate_summary_called
        assert len(mock_summary_port.last_sections) == 3
        assert mock_summary_port.last_previous_summary is None  # No document, no previous summary

        # Verify result metadata
        assert result["summary"] == "This is a test summary."
        assert result["sections_completed"] == 3
        assert result["total_sections"] == 5
        assert result["overall_progress"] == 60  # 3/5 * 100
        assert result["estimated_time_remaining_sec"] == 30  # (5-3) * 15

    @pytest.mark.asyncio
    async def test_generate_summary_with_document_and_previous_summary(
        self,
        summary_service,
        mock_summary_port,
        mock_section_repository_port,
        mock_db,
        sample_sections,
    ):
        """Test incremental summary generation with previous summary"""
        outline_id, user_id, sections = sample_sections
        document_id = uuid.uuid4()

        # Setup mock repository with sections
        mock_section_repository_port.sections = sections

        # Setup mock document with previous summary
        mock_document = Document(
            id=document_id,
            original_filename="test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size_bytes=1024,
            status=DocumentStatus.COMPLETED,
            user_id=user_id,
            user_email="test@example.com",
            global_summary="Previous summary text.",
            summary_updated_at=datetime.utcnow(),
        )
        mock_db.mock_document = mock_document

        # Generate summary
        _result = await summary_service.generate_global_summary(
            db=mock_db,
            outline_id=outline_id,
            user_id=user_id,
            api_key="test-api-key",
            document_id=document_id,
            sections_completed=3,
            total_sections=5,
        )

        # Verify incremental summary strategy
        assert mock_summary_port.last_previous_summary == "Previous summary text."
        assert mock_db.committed  # Database commit called

    @pytest.mark.asyncio
    async def test_generate_summary_no_sections(
        self, summary_service, mock_summary_port, mock_section_repository_port, mock_db
    ):
        """Test summary generation with no sections (edge case)"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()

        # No sections in repository
        mock_section_repository_port.sections = []

        # Generate summary
        result = await summary_service.generate_global_summary(
            db=mock_db,
            outline_id=outline_id,
            user_id=user_id,
            api_key="test-api-key",
            document_id=None,
            sections_completed=0,
            total_sections=5,
        )

        # Verify empty summary returned
        assert result["summary"] == ""
        assert result["sections_completed"] == 0
        assert result["overall_progress"] == 0
        assert not mock_summary_port.generate_summary_called

    @pytest.mark.asyncio
    async def test_generate_summary_calculates_progress_correctly(
        self, summary_service, mock_summary_port, mock_section_repository_port, mock_db
    ):
        """Test progress calculation in summary metadata"""
        # Note: Service uses len(fetched_sections) as sections_completed, not the parameter
        # This test verifies correct progress calculation from actual section count

        user_id = uuid.uuid4()

        # Test different scenarios with varying section counts
        test_cases = [
            (1, 10, 10),  # 1 section, 10 total = 10%
            (5, 10, 50),  # 5 sections, 10 total = 50%
            (10, 10, 100),  # 10 sections, 10 total = 100%
            (3, 10, 30),  # 3 sections, 10 total = 30%
        ]

        for num_sections, total, expected_progress in test_cases:
            outline_id = uuid.uuid4()

            # Create exact number of sections for this test
            sections = []
            for i in range(num_sections):
                sections.append(
                    Section(
                        id=uuid.uuid4(),
                        document_id=None,
                        outline_id=outline_id,
                        section_title=f"Section {i+1}",
                        section_level=1,
                        heading_id=f"H{i+1}",
                        section_order=i,
                        content=f"Content for section {i+1}",
                        word_count=5,
                        tokens_used=10,
                        generation_time_ms=1000,
                        user_id=user_id,
                    )
                )

            mock_section_repository_port.sections = sections

            result = await summary_service.generate_global_summary(
                db=mock_db,
                outline_id=outline_id,
                user_id=user_id,
                api_key="test-api-key",
                document_id=None,
                sections_completed=num_sections,  # This is ignored, uses len(fetched)
                total_sections=total,
            )

            # Verify progress calculation
            assert (
                result["overall_progress"] == expected_progress
            ), f"Progress should be {expected_progress}% for {num_sections}/{total}"
            assert result["sections_completed"] == num_sections
            assert result["total_sections"] == total

    @pytest.mark.asyncio
    async def test_generate_summary_estimates_time_remaining(
        self, summary_service, mock_summary_port, mock_section_repository_port, mock_db
    ):
        """Test estimated time remaining calculation (15s per section)"""
        user_id = uuid.uuid4()

        # Test different scenarios
        # Note: Service uses len(fetched_sections), so we create exact section counts
        test_cases = [
            (1, 10, 135),  # 1 done, 9 left × 15s = 135s
            (5, 10, 75),  # 5 done, 5 left × 15s = 75s
            (9, 10, 15),  # 9 done, 1 left × 15s = 15s
            (10, 10, 0),  # 10 done, 0 left × 15s = 0s
        ]

        for num_sections, total, expected_time in test_cases:
            outline_id = uuid.uuid4()

            # Create exact number of sections
            sections = []
            for i in range(num_sections):
                sections.append(
                    Section(
                        id=uuid.uuid4(),
                        document_id=None,
                        outline_id=outline_id,
                        section_title=f"Section {i+1}",
                        section_level=1,
                        heading_id=f"H{i+1}",
                        section_order=i,
                        content=f"Content for section {i+1}",
                        word_count=5,
                        tokens_used=10,
                        generation_time_ms=1000,
                        user_id=user_id,
                    )
                )

            mock_section_repository_port.sections = sections

            result = await summary_service.generate_global_summary(
                db=mock_db,
                outline_id=outline_id,
                user_id=user_id,
                api_key="test-api-key",
                document_id=None,
                sections_completed=num_sections,
                total_sections=total,
            )

            assert (
                result["estimated_time_remaining_sec"] == expected_time
            ), f"Time should be {expected_time}s for {num_sections}/{total} sections"
            assert result["sections_completed"] == num_sections

    @pytest.mark.asyncio
    async def test_generate_summary_database_error_handling(
        self,
        summary_service,
        mock_summary_port,
        mock_section_repository_port,
        mock_db,
        sample_sections,
    ):
        """Test database error handling (rollback on failure)"""
        outline_id, user_id, sections = sample_sections
        document_id = uuid.uuid4()

        mock_section_repository_port.sections = sections

        # Mock database commit failure
        async def mock_commit_error():
            raise RuntimeError("Database commit failed")

        mock_db.commit = mock_commit_error

        # Setup mock document
        mock_document = Document(
            id=document_id,
            original_filename="test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size_bytes=1024,
            status=DocumentStatus.COMPLETED,
            user_id=user_id,
            user_email="test@example.com",
        )
        mock_db.mock_document = mock_document

        # Should raise RuntimeError
        with pytest.raises(RuntimeError, match="Summary generation failed"):
            await summary_service.generate_global_summary(
                db=mock_db,
                outline_id=outline_id,
                user_id=user_id,
                api_key="test-api-key",
                document_id=document_id,
                sections_completed=3,
                total_sections=5,
            )

    @pytest.mark.asyncio
    async def test_generate_summary_api_error_propagation(
        self, summary_service, mock_section_repository_port, mock_db, sample_sections
    ):
        """Test LLM API error propagation"""
        outline_id, user_id, sections = sample_sections
        mock_section_repository_port.sections = sections

        # Mock summary port that raises error
        async def mock_generate_error(*args, **kwargs):
            raise RuntimeError("OpenAI API error")

        summary_service.summary_port.generate_summary = mock_generate_error

        # Should propagate RuntimeError
        with pytest.raises(RuntimeError, match="Summary generation failed"):
            await summary_service.generate_global_summary(
                db=mock_db,
                outline_id=outline_id,
                user_id=user_id,
                api_key="test-api-key",
                document_id=None,
                sections_completed=3,
                total_sections=5,
            )

    @pytest.mark.asyncio
    async def test_generate_summary_max_tokens_configuration(
        self, mock_summary_port, mock_section_repository_port
    ):
        """Test max_tokens configuration is respected"""
        # Create service with custom max_tokens
        service = SummaryService(
            summary_port=mock_summary_port,
            section_repository_port=mock_section_repository_port,
            max_summary_tokens=300,  # Custom value
        )

        assert service.max_summary_tokens == 300

    @pytest.mark.asyncio
    async def test_build_summary_metadata_edge_cases(self, summary_service):
        """Test _build_summary_metadata with edge cases"""
        # Zero sections
        result = summary_service._build_summary_metadata(
            summary="Test summary", sections_completed=0, total_sections=0
        )
        assert result["overall_progress"] == 0
        assert result["estimated_time_remaining_sec"] == 0

        # Completed > total (should handle gracefully)
        result = summary_service._build_summary_metadata(
            summary="Test summary", sections_completed=15, total_sections=10
        )
        assert result["overall_progress"] == 150  # Mathematically correct
        assert result["estimated_time_remaining_sec"] == 0  # max(0, 10-15) * 15 = 0
