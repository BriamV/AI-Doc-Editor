"""
Unit Tests for Planner Service
T-05: Planner Service - Domain Logic Tests

Tests for:
- Outline validation logic
- Quality metrics calculation
- Fallback logic
- Error handling
"""

import pytest
from unittest.mock import Mock, AsyncMock

from app.services.planner_service import PlannerService
from app.adapters.rule_based_validator import RuleBasedOutlineValidator
from app.models.planner import (
    PlanRequest,
    DocumentOutline,
    HeadingNode,
)


@pytest.fixture
def mock_llm_port():
    """Mock LLM port for testing"""
    mock = Mock()
    mock.generate_outline = AsyncMock()
    mock.get_supported_models = Mock(return_value=["gpt-4o-mini", "gpt-4o"])
    mock.estimate_tokens = Mock(return_value=100)
    return mock


@pytest.fixture
def validator_port():
    """Real validator port for testing"""
    return RuleBasedOutlineValidator(
        min_headings=3, min_heading_length=5, max_heading_length=150, min_avg_heading_length=15
    )


@pytest.fixture
def planner_service(mock_llm_port, validator_port):
    """Planner service with mocked LLM"""
    return PlannerService(
        llm_port=mock_llm_port,
        validator_port=validator_port,
        quality_threshold=0.5,
        enable_fallback=True,
    )


@pytest.fixture
def sample_outline_high_quality():
    """High-quality outline fixture"""
    # Total: 2 H1 + 4 H2 + 2 H3 = 8 headings
    return DocumentOutline(
        headings=[
            HeadingNode(
                level=1,
                text="Introduction to Machine Learning",
                children=[
                    HeadingNode(level=2, text="What is Machine Learning?", children=[]),
                    HeadingNode(
                        level=2,
                        text="Types of Machine Learning",
                        children=[
                            HeadingNode(level=3, text="Supervised Learning", children=[]),
                            HeadingNode(level=3, text="Unsupervised Learning", children=[]),
                        ],
                    ),
                ],
            ),
            HeadingNode(
                level=1,
                text="Machine Learning Algorithms",
                children=[
                    HeadingNode(level=2, text="Classification Algorithms", children=[]),
                    HeadingNode(level=2, text="Regression Algorithms", children=[]),
                ],
            ),
        ],
        total_headings=8,
    )


@pytest.fixture
def sample_outline_low_quality():
    """Low-quality outline fixture"""
    return DocumentOutline(
        headings=[
            HeadingNode(level=1, text="Intro", children=[]),
            HeadingNode(level=1, text="Body", children=[]),
        ],
        total_headings=2,
    )


class TestOutlineValidation:
    """Test suite for outline validation logic"""

    def test_validate_high_quality_outline(self, validator_port, sample_outline_high_quality):
        """Test validation of high-quality outline"""
        metrics = validator_port.validate_outline(sample_outline_high_quality)

        assert metrics.total_headings == 8
        assert metrics.h1_count == 2
        assert metrics.h2_count == 4
        assert metrics.h3_count == 2
        assert metrics.is_hierarchical is True
        assert metrics.quality_score >= 0.7  # High quality

    def test_validate_low_quality_outline(self, validator_port, sample_outline_low_quality):
        """Test validation of low-quality outline"""
        metrics = validator_port.validate_outline(sample_outline_low_quality)

        assert metrics.total_headings == 2
        assert metrics.h1_count == 2
        assert metrics.h2_count == 0
        assert metrics.is_hierarchical is True
        assert metrics.quality_score < 0.5  # Low quality

    def test_quality_threshold_check(self, validator_port, sample_outline_high_quality):
        """Test quality threshold checking"""
        metrics = validator_port.validate_outline(sample_outline_high_quality)

        assert validator_port.meets_quality_threshold(metrics, threshold=0.5) is True
        assert validator_port.meets_quality_threshold(metrics, threshold=0.9) is False

    def test_quality_issues_detection(self, validator_port, sample_outline_low_quality):
        """Test quality issues detection"""
        metrics = validator_port.validate_outline(sample_outline_low_quality)
        issues = validator_port.get_quality_issues(metrics)

        assert issues["too_few_headings"] is True  # Only 2 headings
        assert issues["shallow_depth"] is True  # No H2 or H3

    def test_validation_report_generation(self, validator_port, sample_outline_high_quality):
        """Test validation report generation"""
        metrics = validator_port.validate_outline(sample_outline_high_quality)
        report = validator_port.get_validation_report(metrics)

        assert "Outline Quality Report" in report
        assert "Overall Quality Score" in report
        assert "Heading Distribution" in report


class TestPlannerService:
    """Test suite for planner service domain logic"""

    @pytest.mark.asyncio
    async def test_generate_plan_high_quality(
        self, planner_service, mock_llm_port, sample_outline_high_quality
    ):
        """Test plan generation with high-quality outline"""
        # Mock LLM to return high-quality outline
        mock_llm_port.generate_outline.return_value = {
            "outline": sample_outline_high_quality.headings,
            "raw_response": '{"headings": [...]}',
            "tokens_used": 450,
            "model_used": "gpt-4o-mini",
        }

        request = PlanRequest(
            prompt="Write a guide about machine learning",
            max_headings=15,
            temperature=0.7,
            model="gpt-4o-mini",
        )

        response = await planner_service.generate_plan(request, api_key="test-key")

        # Verify response
        assert response.generation_mode == "outline-guided"
        assert response.quality_metrics.quality_score >= 0.5
        assert response.model_used == "gpt-4o-mini"
        assert response.tokens_used == 450
        assert response.generation_time_ms >= 0  # Allow 0 for fast mocked calls

    @pytest.mark.asyncio
    async def test_generate_plan_low_quality_with_fallback(
        self,
        planner_service,
        mock_llm_port,
        sample_outline_low_quality,
        sample_outline_high_quality,
    ):
        """Test plan generation with low-quality outline triggering fallback"""
        # First call returns low-quality, second call (fallback) returns high-quality
        mock_llm_port.generate_outline.side_effect = [
            {
                "outline": sample_outline_low_quality.headings,
                "raw_response": '{"headings": [...]}',
                "tokens_used": 200,
                "model_used": "gpt-4o-mini",
            },
            {
                "outline": sample_outline_high_quality.headings,
                "raw_response": '{"headings": [...]}',
                "tokens_used": 300,
                "model_used": "gpt-4o-mini",
            },
        ]

        request = PlanRequest(
            prompt="Write a guide", max_headings=15, temperature=0.7, model="gpt-4o-mini"
        )

        response = await planner_service.generate_plan(request, api_key="test-key")

        # Verify fallback was triggered
        assert response.generation_mode == "single-shot"
        assert mock_llm_port.generate_outline.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_plan_fallback_disabled(
        self, mock_llm_port, validator_port, sample_outline_low_quality
    ):
        """Test plan generation with fallback disabled"""
        # Create service with fallback disabled
        service = PlannerService(
            llm_port=mock_llm_port,
            validator_port=validator_port,
            quality_threshold=0.5,
            enable_fallback=False,
        )

        # Mock LLM to return low-quality outline
        mock_llm_port.generate_outline.return_value = {
            "outline": sample_outline_low_quality.headings,
            "raw_response": '{"headings": [...]}',
            "tokens_used": 200,
            "model_used": "gpt-4o-mini",
        }

        request = PlanRequest(
            prompt="Write a guide", max_headings=15, temperature=0.7, model="gpt-4o-mini"
        )

        response = await service.generate_plan(request, api_key="test-key")

        # Verify fallback was NOT triggered
        assert response.generation_mode == "outline-guided"
        assert response.quality_metrics.quality_score < 0.5
        assert mock_llm_port.generate_outline.call_count == 1

    @pytest.mark.asyncio
    async def test_generate_plan_llm_error_with_fallback(
        self, planner_service, mock_llm_port, sample_outline_high_quality
    ):
        """Test plan generation with LLM error triggering fallback"""
        # First call raises error, second call (fallback) succeeds
        mock_llm_port.generate_outline.side_effect = [
            RuntimeError("OpenAI API error"),
            {
                "outline": sample_outline_high_quality.headings,
                "raw_response": '{"headings": [...]}',
                "tokens_used": 300,
                "model_used": "gpt-4o-mini",
            },
        ]

        request = PlanRequest(
            prompt="Write a guide", max_headings=15, temperature=0.7, model="gpt-4o-mini"
        )

        response = await planner_service.generate_plan(request, api_key="test-key")

        # Verify fallback was triggered after error
        assert response.generation_mode == "single-shot"
        assert mock_llm_port.generate_outline.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_plan_llm_error_no_fallback(self, mock_llm_port, validator_port):
        """Test plan generation with LLM error and fallback disabled"""
        # Create service with fallback disabled
        service = PlannerService(
            llm_port=mock_llm_port,
            validator_port=validator_port,
            quality_threshold=0.5,
            enable_fallback=False,
        )

        # Mock LLM to raise error
        mock_llm_port.generate_outline.side_effect = RuntimeError("OpenAI API error")

        request = PlanRequest(
            prompt="Write a guide", max_headings=15, temperature=0.7, model="gpt-4o-mini"
        )

        # Verify error is raised (no fallback)
        with pytest.raises(RuntimeError, match="OpenAI API error"):
            await service.generate_plan(request, api_key="test-key")


class TestHeadingNodeValidation:
    """Test suite for HeadingNode model validation"""

    def test_valid_heading_node(self):
        """Test creation of valid heading node"""
        node = HeadingNode(level=1, text="Introduction", children=[])
        assert node.level == 1
        assert node.text == "Introduction"
        assert len(node.children) == 0

    def test_invalid_heading_level(self):
        """Test heading node with invalid level"""
        with pytest.raises(ValueError):
            HeadingNode(level=4, text="Invalid", children=[])

    def test_empty_heading_text(self):
        """Test heading node with empty text"""
        with pytest.raises(ValueError, match="cannot be empty"):
            HeadingNode(level=1, text="   ", children=[])

    def test_invalid_hierarchy(self):
        """Test heading node with invalid child hierarchy"""
        with pytest.raises(ValueError, match="Invalid hierarchy"):
            HeadingNode(
                level=1,
                text="Parent",
                children=[HeadingNode(level=3, text="Child", children=[])],  # Skips H2
            )


class TestDocumentOutlineValidation:
    """Test suite for DocumentOutline model validation"""

    def test_valid_document_outline(self, sample_outline_high_quality):
        """Test creation of valid document outline"""
        assert sample_outline_high_quality.total_headings == 8
        assert len(sample_outline_high_quality.headings) == 2

    def test_invalid_root_headings(self):
        """Test document outline with non-H1 root headings"""
        with pytest.raises(ValueError, match="Root headings must be H1"):
            DocumentOutline(
                headings=[HeadingNode(level=2, text="Invalid root", children=[])], total_headings=1
            )

    def test_total_headings_mismatch(self):
        """Test document outline with incorrect total_headings"""
        with pytest.raises(ValueError, match="total_headings mismatch"):
            DocumentOutline(
                headings=[
                    HeadingNode(level=1, text="Heading 1", children=[]),
                    HeadingNode(level=1, text="Heading 2", children=[]),
                ],
                total_headings=5,  # Incorrect count
            )


class TestPlanRequest:
    """Test suite for PlanRequest model validation"""

    def test_valid_plan_request(self):
        """Test creation of valid plan request"""
        request = PlanRequest(
            prompt="Write a guide about Python",
            max_headings=15,
            temperature=0.7,
            model="gpt-4o-mini",
        )
        assert request.prompt == "Write a guide about Python"
        assert request.max_headings == 15
        assert request.temperature == 0.7
        assert request.model == "gpt-4o-mini"

    def test_empty_prompt(self):
        """Test plan request with empty prompt"""
        with pytest.raises(ValueError, match="at least 10 characters"):
            PlanRequest(prompt="   ", max_headings=10)

    def test_invalid_model(self):
        """Test plan request with invalid model"""
        with pytest.raises(ValueError, match="Model must be one of"):
            PlanRequest(prompt="Write a guide", model="invalid-model")

    def test_out_of_range_max_headings(self):
        """Test plan request with out-of-range max_headings"""
        with pytest.raises(ValueError):
            PlanRequest(prompt="Write a guide", max_headings=100)  # > 50

    def test_out_of_range_temperature(self):
        """Test plan request with out-of-range temperature"""
        with pytest.raises(ValueError):
            PlanRequest(prompt="Write a guide", temperature=3.0)  # > 2.0
