"""
OAuth Security Monitoring and Alerting System
T-02: OAuth production configuration - Security monitoring

Implements comprehensive OAuth security monitoring:
- Real-time threat detection
- Anomaly detection for OAuth flows
- Security metrics collection
- Automated alerting system
- Compliance monitoring
- Incident response triggers
"""

import asyncio
import time
import statistics
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from enum import Enum
import logging

from app.core.config import settings
from app.security.secure_logging import security_logger, oauth_tracker


class ThreatLevel(Enum):
    """Security threat levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    """Types of security alerts"""

    RATE_LIMIT_VIOLATION = "rate_limit_violation"
    SUSPICIOUS_OAUTH_PATTERN = "suspicious_oauth_pattern"
    INVALID_REDIRECT_URI = "invalid_redirect_uri"
    TOKEN_ABUSE = "token_abuse"
    AUTHENTICATION_ANOMALY = "authentication_anomaly"
    PKCE_VIOLATION = "pkce_violation"
    STATE_PARAMETER_ABUSE = "state_parameter_abuse"
    PROVIDER_AVAILABILITY = "provider_availability"
    SECURITY_THRESHOLD_EXCEEDED = "security_threshold_exceeded"


@dataclass
class SecurityEvent:
    """Security event data structure"""

    timestamp: datetime
    event_type: str
    threat_level: ThreatLevel
    source_ip: str
    provider: str
    details: Dict[str, Any]
    user_email: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class SecurityMetrics:
    """OAuth security metrics"""

    oauth_attempts: int = 0
    oauth_failures: int = 0
    oauth_successes: int = 0
    rate_limit_violations: int = 0
    invalid_redirect_attempts: int = 0
    token_validation_failures: int = 0
    pkce_failures: int = 0
    state_validation_failures: int = 0
    suspicious_patterns_detected: int = 0
    unique_ips: Set[str] = field(default_factory=set)
    provider_errors: Dict[str, int] = field(default_factory=lambda: defaultdict(int))


class OAuthSecurityMonitor:
    """
    OAuth Security Monitoring System

    Monitors OAuth flows for security threats and anomalies:
    - Real-time threat detection
    - Rate limiting violations
    - Suspicious patterns
    - Provider availability
    - Token abuse detection
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Time windows for monitoring (in seconds)
        self.short_window = 300  # 5 minutes
        self.medium_window = 3600  # 1 hour
        self.long_window = 86400  # 24 hours

        # Event storage (in production, use Redis or database)
        self.events_short = deque(maxlen=1000)
        self.events_medium = deque(maxlen=5000)
        self.events_long = deque(maxlen=50000)

        # IP tracking for anomaly detection
        self.ip_activity = defaultdict(lambda: deque(maxlen=100))
        self.blocked_ips = set()

        # Provider health tracking
        self.provider_health = {
            "google": {"status": "healthy", "last_success": None, "consecutive_failures": 0},
            "microsoft": {"status": "healthy", "last_success": None, "consecutive_failures": 0},
        }

        # Security thresholds
        self.thresholds = {
            "max_failures_per_ip_per_hour": 20,
            "max_attempts_per_ip_per_minute": 10,
            "max_invalid_redirects_per_hour": 5,
            "max_pkce_failures_per_hour": 10,
            "max_state_failures_per_hour": 15,
            "max_provider_consecutive_failures": 5,
            "suspicious_user_agent_threshold": 50,  # requests from same user agent
            "anomaly_detection_threshold": 3.0,  # standard deviations
        }

        # Alert configuration
        self.alert_cooldown = 300  # 5 minutes between similar alerts
        self.last_alerts = {}

        # Start monitoring tasks
        self.monitoring_active = True
        asyncio.create_task(self._start_monitoring_tasks())

    async def _start_monitoring_tasks(self):
        """Start background monitoring tasks"""
        if not self.monitoring_active:
            return

        # Create monitoring tasks
        tasks = [
            asyncio.create_task(self._monitor_rate_limits()),
            asyncio.create_task(self._monitor_anomalies()),
            asyncio.create_task(self._monitor_provider_health()),
            asyncio.create_task(self._cleanup_old_events()),
        ]

        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            self.logger.error(f"Monitoring task failed: {str(e)}")

    def record_oauth_event(
        self,
        event_type: str,
        source_ip: str,
        provider: str,
        success: bool = True,
        user_email: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """
        Record an OAuth security event for monitoring

        Args:
            event_type: Type of OAuth event
            source_ip: Source IP address
            provider: OAuth provider
            success: Whether the event was successful
            user_email: User email (if available)
            user_agent: User agent string
            details: Additional event details
        """
        current_time = datetime.now(timezone.utc)

        # Determine threat level based on event characteristics
        threat_level = self._assess_threat_level(
            event_type, source_ip, provider, success, details or {}
        )

        # Create security event
        event = SecurityEvent(
            timestamp=current_time,
            event_type=event_type,
            threat_level=threat_level,
            source_ip=source_ip,
            provider=provider,
            details=details or {},
            user_email=user_email,
            user_agent=user_agent,
        )

        # Store event in appropriate time windows
        self.events_short.append(event)
        self.events_medium.append(event)
        self.events_long.append(event)

        # Update IP activity tracking
        self.ip_activity[source_ip].append(current_time)

        # Update provider health
        self._update_provider_health(provider, success)

        # Check for immediate threats
        self._check_immediate_threats(event)

        # Log the event
        oauth_tracker.security_logger.log_oauth_event(
            event_type=event_type,
            provider=provider,
            status="success" if success else "failure",
            user_email=user_email,
            client_ip=source_ip,
            user_agent=user_agent,
            threat_level=threat_level.value,
            **details or {},
        )

    def _assess_threat_level(
        self, event_type: str, source_ip: str, provider: str, success: bool, details: Dict[str, Any]
    ) -> ThreatLevel:
        """Assess threat level for an OAuth event"""
        # Check threat levels in order of severity
        if self._is_critical_threat(event_type, source_ip, success):
            return ThreatLevel.CRITICAL

        if self._is_high_threat(event_type, source_ip):
            return ThreatLevel.HIGH

        if self._is_medium_threat(source_ip, success, details):
            return ThreatLevel.MEDIUM

        return ThreatLevel.LOW

    def _is_critical_threat(self, event_type: str, source_ip: str, success: bool) -> bool:
        """Check if event represents a critical threat"""
        if not success and event_type in ["oauth_callback", "token_validation"]:
            recent_failures = self._count_recent_failures(source_ip, minutes=5)
            return recent_failures >= 5
        return False

    def _is_high_threat(self, event_type: str, source_ip: str) -> bool:
        """Check if event represents a high threat"""
        high_threat_events = ["invalid_redirect_uri", "pkce_violation", "state_violation"]
        return event_type in high_threat_events or source_ip in self.blocked_ips

    def _is_medium_threat(self, source_ip: str, success: bool, details: Dict[str, Any]) -> bool:
        """Check if event represents a medium threat"""
        if not success:
            recent_failures = self._count_recent_failures(source_ip, minutes=15)
            if recent_failures >= 3:
                return True

        return self._has_suspicious_patterns(source_ip, details)

    def _count_recent_failures(self, source_ip: str, minutes: int) -> int:
        """Count recent failures from a source IP"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)

        failures = 0
        for event in self.events_short:
            if (
                event.source_ip == source_ip
                and event.timestamp >= cutoff_time
                and event.event_type in ["oauth_callback", "token_validation"]
                and "failure" in event.details.get("status", "")
            ):
                failures += 1

        return failures

    def _has_suspicious_patterns(self, source_ip: str, details: Dict[str, Any]) -> bool:
        """Check for suspicious patterns in OAuth events"""

        # Check for rapid requests from same IP
        recent_requests = len(
            [
                event
                for event in self.events_short
                if (
                    event.source_ip == source_ip
                    and event.timestamp >= datetime.now(timezone.utc) - timedelta(minutes=1)
                )
            ]
        )

        if recent_requests > 10:
            return True

        # Check for suspicious user agent patterns
        user_agent = details.get("user_agent", "")
        if user_agent:
            suspicious_patterns = [
                "curl",
                "wget",
                "python",
                "bot",
                "crawler",
                "scanner",
                "automated",
                "script",
                "tool",
            ]
            if any(pattern in user_agent.lower() for pattern in suspicious_patterns):
                return True

        # Check for unusual OAuth parameters
        if details.get("unusual_parameters"):
            return True

        return False

    def _update_provider_health(self, provider: str, success: bool):
        """Update OAuth provider health status"""
        if provider in self.provider_health:
            if success:
                self.provider_health[provider]["status"] = "healthy"
                self.provider_health[provider]["last_success"] = datetime.now(timezone.utc)
                self.provider_health[provider]["consecutive_failures"] = 0
            else:
                self.provider_health[provider]["consecutive_failures"] += 1

                # Mark as degraded or unhealthy based on failures
                failures = self.provider_health[provider]["consecutive_failures"]
                if failures >= self.thresholds["max_provider_consecutive_failures"]:
                    self.provider_health[provider]["status"] = "unhealthy"
                    self._send_alert(
                        AlertType.PROVIDER_AVAILABILITY,
                        ThreatLevel.HIGH,
                        f"OAuth provider {provider} marked as unhealthy",
                        {"provider": provider, "consecutive_failures": failures},
                    )
                elif failures >= 3:
                    self.provider_health[provider]["status"] = "degraded"

    def _check_immediate_threats(self, event: SecurityEvent):
        """Check for immediate security threats requiring alerts"""

        # Critical threat level events
        if event.threat_level == ThreatLevel.CRITICAL:
            self._send_alert(
                AlertType.SECURITY_THRESHOLD_EXCEEDED,
                ThreatLevel.CRITICAL,
                f"Critical OAuth security threat detected from {event.source_ip}",
                {
                    "source_ip": event.source_ip,
                    "event_type": event.event_type,
                    "provider": event.provider,
                    "details": event.details,
                },
            )

        # Rate limit violations
        if self._check_rate_limit_violation(event.source_ip):
            self._send_alert(
                AlertType.RATE_LIMIT_VIOLATION,
                ThreatLevel.HIGH,
                f"Rate limit violation from {event.source_ip}",
                {
                    "source_ip": event.source_ip,
                    "recent_requests": self._count_recent_requests(event.source_ip),
                },
            )
            self.blocked_ips.add(event.source_ip)

        # Invalid redirect URI attempts
        if event.event_type == "invalid_redirect_uri":
            self._send_alert(
                AlertType.INVALID_REDIRECT_URI,
                ThreatLevel.HIGH,
                f"Invalid redirect URI attempt from {event.source_ip}",
                {
                    "source_ip": event.source_ip,
                    "provider": event.provider,
                    "attempted_uri": event.details.get("redirect_uri", "unknown"),
                },
            )

    def _check_rate_limit_violation(self, source_ip: str) -> bool:
        """Check if source IP is violating rate limits"""
        current_time = datetime.now(timezone.utc)

        # Check requests in last minute
        recent_requests = len(
            [ts for ts in self.ip_activity[source_ip] if ts >= current_time - timedelta(minutes=1)]
        )

        return recent_requests > self.thresholds["max_attempts_per_ip_per_minute"]

    def _count_recent_requests(self, source_ip: str, minutes: int = 1) -> int:
        """Count recent requests from a source IP"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        return len([ts for ts in self.ip_activity[source_ip] if ts >= cutoff_time])

    async def _monitor_rate_limits(self):
        """Monitor for rate limit violations"""
        while self.monitoring_active:
            try:
                current_time = datetime.now(timezone.utc)

                for ip, timestamps in self.ip_activity.items():
                    # Check hourly rate limits
                    hour_ago = current_time - timedelta(hours=1)
                    hourly_requests = len([ts for ts in timestamps if ts >= hour_ago])

                    if hourly_requests > self.thresholds["max_failures_per_ip_per_hour"]:
                        if ip not in self.blocked_ips:
                            self._send_alert(
                                AlertType.RATE_LIMIT_VIOLATION,
                                ThreatLevel.HIGH,
                                f"Hourly rate limit exceeded for IP {ip}",
                                {"source_ip": ip, "hourly_requests": hourly_requests},
                            )
                            self.blocked_ips.add(ip)

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                self.logger.error(f"Rate limit monitoring error: {str(e)}")
                await asyncio.sleep(60)

    async def _monitor_anomalies(self):
        """Monitor for statistical anomalies in OAuth patterns"""
        while self.monitoring_active:
            try:
                # Collect metrics every 5 minutes
                await asyncio.sleep(300)

                # Analyze request patterns
                self._analyze_request_patterns()

                # Analyze user agent patterns
                self._analyze_user_agent_patterns()

                # Analyze temporal patterns
                self._analyze_temporal_patterns()

            except Exception as e:
                self.logger.error(f"Anomaly monitoring error: {str(e)}")
                await asyncio.sleep(300)

    def _analyze_request_patterns(self):
        """Analyze request patterns for anomalies"""
        current_time = datetime.now(timezone.utc)
        hour_ago = current_time - timedelta(hours=1)

        # Group requests by IP
        ip_requests = defaultdict(int)
        for event in self.events_medium:
            if event.timestamp >= hour_ago:
                ip_requests[event.source_ip] += 1

        if len(ip_requests) < 2:
            return  # Need at least 2 IPs for statistics

        # Calculate statistics
        request_counts = list(ip_requests.values())
        mean_requests = statistics.mean(request_counts)
        stdev_requests = statistics.stdev(request_counts) if len(request_counts) > 1 else 0

        # Find anomalous IPs
        threshold = mean_requests + (
            self.thresholds["anomaly_detection_threshold"] * stdev_requests
        )

        for ip, count in ip_requests.items():
            if count > threshold and count > 20:  # Minimum threshold
                self._send_alert(
                    AlertType.AUTHENTICATION_ANOMALY,
                    ThreatLevel.MEDIUM,
                    f"Anomalous request pattern from IP {ip}",
                    {
                        "source_ip": ip,
                        "request_count": count,
                        "threshold": threshold,
                        "mean": mean_requests,
                    },
                )

    def _analyze_user_agent_patterns(self):
        """Analyze user agent patterns for automated tools"""
        current_time = datetime.now(timezone.utc)
        hour_ago = current_time - timedelta(hours=1)

        # Group by user agent
        user_agent_counts = defaultdict(int)
        for event in self.events_medium:
            if (
                event.timestamp >= hour_ago and event.user_agent and len(event.user_agent) > 10
            ):  # Filter out short/empty user agents
                user_agent_counts[event.user_agent] += 1

        # Check for suspicious user agents
        for user_agent, count in user_agent_counts.items():
            if count > self.thresholds["suspicious_user_agent_threshold"]:
                self._send_alert(
                    AlertType.SUSPICIOUS_OAUTH_PATTERN,
                    ThreatLevel.MEDIUM,
                    "Suspicious user agent pattern detected",
                    {
                        "user_agent": user_agent[:100],  # Truncate for logging
                        "request_count": count,
                        "pattern": "high_frequency_user_agent",
                    },
                )

    def _analyze_temporal_patterns(self):
        """Analyze temporal patterns for anomalies"""
        current_time = datetime.now(timezone.utc)

        # Analyze requests by hour for last 24 hours
        hourly_counts = defaultdict(int)
        for event in self.events_long:
            if event.timestamp >= current_time - timedelta(hours=24):
                hour = event.timestamp.hour
                hourly_counts[hour] += 1

        # Check for unusual spikes
        if len(hourly_counts) >= 3:
            counts = list(hourly_counts.values())
            mean_hourly = statistics.mean(counts)

            # Alert if current hour has > 5x average
            current_hour_count = hourly_counts[current_time.hour]
            if current_hour_count > mean_hourly * 5 and current_hour_count > 50:
                self._send_alert(
                    AlertType.AUTHENTICATION_ANOMALY,
                    ThreatLevel.MEDIUM,
                    "Unusual spike in OAuth activity",
                    {
                        "current_hour_requests": current_hour_count,
                        "hourly_average": mean_hourly,
                        "spike_ratio": current_hour_count / mean_hourly if mean_hourly > 0 else 0,
                    },
                )

    async def _monitor_provider_health(self):
        """Monitor OAuth provider health and availability"""
        while self.monitoring_active:
            try:
                for provider, health in self.provider_health.items():
                    # Check if provider hasn't had success in last hour
                    if health["last_success"]:
                        time_since_success = datetime.now(timezone.utc) - health["last_success"]
                        if (
                            time_since_success > timedelta(hours=1)
                            and health["status"] == "healthy"
                        ):
                            health["status"] = "degraded"
                            self._send_alert(
                                AlertType.PROVIDER_AVAILABILITY,
                                ThreatLevel.MEDIUM,
                                f"OAuth provider {provider} has not had successful authentication in over 1 hour",
                                {
                                    "provider": provider,
                                    "time_since_success": str(time_since_success),
                                },
                            )

                await asyncio.sleep(600)  # Check every 10 minutes

            except Exception as e:
                self.logger.error(f"Provider health monitoring error: {str(e)}")
                await asyncio.sleep(600)

    async def _cleanup_old_events(self):
        """Clean up old events and data structures"""
        while self.monitoring_active:
            try:
                current_time = datetime.now(timezone.utc)

                # Clean IP activity older than 24 hours
                for ip in list(self.ip_activity.keys()):
                    cutoff_time = current_time - timedelta(hours=24)
                    self.ip_activity[ip] = deque(
                        [ts for ts in self.ip_activity[ip] if ts >= cutoff_time], maxlen=100
                    )

                    # Remove empty entries
                    if not self.ip_activity[ip]:
                        del self.ip_activity[ip]

                # Clean blocked IPs older than 24 hours (in production, use more sophisticated logic)
                # This is a simple implementation - in production, use database with expiration

                await asyncio.sleep(3600)  # Clean every hour

            except Exception as e:
                self.logger.error(f"Cleanup task error: {str(e)}")
                await asyncio.sleep(3600)

    def _send_alert(
        self,
        alert_type: AlertType,
        threat_level: ThreatLevel,
        message: str,
        details: Dict[str, Any],
    ):
        """
        Send security alert

        Args:
            alert_type: Type of alert
            threat_level: Threat level
            message: Alert message
            details: Additional alert details
        """
        # Check alert cooldown
        alert_key = f"{alert_type.value}:{details.get('source_ip', 'global')}"
        current_time = time.time()

        if alert_key in self.last_alerts:
            if current_time - self.last_alerts[alert_key] < self.alert_cooldown:
                return  # Skip duplicate alert within cooldown period

        self.last_alerts[alert_key] = current_time

        # Create alert payload
        alert_data = {
            "alert_type": alert_type.value,
            "threat_level": threat_level.value,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details,
            "environment": settings.ENVIRONMENT,
            "application": "ai-doc-editor-oauth",
        }

        # Log the alert
        security_logger.log_security_event(
            event_type=alert_type.value,
            severity=threat_level.value,
            description=message,
            source="oauth_monitoring",
            **details,
        )

        # In production, send to external alerting system
        # Examples: PagerDuty, Slack, email, SMS, etc.
        self._send_external_alert(alert_data)

    def _send_external_alert(self, alert_data: Dict[str, Any]):
        """
        Send alert to external systems

        In production, implement integrations with:
        - PagerDuty for critical alerts
        - Slack for team notifications
        - Email for security team
        - SIEM systems for security operations
        """
        # Example implementation (replace with actual integrations)
        if alert_data["threat_level"] in ["high", "critical"]:
            self.logger.critical(f"SECURITY ALERT: {alert_data['message']}", extra=alert_data)

            # Example: Send to webhook
            # await self._send_webhook_alert(alert_data)

            # Example: Send email
            # await self._send_email_alert(alert_data)

        else:
            self.logger.warning(f"Security notification: {alert_data['message']}", extra=alert_data)

    def get_security_metrics(self, timeframe_hours: int = 24) -> SecurityMetrics:
        """
        Get OAuth security metrics for specified timeframe

        Args:
            timeframe_hours: Hours to look back for metrics

        Returns:
            SecurityMetrics object with current metrics
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=timeframe_hours)
        events = self._select_event_store(timeframe_hours)
        metrics = SecurityMetrics()

        for event in events:
            if event.timestamp >= cutoff_time:
                self._process_event_for_metrics(event, metrics)

        return metrics

    def _select_event_store(self, timeframe_hours: int) -> deque:
        """Select appropriate event store based on timeframe"""
        if timeframe_hours <= 1:
            return self.events_short
        elif timeframe_hours <= 24:
            return self.events_medium
        else:
            return self.events_long

    def _process_event_for_metrics(self, event: SecurityEvent, metrics: SecurityMetrics):
        """Process a single event for metrics calculation"""
        metrics.oauth_attempts += 1
        metrics.unique_ips.add(event.source_ip)

        self._update_success_failure_metrics(event, metrics)
        self._update_specific_event_metrics(event, metrics)
        self._update_provider_error_metrics(event, metrics)

    def _update_success_failure_metrics(self, event: SecurityEvent, metrics: SecurityMetrics):
        """Update success/failure metrics"""
        if "success" in event.details.get("status", ""):
            metrics.oauth_successes += 1
        else:
            metrics.oauth_failures += 1

    def _update_specific_event_metrics(self, event: SecurityEvent, metrics: SecurityMetrics):
        """Update metrics for specific event types"""
        event_type_handlers = {
            "rate_limit_violation": lambda: setattr(
                metrics, "rate_limit_violations", metrics.rate_limit_violations + 1
            ),
            "invalid_redirect_uri": lambda: setattr(
                metrics, "invalid_redirect_attempts", metrics.invalid_redirect_attempts + 1
            ),
            "pkce_violation": lambda: setattr(metrics, "pkce_failures", metrics.pkce_failures + 1),
            "state_violation": lambda: setattr(
                metrics, "state_validation_failures", metrics.state_validation_failures + 1
            ),
        }

        # Handle specific event types
        if event.event_type in event_type_handlers:
            event_type_handlers[event.event_type]()
        elif event.event_type == "token_validation" and not event.details.get("success"):
            metrics.token_validation_failures += 1
        elif event.threat_level in [ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
            metrics.suspicious_patterns_detected += 1

    def _update_provider_error_metrics(self, event: SecurityEvent, metrics: SecurityMetrics):
        """Update provider error metrics"""
        if not event.details.get("success", True):
            metrics.provider_errors[event.provider] += 1

    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring system status"""
        return {
            "monitoring_active": self.monitoring_active,
            "events_stored": {
                "short_window": len(self.events_short),
                "medium_window": len(self.events_medium),
                "long_window": len(self.events_long),
            },
            "ip_tracking": {
                "active_ips": len(self.ip_activity),
                "blocked_ips": len(self.blocked_ips),
            },
            "provider_health": self.provider_health,
            "thresholds": self.thresholds,
            "alerts_sent_today": len(
                [
                    alert_time
                    for alert_time in self.last_alerts.values()
                    if time.time() - alert_time < 86400
                ]
            ),
        }

    def stop_monitoring(self):
        """Stop monitoring tasks"""
        self.monitoring_active = False

    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is currently blocked"""
        return ip in self.blocked_ips

    def unblock_ip(self, ip: str) -> bool:
        """Unblock an IP address"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
            self.logger.info(f"IP {ip} has been unblocked")
            return True
        return False


# Global monitoring instance
oauth_monitor = OAuthSecurityMonitor()


def get_oauth_security_dashboard() -> Dict[str, Any]:
    """Get OAuth security dashboard data"""
    metrics_1h = oauth_monitor.get_security_metrics(1)
    metrics_24h = oauth_monitor.get_security_metrics(24)
    monitoring_status = oauth_monitor.get_monitoring_status()

    return {
        "monitoring_status": monitoring_status,
        "metrics_last_hour": {
            "oauth_attempts": metrics_1h.oauth_attempts,
            "oauth_failures": metrics_1h.oauth_failures,
            "unique_ips": len(metrics_1h.unique_ips),
            "rate_limit_violations": metrics_1h.rate_limit_violations,
            "suspicious_patterns": metrics_1h.suspicious_patterns_detected,
        },
        "metrics_last_24h": {
            "oauth_attempts": metrics_24h.oauth_attempts,
            "oauth_successes": metrics_24h.oauth_successes,
            "oauth_failures": metrics_24h.oauth_failures,
            "unique_ips": len(metrics_24h.unique_ips),
            "success_rate": (metrics_24h.oauth_successes / max(metrics_24h.oauth_attempts, 1))
            * 100,
            "provider_errors": dict(metrics_24h.provider_errors),
        },
        "security_summary": {
            "threat_level": _calculate_overall_threat_level(metrics_1h, metrics_24h),
            "blocked_ips": len(oauth_monitor.blocked_ips),
            "provider_health": monitoring_status["provider_health"],
            "recommendations": _get_security_recommendations(metrics_1h, metrics_24h),
        },
    }


def _calculate_overall_threat_level(
    metrics_1h: SecurityMetrics, metrics_24h: SecurityMetrics
) -> str:
    """Calculate overall threat level based on metrics"""
    critical_indicators = 0

    # High failure rate
    if metrics_1h.oauth_attempts > 0:
        failure_rate = metrics_1h.oauth_failures / metrics_1h.oauth_attempts
        if failure_rate > 0.5:
            critical_indicators += 1

    # High rate limit violations
    if metrics_1h.rate_limit_violations > 5:
        critical_indicators += 1

    # Suspicious patterns
    if metrics_1h.suspicious_patterns_detected > 3:
        critical_indicators += 1

    # Many invalid redirect attempts
    if metrics_1h.invalid_redirect_attempts > 2:
        critical_indicators += 1

    if critical_indicators >= 3:
        return "critical"
    elif critical_indicators >= 2:
        return "high"
    elif critical_indicators >= 1:
        return "medium"
    else:
        return "low"


def _get_security_recommendations(
    metrics_1h: SecurityMetrics, metrics_24h: SecurityMetrics
) -> List[str]:
    """Get security recommendations based on current metrics"""
    recommendations = []

    # High failure rate
    if metrics_1h.oauth_attempts > 0:
        failure_rate = metrics_1h.oauth_failures / metrics_1h.oauth_attempts
        if failure_rate > 0.3:
            recommendations.append(
                "High OAuth failure rate detected. Review authentication flows and provider configurations."
            )

    # Rate limiting
    if metrics_1h.rate_limit_violations > 2:
        recommendations.append(
            "Multiple rate limit violations detected. Consider tightening rate limits or investigating automated attacks."
        )

    # Provider errors
    if any(count > 5 for count in metrics_24h.provider_errors.values()):
        recommendations.append(
            "High error rate with OAuth providers. Check provider status and credential validity."
        )

    # Suspicious activity
    if metrics_1h.suspicious_patterns_detected > 1:
        recommendations.append(
            "Suspicious OAuth activity detected. Review security logs and consider additional monitoring."
        )

    if not recommendations:
        recommendations.append(
            "OAuth security metrics are within normal ranges. Continue monitoring."
        )

    return recommendations
