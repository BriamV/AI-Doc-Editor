"""
Base security classes for shared security validation and rate limiting
Consolidates security patterns across security and service modules
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
from threading import Lock

from app.core.base_validators import BaseSecurityValidator, BaseRateLimitValidator


class BaseSecurityContext:
    """
    Base class for security context management
    Provides shared security state and configuration
    """

    def __init__(self):
        self.security_config = {
            "max_login_attempts": 5,
            "lockout_duration_minutes": 15,
            "session_timeout_minutes": 30,
            "password_min_length": 8,
            "require_mfa": False,
        }

        self.threat_levels = {"low": 0, "medium": 25, "high": 50, "critical": 75}

    def get_threat_level_score(self, level: str) -> int:
        """Get numeric score for threat level"""
        return self.threat_levels.get(level.lower(), 0)

    def calculate_composite_threat_score(self, factors: List[str]) -> int:
        """Calculate composite threat score from multiple factors"""
        base_scores = {
            "suspicious_pattern": 20,
            "unusual_time": 10,
            "multiple_ips": 15,
            "rate_limit_exceeded": 25,
            "invalid_credentials": 30,
            "privilege_escalation": 40,
        }

        total_score = sum(base_scores.get(factor, 5) for factor in factors)
        return min(total_score, 100)  # Cap at 100


class BaseAccessValidator(BaseSecurityValidator):
    """
    Base class for access validation
    Provides shared access control patterns
    """

    def __init__(self):
        super().__init__()
        self.security_context = BaseSecurityContext()

    def validate_user_access(
        self,
        user_id: str,
        user_role: str,
        required_roles: List[str],
        ip_address: Optional[str] = None,
        resource_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive user access validation

        Args:
            user_id: User requesting access
            user_role: Role of the user
            required_roles: List of acceptable roles
            ip_address: Client IP address
            resource_type: Type of resource being accessed

        Returns:
            dict: Comprehensive validation result
        """
        self.reset_errors()

        validation_result = {
            "allowed": False,
            "user_id": user_id,
            "security_flags": [],
            "threat_score": 0,
            "recommendations": [],
        }

        # 1. Role-based access control
        if not self.validate_user_role(user_role, required_roles):
            validation_result["security_flags"].append("insufficient_privileges")
            validation_result["threat_score"] += 30
            validation_result["recommendations"].append("Request elevated privileges")
            return validation_result

        # 2. IP address validation if provided
        if ip_address:
            ip_validation = self.validate_ip_address(ip_address)
            if not ip_validation["valid"]:
                validation_result["security_flags"].extend(ip_validation["flags"])
                validation_result["threat_score"] += 15

            # Check for suspicious IP flags
            if "reserved_ip" in ip_validation["flags"]:
                validation_result["security_flags"].append("suspicious_ip")
                validation_result["threat_score"] += 25

        # 3. Time-based validation
        time_validation = self.validate_access_time()
        if not time_validation["normal_hours"]:
            validation_result["security_flags"].append("unusual_access_time")
            validation_result["threat_score"] += 10
            validation_result["recommendations"].append("Verify off-hours access requirement")

        # 4. Resource-specific validation
        if resource_type and not self._validate_resource_access(user_role, resource_type):
            validation_result["security_flags"].append("unauthorized_resource_access")
            validation_result["threat_score"] += 35

        # Determine final access decision
        if validation_result["threat_score"] < 50 and not any(
            flag in validation_result["security_flags"]
            for flag in ["insufficient_privileges", "suspicious_ip", "unauthorized_resource_access"]
        ):
            validation_result["allowed"] = True

        return validation_result

    def _validate_resource_access(self, user_role: str, resource_type: str) -> bool:
        """
        Validate access to specific resource types
        Override in subclasses for specific resource logic
        """
        # Default implementation - admins can access everything
        return user_role == "admin"


class BaseRateLimiter(BaseRateLimitValidator):
    """
    In-memory rate limiter implementation
    Provides shared rate limiting logic with configurable windows
    """

    def __init__(self):
        super().__init__()
        self._rate_limit_store = defaultdict(lambda: deque())
        self._rate_limit_lock = Lock()

        # Default rate limit configurations
        self.rate_limits = {
            "api_access": {"max_requests": 100, "window_minutes": 15},
            "login_attempts": {"max_requests": 5, "window_minutes": 15},
            "admin_operations": {"max_requests": 50, "window_minutes": 10},
            "password_reset": {"max_requests": 3, "window_minutes": 60},
            "data_export": {"max_requests": 5, "window_minutes": 60},
        }

    def is_rate_limited(self, identifier: str, limit_type: str) -> bool:
        """
        Check if identifier is rate limited

        Args:
            identifier: Unique identifier for rate limiting
            limit_type: Type of rate limit to apply

        Returns:
            bool: True if rate limited
        """
        limit_config = self.rate_limits.get(limit_type)
        if not limit_config:
            return False

        now = datetime.now()
        window_start = now - timedelta(minutes=limit_config["window_minutes"])

        with self._rate_limit_lock:
            # Clean old entries
            request_times = self._rate_limit_store[identifier]
            while request_times and request_times[0] < window_start:
                request_times.popleft()

            # Check if limit exceeded
            if len(request_times) >= limit_config["max_requests"]:
                return True

            # Add current request
            request_times.append(now)
            return False

    def get_rate_limit_info(self, identifier: str, limit_type: str) -> Dict[str, Any]:
        """
        Get detailed rate limit information for an identifier

        Args:
            identifier: Unique identifier
            limit_type: Type of rate limit

        Returns:
            dict: Rate limit information
        """
        limit_config = self.rate_limits.get(limit_type, {})

        if not limit_config:
            return {"error": "Unknown limit type"}

        now = datetime.now()
        window_start = now - timedelta(minutes=limit_config["window_minutes"])

        with self._rate_limit_lock:
            request_times = self._rate_limit_store[identifier]

            # Clean old entries
            while request_times and request_times[0] < window_start:
                request_times.popleft()

            current_requests = len(request_times)
            max_requests = limit_config["max_requests"]

            # Calculate reset time
            reset_time = None
            if request_times:
                oldest_request = request_times[0]
                reset_time = oldest_request + timedelta(minutes=limit_config["window_minutes"])

            return {
                "current_requests": current_requests,
                "max_requests": max_requests,
                "remaining_requests": max(0, max_requests - current_requests),
                "window_minutes": limit_config["window_minutes"],
                "reset_time": reset_time,
                "is_limited": current_requests >= max_requests,
            }

    def configure_rate_limit(self, limit_type: str, max_requests: int, window_minutes: int) -> None:
        """
        Configure rate limit for a specific type

        Args:
            limit_type: Type of rate limit
            max_requests: Maximum requests allowed
            window_minutes: Time window in minutes
        """
        config = {"max_requests": max_requests, "window_minutes": window_minutes}

        if self.validate_rate_limit_config(config):
            self.rate_limits[limit_type] = config
        else:
            raise ValueError(f"Invalid rate limit configuration: {self.errors}")


class BaseAnomalyDetector:
    """
    Base class for detecting anomalous patterns in access logs
    Provides shared anomaly detection logic
    """

    def __init__(self):
        self.anomaly_thresholds = {
            "max_user_frequency": 50,
            "max_unique_ips": 10,
            "unusual_hour_threshold": 5,
            "suspicious_user_agents": 3,
        }

    def detect_access_anomalies(self, access_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Detect anomalous access patterns

        Args:
            access_patterns: List of access events

        Returns:
            dict: Anomaly detection results
        """
        anomalies = {
            "detected": False,
            "anomaly_types": [],
            "risk_score": 0,
            "recommendations": [],
            "details": {},
        }

        if not access_patterns:
            return anomalies

        # Extract frequency data
        frequency_data = self._extract_frequency_data(access_patterns)

        # Run anomaly detection algorithms
        self._detect_user_frequency_anomaly(frequency_data["user"], anomalies)
        self._detect_ip_distribution_anomaly(frequency_data["ip"], anomalies)
        self._detect_time_pattern_anomaly(frequency_data["time"], anomalies)
        self._detect_user_agent_anomaly(frequency_data["user_agent"], anomalies)

        # Generate recommendations
        if anomalies["detected"]:
            self._generate_anomaly_recommendations(anomalies)

        return anomalies

    def _extract_frequency_data(self, access_patterns: List[Dict[str, Any]]) -> Dict[str, Dict]:
        """Extract frequency data from access patterns"""
        user_frequency = defaultdict(int)
        ip_frequency = defaultdict(int)
        time_frequency = defaultdict(int)
        user_agent_frequency = defaultdict(int)

        for event in access_patterns:
            user_frequency[event.get("user_id")] += 1
            ip_frequency[event.get("ip_address")] += 1

            timestamp = event.get("timestamp", datetime.now())
            hour = timestamp.hour if isinstance(timestamp, datetime) else datetime.now().hour
            time_frequency[hour] += 1

            user_agent = event.get("user_agent", "unknown")
            user_agent_frequency[user_agent] += 1

        return {
            "user": user_frequency,
            "ip": ip_frequency,
            "time": time_frequency,
            "user_agent": user_agent_frequency,
        }

    def _detect_user_frequency_anomaly(
        self, user_frequency: Dict, anomalies: Dict[str, Any]
    ) -> None:
        """Detect excessive frequency from single user"""
        if not user_frequency:
            return

        max_frequency = max(user_frequency.values())
        if max_frequency > self.anomaly_thresholds["max_user_frequency"]:
            anomalies["detected"] = True
            anomalies["anomaly_types"].append("excessive_user_frequency")
            anomalies["risk_score"] += 30
            anomalies["details"]["max_user_requests"] = max_frequency

    def _detect_ip_distribution_anomaly(
        self, ip_frequency: Dict, anomalies: Dict[str, Any]
    ) -> None:
        """Detect access from too many different IP addresses"""
        unique_ips = len(ip_frequency)
        if unique_ips > self.anomaly_thresholds["max_unique_ips"]:
            anomalies["detected"] = True
            anomalies["anomaly_types"].append("distributed_access")
            anomalies["risk_score"] += 20
            anomalies["details"]["unique_ip_count"] = unique_ips

    def _detect_time_pattern_anomaly(self, time_frequency: Dict, anomalies: Dict[str, Any]) -> None:
        """Detect unusual time patterns in access logs"""
        unusual_hours_count = sum(
            1
            for hour, count in time_frequency.items()
            if hour in [0, 1, 2, 3, 4, 5]
            and count > self.anomaly_thresholds["unusual_hour_threshold"]
        )

        if unusual_hours_count > 0:
            anomalies["detected"] = True
            anomalies["anomaly_types"].append("unusual_time_access")
            anomalies["risk_score"] += 15
            anomalies["details"]["unusual_hours_with_activity"] = unusual_hours_count

    def _detect_user_agent_anomaly(
        self, user_agent_frequency: Dict, anomalies: Dict[str, Any]
    ) -> None:
        """Detect suspicious user agent patterns"""
        suspicious_patterns = ["bot", "crawler", "scraper", "python", "curl", "wget"]

        suspicious_count = sum(
            1
            for ua in user_agent_frequency.keys()
            if ua and any(pattern in ua.lower() for pattern in suspicious_patterns)
        )

        if suspicious_count > self.anomaly_thresholds["suspicious_user_agents"]:
            anomalies["detected"] = True
            anomalies["anomaly_types"].append("suspicious_user_agents")
            anomalies["risk_score"] += 25
            anomalies["details"]["suspicious_user_agent_count"] = suspicious_count

    def _generate_anomaly_recommendations(self, anomalies: Dict[str, Any]) -> None:
        """Generate recommendations based on detected anomalies"""
        recommendations_map = {
            "excessive_user_frequency": "Implement stricter rate limiting for this user",
            "distributed_access": "Review IP whitelist policies and implement geo-blocking",
            "unusual_time_access": "Implement time-based access controls and alert policies",
            "suspicious_user_agents": "Block automated tools and implement CAPTCHA",
        }

        for anomaly_type in anomalies["anomaly_types"]:
            if anomaly_type in recommendations_map:
                anomalies["recommendations"].append(recommendations_map[anomaly_type])


class BaseSecurityLogger:
    """
    Base class for security event logging
    Provides shared security logging patterns
    """

    def __init__(self):
        self.log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        self.security_event_types = [
            "LOGIN_SUCCESS",
            "LOGIN_FAILURE",
            "UNAUTHORIZED_ACCESS",
            "PERMISSION_DENIED",
            "RATE_LIMIT_EXCEEDED",
            "SUSPICIOUS_ACTIVITY",
            "ADMIN_ACTION",
            "DATA_ACCESS",
            "SECURITY_CONFIG_CHANGE",
        ]

    def log_security_event(
        self,
        event_type: str,
        details: Dict[str, Any],
        level: str = "INFO",
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """
        Log security event with structured data

        Args:
            event_type: Type of security event
            details: Event details dictionary
            level: Log level
            user_id: User associated with event
            ip_address: IP address associated with event
        """
        if level not in self.log_levels:
            level = "INFO"

        if event_type not in self.security_event_types:
            event_type = "GENERAL_SECURITY_EVENT"

        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "level": level,
            "user_id": user_id,
            "ip_address": ip_address,
            "details": details,
        }

        # In production, this would go to a proper logging system
        self._write_security_log(log_entry)

    def _write_security_log(self, log_entry: Dict[str, Any]) -> None:
        """
        Write security log entry
        Override in subclasses for specific logging implementation
        """
        # Default implementation - print to console
        print(f"SECURITY_LOG: {log_entry}")

    def create_security_alert(
        self, alert_type: str, severity: str, message: str, details: Dict[str, Any]
    ) -> None:
        """
        Create security alert for high-priority events

        Args:
            alert_type: Type of alert
            severity: Alert severity (low, medium, high, critical)
            message: Alert message
            details: Additional alert details
        """
        alert = {
            "timestamp": datetime.utcnow().isoformat(),
            "alert_type": alert_type,
            "severity": severity,
            "message": message,
            "details": details,
            "requires_attention": severity in ["high", "critical"],
        }

        # Log as security event
        self.log_security_event(
            "SECURITY_ALERT", alert, "WARNING" if severity in ["low", "medium"] else "ERROR"
        )

        # In production, this might trigger notifications, emails, etc.
        if alert["requires_attention"]:
            self._send_security_notification(alert)

    def _send_security_notification(self, alert: Dict[str, Any]) -> None:
        """
        Send security notification for high-priority alerts
        Override in subclasses for specific notification implementation
        """
        # Default implementation - print to console
        print(f"SECURITY_ALERT: {alert['severity'].upper()} - {alert['message']}")
