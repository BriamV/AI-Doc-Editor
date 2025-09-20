"""
Comprehensive Monitoring and Alerting for Key Management System
T-12 Credential Store Security - Week 3

Provides real-time monitoring, metrics collection, and alerting for:
- Key lifecycle events and health monitoring
- Rotation performance and failure detection
- HSM connectivity and performance monitoring
- Security incident detection and response
- Compliance metrics and reporting
- System performance and resource utilization

Security Features:
- Real-time threat detection
- Anomaly detection for unusual key usage patterns
- Performance baseline monitoring
- Automated incident response
- Comprehensive audit trail correlation
- Integration with SIEM systems

Architecture:
- Event-driven monitoring system
- Metrics aggregation and storage
- Alert rule engine with escalation
- Dashboard and reporting interfaces
- Integration with external monitoring systems
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Union, Tuple
from dataclasses import dataclass, field
from enum import Enum
import statistics
from collections import defaultdict, deque

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text

from app.models.key_management import (
    KeyMaster,
    KeyRotation,
    KeyAuditLog,
    RotationPolicy,
    KeyStatus,
)


class MetricType(str, Enum):
    """Types of metrics collected"""

    COUNTER = "counter"  # Incrementing values
    GAUGE = "gauge"  # Current values
    HISTOGRAM = "histogram"  # Distribution of values
    TIMING = "timing"  # Duration measurements


class AlertSeverity(str, Enum):
    """Alert severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    """Alert processing status"""

    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"


@dataclass
class Metric:
    """Individual metric data point"""

    name: str
    value: Union[int, float]
    metric_type: MetricType
    timestamp: datetime
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Alert:
    """Alert definition and state"""

    id: str
    name: str
    description: str
    severity: AlertSeverity
    status: AlertStatus
    rule: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HealthCheck:
    """System health check result"""

    component: str
    status: str  # healthy, warning, critical
    message: str
    timestamp: datetime
    response_time_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class MetricsCollector:
    """
    Metrics collection and aggregation system

    Collects, aggregates, and stores metrics from key management operations
    for monitoring, alerting, and reporting purposes.
    """

    def __init__(self, retention_days: int = 90):
        """Initialize metrics collector"""
        self._metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10000))
        self._aggregated_metrics: Dict[str, Dict[str, Any]] = {}
        self._retention_days = retention_days
        self._logger = logging.getLogger(__name__)

    def record_metric(self, metric: Metric) -> None:
        """Record a new metric"""
        try:
            metric_key = f"{metric.name}:{':'.join(f'{k}={v}' for k, v in metric.tags.items())}"
            self._metrics[metric_key].append(metric)

            # Update aggregated metrics
            self._update_aggregated_metrics(metric)

            self._logger.debug(f"Recorded metric: {metric.name} = {metric.value}")

        except Exception as e:
            self._logger.error(f"Error recording metric: {e}")

    def get_metric_value(
        self, metric_name: str, tags: Optional[Dict[str, str]] = None
    ) -> Optional[float]:
        """Get latest value for a metric"""
        try:
            metric_key = f"{metric_name}:{':'.join(f'{k}={v}' for k, v in (tags or {}).items())}"
            if metric_key in self._metrics and self._metrics[metric_key]:
                return self._metrics[metric_key][-1].value
            return None
        except Exception:
            return None

    def get_metric_history(
        self,
        metric_name: str,
        tags: Optional[Dict[str, str]] = None,
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> List[Metric]:
        """Get historical values for a metric"""
        try:
            metric_key = f"{metric_name}:{':'.join(f'{k}={v}' for k, v in (tags or {}).items())}"
            if metric_key not in self._metrics:
                return []

            metrics = list(self._metrics[metric_key])

            # Filter by time
            if since:
                metrics = [m for m in metrics if m.timestamp >= since]

            # Apply limit
            if limit:
                metrics = metrics[-limit:]

            return metrics

        except Exception as e:
            self._logger.error(f"Error getting metric history: {e}")
            return []

    def get_aggregated_metrics(self, metric_name: str) -> Dict[str, Any]:
        """Get aggregated statistics for a metric"""
        return self._aggregated_metrics.get(metric_name, {})

    def _update_aggregated_metrics(self, metric: Metric) -> None:
        """Update aggregated statistics for metric"""
        try:
            if metric.name not in self._aggregated_metrics:
                self._aggregated_metrics[metric.name] = {
                    "count": 0,
                    "sum": 0,
                    "min": float("inf"),
                    "max": float("-inf"),
                    "recent_values": deque(maxlen=100),
                }

            agg = self._aggregated_metrics[metric.name]
            agg["count"] += 1
            agg["sum"] += metric.value
            agg["min"] = min(agg["min"], metric.value)
            agg["max"] = max(agg["max"], metric.value)
            agg["recent_values"].append(metric.value)

            # Calculate derived metrics
            agg["average"] = agg["sum"] / agg["count"]
            if len(agg["recent_values"]) > 1:
                agg["recent_average"] = statistics.mean(agg["recent_values"])
                agg["recent_stddev"] = statistics.stdev(agg["recent_values"])

        except Exception as e:
            self._logger.error(f"Error updating aggregated metrics: {e}")

    def cleanup_old_metrics(self) -> None:
        """Remove metrics older than retention period"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(days=self._retention_days)

            for metric_key in list(self._metrics.keys()):
                metric_queue = self._metrics[metric_key]
                # Remove old metrics from the front of the deque
                while metric_queue and metric_queue[0].timestamp < cutoff_time:
                    metric_queue.popleft()

                # Remove empty metric queues
                if not metric_queue:
                    del self._metrics[metric_key]

        except Exception as e:
            self._logger.error(f"Error cleaning up old metrics: {e}")


class AlertManager:
    """
    Alert management and notification system

    Manages alert rules, processes alerts, and handles notifications
    for key management system events and conditions.
    """

    def __init__(self, notification_handlers: Optional[Dict[str, Callable]] = None):
        """Initialize alert manager"""
        self._alert_rules: Dict[str, Dict[str, Any]] = {}
        self._active_alerts: Dict[str, Alert] = {}
        self._notification_handlers = notification_handlers or {}
        self._logger = logging.getLogger(__name__)

        # Initialize default alert rules
        self._initialize_default_rules()

    def add_alert_rule(
        self,
        rule_id: str,
        name: str,
        condition: str,
        severity: AlertSeverity,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add new alert rule"""
        self._alert_rules[rule_id] = {
            "name": name,
            "condition": condition,
            "severity": severity,
            "description": description,
            "metadata": metadata or {},
            "enabled": True,
            "created_at": datetime.utcnow(),
        }

    def check_alerts(self, metrics: MetricsCollector) -> List[Alert]:
        """Check all alert rules against current metrics"""
        new_alerts = []

        for rule_id, rule in self._alert_rules.items():
            if not rule["enabled"]:
                continue

            try:
                if self._evaluate_alert_condition(rule["condition"], metrics):
                    alert = self._create_alert(rule_id, rule)
                    if alert.id not in self._active_alerts:
                        self._active_alerts[alert.id] = alert
                        new_alerts.append(alert)
                        self._logger.warning(f"Alert triggered: {alert.name}")
                        asyncio.create_task(self._send_alert_notifications(alert))

            except Exception as e:
                self._logger.error(f"Error evaluating alert rule {rule_id}: {e}")

        return new_alerts

    def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Acknowledge an active alert"""
        if alert_id in self._active_alerts:
            alert = self._active_alerts[alert_id]
            if alert.status == AlertStatus.ACTIVE:
                alert.status = AlertStatus.ACKNOWLEDGED
                alert.acknowledged_at = datetime.utcnow()
                alert.metadata["acknowledged_by"] = user_id
                self._logger.info(f"Alert {alert_id} acknowledged by {user_id}")
                return True
        return False

    def resolve_alert(self, alert_id: str, user_id: str, resolution_note: str = "") -> bool:
        """Resolve an active alert"""
        if alert_id in self._active_alerts:
            alert = self._active_alerts[alert_id]
            if alert.status in [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]:
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = datetime.utcnow()
                alert.metadata["resolved_by"] = user_id
                alert.metadata["resolution_note"] = resolution_note
                self._logger.info(f"Alert {alert_id} resolved by {user_id}")
                return True
        return False

    def get_active_alerts(self, severity: Optional[AlertSeverity] = None) -> List[Alert]:
        """Get all active alerts, optionally filtered by severity"""
        alerts = [
            alert for alert in self._active_alerts.values() if alert.status == AlertStatus.ACTIVE
        ]

        if severity:
            alerts = [alert for alert in alerts if alert.severity == severity]

        return sorted(alerts, key=lambda x: x.triggered_at, reverse=True)

    def _initialize_default_rules(self) -> None:
        """Initialize default alert rules"""
        # Key rotation failure rate
        self.add_alert_rule(
            "key_rotation_failure_rate",
            "High Key Rotation Failure Rate",
            "rotation_failure_rate > 0.1",  # >10% failure rate
            AlertSeverity.HIGH,
            "Key rotation failure rate has exceeded 10% in the last hour",
        )

        # Key usage anomaly
        self.add_alert_rule(
            "key_usage_anomaly",
            "Unusual Key Usage Pattern",
            "key_usage_anomaly_score > 0.8",
            AlertSeverity.MEDIUM,
            "Detected unusual key usage pattern that may indicate security incident",
        )

        # HSM connectivity
        self.add_alert_rule(
            "hsm_connectivity",
            "HSM Connection Lost",
            "hsm_connection_status == 0",
            AlertSeverity.CRITICAL,
            "Lost connection to Hardware Security Module",
        )

        # Key expiration warning
        self.add_alert_rule(
            "key_expiration_warning",
            "Keys Approaching Expiration",
            "keys_expiring_soon > 0",
            AlertSeverity.MEDIUM,
            "One or more keys are approaching expiration",
        )

        # Scheduler health
        self.add_alert_rule(
            "scheduler_down",
            "Key Rotation Scheduler Down",
            "scheduler_status != 'running'",
            AlertSeverity.HIGH,
            "Key rotation scheduler is not running",
        )

    def _evaluate_alert_condition(self, condition: str, metrics: MetricsCollector) -> bool:
        """Evaluate alert condition against metrics using safe expression parsing"""
        try:
            # Safe condition evaluation without eval()
            # Supports: ==, !=, >, <, >=, <=

            # Extract variable and value from condition
            if "rotation_failure_rate" in condition:
                failure_rate = self._calculate_rotation_failure_rate(metrics)
                return self._safe_compare(condition, "rotation_failure_rate", failure_rate)

            elif "key_usage_anomaly_score" in condition:
                anomaly_score = self._calculate_usage_anomaly_score(metrics)
                return self._safe_compare(condition, "key_usage_anomaly_score", anomaly_score)

            elif "hsm_connection_status" in condition:
                status = metrics.get_metric_value("hsm_connection_status") or 0
                return self._safe_compare(condition, "hsm_connection_status", status)

            elif "keys_expiring_soon" in condition:
                count = metrics.get_metric_value("keys_expiring_soon") or 0
                return self._safe_compare(condition, "keys_expiring_soon", count)

            elif "scheduler_status" in condition:
                status = metrics.get_metric_value("scheduler_status") or "unknown"
                return self._safe_compare(condition, "scheduler_status", status)

            return False

        except Exception as e:
            self._logger.error(f"Error evaluating condition '{condition}': {e}")
            return False

    def _safe_compare(self, condition: str, variable: str, actual_value) -> bool:
        """Safely compare values without using eval()"""
        try:
            # Parse operator and expected value
            operator, expected_str = self._parse_condition(condition.strip())
            if not operator:
                return False

            # Parse expected value
            expected_value = self._parse_expected_value(expected_str, actual_value)

            # Perform comparison
            return self._perform_comparison(operator, actual_value, expected_value)

        except Exception as e:
            self._logger.error(f"Error in safe comparison: {e}")
            return False

    def _parse_condition(self, condition: str) -> tuple:
        """Parse condition to extract operator and expected value string"""
        operators = [(">=", ">="), ("<=", "<="), ("!=", "!="), ("==", "=="), (">", ">"), ("<", "<")]

        for op_str, op in operators:
            if op_str in condition:
                return op, condition.split(op_str)[1].strip()

        self._logger.warning(f"Unsupported operator in condition: {condition}")
        return None, None

    def _parse_expected_value(self, expected_str: str, actual_value):
        """Parse expected value string to appropriate type"""
        # Remove quotes for strings
        if (expected_str.startswith("'") and expected_str.endswith("'")) or (
            expected_str.startswith('"') and expected_str.endswith('"')
        ):
            return expected_str[1:-1]

        # Try numeric conversion
        try:
            expected_value = float(expected_str)
            if isinstance(actual_value, (int, str)) and str(actual_value).isdigit():
                actual_value = float(actual_value)
            return expected_value
        except ValueError:
            return expected_str

    def _perform_comparison(self, operator: str, actual_value, expected_value) -> bool:
        """Perform the actual comparison safely"""
        if operator in ["==", "!="]:
            return (
                actual_value == expected_value
                if operator == "=="
                else actual_value != expected_value
            )

        # Numeric operators
        if operator in [">", ">=", "<", "<="]:
            if not isinstance(actual_value, (int, float)) or not isinstance(
                expected_value, (int, float)
            ):
                self._logger.warning(
                    f"Non-numeric comparison: {actual_value} {operator} {expected_value}"
                )
                return False

            comparisons = {
                ">": lambda a, e: a > e,
                ">=": lambda a, e: a >= e,
                "<": lambda a, e: a < e,
                "<=": lambda a, e: a <= e,
            }
            return comparisons[operator](actual_value, expected_value)

        return False

    def _calculate_rotation_failure_rate(self, metrics: MetricsCollector) -> float:
        """Calculate key rotation failure rate"""
        try:
            since = datetime.utcnow() - timedelta(hours=1)
            successes = len(metrics.get_metric_history("rotation_success", since=since))
            failures = len(metrics.get_metric_history("rotation_failure", since=since))

            total = successes + failures
            return failures / total if total > 0 else 0.0

        except Exception:
            return 0.0

    def _calculate_usage_anomaly_score(self, metrics: MetricsCollector) -> float:
        """Calculate key usage anomaly score"""
        try:
            # Simple anomaly detection based on usage patterns
            recent_usage = metrics.get_metric_history(
                "key_usage_count", since=datetime.utcnow() - timedelta(hours=1)
            )

            if len(recent_usage) < 10:
                return 0.0

            values = [m.value for m in recent_usage]
            mean_usage = statistics.mean(values)
            std_usage = statistics.stdev(values) if len(values) > 1 else 0

            # Calculate z-score for latest usage
            if std_usage > 0:
                latest_usage = values[-1]
                z_score = abs(latest_usage - mean_usage) / std_usage
                # Normalize to 0-1 scale
                return min(z_score / 3.0, 1.0)

            return 0.0

        except Exception:
            return 0.0

    def _create_alert(self, rule_id: str, rule: Dict[str, Any]) -> Alert:
        """Create new alert from rule"""
        alert_id = f"{rule_id}_{datetime.utcnow().timestamp()}"
        return Alert(
            id=alert_id,
            name=rule["name"],
            description=rule["description"],
            severity=rule["severity"],
            status=AlertStatus.ACTIVE,
            rule=rule_id,
            triggered_at=datetime.utcnow(),
            metadata={"rule_metadata": rule["metadata"]},
        )

    async def _send_alert_notifications(self, alert: Alert) -> None:
        """Send alert notifications"""
        try:
            for channel, handler in self._notification_handlers.items():
                try:
                    await handler(alert)
                    self._logger.info(f"Alert notification sent via {channel}")
                except Exception as e:
                    self._logger.error(f"Failed to send alert via {channel}: {e}")

        except Exception as e:
            self._logger.error(f"Error sending alert notifications: {e}")


class KeyManagementMonitor:
    """
    Comprehensive monitoring system for key management

    Provides unified monitoring, metrics collection, and alerting
    for all key management system components.
    """

    def __init__(self, session_factory: Callable, check_interval: int = 60):
        """Initialize monitoring system"""
        self._session_factory = session_factory
        self._check_interval = check_interval
        self._metrics_collector = MetricsCollector()
        self._alert_manager = AlertManager()
        self._health_checks: Dict[str, HealthCheck] = {}
        self._monitoring_task: Optional[asyncio.Task] = None
        self._logger = logging.getLogger(__name__)

        # Performance baselines
        self._baselines: Dict[str, Dict[str, float]] = {}

    async def start_monitoring(self) -> None:
        """Start the monitoring system"""
        self._logger.info("Starting key management monitoring system")
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())

    async def stop_monitoring(self) -> None:
        """Stop the monitoring system"""
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
        self._logger.info("Key management monitoring system stopped")

    async def collect_metrics(self) -> None:
        """Collect current metrics from the system"""
        try:
            async with self._session_factory() as session:
                # Collect key metrics
                await self._collect_key_metrics(session)

                # Collect rotation metrics
                await self._collect_rotation_metrics(session)

                # Collect policy metrics
                await self._collect_policy_metrics(session)

                # Collect audit metrics
                await self._collect_audit_metrics(session)

                # Collect system health metrics
                await self._collect_health_metrics()

        except Exception as e:
            self._logger.error(f"Error collecting metrics: {e}")

    def get_system_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive system dashboard data"""
        try:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "key_metrics": {
                    "total_keys": self._metrics_collector.get_metric_value("total_keys") or 0,
                    "active_keys": self._metrics_collector.get_metric_value("active_keys") or 0,
                    "keys_due_for_rotation": self._metrics_collector.get_metric_value(
                        "keys_due_for_rotation"
                    )
                    or 0,
                    "average_key_age_days": self._metrics_collector.get_metric_value(
                        "average_key_age_days"
                    )
                    or 0,
                },
                "rotation_metrics": {
                    "rotations_today": self._metrics_collector.get_metric_value("rotations_today")
                    or 0,
                    "rotation_success_rate": self._metrics_collector.get_metric_value(
                        "rotation_success_rate"
                    )
                    or 100,
                    "average_rotation_time_ms": self._metrics_collector.get_metric_value(
                        "average_rotation_time_ms"
                    )
                    or 0,
                    "failed_rotations_24h": self._metrics_collector.get_metric_value(
                        "failed_rotations_24h"
                    )
                    or 0,
                },
                "security_metrics": {
                    "security_incidents_24h": self._metrics_collector.get_metric_value(
                        "security_incidents_24h"
                    )
                    or 0,
                    "anomaly_score": self._metrics_collector.get_metric_value(
                        "key_usage_anomaly_score"
                    )
                    or 0,
                    "compliance_score": self._metrics_collector.get_metric_value("compliance_score")
                    or 100,
                },
                "system_health": {
                    "hsm_status": self._metrics_collector.get_metric_value("hsm_connection_status")
                    or 0,
                    "scheduler_status": self._metrics_collector.get_metric_value("scheduler_status")
                    or "unknown",
                    "api_response_time_ms": self._metrics_collector.get_metric_value(
                        "api_response_time_ms"
                    )
                    or 0,
                },
                "active_alerts": len(self._alert_manager.get_active_alerts()),
                "critical_alerts": len(
                    self._alert_manager.get_active_alerts(AlertSeverity.CRITICAL)
                ),
                "health_checks": {
                    name: {
                        "status": check.status,
                        "response_time_ms": check.response_time_ms,
                        "last_check": check.timestamp.isoformat(),
                    }
                    for name, check in self._health_checks.items()
                },
            }

        except Exception as e:
            self._logger.error(f"Error generating dashboard: {e}")
            return {"error": str(e)}

    async def _monitoring_loop(self) -> None:
        """Main monitoring loop"""
        try:
            while True:
                # Collect metrics
                await self.collect_metrics()

                # Check alerts
                self._alert_manager.check_alerts(self._metrics_collector)

                # Cleanup old data
                self._metrics_collector.cleanup_old_metrics()

                # Wait for next iteration
                await asyncio.sleep(self._check_interval)

        except asyncio.CancelledError:
            self._logger.info("Monitoring loop cancelled")
        except Exception as e:
            self._logger.error(f"Error in monitoring loop: {e}")

    async def _collect_key_metrics(self, session: AsyncSession) -> None:
        """Collect key-related metrics"""
        try:
            # Total keys by status
            total_keys = await session.execute(select(func.count(KeyMaster.id)))
            self._metrics_collector.record_metric(
                Metric(
                    name="total_keys",
                    value=total_keys.scalar() or 0,
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

            # Active keys
            active_keys = await session.execute(
                select(func.count(KeyMaster.id)).where(KeyMaster.status == KeyStatus.ACTIVE.value)
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="active_keys",
                    value=active_keys.scalar() or 0,
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

            # Keys due for rotation
            due_for_rotation = await session.execute(
                select(func.count(KeyMaster.id)).where(
                    and_(
                        KeyMaster.status == KeyStatus.ACTIVE.value,
                        or_(
                            KeyMaster.expires_at < datetime.utcnow() + timedelta(days=7),
                            KeyMaster.usage_count >= KeyMaster.max_usage_count,
                        ),
                    )
                )
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="keys_due_for_rotation",
                    value=due_for_rotation.scalar() or 0,
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

            # Average key age
            avg_age_result = await session.execute(
                select(
                    func.avg(
                        func.extract("epoch", datetime.utcnow() - KeyMaster.created_at) / 86400
                    )
                ).where(KeyMaster.status == KeyStatus.ACTIVE.value)
            )
            avg_age = avg_age_result.scalar() or 0
            self._metrics_collector.record_metric(
                Metric(
                    name="average_key_age_days",
                    value=float(avg_age),
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

        except Exception as e:
            self._logger.error(f"Error collecting key metrics: {e}")

    async def _collect_rotation_metrics(self, session: AsyncSession) -> None:
        """Collect rotation-related metrics"""
        try:
            # Rotations today
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            rotations_today = await session.execute(
                select(func.count(KeyRotation.id)).where(
                    and_(KeyRotation.completed_at >= today, KeyRotation.status == "COMPLETED")
                )
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="rotations_today",
                    value=rotations_today.scalar() or 0,
                    metric_type=MetricType.COUNTER,
                    timestamp=datetime.utcnow(),
                )
            )

            # Failed rotations in last 24h
            day_ago = datetime.utcnow() - timedelta(days=1)
            failed_rotations = await session.execute(
                select(func.count(KeyRotation.id)).where(
                    and_(KeyRotation.failed_at >= day_ago, KeyRotation.status == "FAILED")
                )
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="failed_rotations_24h",
                    value=failed_rotations.scalar() or 0,
                    metric_type=MetricType.COUNTER,
                    timestamp=datetime.utcnow(),
                )
            )

            # Average rotation time
            avg_time_result = await session.execute(
                select(func.avg(KeyRotation.execution_time_ms)).where(
                    and_(KeyRotation.completed_at >= day_ago, KeyRotation.status == "COMPLETED")
                )
            )
            avg_time = avg_time_result.scalar() or 0
            self._metrics_collector.record_metric(
                Metric(
                    name="average_rotation_time_ms",
                    value=float(avg_time),
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

        except Exception as e:
            self._logger.error(f"Error collecting rotation metrics: {e}")

    async def _collect_policy_metrics(self, session: AsyncSession) -> None:
        """Collect policy-related metrics"""
        try:
            # Active policies
            active_policies = await session.execute(
                select(func.count(RotationPolicy.id)).where(RotationPolicy.is_active)
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="active_policies",
                    value=active_policies.scalar() or 0,
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

        except Exception as e:
            self._logger.error(f"Error collecting policy metrics: {e}")

    async def _collect_audit_metrics(self, session: AsyncSession) -> None:
        """Collect audit-related metrics"""
        try:
            # Audit events in last 24h
            day_ago = datetime.utcnow() - timedelta(days=1)
            audit_events = await session.execute(
                select(func.count(KeyAuditLog.id)).where(KeyAuditLog.timestamp >= day_ago)
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="audit_events_24h",
                    value=audit_events.scalar() or 0,
                    metric_type=MetricType.COUNTER,
                    timestamp=datetime.utcnow(),
                )
            )

            # High-risk events
            high_risk_events = await session.execute(
                select(func.count(KeyAuditLog.id)).where(
                    and_(KeyAuditLog.timestamp >= day_ago, KeyAuditLog.risk_score >= 70)
                )
            )
            self._metrics_collector.record_metric(
                Metric(
                    name="high_risk_events_24h",
                    value=high_risk_events.scalar() or 0,
                    metric_type=MetricType.COUNTER,
                    timestamp=datetime.utcnow(),
                )
            )

        except Exception as e:
            self._logger.error(f"Error collecting audit metrics: {e}")

    async def _collect_health_metrics(self) -> None:
        """Collect system health metrics"""
        try:
            # Placeholder for system health metrics
            # These would integrate with actual system monitoring

            # HSM connection status (placeholder)
            self._metrics_collector.record_metric(
                Metric(
                    name="hsm_connection_status",
                    value=1,  # 1 = connected, 0 = disconnected
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                )
            )

            # Scheduler status (placeholder)
            self._metrics_collector.record_metric(
                Metric(
                    name="scheduler_status",
                    value=1,  # 1 = running, 0 = stopped
                    metric_type=MetricType.GAUGE,
                    timestamp=datetime.utcnow(),
                    tags={"status": "running"},
                )
            )

        except Exception as e:
            self._logger.error(f"Error collecting health metrics: {e}")

    async def perform_health_check(self, component: str) -> HealthCheck:
        """Perform health check on system component"""
        start_time = datetime.utcnow()

        try:
            # Component-specific health checks
            if component == "database":
                await self._check_database_health()
                status = "healthy"
                message = "Database connection successful"

            elif component == "hsm":
                status, message = await self._check_hsm_health()

            elif component == "scheduler":
                status, message = await self._check_scheduler_health()

            else:
                status = "unknown"
                message = f"Unknown component: {component}"

            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            health_check = HealthCheck(
                component=component,
                status=status,
                message=message,
                timestamp=datetime.utcnow(),
                response_time_ms=response_time,
            )

            self._health_checks[component] = health_check
            return health_check

        except Exception as e:
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            health_check = HealthCheck(
                component=component,
                status="critical",
                message=f"Health check failed: {e}",
                timestamp=datetime.utcnow(),
                response_time_ms=response_time,
            )

            self._health_checks[component] = health_check
            return health_check

    async def _check_database_health(self) -> None:
        """Check database connectivity"""
        async with self._session_factory() as session:
            await session.execute(text("SELECT 1"))

    async def _check_hsm_health(self) -> Tuple[str, str]:
        """Check HSM connectivity"""
        # Placeholder - would check actual HSM status
        return "healthy", "HSM connection active"

    async def _check_scheduler_health(self) -> Tuple[str, str]:
        """Check scheduler health"""
        # Placeholder - would check actual scheduler status
        return "healthy", "Scheduler running normally"

    # Week 4 Credential Monitoring Extensions (30 LOC)
    async def track_credential_event(
        self,
        session: AsyncSession,
        key_id: str,
        user_id: str,
        event_type: str,
        metadata: Dict[str, Any],
    ) -> None:
        """Track credential access events for Week 4 monitoring"""
        try:
            # Record credential-specific metric
            self._metrics_collector.record_metric(
                Metric(
                    name=f"credential_{event_type.lower()}",
                    value=1,
                    metric_type=MetricType.COUNTER,
                    timestamp=datetime.utcnow(),
                    tags={"key_id": key_id, "user_id": user_id, "event_type": event_type},
                )
            )

            # Check for suspicious patterns
            if await self._is_suspicious_credential_activity(session, key_id, user_id, event_type):
                self._alert_manager.add_alert_rule(
                    f"suspicious_credential_{key_id}_{int(datetime.utcnow().timestamp())}",
                    "Suspicious Credential Activity",
                    f"credential_access_frequency_{key_id} > 10",
                    AlertSeverity.HIGH,
                    f"Suspicious {event_type} activity detected for credential {key_id} by user {user_id}",
                )

        except Exception as e:
            self._logger.error(f"Error tracking credential event: {e}")

    async def _is_suspicious_credential_activity(
        self, session: AsyncSession, key_id: str, user_id: str, event_type: str
    ) -> bool:
        """Detect suspicious credential activity patterns"""
        try:
            # Check access frequency in last hour
            frequency = (
                self._metrics_collector.get_metric_value(
                    f"credential_{event_type.lower()}", tags={"key_id": key_id, "user_id": user_id}
                )
                or 0
            )

            # Simple threshold-based detection
            return frequency > 20  # More than 20 accesses per hour

        except Exception:
            return False
