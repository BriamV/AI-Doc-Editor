"""
Rule-Based Outline Validator
T-05: Planner Service - Hexagonal Architecture

Implements OutlineValidatorPort using rule-based quality checks.
Validates outline structure, hierarchy, and content quality.
"""

import logging
from typing import Dict, Any, List
from app.services.ports.outline_validator_port import OutlineValidatorPort
from app.models.planner import DocumentOutline, QualityMetrics, HeadingNode

logger = logging.getLogger(__name__)


class RuleBasedOutlineValidator(OutlineValidatorPort):
    """
    Rule-based implementation of OutlineValidatorPort.

    Validates outlines using configurable quality rules:
    - Minimum heading count
    - Hierarchical structure
    - Heading text quality (length, content)
    - Balanced structure
    """

    def __init__(
        self,
        min_headings: int = 3,
        min_heading_length: int = 5,
        max_heading_length: int = 150,
        min_avg_heading_length: int = 15,
    ):
        """
        Initialize validator with quality thresholds.

        Args:
            min_headings: Minimum total headings required
            min_heading_length: Minimum characters per heading
            max_heading_length: Maximum characters per heading
            min_avg_heading_length: Minimum average heading length
        """
        self.min_headings = min_headings
        self.min_heading_length = min_heading_length
        self.max_heading_length = max_heading_length
        self.min_avg_heading_length = min_avg_heading_length

    def validate_outline(self, outline: DocumentOutline) -> QualityMetrics:
        """
        Validate document outline and calculate quality metrics.

        Args:
            outline: Document outline to validate

        Returns:
            QualityMetrics with validation results

        Raises:
            ValueError: Invalid outline structure
        """
        logger.info(f"Validating outline with {outline.total_headings} headings")

        # Count headings by level
        counts = self._count_headings_by_level(outline.headings)
        h1_count = counts[1]
        h2_count = counts[2]
        h3_count = counts[3]
        total_headings = outline.total_headings

        # Calculate average heading length
        all_headings = self._collect_all_headings(outline.headings)
        avg_length = (
            sum(len(h.text) for h in all_headings) / len(all_headings) if all_headings else 0.0
        )

        # Calculate max depth
        max_depth = self._calculate_max_depth(outline.headings)

        # Check hierarchical structure
        is_hierarchical = self._validate_hierarchy(outline.headings)

        # Calculate quality score (0.0 - 1.0)
        quality_score = self._calculate_quality_score(
            total_headings=total_headings,
            h1_count=h1_count,
            h2_count=h2_count,
            h3_count=h3_count,
            avg_length=avg_length,
            max_depth=max_depth,
            is_hierarchical=is_hierarchical,
        )

        metrics = QualityMetrics(
            total_headings=total_headings,
            h1_count=h1_count,
            h2_count=h2_count,
            h3_count=h3_count,
            avg_heading_length=round(avg_length, 2),
            max_depth=max_depth,
            is_hierarchical=is_hierarchical,
            quality_score=round(quality_score, 2),
        )

        logger.info(f"Validation complete. Quality score: {metrics.quality_score}")

        return metrics

    def meets_quality_threshold(self, metrics: QualityMetrics, threshold: float = 0.5) -> bool:
        """
        Check if outline meets minimum quality threshold.

        Args:
            metrics: Quality metrics for outline
            threshold: Minimum quality score required (0.0-1.0)

        Returns:
            True if quality score >= threshold
        """
        meets_threshold = metrics.quality_score >= threshold

        logger.info(
            f"Quality threshold check: score={metrics.quality_score}, "
            f"threshold={threshold}, meets={meets_threshold}"
        )

        return meets_threshold

    def get_validation_report(self, metrics: QualityMetrics) -> str:
        """
        Generate human-readable validation report.

        Args:
            metrics: Quality metrics for outline

        Returns:
            Human-readable validation report string
        """
        report_lines = [
            "Outline Quality Report",
            "=" * 50,
            f"Overall Quality Score: {metrics.quality_score:.2f} / 1.00",
            "",
            "Heading Distribution:",
            f"  - H1 headings: {metrics.h1_count}",
            f"  - H2 headings: {metrics.h2_count}",
            f"  - H3 headings: {metrics.h3_count}",
            f"  - Total headings: {metrics.total_headings}",
            "",
            f"Average heading length: {metrics.avg_heading_length:.1f} characters",
            f"Maximum depth: {metrics.max_depth} levels",
            f"Hierarchical structure: {'✓ Valid' if metrics.is_hierarchical else '✗ Invalid'}",
        ]

        # Add quality assessment
        if metrics.quality_score >= 0.8:
            report_lines.append("\nAssessment: Excellent outline quality")
        elif metrics.quality_score >= 0.6:
            report_lines.append("\nAssessment: Good outline quality")
        elif metrics.quality_score >= 0.4:
            report_lines.append("\nAssessment: Acceptable outline quality")
        else:
            report_lines.append("\nAssessment: Poor outline quality - consider regeneration")

        return "\n".join(report_lines)

    def get_quality_issues(self, metrics: QualityMetrics) -> Dict[str, Any]:
        """
        Get specific quality issues detected in outline.

        Args:
            metrics: Quality metrics for outline

        Returns:
            Dict mapping issue type to details
        """
        issues = {
            "missing_hierarchy": not metrics.is_hierarchical,
            "too_few_headings": metrics.total_headings < self.min_headings,
            "unbalanced_structure": self._check_unbalanced_structure(metrics),
            "short_average_headings": metrics.avg_heading_length < self.min_avg_heading_length,
            "shallow_depth": metrics.max_depth < 2,
        }

        logger.debug(f"Quality issues detected: {sum(issues.values())} of {len(issues)}")

        return issues

    def _count_headings_by_level(self, headings: List[HeadingNode]) -> Dict[int, int]:
        """
        Count headings by level (H1, H2, H3).

        Args:
            headings: List of heading nodes

        Returns:
            Dict mapping level to count: {1: 3, 2: 5, 3: 2}
        """
        counts = {1: 0, 2: 0, 3: 0}

        def count_recursive(nodes: List[HeadingNode]):
            for node in nodes:
                counts[node.level] += 1
                count_recursive(node.children)

        count_recursive(headings)
        return counts

    def _collect_all_headings(self, headings: List[HeadingNode]) -> List[HeadingNode]:
        """
        Flatten heading tree into list of all headings.

        Args:
            headings: List of heading nodes

        Returns:
            Flattened list of all heading nodes
        """
        all_headings = []

        def collect_recursive(nodes: List[HeadingNode]):
            for node in nodes:
                all_headings.append(node)
                collect_recursive(node.children)

        collect_recursive(headings)
        return all_headings

    def _calculate_max_depth(self, headings: List[HeadingNode]) -> int:
        """
        Calculate maximum heading depth.

        Args:
            headings: List of heading nodes

        Returns:
            Maximum depth (1, 2, or 3)
        """

        def depth_recursive(nodes: List[HeadingNode]) -> int:
            if not nodes:
                return 0

            max_child_depth = 0
            for node in nodes:
                child_depth = depth_recursive(node.children)
                max_child_depth = max(max_child_depth, child_depth)

            return 1 + max_child_depth

        return depth_recursive(headings)

    def _validate_hierarchy(self, headings: List[HeadingNode]) -> bool:
        """
        Validate proper hierarchical structure.

        Args:
            headings: List of heading nodes

        Returns:
            True if hierarchy is valid (no level skipping)
        """

        def validate_recursive(nodes: List[HeadingNode], expected_level: int) -> bool:
            for node in nodes:
                if node.level != expected_level:
                    return False

                if node.children and not validate_recursive(node.children, expected_level + 1):
                    return False

            return True

        # Root headings must be H1
        return validate_recursive(headings, expected_level=1)

    def _calculate_quality_score(
        self,
        total_headings: int,
        h1_count: int,
        h2_count: int,
        h3_count: int,
        avg_length: float,
        max_depth: int,
        is_hierarchical: bool,
    ) -> float:
        """
        Calculate overall quality score (0.0 - 1.0).

        Weighted scoring:
        - 30%: Heading count adequacy
        - 25%: Hierarchical structure validity
        - 20%: Depth utilization
        - 15%: Heading text quality (length)
        - 10%: Balance between levels

        Args:
            total_headings: Total heading count
            h1_count: H1 heading count
            h2_count: H2 heading count
            h3_count: H3 heading count
            avg_length: Average heading length
            max_depth: Maximum depth
            is_hierarchical: Whether hierarchy is valid

        Returns:
            Quality score (0.0 - 1.0)
        """
        score = 0.0

        # 1. Heading count adequacy (30%)
        if total_headings >= 10:
            score += 0.30
        elif total_headings >= 6:
            score += 0.20
        elif total_headings >= 3:
            score += 0.10

        # 2. Hierarchical structure (25%)
        if is_hierarchical:
            score += 0.25

        # 3. Depth utilization (20%)
        if max_depth == 3:
            score += 0.20  # Full depth usage
        elif max_depth == 2:
            score += 0.15  # Good depth
        elif max_depth == 1:
            score += 0.05  # Minimal depth

        # 4. Heading text quality (15%)
        if avg_length >= 30:
            score += 0.15  # Descriptive headings
        elif avg_length >= 20:
            score += 0.10  # Adequate headings
        elif avg_length >= 10:
            score += 0.05  # Minimal headings

        # 5. Balance between levels (10%)
        if h2_count >= h1_count and h3_count <= h2_count:
            score += 0.10  # Well-balanced
        elif h2_count > 0:
            score += 0.05  # Some structure

        return min(score, 1.0)

    def _check_unbalanced_structure(self, metrics: QualityMetrics) -> bool:
        """
        Check if structure is unbalanced.

        Args:
            metrics: Quality metrics

        Returns:
            True if structure is unbalanced
        """
        # Unbalanced if:
        # - No H2 headings but has H3
        # - H1 count exceeds H2 count significantly
        # - Single H1 with no children

        if metrics.h3_count > 0 and metrics.h2_count == 0:
            return True

        if metrics.h1_count > metrics.h2_count:
            return True

        if metrics.h1_count == 1 and metrics.h2_count == 0:
            return True

        return False
