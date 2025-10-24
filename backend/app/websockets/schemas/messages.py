"""
WebSocket Message Schemas
T-06 ST1: Pydantic models for all WebSocket messages

Defines the message protocol for WebSocket communication between server and client.
All messages are JSON-serializable Pydantic models with type validation.
"""

from typing import Literal, Optional, Any, Dict
from pydantic import BaseModel, Field


# Server → Client Messages


class ConnectedMessage(BaseModel):
    """
    Sent immediately after WebSocket connection is established.
    Confirms authentication and provides connection metadata.
    """

    type: Literal["connected"] = "connected"
    document_id: str = Field(..., description="Document ID for this WebSocket session")
    user_id: str = Field(..., description="Authenticated user ID")
    message: str = Field(default="WebSocket connection established", description="Status message")
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


class SectionStartMessage(BaseModel):
    """
    Sent when a new section generation begins.
    Provides section metadata before streaming chunks.
    """

    type: Literal["section_start"] = "section_start"
    section_id: str = Field(..., description="Unique section identifier (e.g., 'section_1')")
    heading_id: str = Field(..., description="Heading ID from outline (e.g., 'H1', 'H1.1')")
    heading_text: str = Field(..., description="Section heading text")
    heading_level: int = Field(..., ge=1, le=6, description="Heading level (1-6)")
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


class SectionChunkMessage(BaseModel):
    """
    Sent during section content streaming.
    Contains incremental content chunks from LLM.
    """

    type: Literal["section_chunk"] = "section_chunk"
    section_id: str = Field(..., description="Section identifier this chunk belongs to")
    chunk: str = Field(..., description="Incremental content chunk (markdown text)")
    chunk_index: int = Field(..., ge=0, description="Sequential chunk index (0-based)")
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


class SectionEndMessage(BaseModel):
    """
    Sent when a section generation completes.
    Provides final section metadata and statistics.
    """

    type: Literal["section_end"] = "section_end"
    section_id: str = Field(..., description="Section identifier that completed")
    heading_id: str = Field(..., description="Heading ID from outline")
    full_content: str = Field(..., description="Complete section content (markdown)")
    word_count: int = Field(..., ge=0, description="Final word count")
    tokens_used: int = Field(..., ge=0, description="Total tokens consumed by LLM")
    generation_time_ms: int = Field(..., ge=0, description="Generation time in milliseconds")
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


class SummaryUpdateMessage(BaseModel):
    """
    Sent when document summary is updated.
    Provides aggregated progress across all sections.
    """

    type: Literal["summary_update"] = "summary_update"
    total_sections: int = Field(..., ge=0, description="Total sections in document")
    completed_sections: int = Field(..., ge=0, description="Number of completed sections")
    total_words: int = Field(..., ge=0, description="Total word count across all sections")
    total_tokens: int = Field(..., ge=0, description="Total tokens consumed")
    estimated_time_remaining_ms: Optional[int] = Field(
        None, ge=0, description="Estimated time remaining (milliseconds)"
    )
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


class GenerationCompleteMessage(BaseModel):
    """
    Sent when entire document generation completes.
    Provides final statistics and closes the generation session.
    """

    type: Literal["generation_complete"] = "generation_complete"
    document_id: str = Field(..., description="Completed document ID")
    total_sections: int = Field(..., ge=0, description="Total sections generated")
    total_words: int = Field(..., ge=0, description="Total word count")
    total_tokens: int = Field(..., ge=0, description="Total tokens consumed")
    total_generation_time_ms: int = Field(
        ..., ge=0, description="Total generation time (milliseconds)"
    )
    message: str = Field(default="Document generation complete", description="Completion message")
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


class ErrorMessage(BaseModel):
    """
    Sent when an error occurs during generation.
    Provides error details and optionally closes the connection.
    """

    type: Literal["error"] = "error"
    error_code: str = Field(
        ..., description="Error code (e.g., 'GENERATION_FAILED', 'AUTH_FAILED')"
    )
    error_message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error context")
    section_id: Optional[str] = Field(
        default=None, description="Section ID if error is section-specific"
    )
    fatal: bool = Field(
        default=False, description="If True, connection will close after this message"
    )
    timestamp: float = Field(..., description="Server timestamp (Unix epoch)")


# Client → Server Messages


class ClientActionMessage(BaseModel):
    """
    Sent by client to control generation flow.
    Currently supports pause, resume, cancel actions.
    """

    type: Literal["client_action"] = "client_action"
    action: Literal["pause", "resume", "cancel"] = Field(
        ..., description="Action to perform (pause/resume/cancel generation)"
    )
    section_id: Optional[str] = Field(
        default=None, description="Section ID to apply action to (None = all sections)"
    )
    reason: Optional[str] = Field(default=None, description="Optional reason for action")
    timestamp: float = Field(..., description="Client timestamp (Unix epoch)")


# Type alias for all message types (useful for validation)
WebSocketMessage = (
    ConnectedMessage
    | SectionStartMessage
    | SectionChunkMessage
    | SectionEndMessage
    | SummaryUpdateMessage
    | GenerationCompleteMessage
    | ErrorMessage
    | ClientActionMessage
)
