"""
Base validation classes for shared validation logic across the application
Eliminates duplication in security and service modules
"""

import re
import ipaddress
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Pattern
from datetime import datetime


class BaseValidator(ABC):
    """
    Abstract base class for all validators
    Provides common validation infrastructure and error handling
    """

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def reset_errors(self) -> None:
        """Reset error and warning lists"""
        self.errors.clear()
        self.warnings.clear()

    def add_error(self, error: str) -> None:
        """Add validation error"""
        self.errors.append(error)

    def add_warning(self, warning: str) -> None:
        """Add validation warning"""
        self.warnings.append(warning)

    def is_valid(self) -> bool:
        """Check if validation passed (no errors)"""
        return len(self.errors) == 0

    def get_validation_result(self) -> Dict[str, Any]:
        """Get comprehensive validation result"""
        return {
            "valid": self.is_valid(),
            "errors": self.errors.copy(),
            "warnings": self.warnings.copy(),
        }


class BaseInputValidator(BaseValidator):
    """
    Base class for input validation with common security patterns
    Provides shared logic for input sanitization and threat detection
    """

    def __init__(self):
        super().__init__()
        self.suspicious_patterns: List[Pattern] = self._initialize_security_patterns()
        self.max_length_limits = {
            "general": 1000,
            "email": 254,
            "ip": 45,  # IPv6 max length
            "query_param": 500,
            "description": 2000,
        }

    def _initialize_security_patterns(self) -> List[Pattern]:
        """Initialize compiled regex patterns for threat detection"""
        patterns = [
            re.compile(
                r"(union|select|insert|update|delete|drop|create|alter)", re.IGNORECASE
            ),  # SQL injection
            re.compile(r"(<script|javascript:|data:)", re.IGNORECASE),  # XSS
            re.compile(r"(\.\./|\.\.\\)", re.IGNORECASE),  # Path traversal
            re.compile(r"(exec|eval|system|shell)", re.IGNORECASE),  # Command injection
            re.compile(r"(onload|onerror|onclick)", re.IGNORECASE),  # Event handler injection
        ]
        return patterns

    def validate_input_security(self, value: str, field_name: str = "input") -> bool:
        """
        Validate input for security threats

        Args:
            value: Input value to validate
            field_name: Name of the field being validated

        Returns:
            bool: True if input is safe
        """
        if not value:
            return True

        # Check for suspicious patterns
        for pattern in self.suspicious_patterns:
            if pattern.search(value):
                self.add_error(f"Suspicious pattern detected in {field_name}")
                return False

        return True

    def validate_length(
        self, value: str, field_name: str, max_length: Optional[int] = None
    ) -> bool:
        """
        Validate input length

        Args:
            value: Input value to validate
            field_name: Name of the field being validated
            max_length: Maximum allowed length (uses default if None)

        Returns:
            bool: True if length is valid
        """
        if not value:
            return True

        limit = max_length or self.max_length_limits.get(
            field_name, self.max_length_limits["general"]
        )

        if len(value) > limit:
            self.add_error(f"{field_name} exceeds maximum length of {limit} characters")
            return False

        return True

    def sanitize_input(self, value: str) -> str:
        """
        Sanitize input by removing potentially dangerous characters

        Args:
            value: Input value to sanitize

        Returns:
            str: Sanitized input
        """
        if not value:
            return value

        # Remove null bytes and control characters
        sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)

        # Normalize whitespace
        sanitized = re.sub(r"\s+", " ", sanitized).strip()

        return sanitized


class BaseQueryValidator(BaseInputValidator):
    """
    Base class for query parameter validation
    Provides shared logic for filtering and pagination validation
    """

    def __init__(self):
        super().__init__()
        self.valid_sort_orders = ["asc", "desc"]
        self.pagination_limits = {
            "max_page_size": 1000,
            "min_page_size": 1,
            "min_page": 1,
        }

    def validate_pagination(self, page: int, page_size: int) -> Dict[str, Any]:
        """
        Validate pagination parameters

        Args:
            page: Page number
            page_size: Items per page

        Returns:
            dict: Validation result with sanitized values
        """
        self.reset_errors()
        result = {"valid": True, "page": page, "page_size": page_size}

        # Validate page number
        if page < self.pagination_limits["min_page"]:
            self.add_error(f"Page must be >= {self.pagination_limits['min_page']}")
            result["page"] = self.pagination_limits["min_page"]

        # Validate page size
        if page_size < self.pagination_limits["min_page_size"]:
            self.add_error(f"Page size must be >= {self.pagination_limits['min_page_size']}")
            result["page_size"] = self.pagination_limits["min_page_size"]
        elif page_size > self.pagination_limits["max_page_size"]:
            self.add_error(f"Page size must be <= {self.pagination_limits['max_page_size']}")
            result["page_size"] = self.pagination_limits["max_page_size"]

        result["valid"] = self.is_valid()
        result["errors"] = self.errors.copy()

        return result

    def validate_sort_parameters(
        self, sort_by: str, sort_order: str, allowed_fields: List[str]
    ) -> Dict[str, Any]:
        """
        Validate sorting parameters

        Args:
            sort_by: Field to sort by
            sort_order: Sort direction (asc/desc)
            allowed_fields: List of allowed sort fields

        Returns:
            dict: Validation result with sanitized values
        """
        self.reset_errors()
        result = {"valid": True, "sort_by": sort_by, "sort_order": sort_order}

        # Validate sort field
        if sort_by not in allowed_fields:
            self.add_error(f"Invalid sort field. Allowed: {', '.join(allowed_fields)}")
            result["sort_by"] = allowed_fields[0] if allowed_fields else "id"

        # Validate sort order
        if sort_order not in self.valid_sort_orders:
            self.add_error(f"Invalid sort order. Allowed: {', '.join(self.valid_sort_orders)}")
            result["sort_order"] = "desc"

        result["valid"] = self.is_valid()
        result["errors"] = self.errors.copy()

        return result


class BaseSecurityValidator(BaseInputValidator):
    """
    Base class for security-specific validation
    Provides shared security validation patterns
    """

    def __init__(self):
        super().__init__()
        self.business_hours = {"start": 8, "end": 20}  # 8 AM to 8 PM

    def validate_email_format(self, email: str) -> bool:
        """
        Validate email format using RFC-compliant regex

        Args:
            email: Email address to validate

        Returns:
            bool: True if valid email format
        """
        if not email:
            self.add_error("Email is required")
            return False

        # RFC 5322 compliant email regex (simplified)
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

        if not re.match(email_pattern, email):
            self.add_error("Invalid email format")
            return False

        if not self.validate_length(email, "email"):
            return False

        return True

    def validate_ip_address(self, ip_address: str) -> Dict[str, Any]:
        """
        Validate IP address and return security flags

        Args:
            ip_address: IP address to validate

        Returns:
            dict: Validation result with security flags
        """
        result = {"valid": True, "flags": [], "ip_type": None}

        if not ip_address:
            result["valid"] = False
            result["flags"].append("missing_ip")
            return result

        try:
            ip_obj = ipaddress.ip_address(ip_address)
            result["ip_type"] = "ipv6" if isinstance(ip_obj, ipaddress.IPv6Address) else "ipv4"

            # Check for various IP address types
            if ip_obj.is_private:
                result["flags"].append("private_ip")

            if ip_obj.is_loopback:
                result["flags"].append("loopback_ip")

            if ip_obj.is_reserved:
                result["flags"].append("reserved_ip")
                result["valid"] = False

            if ip_obj.is_multicast:
                result["flags"].append("multicast_ip")

        except ValueError:
            result["valid"] = False
            result["flags"].append("invalid_ip_format")

        return result

    def validate_access_time(self, timestamp: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Validate if access time is within normal business hours

        Args:
            timestamp: Time to validate (defaults to current time)

        Returns:
            dict: Time validation result
        """
        check_time = timestamp or datetime.now()
        hour = check_time.hour

        normal_hours = self.business_hours["start"] <= hour <= self.business_hours["end"]

        return {
            "normal_hours": normal_hours,
            "current_hour": hour,
            "timestamp": check_time,
            "warning": None if normal_hours else "Access outside normal business hours",
        }

    def validate_user_role(self, user_role: str, required_roles: List[str]) -> bool:
        """
        Validate user role against required roles

        Args:
            user_role: User's role
            required_roles: List of acceptable roles

        Returns:
            bool: True if user has required role
        """
        if not user_role:
            self.add_error("User role is required")
            return False

        if user_role not in required_roles:
            self.add_error(f"Insufficient permissions. Required: {', '.join(required_roles)}")
            return False

        return True


class BaseRateLimitValidator(BaseValidator):
    """
    Base class for rate limiting validation
    Provides shared rate limiting logic
    """

    def __init__(self):
        super().__init__()
        self.default_limits = {
            "requests_per_minute": 60,
            "requests_per_hour": 1000,
            "requests_per_day": 10000,
        }

    @abstractmethod
    def is_rate_limited(self, identifier: str, limit_type: str) -> bool:
        """
        Check if identifier is rate limited
        Implementation depends on storage backend (Redis, memory, etc.)
        """
        pass

    def get_rate_limit_key(self, identifier: str, limit_type: str) -> str:
        """
        Generate rate limit key for storage

        Args:
            identifier: Unique identifier for rate limiting
            limit_type: Type of rate limit

        Returns:
            str: Rate limit key
        """
        return f"rate_limit:{limit_type}:{identifier}"

    def validate_rate_limit_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate rate limit configuration

        Args:
            config: Rate limit configuration

        Returns:
            bool: True if configuration is valid
        """
        required_fields = ["max_requests", "window_minutes"]

        for field in required_fields:
            if field not in config:
                self.add_error(f"Missing required field: {field}")
                return False

            if not isinstance(config[field], int) or config[field] <= 0:
                self.add_error(f"Invalid {field}: must be positive integer")
                return False

        return self.is_valid()
