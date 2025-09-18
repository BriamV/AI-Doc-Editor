#!/usr/bin/env python3
"""
OAuth Security Validation Script
T-02: OAuth production configuration validation

Validates OAuth security configuration and compliance with security best practices.
Run this script before production deployment to ensure security requirements are met.
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
from urllib.parse import urlparse

# Add app directory to path for imports
sys.path.append(str(Path(__file__).parent / "app"))

from app.core.config import settings


class OAuthSecurityValidator:
    """Comprehensive OAuth security validation"""

    def __init__(self):
        self.validation_results = {
            "passed": [],
            "warnings": [],
            "errors": [],
            "critical_errors": [],
        }
        self.score = 0
        self.max_score = 0

    def validate_all(self) -> Dict[str, Any]:
        """Run all OAuth security validations"""
        print("🔐 OAuth Security Validation Starting...")
        print("=" * 60)

        # Run validation categories
        self._validate_environment_configuration()
        self._validate_oauth_credentials()
        self._validate_jwt_security()
        self._validate_cors_configuration()
        self._validate_security_headers()
        self._validate_logging_configuration()
        self._validate_rate_limiting()
        self._validate_encryption_settings()
        self._validate_production_requirements()

        # Generate report
        return self._generate_report()

    def _validate_environment_configuration(self):
        """Validate environment configuration"""
        print("\n📋 Validating Environment Configuration...")

        # Check environment setting
        if settings.ENVIRONMENT in ["production", "staging"]:
            self._add_pass("Environment set to production/staging", 5)
        elif settings.ENVIRONMENT == "development":
            self._add_warning(
                "Environment set to development - ensure this is correct for deployment"
            )
        else:
            self._add_error(
                "Invalid environment setting",
                "Environment must be development, staging, or production",
            )

        # Check production domain
        if settings.ENVIRONMENT == "production":
            if settings.PRODUCTION_DOMAIN:
                if settings.PRODUCTION_DOMAIN.startswith("https://"):
                    self._add_pass("Production domain configured with HTTPS", 10)
                else:
                    self._add_critical(
                        "Production domain must use HTTPS", "OAuth 2.0 requires HTTPS in production"
                    )
            else:
                self._add_critical(
                    "Production domain not configured",
                    "PRODUCTION_DOMAIN is required for production OAuth callbacks",
                )

        # Check HTTPS enforcement
        if settings.ENVIRONMENT == "production" and not settings.REQUIRE_HTTPS:
            self._add_critical(
                "HTTPS not enforced in production", "Set REQUIRE_HTTPS=true for production"
            )

    def _validate_oauth_credentials(self):
        """Validate OAuth provider credentials"""
        print("\n🔑 Validating OAuth Credentials...")

        self._validate_google_oauth_credentials()
        self._validate_microsoft_oauth_credentials()
        self._check_production_demo_credentials()

    def _validate_google_oauth_credentials(self):
        """Validate Google OAuth credentials"""
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            self._add_warning(
                "Google OAuth credentials not configured - OAuth will not work for Google"
            )
            return

        self._validate_client_id(
            settings.GOOGLE_CLIENT_ID,
            self._validate_google_client_id,
            "Google Client ID format valid",
            "Invalid Google Client ID format",
            "Expected format: numbers-string.apps.googleusercontent.com",
        )

        self._validate_client_secret(
            settings.GOOGLE_CLIENT_SECRET,
            "Google Client Secret configured",
            "Google Client Secret too short or missing",
        )

    def _validate_microsoft_oauth_credentials(self):
        """Validate Microsoft OAuth credentials"""
        if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
            self._add_warning(
                "Microsoft OAuth credentials not configured - OAuth will not work for Microsoft"
            )
            return

        self._validate_client_id(
            settings.MICROSOFT_CLIENT_ID,
            self._validate_microsoft_client_id,
            "Microsoft Client ID format valid",
            "Invalid Microsoft Client ID format",
            "Expected UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        )

        self._validate_client_secret(
            settings.MICROSOFT_CLIENT_SECRET,
            "Microsoft Client Secret configured",
            "Microsoft Client Secret too short or missing",
        )

    def _validate_client_id(
        self, client_id: str, validator_func, success_msg: str, error_msg: str, error_details: str
    ):
        """Validate client ID using provided validator function"""
        if validator_func(client_id):
            self._add_pass(success_msg, 5)
        else:
            self._add_error(error_msg, error_details)

    def _validate_client_secret(self, client_secret: str, success_msg: str, error_msg: str):
        """Validate client secret length"""
        if len(client_secret) > 20:
            self._add_pass(success_msg, 5)
        else:
            self._add_error(error_msg, "Client secrets should be longer than 20 characters")

    def _check_production_demo_credentials(self):
        """Check for demo/development credentials in production"""
        if settings.ENVIRONMENT != "production":
            return

        demo_patterns = ["demo", "test", "development", "localhost", "example"]

        for pattern in demo_patterns:
            if self._has_demo_pattern_in_credentials(pattern):
                self._add_critical(
                    "Demo/development credentials detected in production",
                    "Use real production OAuth credentials",
                )
                break

    def _has_demo_pattern_in_credentials(self, pattern: str) -> bool:
        """Check if demo pattern exists in any OAuth credentials"""
        google_id = getattr(settings, "GOOGLE_CLIENT_ID", "") or ""
        microsoft_id = getattr(settings, "MICROSOFT_CLIENT_ID", "") or ""

        return pattern in google_id.lower() or pattern in microsoft_id.lower()

    def _validate_jwt_security(self):
        """Validate JWT security configuration"""
        print("\n🔐 Validating JWT Security...")

        # Secret key validation
        secret_key = settings.SECRET_KEY

        if len(secret_key) >= 32:
            self._add_pass("JWT secret key meets minimum length requirement", 5)
        else:
            self._add_critical(
                "JWT secret key too short",
                f"Secret key must be at least 32 characters, got {len(secret_key)}",
            )

        # Check for default development key
        if "development-secret-key" in secret_key.lower():
            if settings.ENVIRONMENT == "production":
                self._add_critical(
                    "Default development JWT secret in production",
                    "Must change SECRET_KEY for production deployment",
                )
            else:
                self._add_warning("Using default development JWT secret")

        # Entropy check
        entropy = self._calculate_entropy(secret_key)
        if entropy >= 3.0:
            self._add_pass("JWT secret key has sufficient entropy", 5)
        elif entropy >= 2.0:
            self._add_warning(
                "JWT secret key has moderate entropy - consider using more random key"
            )
        else:
            self._add_error(
                "JWT secret key has low entropy", "Use a more random key for better security"
            )

        # Token expiration settings
        if settings.ACCESS_TOKEN_EXPIRE_MINUTES <= 60:
            self._add_pass("Access token expiration appropriately short", 3)
        else:
            self._add_warning(
                "Access token expiration is quite long - consider shorter duration for production"
            )

        if 1 <= settings.REFRESH_TOKEN_EXPIRE_DAYS <= 30:
            self._add_pass("Refresh token expiration appropriately configured", 3)
        else:
            self._add_warning("Refresh token expiration may be too long or too short")

    def _validate_cors_configuration(self):
        """Validate CORS security configuration"""
        print("\n🌐 Validating CORS Configuration...")

        self._validate_cors_origins()
        self._validate_cors_credentials()
        self._validate_cors_methods()

    def _validate_cors_origins(self):
        """Validate CORS origins configuration"""
        if not settings.ALLOWED_ORIGINS:
            self._add_error("No CORS origins configured", "Configure ALLOWED_ORIGINS")
            return

        self._check_wildcard_origins()
        self._check_production_https_origins()

    def _check_wildcard_origins(self):
        """Check for wildcard CORS origins in production"""
        if "*" in settings.ALLOWED_ORIGINS and settings.ENVIRONMENT == "production":
            self._add_critical(
                "Wildcard CORS origin in production",
                "Specify exact domains instead of '*' for production",
            )
        else:
            self._add_pass("CORS origins configured", 3)

    def _check_production_https_origins(self):
        """Check for HTTPS origins in production"""
        if settings.ENVIRONMENT != "production":
            return

        http_origins = self._find_insecure_http_origins()
        if http_origins:
            self._add_error(
                "HTTP origins in production CORS",
                f"Use HTTPS for production origins: {http_origins}",
            )

    def _find_insecure_http_origins(self) -> list[str]:
        """Find HTTP origins that are not localhost"""
        return [
            origin
            for origin in settings.ALLOWED_ORIGINS
            if origin.startswith("http://") and not origin.startswith("http://localhost")
        ]

    def _validate_cors_credentials(self):
        """Validate CORS credentials setting"""
        if settings.CORS_ALLOW_CREDENTIALS:
            self._add_pass("CORS credentials properly configured", 2)

    def _validate_cors_methods(self):
        """Validate CORS allowed methods"""
        dangerous_methods = ["TRACE", "CONNECT"]
        if any(method in settings.CORS_ALLOW_METHODS for method in dangerous_methods):
            self._add_warning("Potentially dangerous HTTP methods allowed in CORS")

    def _validate_security_headers(self):
        """Validate security headers configuration"""
        print("\n🛡️ Validating Security Headers...")

        if settings.SECURITY_HEADERS_ENABLED:
            self._add_pass("Security headers enabled", 5)
        else:
            self._add_error("Security headers disabled", "Enable SECURITY_HEADERS_ENABLED=true")

        # Check HSTS configuration for production
        if settings.ENVIRONMENT == "production":
            if settings.HSTS_MAX_AGE >= 31536000:  # 1 year
                self._add_pass("HSTS max-age appropriately configured", 3)
            else:
                self._add_warning("HSTS max-age should be at least 1 year for production")

            if settings.HSTS_INCLUDE_SUBDOMAINS:
                self._add_pass("HSTS includes subdomains", 2)

        # Check CSP configuration
        # CSP validation checks

        if settings.CSP_FRAME_ANCESTORS == "'none'":
            self._add_pass("Frame ancestors properly restricted", 3)

        if "'unsafe-eval'" not in settings.CSP_SCRIPT_SRC:
            self._add_pass("CSP script-src does not allow unsafe-eval", 3)
        else:
            self._add_warning("CSP allows unsafe-eval in script-src")

    def _validate_logging_configuration(self):
        """Validate secure logging configuration"""
        print("\n📝 Validating Logging Configuration...")

        if settings.SECURITY_LOG_ENABLED:
            self._add_pass("Security logging enabled", 5)
        else:
            self._add_error("Security logging disabled", "Enable SECURITY_LOG_ENABLED=true")

        if settings.LOG_SANITIZATION_ENABLED:
            self._add_pass("Log sanitization enabled", 5)
        else:
            self._add_critical("Log sanitization disabled", "Sensitive data may be exposed in logs")

        if settings.AUDIT_INTEGRITY_CHECKS:
            self._add_pass("Audit integrity checks enabled", 3)

        # Check log level
        if settings.LOG_LEVEL.upper() in ["INFO", "WARNING", "ERROR"]:
            self._add_pass("Appropriate log level configured", 2)
        elif settings.LOG_LEVEL.upper() == "DEBUG":
            if settings.ENVIRONMENT == "production":
                self._add_warning("DEBUG logging enabled in production - may expose sensitive data")

    def _validate_rate_limiting(self):
        """Validate rate limiting configuration"""
        print("\n⏱️ Validating Rate Limiting...")

        if settings.AUDIT_RATE_LIMIT_ENABLED:
            self._add_pass("Rate limiting enabled", 5)

            if settings.RATE_LIMIT_PER_MINUTE > 0:
                self._add_pass("Per-minute rate limit configured", 3)

            if settings.OAUTH_RATE_LIMIT_PER_HOUR > 0:
                self._add_pass("OAuth-specific rate limiting configured", 3)

            # Check if limits are reasonable
            if settings.RATE_LIMIT_PER_MINUTE > 1000:
                self._add_warning("Rate limit may be too high for security")
        else:
            self._add_error("Rate limiting disabled", "Enable rate limiting for production")

    def _validate_encryption_settings(self):
        """Validate encryption and cryptographic settings"""
        print("\n🔒 Validating Encryption Settings...")

        # Check audit encryption
        if settings.AUDIT_ENCRYPTION_KEY:
            if len(settings.AUDIT_ENCRYPTION_KEY) >= 32:
                self._add_pass("Audit encryption key configured", 5)
            else:
                self._add_error("Audit encryption key too short")
        else:
            self._add_warning("Audit encryption key not configured")

        # Check hash algorithm
        if settings.AUDIT_HASH_ALGORITHM.upper() in ["SHA256", "SHA512"]:
            self._add_pass("Secure hash algorithm configured", 3)
        else:
            self._add_warning("Consider using SHA256 or SHA512 for audit hashing")

        # Check OAuth security settings
        if settings.OAUTH_NONCE_LENGTH >= 16:
            self._add_pass("OAuth nonce length sufficient", 2)

        if settings.OAUTH_STATE_EXPIRE_MINUTES <= 15:
            self._add_pass("OAuth state expiration appropriately short", 2)

    def _validate_production_requirements(self):
        """Validate production-specific requirements"""
        print("\n🏭 Validating Production Requirements...")

        if settings.ENVIRONMENT != "production":
            return

        # Critical production requirements
        requirements = [
            (settings.REQUIRE_HTTPS, "HTTPS enforcement"),
            (settings.SECURITY_HEADERS_ENABLED, "Security headers"),
            (settings.LOG_SANITIZATION_ENABLED, "Log sanitization"),
            (settings.AUDIT_INTEGRITY_CHECKS, "Audit integrity"),
            (not settings.DEBUG, "Debug mode disabled"),
        ]

        for requirement, description in requirements:
            if requirement:
                self._add_pass(f"Production requirement met: {description}", 5)
            else:
                self._add_critical(
                    f"Production requirement not met: {description}",
                    "Required for production deployment",
                )

        # Check for sensitive data in logs
        if settings.AUDIT_LOG_SENSITIVE_DATA:
            self._add_critical(
                "Sensitive data logging enabled in production",
                "Set AUDIT_LOG_SENSITIVE_DATA=false for production",
            )

        # Validate production domain
        if settings.PRODUCTION_DOMAIN:
            parsed = urlparse(settings.PRODUCTION_DOMAIN)
            if not parsed.netloc:
                self._add_error("Invalid production domain format")
            elif parsed.netloc in ["localhost", "127.0.0.1", "0.0.0.0"]:
                self._add_critical(
                    "Production domain points to localhost", "Use real production domain"
                )

    def _validate_google_client_id(self, client_id: str) -> bool:
        """Validate Google OAuth Client ID format"""
        pattern = r"^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$"
        return bool(re.match(pattern, client_id))

    def _validate_microsoft_client_id(self, client_id: str) -> bool:
        """Validate Microsoft OAuth Client ID format (UUID)"""
        pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        return bool(re.match(pattern, client_id.lower()))

    def _calculate_entropy(self, text: str) -> float:
        """Calculate entropy of a text string"""
        if not text:
            return 0.0

        # Count character frequency
        char_count = {}
        for char in text:
            char_count[char] = char_count.get(char, 0) + 1

        # Calculate entropy
        length = len(text)
        entropy = 0.0
        for count in char_count.values():
            probability = count / length
            if probability > 0:
                entropy -= probability * (probability.bit_length() - 1)

        return entropy

    def _add_pass(self, message: str, points: int = 1):
        """Add a passing validation"""
        self.validation_results["passed"].append(message)
        self.score += points
        self.max_score += points
        print(f"  ✅ {message}")

    def _add_warning(self, message: str, details: str = ""):
        """Add a warning"""
        warning = {"message": message, "details": details}
        self.validation_results["warnings"].append(warning)
        self.max_score += 1
        print(f"  ⚠️  {message}")
        if details:
            print(f"     {details}")

    def _add_error(self, message: str, details: str = ""):
        """Add an error"""
        error = {"message": message, "details": details}
        self.validation_results["errors"].append(error)
        self.max_score += 1
        print(f"  ❌ {message}")
        if details:
            print(f"     {details}")

    def _add_critical(self, message: str, details: str = ""):
        """Add a critical error"""
        error = {"message": message, "details": details}
        self.validation_results["critical_errors"].append(error)
        self.max_score += 1
        print(f"  🚨 CRITICAL: {message}")
        if details:
            print(f"     {details}")

    def _generate_report(self) -> Dict[str, Any]:
        """Generate final validation report"""
        self._print_report_header()

        score_percentage = self._calculate_score_percentage()
        status, status_emoji = self._determine_overall_status()

        self._print_status_and_score(status_emoji, status, score_percentage)
        self._print_summary_counts()
        self._print_issues_sections()
        self._print_recommendations(score_percentage)
        self._print_security_resources()

        return self._create_structured_report(status, score_percentage)

    def _print_report_header(self):
        """Print report header"""
        print("\n" + "=" * 60)
        print("📊 OAuth Security Validation Report")
        print("=" * 60)

    def _calculate_score_percentage(self) -> float:
        """Calculate score percentage"""
        return (self.score / self.max_score * 100) if self.max_score > 0 else 0

    def _determine_overall_status(self) -> tuple[str, str]:
        """Determine overall validation status"""
        if self.validation_results["critical_errors"]:
            return "CRITICAL - Deployment Blocked", "🚨"
        elif self.validation_results["errors"]:
            return "FAILED - Errors Must Be Fixed", "❌"
        elif self.validation_results["warnings"]:
            return "PASSED WITH WARNINGS", "⚠️"
        else:
            return "PASSED - All Validations Successful", "✅"

    def _print_status_and_score(self, status_emoji: str, status: str, score_percentage: float):
        """Print status and score information"""
        print(f"\n{status_emoji} Overall Status: {status}")
        print(f"📊 Security Score: {self.score}/{self.max_score} ({score_percentage:.1f}%)")

    def _print_summary_counts(self):
        """Print summary counts"""
        print("\n📋 Summary:")
        print(f"  ✅ Passed: {len(self.validation_results['passed'])}")
        print(f"  ⚠️  Warnings: {len(self.validation_results['warnings'])}")
        print(f"  ❌ Errors: {len(self.validation_results['errors'])}")
        print(f"  🚨 Critical: {len(self.validation_results['critical_errors'])}")

    def _print_issues_sections(self):
        """Print all issues sections"""
        self._print_critical_errors()
        self._print_errors()
        self._print_warnings()

    def _print_critical_errors(self):
        """Print critical errors section"""
        if not self.validation_results["critical_errors"]:
            return

        print("\n🚨 Critical Issues (Must Fix Before Production):")
        for error in self.validation_results["critical_errors"]:
            print(f"  • {error['message']}")
            if error["details"]:
                print(f"    → {error['details']}")

    def _print_errors(self):
        """Print errors section"""
        if not self.validation_results["errors"]:
            return

        print("\n❌ Errors (Should Fix):")
        for error in self.validation_results["errors"]:
            print(f"  • {error['message']}")
            if error["details"]:
                print(f"    → {error['details']}")

    def _print_warnings(self):
        """Print warnings section"""
        if not self.validation_results["warnings"]:
            return

        print("\n⚠️  Warnings (Recommended Fixes):")
        for warning in self.validation_results["warnings"]:
            print(f"  • {warning['message']}")
            if warning["details"]:
                print(f"    → {warning['details']}")

    def _print_recommendations(self, score_percentage: float):
        """Print recommendations based on score"""
        print("\n💡 Recommendations:")

        if score_percentage >= 90:
            print("  • OAuth security configuration is excellent!")
            print("  • Consider regular security reviews and updates")
        elif score_percentage >= 75:
            print("  • Good security configuration with room for improvement")
            print("  • Address warnings before production deployment")
        elif score_percentage >= 50:
            print("  • Security configuration needs improvement")
            print("  • Fix errors and warnings before deployment")
        else:
            print("  • Security configuration is insufficient for production")
            print("  • Major security improvements required")

    def _print_security_resources(self):
        """Print security resources section"""
        print("\n📚 Additional Security Resources:")
        print("  • OWASP OAuth 2.0 Security Cheat Sheet")
        print("  • RFC 6749 - OAuth 2.0 Authorization Framework")
        print("  • Project security documentation: docs/security/")

    def _create_structured_report(self, status: str, score_percentage: float) -> Dict[str, Any]:
        """Create structured report dictionary"""
        return {
            "status": status,
            "score": self.score,
            "max_score": self.max_score,
            "score_percentage": score_percentage,
            "environment": settings.ENVIRONMENT,
            "timestamp": str(datetime.now()),
            "results": self.validation_results,
            "deployment_approved": len(self.validation_results["critical_errors"]) == 0,
        }


def main():
    """Main validation function"""
    validator = OAuthSecurityValidator()
    report = validator.validate_all()

    # Save report to file
    report_file = Path("oauth_security_validation_report.json")
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: {report_file}")

    # Exit with appropriate code
    if report["deployment_approved"]:
        print("\n🎉 OAuth security validation completed successfully!")
        print("   Ready for production deployment.")
        sys.exit(0)
    else:
        print("\n🛑 OAuth security validation failed!")
        print("   Fix critical issues before production deployment.")
        sys.exit(1)


if __name__ == "__main__":
    main()
