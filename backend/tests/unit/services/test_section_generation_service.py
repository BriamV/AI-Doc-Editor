"""
Unit tests for Section Generation Service (T-06 ST2)

Tests SectionGenerationService business logic with mocked dependencies.
"""

import pytest
import uuid
from typing import AsyncIterator

from app.services.section_generation_service import SectionGenerationService
from app.models.planner import DocumentOutline, HeadingNode
from app.models.section import Section


class MockStreamingPort:
    """Mock OpenAI streaming port for testing"""

    def __init__(self, chunks: list[str] = None):
        self.chunks = chunks or ["This is ", "a test ", "content."]
        self.estimate_tokens_called = False

    async def stream_content(
        self, prompt: str, model: str, temperature: float, max_tokens: int, api_key: str
    ) -> AsyncIterator[str]:
        """Mock streaming content generation"""
        for chunk in self.chunks:
            yield chunk

    def estimate_tokens(self, text: str, model: str) -> int:
        """Mock token estimation"""
        self.estimate_tokens_called = True
        return len(text.split()) * 2  # Simple approximation


class MockRepositoryPort:
    """Mock section repository port for testing"""

    def __init__(self):
        self.saved_sections = []

    async def save_section(self, section: Section) -> Section:
        """Mock save section"""
        self.saved_sections.append(section)
        return section

    async def get_sections_by_outline(self, outline_id: uuid.UUID, user_id: uuid.UUID) -> list:
        """Mock get sections by outline"""
        return [s for s in self.saved_sections if s.outline_id == outline_id]

    async def get_sections_by_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> list:
        """Mock get sections by document"""
        return [s for s in self.saved_sections if s.document_id == document_id]

    async def delete_sections_by_outline(self, outline_id: uuid.UUID, user_id: uuid.UUID) -> int:
        """Mock delete sections by outline"""
        count = len([s for s in self.saved_sections if s.outline_id == outline_id])
        self.saved_sections = [s for s in self.saved_sections if s.outline_id != outline_id]
        return count


@pytest.fixture
def mock_streaming_port():
    """Fixture for mock streaming port"""
    return MockStreamingPort()


@pytest.fixture
def mock_repository_port():
    """Fixture for mock repository port"""
    return MockRepositoryPort()


@pytest.fixture
def section_generation_service(mock_streaming_port, mock_repository_port):
    """Fixture for SectionGenerationService with mocked dependencies"""
    return SectionGenerationService(
        streaming_port=mock_streaming_port,
        repository_port=mock_repository_port,
        default_model="gpt-4o-mini",
        default_temperature=0.7,
        default_max_tokens=600,
    )


@pytest.fixture
def simple_outline():
    """Fixture for simple 2-level outline"""
    heading1 = HeadingNode(
        level=1,
        text="Introduction",
        children=[HeadingNode(level=2, text="Background", children=[])],
    )

    heading2 = HeadingNode(level=1, text="Conclusion", children=[])

    return DocumentOutline(headings=[heading1, heading2], total_headings=3)


@pytest.fixture
def complex_outline():
    """Fixture for complex 3-level outline"""
    heading1 = HeadingNode(
        level=1,
        text="Chapter 1",
        children=[
            HeadingNode(
                level=2,
                text="Section 1.1",
                children=[
                    HeadingNode(level=3, text="Subsection 1.1.1", children=[]),
                    HeadingNode(level=3, text="Subsection 1.1.2", children=[]),
                ],
            ),
            HeadingNode(level=2, text="Section 1.2", children=[]),
        ],
    )

    return DocumentOutline(headings=[heading1], total_headings=5)


class TestSectionGenerationService:
    """Test suite for SectionGenerationService"""

    @pytest.mark.asyncio
    async def test_generate_sections_simple_outline(
        self, section_generation_service, simple_outline, mock_repository_port
    ):
        """Test section generation with simple 2-level outline"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        events = []
        async for event in section_generation_service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
        ):
            events.append(event)

        # Verify event types
        event_types = [e["type"] for e in events]

        # Expected: 3 sections × 3 events (start, chunks, end) = 9+ events
        assert "section_start" in event_types
        assert "section_chunk" in event_types
        assert "section_end" in event_types

        # Verify 3 sections saved (3 headings in outline)
        assert len(mock_repository_port.saved_sections) == 3

        # Verify section metadata
        section_titles = [s.section_title for s in mock_repository_port.saved_sections]
        assert "Introduction" in section_titles
        assert "Background" in section_titles
        assert "Conclusion" in section_titles

    @pytest.mark.asyncio
    async def test_generate_sections_complex_outline(
        self, section_generation_service, complex_outline, mock_repository_port
    ):
        """Test section generation with complex 3-level outline"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        events = []
        async for event in section_generation_service.generate_sections(
            outline=complex_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
        ):
            events.append(event)

        # Verify 5 sections saved (5 total_headings)
        assert len(mock_repository_port.saved_sections) == 5

        # Verify section ordering
        sections = mock_repository_port.saved_sections
        assert sections[0].section_order == 0
        assert sections[1].section_order == 1
        assert sections[4].section_order == 4

    @pytest.mark.asyncio
    async def test_section_start_event(self, section_generation_service, simple_outline):
        """Test section_start event format"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        events = []
        async for event in section_generation_service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
        ):
            if event["type"] == "section_start":
                events.append(event)

        # Verify first section_start event
        first_event = events[0]
        assert first_event["type"] == "section_start"
        assert first_event["section_id"] == "section_1"
        assert first_event["heading_text"] == "Introduction"
        assert first_event["heading_level"] == 1
        assert first_event["heading_id"] == "H1"
        assert "timestamp" in first_event

    @pytest.mark.asyncio
    async def test_section_chunk_events(self, section_generation_service, simple_outline):
        """Test section_chunk event format and ordering"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        chunk_events = []
        async for event in section_generation_service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
        ):
            if event["type"] == "section_chunk":
                chunk_events.append(event)

        # Verify chunk events exist
        assert len(chunk_events) > 0

        # Verify first chunk event format
        first_chunk = chunk_events[0]
        assert first_chunk["type"] == "section_chunk"
        assert first_chunk["section_id"] == "section_1"
        assert "chunk" in first_chunk
        assert first_chunk["chunk_index"] == 0
        assert "timestamp" in first_chunk

        # Verify chunk indices are sequential
        indices = [e["chunk_index"] for e in chunk_events if e["section_id"] == "section_1"]
        assert indices == list(range(len(indices)))

    @pytest.mark.asyncio
    async def test_section_end_event(
        self, section_generation_service, simple_outline, mock_streaming_port
    ):
        """Test section_end event format and statistics"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        end_events = []
        async for event in section_generation_service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
        ):
            if event["type"] == "section_end":
                end_events.append(event)

        # Verify 3 section_end events (3 headings)
        assert len(end_events) == 3

        # Verify first section_end event
        first_end = end_events[0]
        assert first_end["type"] == "section_end"
        assert first_end["section_id"] == "section_1"
        assert first_end["heading_id"] == "H1"
        assert "full_content" in first_end
        assert first_end["word_count"] > 0
        assert first_end["tokens_used"] > 0
        assert first_end["generation_time_ms"] >= 0
        assert "timestamp" in first_end

        # Verify token estimation was called
        assert mock_streaming_port.estimate_tokens_called

    @pytest.mark.asyncio
    async def test_section_persistence(
        self, section_generation_service, simple_outline, mock_repository_port
    ):
        """Test section persistence to database"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        document_id = uuid.uuid4()
        api_key = "test-api-key"

        async for event in section_generation_service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
            document_id=document_id,
        ):
            pass  # Process all events

        # Verify sections saved
        sections = mock_repository_port.saved_sections
        assert len(sections) == 3

        # Verify first section
        section1 = sections[0]
        assert section1.outline_id == outline_id
        assert section1.user_id == user_id
        assert section1.document_id == document_id
        assert section1.section_title == "Introduction"
        assert section1.section_level == 1
        assert section1.heading_id == "H1"
        assert section1.section_order == 0
        assert len(section1.content) > 0
        assert section1.word_count > 0
        assert section1.tokens_used > 0

    @pytest.mark.asyncio
    async def test_parse_outline_to_sections(self, section_generation_service, complex_outline):
        """Test outline parsing into flat section list"""
        sections = section_generation_service._parse_outline_to_sections(complex_outline)

        # Verify 5 sections (5 total_headings)
        assert len(sections) == 5

        # Verify section structure
        assert sections[0]["heading_text"] == "Chapter 1"
        assert sections[0]["heading_level"] == 1
        assert sections[0]["heading_id"] == "H1"

        assert sections[1]["heading_text"] == "Section 1.1"
        assert sections[1]["heading_level"] == 2
        assert sections[1]["heading_id"] == "H1.1"

        assert sections[2]["heading_text"] == "Subsection 1.1.1"
        assert sections[2]["heading_level"] == 3
        assert sections[2]["heading_id"] == "H1.1.1"

        assert sections[3]["heading_text"] == "Subsection 1.1.2"
        assert sections[3]["heading_level"] == 3
        assert sections[3]["heading_id"] == "H1.1.2"

        assert sections[4]["heading_text"] == "Section 1.2"
        assert sections[4]["heading_level"] == 2
        assert sections[4]["heading_id"] == "H1.2"

    @pytest.mark.asyncio
    async def test_build_section_prompt(self, section_generation_service):
        """Test section prompt generation"""
        prompt = section_generation_service._build_section_prompt("Introduction", 1)

        # Verify prompt contains heading
        assert "Introduction" in prompt

        # Verify prompt contains level-specific instructions
        assert "main section" in prompt or "section" in prompt

        # Verify prompt has requirements
        assert "Requirements:" in prompt or "paragraphs" in prompt

    @pytest.mark.asyncio
    async def test_custom_model_parameters(self, section_generation_service, simple_outline):
        """Test custom model, temperature, max_tokens parameters"""
        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        custom_model = "gpt-4o"
        custom_temperature = 0.9
        custom_max_tokens = 800

        events = []
        async for event in section_generation_service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
            model=custom_model,
            temperature=custom_temperature,
            max_tokens=custom_max_tokens,
        ):
            events.append(event)

        # Verify sections generated with custom parameters
        assert len(events) > 0
        assert any(e["type"] == "section_end" for e in events)

    @pytest.mark.asyncio
    async def test_error_handling_llm_failure(self, mock_repository_port, simple_outline):
        """Test error handling when LLM streaming fails"""

        class FailingStreamingPort:
            async def stream_content(self, *args, **kwargs) -> AsyncIterator[str]:
                raise RuntimeError("LLM API error")

            def estimate_tokens(self, text: str, model: str) -> int:
                return 0

        service = SectionGenerationService(
            streaming_port=FailingStreamingPort(),
            repository_port=mock_repository_port,
        )

        outline_id = uuid.uuid4()
        user_id = uuid.uuid4()
        api_key = "test-api-key"

        events = []
        async for event in service.generate_sections(
            outline=simple_outline,
            outline_id=outline_id,
            user_id=user_id,
            api_key=api_key,
        ):
            events.append(event)

        # Verify error events emitted
        error_events = [e for e in events if e["type"] == "error"]
        assert len(error_events) > 0

        # Verify error event format
        error = error_events[0]
        assert error["error_code"] == "SECTION_GENERATION_FAILED"
        assert "error_message" in error
        assert error["fatal"] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
