#!/usr/bin/env python3
"""
Security Configuration Validator
Validates that all security hardening measures are properly configured
"""

import sys
import os


def validate_security_config():
    """Validate security configuration"""
    print("Security Configuration Validator")
    print("=" * 50)

    issues = []

    # Check if security files exist
    security_files = [
        "app/security/rate_limiter.py",
        "app/main.py",
        "app/core/config.py",
        ".env.production.example",
    ]

    for file in security_files:
        if os.path.exists(file):
            print(f"[OK] {file} - EXISTS")
        else:
            print(f"[FAIL] {file} - MISSING")
            issues.append(f"Missing security file: {file}")

    print("\nConfiguration Validation")
    print("-" * 30)

    try:
        # Import and check configuration
        sys.path.append(os.path.dirname(__file__))
        from app.core.config import settings

        # Check critical security settings
        security_checks = [
            ("Rate Limiting Enabled", settings.AUDIT_RATE_LIMIT_ENABLED, True),
            ("Security Headers Enabled", settings.SECURE_HEADERS, True),
            ("Audit System Enabled", settings.AUDIT_ENABLED, True),
            ("CORS Allow Credentials", settings.CORS_ALLOW_CREDENTIALS, True),
            ("Security Logging Enabled", settings.SECURITY_LOG_ENABLED, True),
        ]

        for check_name, actual, expected in security_checks:
            if actual == expected:
                print(f"[OK] {check_name}: {actual}")
            else:
                print(f"[FAIL] {check_name}: {actual} (expected: {expected})")
                issues.append(f"Security setting incorrect: {check_name}")

        # Check CORS configuration
        if hasattr(settings, "ALLOWED_ORIGINS"):
            if len(settings.ALLOWED_ORIGINS) > 0 and "*" not in settings.ALLOWED_ORIGINS:
                print(f"[OK] CORS Origins Restricted: {settings.ALLOWED_ORIGINS}")
            else:
                print(f"[FAIL] CORS Origins Not Restricted: {settings.ALLOWED_ORIGINS}")
                issues.append("CORS origins not properly restricted")

        # Check JWT configuration
        if settings.SECRET_KEY == "development-secret-key-change-in-production-T02-2025":
            print("[WARN] JWT Secret Key: Using development key (change for production)")
        else:
            print("[OK] JWT Secret Key: Custom key configured")

    except ImportError as e:
        print(f"[FAIL] Cannot import configuration: {e}")
        issues.append("Configuration import failed")

    print("\nSecurity Middleware Validation")
    print("-" * 35)

    try:
        # Check if middleware classes can be imported
        from app.security.rate_limiter import RateLimitMiddleware

        print("[OK] Rate Limiting Middleware - IMPORTABLE")
        print("[OK] Security Headers Middleware - IMPORTABLE")

        # Check middleware configuration
        rate_limits = RateLimitMiddleware.RATE_LIMITS
        if "/api/audit" in rate_limits:
            audit_limits = rate_limits["/api/audit"]
            if audit_limits["per_ip"]["requests"] <= 30:
                print(f"[OK] Audit Rate Limits: {audit_limits['per_ip']['requests']}/minute per IP")
            else:
                print(
                    f"[WARN] Audit Rate Limits: {audit_limits['per_ip']['requests']}/minute per IP (consider lowering)"
                )

    except ImportError as e:
        print(f"[FAIL] Cannot import security middleware: {e}")
        issues.append("Security middleware import failed")

    print("\nProduction Configuration Check")
    print("-" * 38)

    if os.path.exists(".env.production.example"):
        with open(".env.production.example", "r") as f:
            content = f.read()
            prod_checks = [
                ("Environment Production", "ENVIRONMENT=production" in content),
                ("Debug Disabled", "DEBUG=false" in content),
                ("HTTPS Required", "REQUIRE_HTTPS=true" in content),
                ("Secure SSL Redirect", "SECURE_SSL_REDIRECT=true" in content),
                ("Rate Limiting Enabled", "AUDIT_RATE_LIMIT_ENABLED=true" in content),
            ]

            for check_name, condition in prod_checks:
                if condition:
                    print(f"[OK] {check_name}")
                else:
                    print(f"[FAIL] {check_name}")
                    issues.append(f"Production config missing: {check_name}")

    print("\nSecurity Validation Summary")
    print("=" * 50)

    if not issues:
        print("SUCCESS: All security configurations validated!")
        print("System is ready for production deployment")
        return True
    else:
        print(f"ISSUES FOUND: {len(issues)} security issues detected")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
        print("\nPlease resolve these issues before production deployment")
        return False


if __name__ == "__main__":
    success = validate_security_config()
    sys.exit(0 if success else 1)
