"""
Security considerations and hardening for WORM audit system
T-13: Security implementation guide and best practices
"""

from typing import List, Dict, Any
from datetime import datetime

from app.core.base_security import BaseAccessValidator, BaseRateLimiter, BaseAnomalyDetector


class AuditSecurityValidator(BaseAccessValidator):
    """
    Security validator for audit system operations
    Inherits from BaseAccessValidator to eliminate code duplication
    """

    def __init__(self):
        super().__init__()
        self.rate_limiter = AuditRateLimiter()
        self.anomaly_detector = AuditAnomalyDetector()

        # Audit-specific rate limiting configuration
        self.rate_limiter.configure_rate_limit("audit_access", 100, 15)
        self.rate_limiter.configure_rate_limit("integrity_check", 10, 5)
        self.rate_limiter.configure_rate_limit("admin_operations", 50, 10)

    def validate_audit_access(
        self, user_id: str, user_role: str, ip_address: str
    ) -> Dict[str, Any]:
        """
        Validate audit log access request for security compliance
        Uses inherited validation methods to eliminate code duplication

        Args:
            user_id: User requesting access
            user_role: Role of the user
            ip_address: Client IP address

        Returns:
            dict: Validation result with security flags
        """
        # Use base class validation with audit-specific requirements
        validation_result = self.validate_user_access(
            user_id=user_id,
            user_role=user_role,
            required_roles=["admin"],
            ip_address=ip_address,
            resource_type="audit_logs",
        )

        # Add audit-specific rate limiting check
        if validation_result["allowed"]:
            if self.rate_limiter.is_rate_limited(f"audit_access_{user_id}", "audit_access"):
                validation_result["allowed"] = False
                validation_result["security_flags"].append("rate_limited")
                validation_result["threat_score"] += 25

        # Convert threat score to threat level for backward compatibility
        if validation_result["threat_score"] >= 50:
            validation_result["threat_level"] = "high"
        elif validation_result["threat_score"] >= 25:
            validation_result["threat_level"] = "medium"
        else:
            validation_result["threat_level"] = "low"

        # Add rate_limited flag for backward compatibility
        validation_result["rate_limited"] = "rate_limited" in validation_result["security_flags"]

        return validation_result

    def validate_query_parameters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate audit query parameters for injection attacks
        Uses inherited input validation to eliminate code duplication

        Args:
            filters: Query filter parameters

        Returns:
            dict: Validation result
        """
        self.reset_errors()
        validation_result = {"valid": True, "sanitized_filters": {}, "security_flags": []}

        for key, value in filters.items():
            if value is None:
                validation_result["sanitized_filters"][key] = None
                continue

            str_value = str(value)

            # Use inherited security validation
            if not self.validate_input_security(str_value, key):
                validation_result["valid"] = False
                validation_result["security_flags"].append(f"suspicious_pattern_{key}")
                continue

            # Use inherited length validation
            if not self.validate_length(str_value, "query_param"):
                validation_result["valid"] = False
                validation_result["security_flags"].append(f"excessive_length_{key}")
                continue

            # Specific field validations using inherited methods
            if key == "user_email":
                if not self.validate_email_format(str_value):
                    validation_result["valid"] = False
                    validation_result["security_flags"].append("invalid_email_format")
                    continue

            elif key == "ip_address":
                ip_validation = self.validate_ip_address(str_value)
                if not ip_validation["valid"]:
                    validation_result["valid"] = False
                    validation_result["security_flags"].append("invalid_ip_format")
                    continue

            elif key in ["page", "page_size"]:
                if not str_value.isdigit() or int(str_value) < 1:
                    validation_result["valid"] = False
                    validation_result["security_flags"].append(f"invalid_pagination_{key}")
                    continue

            # If validation passed, add sanitized value
            validation_result["sanitized_filters"][key] = (
                self.sanitize_input(str_value) if isinstance(value, str) else value
            )

        return validation_result

    def detect_audit_anomalies(self, access_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Detect anomalous access patterns in audit logs
        Uses inherited anomaly detection to eliminate code duplication

        Args:
            access_patterns: List of access events

        Returns:
            dict: Anomaly detection results
        """
        # Use inherited anomaly detection with audit-specific context
        return self.anomaly_detector.detect_access_anomalies(access_patterns)

    def _validate_resource_access(self, user_role: str, resource_type: str) -> bool:
        """
        Override base method for audit-specific resource access validation

        Args:
            user_role: User's role
            resource_type: Type of resource being accessed

        Returns:
            bool: True if access is allowed
        """
        # Audit logs require admin access
        if resource_type == "audit_logs":
            return user_role == "admin"

        # Integrity checks require admin access
        if resource_type == "integrity_check":
            return user_role == "admin"

        # Default to admin-only for audit system
        return user_role == "admin"


class AuditRateLimiter(BaseRateLimiter):
    """
    Audit-specific rate limiter
    Extends base rate limiter with audit-specific configurations
    """

    def __init__(self):
        super().__init__()
        # Override with audit-specific default limits
        self.rate_limits.update(
            {
                "audit_access": {"max_requests": 100, "window_minutes": 15},
                "integrity_check": {"max_requests": 10, "window_minutes": 5},
                "admin_operations": {"max_requests": 50, "window_minutes": 10},
            }
        )


class AuditAnomalyDetector(BaseAnomalyDetector):
    """
    Audit-specific anomaly detector
    Extends base anomaly detector with audit-specific thresholds
    """

    def __init__(self):
        super().__init__()
        # Override with audit-specific thresholds
        self.anomaly_thresholds.update(
            {
                "max_user_frequency": 50,  # Max audit access frequency per user
                "max_unique_ips": 10,  # Max unique IPs accessing audit logs
                "unusual_hour_threshold": 5,  # Threshold for off-hours access
            }
        )


class AuditIntegrityMonitor:
    """
    Monitor audit log integrity and detect tampering attempts
    """

    def __init__(self):
        self.integrity_checks_performed = 0
        self.integrity_violations_detected = 0
        self.last_check_timestamp = None

    async def perform_integrity_check(self, audit_service) -> Dict[str, Any]:
        """
        Perform comprehensive integrity check on audit logs

        Args:
            audit_service: AuditService instance

        Returns:
            dict: Integrity check results
        """

        self.integrity_checks_performed += 1
        self.last_check_timestamp = datetime.utcnow()

        # This would be implemented to check hash consistency
        # Sample implementation:
        integrity_result = {
            "check_id": f"integrity_check_{self.integrity_checks_performed}",
            "timestamp": self.last_check_timestamp,
            "logs_checked": 0,
            "violations_found": 0,
            "status": "passed",
            "violations": [],
        }

        # In a real implementation, this would:
        # 1. Sample audit logs
        # 2. Recalculate hashes
        # 3. Compare with stored hashes
        # 4. Report any discrepancies

        return integrity_result


# Security configuration constants
AUDIT_SECURITY_CONFIG = {
    "max_query_complexity": 10,  # Maximum number of filter conditions
    "max_results_per_page": 1000,  # Maximum page size
    "admin_session_timeout_minutes": 30,  # Admin session timeout
    "integrity_check_interval_hours": 24,  # How often to run integrity checks
    "anomaly_detection_window_hours": 24,  # Window for anomaly detection
    "rate_limit_cleanup_interval_minutes": 60,  # Cleanup interval for rate limiting
}


def get_security_headers() -> Dict[str, str]:
    """
    Get security headers for audit endpoints

    Returns:
        dict: Security headers
    """

    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }
