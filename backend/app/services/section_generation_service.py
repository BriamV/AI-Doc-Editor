"""
Section Generation Service - Domain Logic

T-06 ST2: Section Generation with WebSocket streaming
Hexagonal Architecture - Domain Layer
Coordinates section content generation, streaming, and persistence.
"""

import logging
import time
import uuid
from typing import TYPE_CHECKING, List, AsyncIterator, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.ports.openai_streaming_port import OpenAIStreamingPort
from app.ports.section_repository_port import SectionRepositoryPort
from app.models.planner import DocumentOutline, HeadingNode
from app.models.section import Section

if TYPE_CHECKING:
    from app.services.summary_service import SummaryService

logger = logging.getLogger(__name__)


class SectionGenerationService:
    """
    Section Generation Service - Domain Logic

    Implements streaming section generation with outline-guided content.

    Architecture:
    - Uses OpenAIStreamingPort for LLM streaming (adapter pattern)
    - Uses SectionRepositoryPort for persistence (adapter pattern)
    - Coordinates: outline parsing → section generation → streaming → persistence

    Workflow:
    1. Parse outline structure into flat section list
    2. For each section:
       a. Generate content via streaming LLM
       b. Emit chunks as they arrive (caller handles WebSocket)
       c. Save complete section to database
    3. Return statistics for all sections
    """

    def __init__(
        self,
        streaming_port: OpenAIStreamingPort,
        repository_port: SectionRepositoryPort,
        summary_service: Optional["SummaryService"] = None,  # T-06 ST3
        default_model: str = "gpt-4o-mini",
        default_temperature: float = 0.7,
        default_max_tokens: int = 600,
    ):
        """
        Initialize section generation service.

        Args:
            streaming_port: OpenAI streaming adapter
            repository_port: Section repository adapter
            summary_service: Optional summary service for global summaries (T-06 ST3)
            default_model: Default OpenAI model for generation
            default_temperature: Default LLM temperature (0.0-2.0)
            default_max_tokens: Default max tokens per section
        """
        self.streaming_port = streaming_port
        self.repository_port = repository_port
        self.summary_service = summary_service
        self.default_model = default_model
        self.default_temperature = default_temperature
        self.default_max_tokens = default_max_tokens

        logger.info(
            f"SectionGenerationService initialized "
            f"(model={default_model}, temperature={default_temperature}, "
            f"max_tokens={default_max_tokens}, summary_enabled={summary_service is not None})"
        )

    async def generate_sections(
        self,
        outline: DocumentOutline,
        outline_id: uuid.UUID,
        user_id: uuid.UUID,
        api_key: str,
        db: Optional[AsyncSession] = None,  # T-06 ST3: Required for summary updates
        document_id: Optional[uuid.UUID] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Generate sections from outline with streaming.

        Yields events for WebSocket streaming:
        - section_start: Section metadata before generation
        - section_chunk: Content chunks as they arrive from LLM
        - section_end: Final section metadata after generation
        - summary_update: Global summary after each section (T-06 ST3)

        Args:
            outline: DocumentOutline from T-05 Planner Service
            outline_id: Outline UUID for database association
            user_id: User UUID for multi-tenancy
            api_key: OpenAI API key
            db: Optional database session for summary updates (T-06 ST3)
            document_id: Optional document UUID
            model: Optional model override
            temperature: Optional temperature override
            max_tokens: Optional max_tokens override

        Yields:
            Event dictionaries:
            - {"type": "section_start", "section_id": ..., "heading_text": ..., ...}
            - {"type": "section_chunk", "section_id": ..., "chunk": ..., "chunk_index": ...}
            - {"type": "section_end", "section_id": ..., "full_content": ..., ...}
            - {"type": "summary_update", "data": {...}} (T-06 ST3)

        Raises:
            RuntimeError: LLM API error or database error
        """
        model = model or self.default_model
        temperature = temperature or self.default_temperature
        max_tokens = max_tokens or self.default_max_tokens

        logger.info(
            f"Starting section generation: outline_id={outline_id}, "
            f"total_headings={outline.total_headings}, model={model}"
        )

        # Parse outline into flat section list
        sections = self._parse_outline_to_sections(outline)

        logger.info(f"Parsed {len(sections)} sections from outline")

        # Generate each section
        section_order = 0
        for section_meta in sections:
            section_id = f"section_{section_order + 1}"
            heading_text = section_meta["heading_text"]
            heading_level = section_meta["heading_level"]
            heading_id = section_meta["heading_id"]

            logger.info(f"Generating section: {section_id} (H{heading_level}: {heading_text})")

            # Emit section_start event
            yield {
                "type": "section_start",
                "section_id": section_id,
                "heading_id": heading_id,
                "heading_text": heading_text,
                "heading_level": heading_level,
                "timestamp": time.time(),
            }

            # Generate section content with streaming
            try:
                full_content = ""
                chunk_index = 0
                start_time = time.time()

                async for chunk in self.stream_section_content(
                    heading_text=heading_text,
                    heading_level=heading_level,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    api_key=api_key,
                ):
                    full_content += chunk

                    # Emit section_chunk event
                    yield {
                        "type": "section_chunk",
                        "section_id": section_id,
                        "chunk": chunk,
                        "chunk_index": chunk_index,
                        "timestamp": time.time(),
                    }

                    chunk_index += 1

                generation_time_ms = int((time.time() - start_time) * 1000)

                # Calculate statistics
                word_count = len(full_content.split())
                tokens_used = self.streaming_port.estimate_tokens(full_content, model)

                # Save section to database
                section = Section(
                    id=uuid.uuid4(),
                    document_id=document_id,
                    outline_id=outline_id,
                    section_title=heading_text,
                    section_level=heading_level,
                    heading_id=heading_id,
                    section_order=section_order,
                    content=full_content,
                    word_count=word_count,
                    tokens_used=tokens_used,
                    generation_time_ms=generation_time_ms,
                    user_id=user_id,
                )

                _saved_section = await self.save_section(section)

                logger.info(
                    f"Section generated: {section_id} ({word_count} words, "
                    f"{tokens_used} tokens, {generation_time_ms}ms)"
                )

                # Emit section_end event
                yield {
                    "type": "section_end",
                    "section_id": section_id,
                    "heading_id": heading_id,
                    "full_content": full_content,
                    "word_count": word_count,
                    "tokens_used": tokens_used,
                    "generation_time_ms": generation_time_ms,
                    "timestamp": time.time(),
                }

                section_order += 1

                # T-06 ST3: Generate global summary after each section
                if self.summary_service and db:
                    try:
                        summary_metadata = await self.summary_service.generate_global_summary(
                            db=db,
                            outline_id=outline_id,
                            user_id=user_id,
                            api_key=api_key,
                            document_id=document_id,
                            sections_completed=section_order,
                            total_sections=len(sections),
                        )

                        # Emit summary_update event
                        yield {
                            "type": "summary_update",
                            "message_id": str(uuid.uuid4()),
                            "timestamp": time.time(),
                            "data": summary_metadata,
                        }

                        logger.info(
                            f"Summary updated after section {section_order}/{len(sections)}"
                        )

                    except Exception as e:
                        # Non-fatal error: Log warning and continue generation
                        logger.warning(
                            f"Failed to generate summary after section {section_order}: {e}",
                            exc_info=True,
                        )

                        # Emit error event (non-fatal)
                        yield {
                            "type": "error",
                            "error_code": "SUMMARY_GENERATION_FAILED",
                            "error_message": f"Failed to generate summary: {str(e)}",
                            "fatal": False,
                            "timestamp": time.time(),
                        }

            except Exception as e:
                logger.error(f"Section generation failed for {section_id}: {e}", exc_info=True)

                # Emit error event
                yield {
                    "type": "error",
                    "error_code": "SECTION_GENERATION_FAILED",
                    "error_message": f"Failed to generate section '{heading_text}': {str(e)}",
                    "section_id": section_id,
                    "fatal": False,
                    "timestamp": time.time(),
                }

                # Continue to next section (non-fatal error)
                section_order += 1
                continue

        logger.info(f"Section generation complete: {section_order} sections generated")

        # Emit generation_complete event
        # Calculate total statistics (fetch from database if needed)
        # For now, use section_order as total sections count
        yield {
            "type": "generation_complete",
            "message_id": str(uuid.uuid4()),
            "timestamp": time.time(),
            "data": {
                "document_id": str(document_id) if document_id else None,
                "total_sections": section_order,
                "message": "Document generation complete",
            },
        }

    async def stream_section_content(
        self,
        heading_text: str,
        heading_level: int,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
    ) -> AsyncIterator[str]:
        """
        Stream content generation for a single section.

        Args:
            heading_text: Section heading text
            heading_level: Heading level (1-3)
            model: OpenAI model
            temperature: LLM temperature
            max_tokens: Max tokens to generate
            api_key: OpenAI API key

        Yields:
            Content chunks from LLM

        Raises:
            RuntimeError: LLM API error
        """
        # Build prompt for section content
        prompt = self._build_section_prompt(heading_text, heading_level)

        logger.debug(f"Prompt for '{heading_text}': {len(prompt)} chars")

        # Stream content from LLM
        async for chunk in self.streaming_port.stream_content(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
        ):
            yield chunk

    async def save_section(self, section: Section) -> Section:
        """
        Save generated section to database.

        Args:
            section: Section model instance

        Returns:
            Saved section with database ID

        Raises:
            RuntimeError: Database write error
        """
        try:
            saved = await self.repository_port.save_section(section)
            logger.debug(f"Section saved: id={saved.id}, title={saved.section_title}")
            return saved

        except Exception as e:
            logger.error(f"Failed to save section: {e}", exc_info=True)
            raise RuntimeError(f"Database error while saving section: {str(e)}")

    def _parse_outline_to_sections(self, outline: DocumentOutline) -> List[Dict[str, Any]]:
        """
        Parse hierarchical outline into flat list of sections.

        Converts tree structure (H1→H2→H3) into ordered list for sequential generation.

        Args:
            outline: DocumentOutline from T-05

        Returns:
            List of section metadata dicts:
            [
                {"heading_text": "Introduction", "heading_level": 1, "heading_id": "H1"},
                {"heading_text": "Background", "heading_level": 2, "heading_id": "H1.1"},
                ...
            ]
        """
        sections = []

        def traverse(nodes: List[HeadingNode], parent_id: str = ""):
            """Recursively traverse heading tree and collect sections"""
            for idx, node in enumerate(nodes, start=1):
                # Build heading ID (e.g., H1, H1.1, H1.2.1)
                heading_id = f"{parent_id}.{idx}" if parent_id else f"H{idx}"

                # Add section metadata
                sections.append(
                    {
                        "heading_text": node.text,
                        "heading_level": node.level,
                        "heading_id": heading_id,
                    }
                )

                # Recursively process children
                if node.children:
                    traverse(node.children, heading_id)

        # Start traversal from root headings
        traverse(outline.headings)

        return sections

    def _build_section_prompt(self, heading_text: str, heading_level: int) -> str:
        """
        Build LLM prompt for section content generation.

        Args:
            heading_text: Section heading
            heading_level: Heading level (1-3)

        Returns:
            Formatted prompt string
        """
        level_names = {1: "main section", 2: "subsection", 3: "detailed subsection"}
        level_name = level_names.get(heading_level, "section")

        prompt = f"""Write professional, detailed content for the following {level_name}:

Heading: {heading_text}

Requirements:
- Write 2-3 well-structured paragraphs (300-400 words)
- Use clear, professional language
- Provide concrete information and examples
- Focus on the specific topic of this heading
- Do NOT include the heading itself in the content
- Use markdown formatting (bold, lists, code blocks) where appropriate

Content:"""

        return prompt
