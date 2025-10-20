"""
Planner Service Models
T-05: Planner Service (/plan endpoint)

Pydantic models for document outline generation requests and responses.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, validator


class HeadingNode(BaseModel):
    """
    Hierarchical heading node in document outline.

    Represents a single heading (H1, H2, or H3) with optional child nodes.
    """

    level: Literal[1, 2, 3] = Field(..., description="Heading level (1=H1, 2=H2, 3=H3)")
    text: str = Field(..., min_length=1, max_length=200, description="Heading text content")
    children: List["HeadingNode"] = Field(default_factory=list, description="Child headings")

    @validator("text")
    def validate_text_not_empty(cls, v):
        """Ensure heading text is not just whitespace"""
        if not v.strip():
            raise ValueError("Heading text cannot be empty or whitespace only")
        return v.strip()

    @validator("children")
    def validate_children_level(cls, v, values):
        """Ensure children have correct hierarchical level"""
        if "level" not in values:
            return v

        parent_level = values["level"]
        for child in v:
            if child.level != parent_level + 1:
                raise ValueError(
                    f"Invalid hierarchy: H{parent_level} cannot have H{child.level} as direct child. "
                    f"Expected H{parent_level + 1}"
                )
        return v

    class Config:
        schema_extra = {
            "example": {
                "level": 1,
                "text": "Introduction to Machine Learning",
                "children": [
                    {"level": 2, "text": "What is Machine Learning?", "children": []},
                    {
                        "level": 2,
                        "text": "Types of Machine Learning",
                        "children": [
                            {"level": 3, "text": "Supervised Learning", "children": []},
                            {"level": 3, "text": "Unsupervised Learning", "children": []},
                        ],
                    },
                ],
            }
        }


# Enable forward references for recursive model
HeadingNode.model_rebuild()


class DocumentOutline(BaseModel):
    """
    Complete document outline structure.

    Hierarchical representation of document headings (H1-H3).
    """

    headings: List[HeadingNode] = Field(..., min_items=1, description="Top-level headings (H1)")
    total_headings: int = Field(..., ge=1, description="Total number of headings across all levels")

    @validator("headings")
    def validate_root_headings(cls, v):
        """Ensure root headings are all H1 level"""
        for heading in v:
            if heading.level != 1:
                raise ValueError("Root headings must be H1 (level=1)")
        return v

    @validator("total_headings", always=True)
    def calculate_total_headings(cls, v, values):
        """Calculate total heading count from hierarchy"""
        if "headings" not in values:
            return v

        def count_headings(nodes: List[HeadingNode]) -> int:
            count = len(nodes)
            for node in nodes:
                count += count_headings(node.children)
            return count

        calculated_total = count_headings(values["headings"])

        # If total_headings was provided, validate it matches
        if v != calculated_total:
            raise ValueError(
                f"total_headings mismatch: provided {v}, calculated {calculated_total}"
            )

        return calculated_total

    class Config:
        schema_extra = {
            "example": {
                "headings": [
                    {
                        "level": 1,
                        "text": "Introduction",
                        "children": [
                            {"level": 2, "text": "Background", "children": []},
                            {"level": 2, "text": "Motivation", "children": []},
                        ],
                    },
                    {
                        "level": 1,
                        "text": "Methods",
                        "children": [
                            {
                                "level": 2,
                                "text": "Data Collection",
                                "children": [
                                    {"level": 3, "text": "Survey Design", "children": []},
                                    {"level": 3, "text": "Sampling Strategy", "children": []},
                                ],
                            }
                        ],
                    },
                ],
                "total_headings": 7,
            }
        }


class PlanRequest(BaseModel):
    """
    Request payload for document outline generation.

    Contains user prompt and optional configuration parameters.
    """

    prompt: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="User prompt describing desired document content",
    )
    max_headings: Optional[int] = Field(
        default=20, ge=5, le=50, description="Maximum number of headings to generate (default: 20)"
    )
    temperature: Optional[float] = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="LLM temperature for outline generation (default: 0.7)",
    )
    model: Optional[str] = Field(
        default="gpt-4o-mini", description="OpenAI model to use (default: gpt-4o-mini)"
    )

    @validator("prompt")
    def validate_prompt_not_empty(cls, v):
        """Ensure prompt is not just whitespace"""
        if not v.strip():
            raise ValueError("Prompt cannot be empty or whitespace only")
        return v.strip()

    @validator("model")
    def validate_model(cls, v):
        """Validate OpenAI model name"""
        allowed_models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
        if v not in allowed_models:
            raise ValueError(f"Model must be one of: {', '.join(allowed_models)}")
        return v

    class Config:
        schema_extra = {
            "example": {
                "prompt": "Write a comprehensive guide about machine learning for beginners",
                "max_headings": 15,
                "temperature": 0.7,
                "model": "gpt-4o-mini",
            }
        }


class QualityMetrics(BaseModel):
    """
    Quality metrics for generated outline.

    Used to determine if outline meets quality threshold or needs fallback.
    """

    total_headings: int = Field(..., ge=0, description="Total number of headings")
    h1_count: int = Field(..., ge=0, description="Number of H1 headings")
    h2_count: int = Field(..., ge=0, description="Number of H2 headings")
    h3_count: int = Field(..., ge=0, description="Number of H3 headings")
    avg_heading_length: float = Field(..., ge=0.0, description="Average heading text length")
    max_depth: int = Field(..., ge=1, le=3, description="Maximum heading depth (1-3)")
    is_hierarchical: bool = Field(..., description="Whether outline has proper hierarchy")
    quality_score: float = Field(..., ge=0.0, le=1.0, description="Overall quality score (0-1)")

    class Config:
        schema_extra = {
            "example": {
                "total_headings": 12,
                "h1_count": 3,
                "h2_count": 6,
                "h3_count": 3,
                "avg_heading_length": 45.5,
                "max_depth": 3,
                "is_hierarchical": True,
                "quality_score": 0.85,
            }
        }


class PlanResponse(BaseModel):
    """
    Response payload for document outline generation.

    Contains generated outline, quality metrics, and metadata.
    """

    outline: DocumentOutline = Field(..., description="Generated document outline")
    quality_metrics: QualityMetrics = Field(..., description="Outline quality metrics")
    generation_mode: Literal["outline-guided", "single-shot"] = Field(
        ..., description="Generation mode used (outline-guided or fallback single-shot)"
    )
    model_used: str = Field(..., description="OpenAI model used for generation")
    tokens_used: Optional[int] = Field(None, description="Total tokens consumed (if available)")
    generation_time_ms: int = Field(..., ge=0, description="Generation time in milliseconds")

    class Config:
        schema_extra = {
            "example": {
                "outline": {
                    "headings": [
                        {
                            "level": 1,
                            "text": "Introduction to Machine Learning",
                            "children": [
                                {"level": 2, "text": "What is Machine Learning?", "children": []},
                                {"level": 2, "text": "Applications", "children": []},
                            ],
                        }
                    ],
                    "total_headings": 3,
                },
                "quality_metrics": {
                    "total_headings": 3,
                    "h1_count": 1,
                    "h2_count": 2,
                    "h3_count": 0,
                    "avg_heading_length": 32.0,
                    "max_depth": 2,
                    "is_hierarchical": True,
                    "quality_score": 0.75,
                },
                "generation_mode": "outline-guided",
                "model_used": "gpt-4o-mini",
                "tokens_used": 450,
                "generation_time_ms": 850,
            }
        }


class PlanError(BaseModel):
    """
    Error response for planner service.

    Returned when outline generation fails.
    """

    error: str = Field(..., description="Error type code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[str] = Field(None, description="Additional error details")

    class Config:
        schema_extra = {
            "example": {
                "error": "quality_threshold_failed",
                "message": "Generated outline did not meet minimum quality threshold",
                "details": "Quality score: 0.35, Minimum required: 0.50",
            }
        }
