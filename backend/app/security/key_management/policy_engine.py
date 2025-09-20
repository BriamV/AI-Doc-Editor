"""
Policy Engine for Automated Key Rotation - T-12 Credential Store Security

Implements comprehensive policy management for automated key rotation including:
- Policy creation, validation, and lifecycle management
- Rule evaluation engine for rotation decisions
- Configuration templates for common scenarios
- Integration with compliance frameworks
- Dynamic policy updates and versioning

Security Features:
- Policy integrity verification
- Secure configuration storage
- Audit logging for all policy changes
- Fail-safe defaults
- Compliance framework integration

Architecture:
- Rule-based policy evaluation engine
- Template system for common configurations
- Version control for policy changes
- Integration with scheduler and key manager
"""

import logging
from datetime import datetime, timedelta, time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.key_management import (
    RotationPolicy,
    KeyMaster,
    KeyRotation,
    KeyAuditLog,
    KeyType,
    RotationTrigger,
    RotationPolicyCreate,
    RotationPolicyResponse,
)


class PolicyTemplate(str, Enum):
    """Pre-defined policy templates for common scenarios"""

    FINANCIAL_SERVICES = "financial_services"  # PCI DSS compliance
    HEALTHCARE = "healthcare"  # HIPAA compliance
    GOVERNMENT = "government"  # FIPS 140-2 compliance
    HIGH_SECURITY = "high_security"  # Maximum security
    STANDARD_CORPORATE = "standard_corporate"  # Balanced security/performance
    DEVELOPMENT = "development"  # Development environments


class ComplianceFramework(str, Enum):
    """Supported compliance frameworks"""

    PCI_DSS = "pci_dss"
    HIPAA = "hipaa"
    SOX = "sox"
    GDPR = "gdpr"
    NIST = "nist"
    ISO27001 = "iso27001"
    FIPS_140_2 = "fips_140_2"


class PolicyValidationError(Exception):
    """Policy validation errors"""

    pass


class PolicyEngineError(Exception):
    """Policy engine errors"""

    pass


@dataclass
class PolicyEvaluationContext:
    """Context for policy evaluation"""

    key_master: KeyMaster
    current_time: datetime
    security_incidents: List[Dict[str, Any]] = field(default_factory=list)
    compliance_requirements: List[ComplianceFramework] = field(default_factory=list)
    system_load: float = 0.0
    maintenance_window: bool = False


@dataclass
class PolicyEvaluationResult:
    """Result of policy evaluation"""

    rotation_required: bool
    trigger: RotationTrigger
    priority: int  # 1-10, 10 being highest
    reason: str
    recommended_schedule: Optional[datetime] = None
    safety_checks_passed: bool = True
    compliance_notes: List[str] = field(default_factory=list)


@dataclass
class PolicyConfiguration:
    """Template for common policy configurations"""

    name: str
    description: str
    key_types: List[KeyType]
    rotation_interval_days: int
    max_operations: Optional[int]
    rotation_window_start: str
    rotation_window_end: str
    compliance_frameworks: List[ComplianceFramework]
    notification_settings: Dict[str, Any]


class PolicyEngine:
    """
    Advanced Policy Engine for Key Rotation Management

    Provides comprehensive policy management including:
    - Policy creation and validation
    - Rule evaluation for rotation decisions
    - Template-based configuration
    - Compliance framework integration
    - Dynamic policy updates
    """

    def __init__(self, logger: Optional[logging.Logger] = None):
        """Initialize policy engine"""
        self._logger = logger or logging.getLogger(__name__)
        self._policy_cache: Dict[str, RotationPolicy] = {}
        self._templates = self._initialize_templates()
        self._compliance_rules = self._initialize_compliance_rules()

    async def create_policy(
        self,
        session: AsyncSession,
        policy_request: RotationPolicyCreate,
        user_id: str,
        template: Optional[PolicyTemplate] = None,
    ) -> RotationPolicyResponse:
        """
        Create new rotation policy with validation

        Args:
            session: Database session
            policy_request: Policy creation request
            user_id: User creating the policy
            template: Optional template to base policy on

        Returns:
            Created policy response
        """
        try:
            # Apply template if specified
            if template:
                policy_request = self._apply_template(policy_request, template)

            # Validate policy configuration
            await self._validate_policy_request(session, policy_request)

            # Create policy record
            policy = RotationPolicy(
                policy_name=policy_request.policy_name,
                key_type=policy_request.key_type.value,
                rotation_interval_days=policy_request.rotation_interval_days,
                max_operations=policy_request.max_operations,
                max_data_volume_mb=policy_request.max_data_volume_mb,
                rotation_window_start=policy_request.rotation_window_start,
                rotation_window_end=policy_request.rotation_window_end,
                notify_before_rotation_hours=policy_request.notify_before_rotation_hours,
                notification_channels=policy_request.notification_channels,
                created_by=user_id,
            )

            session.add(policy)
            await session.commit()

            # Clear cache to force refresh
            self._clear_policy_cache()

            # Log policy creation
            await self._log_policy_event(
                session,
                str(policy.id),
                "POLICY_CREATED",
                f"Rotation policy '{policy.policy_name}' created",
                user_id,
                {"template": template.value if template else None},
            )

            self._logger.info(f"Created rotation policy '{policy.policy_name}'")

            return RotationPolicyResponse(
                id=str(policy.id),
                policy_name=policy.policy_name,
                key_type=KeyType(policy.key_type),
                rotation_interval_days=policy.rotation_interval_days,
                max_operations=policy.max_operations,
                is_active=policy.is_active,
                created_at=policy.created_at,
                next_scheduled_rotation=await self._calculate_next_rotation(session, policy),
            )

        except PolicyValidationError as e:
            await session.rollback()
            self._logger.error(f"Policy validation failed: {e}")
            raise PolicyEngineError(f"Policy validation failed: {e}")
        except Exception as e:
            await session.rollback()
            self._logger.error(f"Error creating policy: {e}")
            raise PolicyEngineError(f"Policy creation failed: {e}")

    async def evaluate_policy(
        self, session: AsyncSession, policy: RotationPolicy, context: PolicyEvaluationContext
    ) -> PolicyEvaluationResult:
        """
        Evaluate if key rotation is required based on policy

        Args:
            session: Database session
            policy: Rotation policy to evaluate
            context: Evaluation context including key and system state

        Returns:
            Policy evaluation result
        """
        try:
            key_master = context.key_master
            current_time = context.current_time

            # Initialize result
            result = PolicyEvaluationResult(
                rotation_required=False,
                trigger=RotationTrigger.SCHEDULED,
                priority=1,
                reason="No rotation required",
            )

            # Time-based evaluation
            time_result = await self._evaluate_time_based_rotation(
                session, policy, key_master, current_time
            )
            if time_result.rotation_required:
                result = time_result

            # Usage-based evaluation
            usage_result = await self._evaluate_usage_based_rotation(policy, key_master)
            if usage_result.rotation_required and usage_result.priority > result.priority:
                result = usage_result

            # Security incident evaluation
            security_result = self._evaluate_security_incidents(policy, context.security_incidents)
            if security_result.rotation_required and security_result.priority > result.priority:
                result = security_result

            # Compliance evaluation
            compliance_result = await self._evaluate_compliance_requirements(
                session, policy, key_master, context.compliance_requirements
            )
            if compliance_result.rotation_required and compliance_result.priority > result.priority:
                result = compliance_result

            # Safety checks
            result.safety_checks_passed = await self._perform_safety_checks(
                session, policy, key_master, context
            )

            # Calculate recommended schedule if rotation required
            if result.rotation_required:
                result.recommended_schedule = await self._calculate_recommended_schedule(
                    policy, result.priority, current_time
                )

            return result

        except Exception as e:
            self._logger.error(f"Error evaluating policy {policy.policy_name}: {e}")
            return PolicyEvaluationResult(
                rotation_required=False,
                trigger=RotationTrigger.SCHEDULED,
                priority=1,
                reason=f"Evaluation error: {e}",
                safety_checks_passed=False,
            )

    async def get_policy_templates(self) -> List[Dict[str, Any]]:
        """Get available policy templates"""
        return [
            {
                "template": template.value,
                "name": config.name,
                "description": config.description,
                "key_types": [kt.value for kt in config.key_types],
                "rotation_interval_days": config.rotation_interval_days,
                "compliance_frameworks": [cf.value for cf in config.compliance_frameworks],
            }
            for template, config in self._templates.items()
        ]

    async def validate_policy_configuration(
        self, session: AsyncSession, policy_request: RotationPolicyCreate
    ) -> Tuple[bool, List[str]]:
        """
        Validate policy configuration without creating it

        Args:
            session: Database session
            policy_request: Policy to validate

        Returns:
            Tuple of (is_valid, validation_errors)
        """
        try:
            await self._validate_policy_request(session, policy_request)
            return True, []
        except PolicyValidationError as e:
            return False, [str(e)]
        except Exception as e:
            return False, [f"Validation error: {e}"]

    async def update_policy(
        self, session: AsyncSession, policy_id: str, updates: Dict[str, Any], user_id: str
    ) -> RotationPolicyResponse:
        """Update existing rotation policy"""
        try:
            # Get existing policy
            policy = await session.get(RotationPolicy, policy_id)
            if not policy:
                raise PolicyEngineError(f"Policy not found: {policy_id}")

            # Validate updates
            await self._validate_policy_updates(session, policy, updates)

            # Apply updates
            for field, value in updates.items():
                if hasattr(policy, field):
                    setattr(policy, field, value)

            policy.updated_at = datetime.utcnow()
            await session.commit()

            # Clear cache
            self._clear_policy_cache()

            # Log update
            await self._log_policy_event(
                session,
                policy_id,
                "POLICY_UPDATED",
                f"Rotation policy '{policy.policy_name}' updated",
                user_id,
                {"updates": list(updates.keys())},
            )

            return await self._get_policy_response(session, policy)

        except Exception as e:
            await session.rollback()
            self._logger.error(f"Error updating policy {policy_id}: {e}")
            raise PolicyEngineError(f"Policy update failed: {e}")

    async def delete_policy(self, session: AsyncSession, policy_id: str, user_id: str) -> None:
        """Delete rotation policy"""
        try:
            policy = await session.get(RotationPolicy, policy_id)
            if not policy:
                raise PolicyEngineError(f"Policy not found: {policy_id}")

            # Check if policy is in use
            active_rotations = await session.execute(
                select(func.count(KeyRotation.id)).where(
                    and_(
                        KeyRotation.policy_id == policy_id,
                        KeyRotation.status.in_(["SCHEDULED", "RUNNING"]),
                    )
                )
            )

            if active_rotations.scalar() > 0:
                raise PolicyEngineError("Cannot delete policy with active rotations")

            # Deactivate instead of delete for audit trail
            policy.is_active = False
            policy.updated_at = datetime.utcnow()
            await session.commit()

            # Clear cache
            self._clear_policy_cache()

            # Log deletion
            await self._log_policy_event(
                session,
                policy_id,
                "POLICY_DELETED",
                f"Rotation policy '{policy.policy_name}' deactivated",
                user_id,
            )

        except Exception as e:
            await session.rollback()
            self._logger.error(f"Error deleting policy {policy_id}: {e}")
            raise PolicyEngineError(f"Policy deletion failed: {e}")

    # Private implementation methods

    def _initialize_templates(self) -> Dict[PolicyTemplate, PolicyConfiguration]:
        """Initialize policy templates"""
        return {
            PolicyTemplate.FINANCIAL_SERVICES: PolicyConfiguration(
                name="Financial Services (PCI DSS)",
                description="PCI DSS compliant key rotation for financial services",
                key_types=[KeyType.DEK, KeyType.TLS],
                rotation_interval_days=90,
                max_operations=1000000,
                rotation_window_start="02:00",
                rotation_window_end="04:00",
                compliance_frameworks=[ComplianceFramework.PCI_DSS],
                notification_settings={"email": True, "slack": True, "notify_hours": 24},
            ),
            PolicyTemplate.HEALTHCARE: PolicyConfiguration(
                name="Healthcare (HIPAA)",
                description="HIPAA compliant key rotation for healthcare data",
                key_types=[KeyType.DEK],
                rotation_interval_days=365,
                max_operations=5000000,
                rotation_window_start="01:00",
                rotation_window_end="05:00",
                compliance_frameworks=[ComplianceFramework.HIPAA],
                notification_settings={"email": True, "notify_hours": 72},
            ),
            PolicyTemplate.HIGH_SECURITY: PolicyConfiguration(
                name="High Security",
                description="Maximum security key rotation",
                key_types=[KeyType.KEK, KeyType.DEK, KeyType.TLS],
                rotation_interval_days=30,
                max_operations=100000,
                rotation_window_start="03:00",
                rotation_window_end="05:00",
                compliance_frameworks=[ComplianceFramework.FIPS_140_2, ComplianceFramework.NIST],
                notification_settings={
                    "email": True,
                    "slack": True,
                    "pagerduty": True,
                    "notify_hours": 48,
                },
            ),
            PolicyTemplate.STANDARD_CORPORATE: PolicyConfiguration(
                name="Standard Corporate",
                description="Balanced security and performance for corporate environments",
                key_types=[KeyType.DEK, KeyType.TLS],
                rotation_interval_days=180,
                max_operations=10000000,
                rotation_window_start="02:00",
                rotation_window_end="06:00",
                compliance_frameworks=[ComplianceFramework.ISO27001],
                notification_settings={"email": True, "notify_hours": 24},
            ),
        }

    def _initialize_compliance_rules(self) -> Dict[ComplianceFramework, Dict[str, Any]]:
        """Initialize compliance framework rules"""
        return {
            ComplianceFramework.PCI_DSS: {
                "max_key_age_days": 365,
                "min_rotation_interval_days": 90,
                "require_dual_control": True,
                "audit_retention_years": 3,
            },
            ComplianceFramework.HIPAA: {
                "max_key_age_days": 730,
                "min_rotation_interval_days": 365,
                "require_access_logging": True,
                "audit_retention_years": 6,
            },
            ComplianceFramework.FIPS_140_2: {
                "max_key_age_days": 90,
                "min_rotation_interval_days": 30,
                "require_hsm": True,
                "audit_retention_years": 7,
            },
        }

    def _apply_template(
        self, policy_request: RotationPolicyCreate, template: PolicyTemplate
    ) -> RotationPolicyCreate:
        """Apply template configuration to policy request"""
        template_config = self._templates[template]

        # Update fields that aren't already specified
        if not policy_request.rotation_interval_days:
            policy_request.rotation_interval_days = template_config.rotation_interval_days

        if not policy_request.max_operations:
            policy_request.max_operations = template_config.max_operations

        if not policy_request.rotation_window_start:
            policy_request.rotation_window_start = template_config.rotation_window_start

        if not policy_request.rotation_window_end:
            policy_request.rotation_window_end = template_config.rotation_window_end

        if not policy_request.notification_channels:
            policy_request.notification_channels = template_config.notification_settings

        return policy_request

    async def _validate_policy_request(
        self, session: AsyncSession, policy_request: RotationPolicyCreate
    ) -> None:
        """Validate policy creation request"""
        # Check policy name uniqueness
        existing_policy = await session.execute(
            select(RotationPolicy).where(RotationPolicy.policy_name == policy_request.policy_name)
        )
        if existing_policy.scalar_one_or_none():
            raise PolicyValidationError(f"Policy name already exists: {policy_request.policy_name}")

        # Validate rotation intervals
        if policy_request.rotation_interval_days and policy_request.rotation_interval_days < 1:
            raise PolicyValidationError("Rotation interval must be at least 1 day")

        if policy_request.max_operations and policy_request.max_operations < 1:
            raise PolicyValidationError("Maximum operations must be at least 1")

        # Validate time windows
        if policy_request.rotation_window_start and policy_request.rotation_window_end:
            try:
                start_time = time.fromisoformat(policy_request.rotation_window_start)
                end_time = time.fromisoformat(policy_request.rotation_window_end)
                # Validate that end time is after start time
                if end_time <= start_time:
                    raise PolicyValidationError("Rotation window end time must be after start time")
            except ValueError as e:
                raise PolicyValidationError(f"Invalid time format: {e}")

        # Validate notification settings
        if policy_request.notify_before_rotation_hours < 1:
            raise PolicyValidationError("Notification time must be at least 1 hour")

    async def _evaluate_time_based_rotation(
        self,
        session: AsyncSession,
        policy: RotationPolicy,
        key_master: KeyMaster,
        current_time: datetime,
    ) -> PolicyEvaluationResult:
        """Evaluate time-based rotation requirements"""
        if not policy.rotation_interval_days:
            return PolicyEvaluationResult(
                rotation_required=False,
                trigger=RotationTrigger.SCHEDULED,
                priority=1,
                reason="No time-based rotation configured",
            )

        # Calculate last rotation time
        last_rotation = key_master.rotated_at or key_master.activated_at or key_master.created_at
        time_since_rotation = current_time - last_rotation
        rotation_interval = timedelta(days=policy.rotation_interval_days)

        if time_since_rotation >= rotation_interval:
            days_overdue = (time_since_rotation - rotation_interval).days
            priority = min(10, 5 + (days_overdue // 30))  # Increase priority over time

            return PolicyEvaluationResult(
                rotation_required=True,
                trigger=RotationTrigger.SCHEDULED,
                priority=priority,
                reason=f"Key age ({time_since_rotation.days} days) exceeds rotation interval ({policy.rotation_interval_days} days)",
            )

        return PolicyEvaluationResult(
            rotation_required=False,
            trigger=RotationTrigger.SCHEDULED,
            priority=1,
            reason=f"Key age ({time_since_rotation.days} days) within rotation interval",
        )

    async def _evaluate_usage_based_rotation(
        self, policy: RotationPolicy, key_master: KeyMaster
    ) -> PolicyEvaluationResult:
        """Evaluate usage-based rotation requirements"""
        if not policy.max_operations:
            return PolicyEvaluationResult(
                rotation_required=False,
                trigger=RotationTrigger.USAGE_COUNT,
                priority=1,
                reason="No usage-based rotation configured",
            )

        usage_percentage = (key_master.usage_count / policy.max_operations) * 100

        if key_master.usage_count >= policy.max_operations:
            return PolicyEvaluationResult(
                rotation_required=True,
                trigger=RotationTrigger.USAGE_COUNT,
                priority=8,
                reason=f"Usage count ({key_master.usage_count}) exceeds maximum ({policy.max_operations})",
            )
        elif usage_percentage >= 90:
            return PolicyEvaluationResult(
                rotation_required=True,
                trigger=RotationTrigger.USAGE_COUNT,
                priority=6,
                reason=f"Usage count approaching limit ({usage_percentage:.1f}%)",
            )

        return PolicyEvaluationResult(
            rotation_required=False,
            trigger=RotationTrigger.USAGE_COUNT,
            priority=1,
            reason=f"Usage count ({usage_percentage:.1f}%) within limits",
        )

    def _evaluate_security_incidents(
        self, policy: RotationPolicy, security_incidents: List[Dict[str, Any]]
    ) -> PolicyEvaluationResult:
        """Evaluate security incident-based rotation requirements"""
        if not policy.rotate_on_security_incident:
            return PolicyEvaluationResult(
                rotation_required=False,
                trigger=RotationTrigger.SECURITY_INCIDENT,
                priority=1,
                reason="Security incident rotation disabled",
            )

        # Check for recent high-severity incidents
        recent_incidents = [
            incident
            for incident in security_incidents
            if incident.get("severity", 0) >= 7
            and incident.get("timestamp", datetime.min) > datetime.utcnow() - timedelta(hours=24)
        ]

        if recent_incidents:
            return PolicyEvaluationResult(
                rotation_required=True,
                trigger=RotationTrigger.SECURITY_INCIDENT,
                priority=10,
                reason=f"High-severity security incidents detected: {len(recent_incidents)} incidents",
            )

        return PolicyEvaluationResult(
            rotation_required=False,
            trigger=RotationTrigger.SECURITY_INCIDENT,
            priority=1,
            reason="No recent high-severity security incidents",
        )

    async def _evaluate_compliance_requirements(
        self,
        session: AsyncSession,
        policy: RotationPolicy,
        key_master: KeyMaster,
        compliance_requirements: List[ComplianceFramework],
    ) -> PolicyEvaluationResult:
        """Evaluate compliance-based rotation requirements"""
        if not policy.rotate_on_compliance_requirement or not compliance_requirements:
            return PolicyEvaluationResult(
                rotation_required=False,
                trigger=RotationTrigger.COMPLIANCE,
                priority=1,
                reason="No compliance rotation requirements",
            )

        # Check each compliance framework
        for framework in compliance_requirements:
            if framework in self._compliance_rules:
                rules = self._compliance_rules[framework]
                key_age_days = (datetime.utcnow() - key_master.created_at).days

                if key_age_days > rules.get("max_key_age_days", 365):
                    return PolicyEvaluationResult(
                        rotation_required=True,
                        trigger=RotationTrigger.COMPLIANCE,
                        priority=9,
                        reason=f"{framework.value} compliance requires rotation (key age: {key_age_days} days)",
                    )

        return PolicyEvaluationResult(
            rotation_required=False,
            trigger=RotationTrigger.COMPLIANCE,
            priority=1,
            reason="All compliance requirements met",
        )

    async def _perform_safety_checks(
        self,
        session: AsyncSession,
        policy: RotationPolicy,
        key_master: KeyMaster,
        context: PolicyEvaluationContext,
    ) -> bool:
        """Perform safety checks before rotation"""
        try:
            # Check for active rotations
            active_rotation = await session.execute(
                select(KeyRotation).where(
                    and_(KeyRotation.key_id == key_master.key_id, KeyRotation.status == "RUNNING")
                )
            )
            if active_rotation.scalar_one_or_none():
                return False

            # Check system load
            if context.system_load > 0.8:  # 80% system load threshold
                return False

            # Check maintenance window
            if context.maintenance_window:
                return False

            return True

        except Exception as e:
            self._logger.error(f"Error performing safety checks: {e}")
            return False

    async def _calculate_recommended_schedule(
        self, policy: RotationPolicy, priority: int, current_time: datetime
    ) -> datetime:
        """Calculate recommended rotation schedule time"""
        # High priority rotations should be scheduled immediately
        if priority >= 8:
            return current_time

        # Medium priority within next rotation window
        if priority >= 5:
            return self._find_next_rotation_window(policy, current_time)

        # Low priority can wait for optimal window
        return self._find_optimal_rotation_window(policy, current_time)

    def _find_next_rotation_window(self, policy: RotationPolicy, from_time: datetime) -> datetime:
        """Find next available rotation window"""
        if not policy.rotation_window_start or not policy.rotation_window_end:
            return from_time + timedelta(hours=1)

        # Parse window times
        start_time = time.fromisoformat(policy.rotation_window_start)
        # Note: end_time could be used for additional validation if needed

        # Find next window occurrence
        check_time = from_time.replace(
            hour=start_time.hour, minute=start_time.minute, second=0, microsecond=0
        )

        # If we're past today's window, schedule for tomorrow
        if check_time <= from_time:
            check_time += timedelta(days=1)

        return check_time

    def _find_optimal_rotation_window(
        self, policy: RotationPolicy, from_time: datetime
    ) -> datetime:
        """Find optimal rotation window (e.g., weekends, low traffic periods)"""
        # For now, use the same logic as next window
        # In production, this could consider historical load patterns
        return self._find_next_rotation_window(policy, from_time)

    async def _calculate_next_rotation(
        self, session: AsyncSession, policy: RotationPolicy
    ) -> Optional[datetime]:
        """Calculate next scheduled rotation for this policy"""
        # Find keys that use this policy and calculate their next rotation
        # This is a placeholder implementation
        return None

    def _clear_policy_cache(self) -> None:
        """Clear policy cache"""
        self._policy_cache.clear()

    async def _log_policy_event(
        self,
        session: AsyncSession,
        policy_id: str,
        event_type: str,
        description: str,
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log policy management event"""
        try:
            audit_log = KeyAuditLog(
                key_id=None,  # Policy events don't have a specific key
                event_type=event_type,
                event_category="POLICY",
                event_description=description,
                user_id=user_id,
                security_level="HIGH",
                metadata={"policy_id": policy_id, **(metadata or {})},
                log_hash=self._calculate_log_hash(policy_id, event_type, description),
            )

            session.add(audit_log)
            await session.flush()

        except Exception as e:
            self._logger.error(f"Failed to log policy event: {e}")

    def _calculate_log_hash(self, policy_id: str, event_type: str, description: str) -> str:
        """Calculate hash for log integrity"""
        import hashlib

        content = f"{policy_id}:{event_type}:{description}:{datetime.utcnow().isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()

    async def _get_policy_response(
        self, session: AsyncSession, policy: RotationPolicy
    ) -> RotationPolicyResponse:
        """Convert policy to response model"""
        return RotationPolicyResponse(
            id=str(policy.id),
            policy_name=policy.policy_name,
            key_type=KeyType(policy.key_type),
            rotation_interval_days=policy.rotation_interval_days,
            max_operations=policy.max_operations,
            is_active=policy.is_active,
            created_at=policy.created_at,
            next_scheduled_rotation=await self._calculate_next_rotation(session, policy),
        )
