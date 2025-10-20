"""
Outline Validator Port Interface
T-05: Planner Service - Hexagonal Architecture

Defines the contract for outline quality validation.
Adapters implement this interface to provide different validation strategies.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.planner import DocumentOutline, QualityMetrics


class OutlineValidatorPort(ABC):
    """
    Port interface for document outline quality validation.

    This interface isolates validation logic from specific implementation strategies.
    Adapters can implement rule-based, ML-based, or hybrid validation approaches.
    """

    @abstractmethod
    def validate_outline(self, outline: DocumentOutline) -> QualityMetrics:
        """
        Validate document outline and calculate quality metrics.

        Args:
            outline: Document outline to validate

        Returns:
            QualityMetrics with validation results and quality score

        Raises:
            ValueError: Invalid outline structure
        """
        pass

    @abstractmethod
    def meets_quality_threshold(self, metrics: QualityMetrics, threshold: float = 0.5) -> bool:
        """
        Check if outline meets minimum quality threshold.

        Args:
            metrics: Quality metrics for outline
            threshold: Minimum quality score required (0.0-1.0, default: 0.5)

        Returns:
            True if quality score >= threshold
        """
        pass

    @abstractmethod
    def get_validation_report(self, metrics: QualityMetrics) -> str:
        """
        Generate human-readable validation report.

        Args:
            metrics: Quality metrics for outline

        Returns:
            Human-readable validation report string
        """
        pass

    @abstractmethod
    def get_quality_issues(self, metrics: QualityMetrics) -> Dict[str, Any]:
        """
        Get specific quality issues detected in outline.

        Args:
            metrics: Quality metrics for outline

        Returns:
            Dict mapping issue type to details:
                - "missing_hierarchy": bool
                - "too_few_headings": bool
                - "unbalanced_structure": bool
                - "short_headings": List[str]
        """
        pass
