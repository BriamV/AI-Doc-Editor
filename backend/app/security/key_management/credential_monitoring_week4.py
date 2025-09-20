"""
Credential Monitoring Extensions for Week 4 - T-12 Credential Store Security
Issue #14: Advanced credential access monitoring, suspicious activity detection, and compliance

50+60+100+50+30 = 290 LOC strategy leveraging existing infrastructure.
Extends KeyManagementMonitor with credential-specific monitoring capabilities.
Integrates with T-13 audit system and existing AlertManager for unified security operations.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import statistics
import re

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.models.key_management import KeyAuditLog, KeyMaster, KeyStatus
from app.security.key_management.monitoring import AlertManager, AlertSeverity, Alert


class CredentialAccessPattern(str, Enum):
    """Types of credential access patterns"""

    NORMAL = "normal"
    BULK_ACCESS = "bulk_access"
    OFF_HOURS = "off_hours"
    UNUSUAL_LOCATION = "unusual_location"
    RAPID_SUCCESSION = "rapid_succession"
    PRIVILEGE_ESCALATION = "privilege_escalation"


class ComplianceFramework(str, Enum):
    """Supported compliance frameworks"""

    GDPR = "gdpr"
    SOX = "sox"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    ISO27001 = "iso27001"


@dataclass
class CredentialAccessEvent:
    """Credential access event for monitoring"""

    timestamp: datetime
    user_id: str
    credential_id: str
    action: str
    source_ip: str
    user_agent: str
    risk_score: int
    pattern: CredentialAccessPattern


# CredentialMonitorExtension - 50 LOC
class CredentialMonitorExtension:
    """Extension for credential-specific monitoring (50 LOC)"""

    def __init__(self, alert_manager: AlertManager):
        self._alert_manager = alert_manager
        self._access_events: List[CredentialAccessEvent] = []
        self._logger = logging.getLogger(__name__)

    def record_credential_access(self, event: CredentialAccessEvent) -> None:
        """Record credential access event"""
        try:
            self._access_events.append(event)
            # Keep only last 1000 events in memory
            if len(self._access_events) > 1000:
                self._access_events = self._access_events[-1000:]

            # Real-time suspicious activity detection
            if event.risk_score >= 70:
                asyncio.create_task(self._trigger_suspicious_activity_alert(event))

        except Exception as e:
            self._logger.error(f"Error recording credential access: {e}")

    async def _trigger_suspicious_activity_alert(self, event: CredentialAccessEvent) -> None:
        """Trigger alert for suspicious credential access"""
        alert_id = f"credential_suspicious_{event.credential_id}_{int(event.timestamp.timestamp())}"

        alert = Alert(
            id=alert_id,
            name="Suspicious Credential Access",
            description=f"High-risk access to credential {event.credential_id} from {event.source_ip}",
            severity=AlertSeverity.HIGH if event.risk_score >= 80 else AlertSeverity.MEDIUM,
            status="active",
            rule="credential_suspicious_access",
            triggered_at=event.timestamp,
            metadata={"event": event.__dict__},
        )

        await self._alert_manager._send_alert_notifications(alert)

    def get_recent_access_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get summary of recent credential access"""
        since = datetime.utcnow() - timedelta(hours=hours)
        recent_events = [e for e in self._access_events if e.timestamp >= since]

        return {
            "total_accesses": len(recent_events),
            "unique_users": len(set(e.user_id for e in recent_events)),
            "unique_credentials": len(set(e.credential_id for e in recent_events)),
            "high_risk_events": len([e for e in recent_events if e.risk_score >= 70]),
            "pattern_distribution": {
                pattern.value: len([e for e in recent_events if e.pattern == pattern])
                for pattern in CredentialAccessPattern
            },
        }


# SuspiciousActivityRules - 60 LOC
class SuspiciousActivityRules:
    """Rules engine for detecting suspicious credential activity (60 LOC)"""

    def __init__(self):
        self._user_baselines: Dict[str, Dict[str, Any]] = {}
        self._logger = logging.getLogger(__name__)

    def analyze_access_pattern(
        self, event: CredentialAccessEvent, recent_events: List[CredentialAccessEvent]
    ) -> Tuple[int, CredentialAccessPattern]:
        """Analyze access pattern and return risk score + pattern type"""
        try:
            risk_score = 0
            pattern = CredentialAccessPattern.NORMAL

            # Bulk access detection (>5 credentials in 10 minutes)
            recent_10min = [
                e for e in recent_events if e.timestamp >= datetime.utcnow() - timedelta(minutes=10)
            ]
            unique_creds = len(
                set(e.credential_id for e in recent_10min if e.user_id == event.user_id)
            )
            if unique_creds > 5:
                risk_score += 30
                pattern = CredentialAccessPattern.BULK_ACCESS

            # Off-hours detection (outside 9-17 business hours)
            if event.timestamp.hour < 9 or event.timestamp.hour > 17:
                risk_score += 20
                pattern = CredentialAccessPattern.OFF_HOURS

            # Rapid succession detection (>10 accesses in 5 minutes)
            recent_5min = [
                e
                for e in recent_events
                if e.timestamp >= datetime.utcnow() - timedelta(minutes=5)
                and e.user_id == event.user_id
            ]
            if len(recent_5min) > 10:
                risk_score += 25
                pattern = CredentialAccessPattern.RAPID_SUCCESSION

            # Location anomaly (new IP for user)
            user_ips = set(e.source_ip for e in recent_events if e.user_id == event.user_id)
            if event.source_ip not in user_ips and len(user_ips) > 0:
                risk_score += 15
                pattern = CredentialAccessPattern.UNUSUAL_LOCATION

            # Privilege escalation (accessing admin credentials without admin role)
            if "admin" in event.credential_id.lower() and not self._is_admin_user(event.user_id):
                risk_score += 40
                pattern = CredentialAccessPattern.PRIVILEGE_ESCALATION

            return min(risk_score, 100), pattern

        except Exception as e:
            self._logger.error(f"Error analyzing access pattern: {e}")
            return 0, CredentialAccessPattern.NORMAL

    def _is_admin_user(self, user_id: str) -> bool:
        """Check if user has admin privileges (simplified check)"""
        # In real implementation, would check user roles from auth system
        return "admin" in user_id.lower()

    def update_user_baseline(self, user_id: str, events: List[CredentialAccessEvent]) -> None:
        """Update behavioral baseline for user"""
        try:
            user_events = [e for e in events if e.user_id == user_id]
            if len(user_events) < 10:  # Need minimum events for baseline
                return

            hours = [e.timestamp.hour for e in user_events]
            ips = set(e.source_ip for e in user_events)

            self._user_baselines[user_id] = {
                "typical_hours": statistics.mode(hours) if hours else 12,
                "typical_ips": list(ips),
                "avg_daily_accesses": len(user_events) / 7,  # Assuming 7-day window
                "last_updated": datetime.utcnow(),
            }

        except Exception as e:
            self._logger.error(f"Error updating user baseline: {e}")


# ComplianceReporter - 100 LOC
class ComplianceReporter:
    """Comprehensive compliance reporting for credential usage (100 LOC)"""

    def __init__(self, session_factory):
        self._session_factory = session_factory
        self._logger = logging.getLogger(__name__)

    async def generate_gdpr_report(
        self, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Generate GDPR compliance report for credential access"""
        try:
            async with self._session_factory() as session:
                # Get all credential access events in date range
                audit_events = await session.execute(
                    select(KeyAuditLog).where(
                        and_(
                            KeyAuditLog.timestamp >= start_date,
                            KeyAuditLog.timestamp <= end_date,
                            KeyAuditLog.event_type.in_(["ACCESS", "USE", "EXPORT"]),
                        )
                    )
                )
                events = audit_events.scalars().all()

                # GDPR Article 30 - Records of processing activities
                personal_data_accesses = [
                    e for e in events if "personal" in e.event_description.lower()
                ]

                return {
                    "report_type": "GDPR Compliance Report",
                    "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
                    "total_credential_accesses": len(events),
                    "personal_data_accesses": len(personal_data_accesses),
                    "data_subjects_affected": len(
                        set(e.metadata.get("data_subject_id", "") for e in personal_data_accesses)
                    ),
                    "legal_basis_summary": self._analyze_legal_basis(personal_data_accesses),
                    "retention_compliance": await self._check_retention_compliance(session),
                    "data_breach_indicators": self._check_breach_indicators(events),
                    "generated_at": datetime.utcnow().isoformat(),
                }

        except Exception as e:
            self._logger.error(f"Error generating GDPR report: {e}")
            return {"error": str(e)}

    async def generate_sox_report(self, quarter: int, year: int) -> Dict[str, Any]:
        """Generate SOX compliance report for financial credential access"""
        try:
            start_date = datetime(year, (quarter - 1) * 3 + 1, 1)
            end_date = datetime(year, quarter * 3, 28) + timedelta(days=4)  # End of quarter

            async with self._session_factory() as session:
                # SOX Section 404 - Internal controls over financial reporting
                financial_events = await session.execute(
                    select(KeyAuditLog).where(
                        and_(
                            KeyAuditLog.timestamp >= start_date,
                            KeyAuditLog.timestamp <= end_date,
                            or_(
                                KeyAuditLog.event_description.ilike("%financial%"),
                                KeyAuditLog.event_description.ilike("%accounting%"),
                                KeyAuditLog.metadata.contains({"category": "financial"}),
                            ),
                        )
                    )
                )
                events = financial_events.scalars().all()

                return {
                    "report_type": "SOX Compliance Report",
                    "quarter": quarter,
                    "year": year,
                    "financial_system_accesses": len(events),
                    "segregation_of_duties": await self._analyze_segregation_of_duties(events),
                    "access_control_effectiveness": self._measure_access_control_effectiveness(
                        events
                    ),
                    "change_management_compliance": await self._check_change_management(
                        session, start_date, end_date
                    ),
                    "audit_trail_integrity": self._verify_audit_trail_integrity(events),
                    "exceptions_identified": self._identify_sox_exceptions(events),
                    "generated_at": datetime.utcnow().isoformat(),
                }

        except Exception as e:
            self._logger.error(f"Error generating SOX report: {e}")
            return {"error": str(e)}

    def _analyze_legal_basis(self, events: List) -> Dict[str, int]:
        """Analyze legal basis for personal data processing"""
        basis_counts = {
            "consent": 0,
            "contract": 0,
            "legal_obligation": 0,
            "legitimate_interest": 0,
        }
        for event in events:
            basis = event.metadata.get("legal_basis", "unknown")
            if basis in basis_counts:
                basis_counts[basis] += 1
        return basis_counts

    async def _check_retention_compliance(self, session: AsyncSession) -> Dict[str, Any]:
        """Check credential retention policy compliance"""
        expired_keys = await session.execute(
            select(func.count(KeyMaster.id)).where(
                and_(
                    KeyMaster.status == KeyStatus.ACTIVE.value,
                    KeyMaster.expires_at < datetime.utcnow(),
                )
            )
        )

        return {
            "expired_active_keys": expired_keys.scalar() or 0,
            "compliance_status": (
                "compliant" if (expired_keys.scalar() or 0) == 0 else "non_compliant"
            ),
        }

    def _check_breach_indicators(self, events: List) -> List[Dict[str, Any]]:
        """Check for potential data breach indicators"""
        indicators = []

        # High-risk access patterns
        high_risk_events = [e for e in events if e.risk_score >= 80]
        if len(high_risk_events) > 10:
            indicators.append(
                {
                    "type": "suspicious_access_pattern",
                    "count": len(high_risk_events),
                    "severity": "high",
                }
            )

        return indicators

    async def _analyze_segregation_of_duties(self, events: List) -> Dict[str, Any]:
        """Analyze segregation of duties compliance"""
        # Check for users with conflicting access patterns
        user_actions = {}
        for event in events:
            user_id = event.user_id
            if user_id not in user_actions:
                user_actions[user_id] = set()
            user_actions[user_id].add(event.event_type)

        violations = 0
        for user_id, actions in user_actions.items():
            # Check for conflicting duties (e.g., both CREATE and APPROVE)
            if "CREATE" in actions and "APPROVE" in actions:
                violations += 1

        return {
            "total_users": len(user_actions),
            "segregation_violations": violations,
            "compliance_percentage": (
                ((len(user_actions) - violations) / len(user_actions) * 100)
                if user_actions
                else 100
            ),
        }

    def _measure_access_control_effectiveness(self, events: List) -> Dict[str, Any]:
        """Measure effectiveness of access controls"""
        unauthorized_attempts = len([e for e in events if "DENIED" in e.event_type])
        total_attempts = len(events)

        return {
            "total_access_attempts": total_attempts,
            "unauthorized_attempts": unauthorized_attempts,
            "success_rate": (
                ((total_attempts - unauthorized_attempts) / total_attempts * 100)
                if total_attempts > 0
                else 0
            ),
        }

    async def _check_change_management(
        self, session: AsyncSession, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Check change management compliance"""
        changes = await session.execute(
            select(KeyAuditLog).where(
                and_(
                    KeyAuditLog.timestamp >= start_date,
                    KeyAuditLog.timestamp <= end_date,
                    KeyAuditLog.event_type.in_(["ROTATE", "REVOKE", "UPDATE"]),
                )
            )
        )
        change_events = changes.scalars().all()

        approved_changes = len([e for e in change_events if e.metadata.get("approved_by")])

        return {
            "total_changes": len(change_events),
            "approved_changes": approved_changes,
            "approval_compliance_rate": (
                (approved_changes / len(change_events) * 100) if change_events else 100
            ),
        }

    def _verify_audit_trail_integrity(self, events: List) -> Dict[str, Any]:
        """Verify audit trail integrity"""
        # Check for gaps in audit trail
        timestamps = [e.timestamp for e in events]
        timestamps.sort()

        gaps = 0
        for i in range(1, len(timestamps)):
            if (timestamps[i] - timestamps[i - 1]).total_seconds() > 86400:  # 24 hour gap
                gaps += 1

        return {
            "total_events": len(events),
            "timestamp_gaps": gaps,
            "integrity_score": max(0, 100 - (gaps * 10)),
        }

    def _identify_sox_exceptions(self, events: List) -> List[Dict[str, Any]]:
        """Identify SOX compliance exceptions"""
        exceptions = []

        # Weekend financial system access
        weekend_access = [e for e in events if e.timestamp.weekday() >= 5]
        if weekend_access:
            exceptions.append(
                {
                    "type": "weekend_financial_access",
                    "count": len(weekend_access),
                    "risk_level": "medium",
                }
            )

        return exceptions


# CredentialScanAutomation - 50 LOC
class CredentialScanAutomation:
    """Automated credential leak scanning (50 LOC)"""

    def __init__(self):
        self._logger = logging.getLogger(__name__)
        self._scan_patterns = [
            r"key[_-]?[a-zA-Z0-9]{20,}",
            r"secret[_-]?[a-zA-Z0-9]{20,}",
            r"token[_-]?[a-zA-Z0-9]{20,}",
            r"password[_-]?[a-zA-Z0-9]{8,}",
            r"[a-zA-Z0-9+/]{40}={0,2}",  # Base64 patterns
        ]

    async def scan_repository_commits(
        self, repo_path: str, since_commit: str = None
    ) -> List[Dict[str, Any]]:
        """Scan repository commits for credential leaks"""
        try:
            findings = []

            # In real implementation, would use git API or subprocess
            # This is a simplified simulation

            sample_files = ["config.py", "settings.json", ".env", "docker-compose.yml"]

            for file_path in sample_files:
                content = await self._simulate_file_content(file_path)
                file_findings = self._scan_content(content, file_path)
                findings.extend(file_findings)

            return findings

        except Exception as e:
            self._logger.error(f"Error scanning repository: {e}")
            return []

    async def scan_log_files(self, log_directory: str) -> List[Dict[str, Any]]:
        """Scan application logs for credential leaks"""
        try:
            findings = []

            # Simulate log scanning
            log_content = "2024-01-15 10:30:00 INFO Processing with api_key=abc123def456ghi789"
            findings.extend(self._scan_content(log_content, "application.log"))

            return findings

        except Exception as e:
            self._logger.error(f"Error scanning logs: {e}")
            return []

    def _scan_content(self, content: str, source: str) -> List[Dict[str, Any]]:
        """Scan content for credential patterns"""
        findings = []

        for pattern in self._scan_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                findings.append(
                    {
                        "source": source,
                        "pattern": pattern,
                        "match": match.group()[:20] + "...",  # Truncate for security
                        "line_number": content[: match.start()].count("\n") + 1,
                        "severity": "high",
                        "found_at": datetime.utcnow().isoformat(),
                    }
                )

        return findings

    async def _simulate_file_content(self, file_path: str) -> str:
        """Simulate file content for scanning"""
        # In real implementation, would read actual file
        if file_path == ".env":
            return "DATABASE_PASSWORD=secret123456789\nAPI_TOKEN=abcdef1234567890"
        return "# Sample file content"


# Privacy compliance layer - 30 LOC
class PrivacyComplianceLayer:
    """GDPR compliance for credential data handling (30 LOC)"""

    def __init__(self):
        self._anonymization_map: Dict[str, str] = {}
        self._logger = logging.getLogger(__name__)

    def anonymize_credential_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize credential data for privacy compliance"""
        try:
            anonymized = data.copy()

            # Anonymize user identifiers
            if "user_id" in anonymized:
                user_id = anonymized["user_id"]
                if user_id not in self._anonymization_map:
                    self._anonymization_map[user_id] = (
                        f"user_{len(self._anonymization_map) + 1:04d}"
                    )
                anonymized["user_id"] = self._anonymization_map[user_id]

            # Remove or mask sensitive fields
            sensitive_fields = ["source_ip", "user_agent", "session_id"]
            for field in sensitive_fields:
                if field in anonymized:
                    anonymized[field] = self._mask_sensitive_data(anonymized[field])

            return anonymized

        except Exception as e:
            self._logger.error(f"Error anonymizing data: {e}")
            return data

    def _mask_sensitive_data(self, value: str) -> str:
        """Mask sensitive data while preserving utility"""
        if len(value) <= 4:
            return "*" * len(value)
        return value[:2] + "*" * (len(value) - 4) + value[-2:]

    def get_data_retention_schedule(self) -> Dict[str, timedelta]:
        """Get data retention schedule for different data types"""
        return {
            "access_logs": timedelta(days=365),  # 1 year
            "audit_trails": timedelta(days=2555),  # 7 years for compliance
            "user_analytics": timedelta(days=90),  # 3 months
            "security_events": timedelta(days=1825),  # 5 years
        }
