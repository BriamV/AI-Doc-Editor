"""
Chat API data models for OpenAI proxy
GitHub Issue #29: Backend chat proxy endpoint
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any


class ChatMessage(BaseModel):
    """Single chat message in conversation"""

    role: Literal["system", "user", "assistant", "function"] = Field(
        ..., description="Role of the message sender"
    )
    content: str = Field(..., description="Content of the message")
    name: Optional[str] = Field(None, description="Optional name of the sender")


class ChatRequest(BaseModel):
    """Request model for chat completions"""

    messages: List[ChatMessage] = Field(..., description="List of messages in the conversation")
    model: str = Field(default="gpt-4o-mini", description="OpenAI model to use")
    temperature: Optional[float] = Field(
        default=0.7, ge=0.0, le=2.0, description="Sampling temperature"
    )
    max_tokens: Optional[int] = Field(default=None, ge=1, description="Maximum tokens to generate")
    stream: bool = Field(default=False, description="Whether to stream the response")
    top_p: Optional[float] = Field(default=1.0, ge=0.0, le=1.0, description="Nucleus sampling")
    frequency_penalty: Optional[float] = Field(
        default=0.0, ge=-2.0, le=2.0, description="Frequency penalty"
    )
    presence_penalty: Optional[float] = Field(
        default=0.0, ge=-2.0, le=2.0, description="Presence penalty"
    )


class ChatChoice(BaseModel):
    """Single choice in chat completion response"""

    index: int = Field(..., description="Choice index")
    message: ChatMessage = Field(..., description="Generated message")
    finish_reason: Optional[str] = Field(None, description="Reason for finishing")


class ChatUsage(BaseModel):
    """Token usage information"""

    prompt_tokens: int = Field(..., description="Tokens in the prompt")
    completion_tokens: int = Field(..., description="Tokens in the completion")
    total_tokens: int = Field(..., description="Total tokens used")


class ChatResponse(BaseModel):
    """Response model for chat completions"""

    id: str = Field(..., description="Unique completion ID")
    object: str = Field(default="chat.completion", description="Object type")
    created: int = Field(..., description="Unix timestamp")
    model: str = Field(..., description="Model used")
    choices: List[ChatChoice] = Field(..., description="List of completion choices")
    usage: Optional[ChatUsage] = Field(None, description="Token usage information")


class ChatStreamChunk(BaseModel):
    """Single chunk in streaming response"""

    id: str = Field(..., description="Unique completion ID")
    object: str = Field(default="chat.completion.chunk", description="Object type")
    created: int = Field(..., description="Unix timestamp")
    model: str = Field(..., description="Model used")
    choices: List[Dict[str, Any]] = Field(..., description="List of delta choices")
