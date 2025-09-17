"""
Secure Logging System
T-02: OAuth security - Secure logging without credential exposure

Implements secure logging practices:
- Automatic redaction of sensitive data
- Structured JSON logging with security context
- OAuth event logging with compliance tracking
- Security event monitoring and alerting
- Log integrity verification
"""

import json
import re
import hashlib
import hmac
import logging
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Union
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

from app.core.config import settings


class SensitiveDataRedactor:
    """Redacts sensitive information from log messages"""

    # Common sensitive field patterns
    SENSITIVE_FIELD_PATTERNS = [
        r'(?i)(password|passwd|pwd)[\s]*[:=][\s]*["\']?([^"\s,}]+)',
        r'(?i)(secret|token|key|apikey|api_key)[\s]*[:=][\s]*["\']?([^"\s,}]+)',
        r'(?i)(client_secret|refresh_token|access_token)[\s]*[:=][\s]*["\']?([^"\s,}]+)',
        r'(?i)(authorization)[\s]*:[\s]*bearer[\s]+([^\s]+)',
        r'(?i)(x-api-key|x-auth-token)[\s]*:[\s]*([^\s,}]+)',
        r'(?i)(credential|auth|authentication)[\s]*[:=][\s]*["\']?([^"\s,}]+)',
    ]

    # JWT token patterns
    JWT_PATTERNS = [
        r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*',  # JWT structure
        r'Bearer[\s]+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*)',  # Bearer JWT
    ]

    # OAuth authorization code patterns
    OAUTH_CODE_PATTERNS = [
        r'(?i)(code|authorization_code)[\s]*[:=][\s]*["\']?([A-Za-z0-9_-]+)',
        r'(?i)(state)[\s]*[:=][\s]*["\']?([A-Za-z0-9_-]{20,})',  # OAuth state parameter
    ]

    # Credit card and sensitive number patterns
    SENSITIVE_NUMBER_PATTERNS = [
        r'\b(?:\d{4}[-\s]?){3}\d{4}\b',  # Credit card numbers
        r'\b\d{3}-?\d{2}-?\d{4}\b',      # SSN pattern
    ]

    # Email patterns (partial redaction)
    EMAIL_PATTERNS = [
        r'\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
    ]

    def __init__(self):
        self.redaction_marker = "***REDACTED***"
        self.partial_redaction_marker = "***PARTIAL***"

    def redact_sensitive_data(self, text: str, preserve_structure: bool = True) -> str:
        """
        Redact sensitive information from text

        Args:
            text: Text to redact
            preserve_structure: Whether to preserve original structure

        Returns:
            Text with sensitive data redacted
        """
        if not isinstance(text, str):
            return str(text)

        redacted_text = text

        # Redact sensitive fields
        for pattern in self.SENSITIVE_FIELD_PATTERNS:
            redacted_text = re.sub(
                pattern,
                r'\1=' + self.redaction_marker,
                redacted_text,
                flags=re.IGNORECASE
            )

        # Redact JWT tokens
        for pattern in self.JWT_PATTERNS:
            redacted_text = re.sub(
                pattern,
                self.redaction_marker,
                redacted_text
            )

        # Redact OAuth codes
        for pattern in self.OAUTH_CODE_PATTERNS:
            redacted_text = re.sub(
                pattern,
                r'\1=' + self.redaction_marker,
                redacted_text,
                flags=re.IGNORECASE
            )

        # Redact sensitive numbers
        for pattern in self.SENSITIVE_NUMBER_PATTERNS:
            redacted_text = re.sub(pattern, self.redaction_marker, redacted_text)

        # Partial redaction for emails (keep domain for debugging)
        if preserve_structure:
            redacted_text = re.sub(
                self.EMAIL_PATTERNS[0],
                r'\1****@\2',
                redacted_text
            )

        return redacted_text

    def redact_dict(self, data: Dict[str, Any], deep: bool = True) -> Dict[str, Any]:
        """
        Redact sensitive data from dictionary

        Args:
            data: Dictionary to redact
            deep: Whether to recursively redact nested structures

        Returns:
            Dictionary with sensitive data redacted
        """
        if not isinstance(data, dict):
            return data

        redacted = {}
        sensitive_keys = [
            'password', 'secret', 'token', 'key', 'credential', 'auth',
            'client_secret', 'refresh_token', 'access_token', 'authorization',
            'x-api-key', 'x-auth-token', 'apikey', 'api_key'
        ]

        for key, value in data.items():
            key_lower = str(key).lower()

            # Check if key is sensitive
            if any(sensitive_key in key_lower for sensitive_key in sensitive_keys):
                redacted[key] = self.redaction_marker
            elif isinstance(value, str):
                redacted[key] = self.redact_sensitive_data(value)
            elif isinstance(value, dict) and deep:
                redacted[key] = self.redact_dict(value, deep=True)
            elif isinstance(value, (list, tuple)) and deep:
                redacted[key] = [
                    self.redact_dict(item, deep=True) if isinstance(item, dict)
                    else self.redact_sensitive_data(str(item)) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                redacted[key] = value

        return redacted


class SecurityEventLogger:
    """Logger for security-related events with OAuth focus"""

    def __init__(self, name: str = "security"):
        self.logger = logging.getLogger(name)
        self.redactor = SensitiveDataRedactor()

        # Configure logger if not already configured
        if not self.logger.handlers:
            self._setup_logger()

    def _setup_logger(self):
        """Setup secure logging configuration"""
        self.logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

        # Create formatters
        json_formatter = JSONSecurityFormatter()
        console_formatter = SecureConsoleFormatter()

        # File handler for security events
        if settings.SECURITY_LOG_ENABLED:
            security_log_path = Path(settings.SECURITY_LOG_FILE)
            security_log_path.parent.mkdir(parents=True, exist_ok=True)

            file_handler = TimedRotatingFileHandler(
                security_log_path,
                when='midnight',
                interval=1,
                backupCount=settings.LOG_RETENTION_DAYS,
                encoding='utf-8'
            )
            file_handler.setLevel(logging.INFO)
            file_handler.setFormatter(json_formatter)
            self.logger.addHandler(file_handler)

        # Console handler for development
        if settings.DEBUG:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.DEBUG)
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)

    def log_oauth_event(
        self,
        event_type: str,
        provider: str,
        status: str = "success",
        user_email: Optional[str] = None,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        **kwargs
    ):
        """
        Log OAuth-specific security events

        Args:
            event_type: Type of OAuth event (login, callback, token_refresh, etc.)
            provider: OAuth provider (google, microsoft)
            status: Event status (success, failure, error)
            user_email: User email (will be partially redacted)
            client_ip: Client IP address
            user_agent: User agent string
            **kwargs: Additional event data
        """
        event_data = {
            "event_category": "oauth",
            "event_type": event_type,
            "provider": provider,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_email": self._redact_email(user_email) if user_email else None,
            "client_ip": client_ip,
            "user_agent": self._sanitize_user_agent(user_agent) if user_agent else None,
            **kwargs
        }

        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}

        # Redact sensitive data
        sanitized_data = self.redactor.redact_dict(event_data)

        # Log based on status
        if status == "success":
            self.logger.info(f"OAuth {event_type} successful", extra=sanitized_data)
        elif status == "failure":
            self.logger.warning(f"OAuth {event_type} failed", extra=sanitized_data)
        else:
            self.logger.error(f"OAuth {event_type} error", extra=sanitized_data)

    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        source: Optional[str] = None,
        **kwargs
    ):
        """
        Log general security events

        Args:
            event_type: Type of security event
            severity: Event severity (low, medium, high, critical)
            description: Event description
            source: Event source (e.g., middleware, auth, api)
            **kwargs: Additional event data
        """
        event_data = {
            "event_category": "security",
            "event_type": event_type,
            "severity": severity.lower(),
            "description": description,
            "source": source,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **kwargs
        }

        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}

        # Redact sensitive data
        sanitized_data = self.redactor.redact_dict(event_data)

        # Log based on severity
        if severity.lower() == "critical":
            self.logger.critical(f"Critical security event: {event_type}", extra=sanitized_data)
        elif severity.lower() == "high":
            self.logger.error(f"High severity security event: {event_type}", extra=sanitized_data)
        elif severity.lower() == "medium":
            self.logger.warning(f"Medium severity security event: {event_type}", extra=sanitized_data)
        else:
            self.logger.info(f"Security event: {event_type}", extra=sanitized_data)

    def log_audit_event(
        self,
        action: str,
        resource: str,
        user_id: Optional[str] = None,
        success: bool = True,
        **kwargs
    ):
        """
        Log audit trail events

        Args:
            action: Action performed (create, read, update, delete)
            resource: Resource accessed
            user_id: User performing action
            success: Whether action was successful
            **kwargs: Additional audit data
        """
        event_data = {
            "event_category": "audit",
            "action": action,
            "resource": resource,
            "user_id": user_id,
            "success": success,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **kwargs
        }

        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}

        # Redact sensitive data
        sanitized_data = self.redactor.redact_dict(event_data)

        if success:
            self.logger.info(f"Audit: {action} {resource}", extra=sanitized_data)
        else:
            self.logger.warning(f"Audit failed: {action} {resource}", extra=sanitized_data)

    def _redact_email(self, email: str) -> str:
        """Partially redact email for privacy while keeping domain for debugging"""
        if not email or '@' not in email:
            return email

        local, domain = email.split('@', 1)
        if len(local) <= 2:
            redacted_local = '*' * len(local)
        else:
            redacted_local = local[0] + '*' * (len(local) - 2) + local[-1]

        return f"{redacted_local}@{domain}"

    def _sanitize_user_agent(self, user_agent: str) -> str:
        """Sanitize user agent string to remove potentially sensitive information"""
        if not user_agent:
            return user_agent

        # Remove version numbers that might contain sensitive info
        sanitized = re.sub(r'/[\d.]+', '/***', user_agent)

        # Truncate if too long
        return sanitized[:200] + '...' if len(sanitized) > 200 else sanitized


class JSONSecurityFormatter(logging.Formatter):
    """JSON formatter for structured security logging"""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        # Base log data
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra data if present
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                              'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                              'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                              'thread', 'threadName', 'processName', 'process', 'getMessage']:
                    log_data[key] = value

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Calculate log integrity hash
        log_data["integrity_hash"] = self._calculate_integrity_hash(log_data)

        return json.dumps(log_data, default=str, ensure_ascii=False)

    def _calculate_integrity_hash(self, log_data: Dict[str, Any]) -> str:
        """Calculate integrity hash for log entry"""
        if not settings.AUDIT_INTEGRITY_CHECKS:
            return ""

        # Create deterministic string representation
        sorted_data = json.dumps(log_data, sort_keys=True, default=str)

        # Calculate HMAC
        key = settings.AUDIT_ENCRYPTION_KEY.encode('utf-8')
        return hmac.new(key, sorted_data.encode('utf-8'), hashlib.sha256).hexdigest()[:16]


class SecureConsoleFormatter(logging.Formatter):
    """Console formatter with sensitive data redaction"""

    def __init__(self):
        super().__init__(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        self.redactor = SensitiveDataRedactor()

    def format(self, record: logging.LogRecord) -> str:
        """Format log record for console with redaction"""
        # Format the record
        formatted = super().format(record)

        # Redact sensitive data if enabled
        if settings.LOG_SANITIZATION_ENABLED:
            formatted = self.redactor.redact_sensitive_data(formatted)

        return formatted


class OAuthEventTracker:
    """Track OAuth events for security monitoring and compliance"""

    def __init__(self):
        self.security_logger = SecurityEventLogger("oauth_tracker")
        self.event_counts = {}
        self.suspicious_patterns = []

    def track_oauth_start(self, provider: str, client_ip: str, user_agent: str):
        """Track OAuth flow initiation"""
        self.security_logger.log_oauth_event(
            event_type="oauth_initiation",
            provider=provider,
            status="started",
            client_ip=client_ip,
            user_agent=user_agent,
            flow_stage="authorization_request"
        )

    def track_oauth_callback(self, provider: str, success: bool, user_email: str = None,
                           client_ip: str = None, error: str = None):
        """Track OAuth callback processing"""
        status = "success" if success else "failure"

        self.security_logger.log_oauth_event(
            event_type="oauth_callback",
            provider=provider,
            status=status,
            user_email=user_email,
            client_ip=client_ip,
            flow_stage="authorization_callback",
            error_message=error if error else None
        )

    def track_token_refresh(self, provider: str, user_email: str, success: bool,
                          client_ip: str = None):
        """Track token refresh events"""
        status = "success" if success else "failure"

        self.security_logger.log_oauth_event(
            event_type="token_refresh",
            provider=provider,
            status=status,
            user_email=user_email,
            client_ip=client_ip,
            flow_stage="token_refresh"
        )

    def track_suspicious_activity(self, event_type: str, details: Dict[str, Any],
                                client_ip: str = None):
        """Track suspicious OAuth activity"""
        self.security_logger.log_security_event(
            event_type=f"oauth_suspicious_{event_type}",
            severity="high",
            description=f"Suspicious OAuth activity detected: {event_type}",
            source="oauth_security",
            client_ip=client_ip,
            details=details
        )

    def get_oauth_metrics(self) -> Dict[str, Any]:
        """Get OAuth security metrics for monitoring"""
        return {
            "total_events": len(self.event_counts),
            "suspicious_patterns": len(self.suspicious_patterns),
            "tracking_enabled": True,
            "log_sanitization": settings.LOG_SANITIZATION_ENABLED,
            "audit_integrity": settings.AUDIT_INTEGRITY_CHECKS,
        }


# Global instances
security_logger = SecurityEventLogger()
oauth_tracker = OAuthEventTracker()


def get_secure_logger(name: str) -> SecurityEventLogger:
    """Get a secure logger instance"""
    return SecurityEventLogger(name)


def configure_secure_logging():
    """Configure secure logging for the application"""
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Add secure handlers
    if settings.LOG_STRUCTURED_FORMAT:
        formatter = JSONSecurityFormatter()
    else:
        formatter = SecureConsoleFormatter()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler
    if settings.SECURITY_LOG_ENABLED:
        log_path = Path(settings.SECURITY_LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = RotatingFileHandler(
            log_path,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Configure specific loggers to prevent credential leakage
    sensitive_loggers = [
        'urllib3.connectionpool',
        'requests.packages.urllib3',
        'httpx',
        'httpcore',
    ]

    for logger_name in sensitive_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.WARNING)  # Suppress debug/info logs that might contain tokens