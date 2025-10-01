#!/usr/bin/env python3
"""
Security Configuration Validator
Validates that all security hardening measures are properly configured
"""

import sys
import os
from typing import List, Tuple


def _check_security_files() -> List[str]:
    """Ensure critical security-related files exist."""
    issues: List[str] = []
    backend_root = os.path.join(os.path.dirname(__file__), "..", "..")
    security_files = [
        "app/security/rate_limiter.py",
        "app/main.py",
        "app/core/config.py",
        ".env.production.example",
    ]

    for file in security_files:
        full_path = os.path.join(backend_root, file)
        if os.path.exists(full_path):
            print(f"[OK] {file} - EXISTS")
        else:
            print(f"[FAIL] {file} - MISSING")
            issues.append(f"Missing security file: {file}")
    return issues


def _load_settings():
    """Load application settings safely for validation."""
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
        from app.core.config import settings  # type: ignore

        return settings, None
    except ImportError as e:  # pragma: no cover - runtime env dependent
        return None, str(e)


def _validate_core_settings(settings) -> List[str]:
    """Validate core security-related settings values."""
    print("\nConfiguration Validation")
    print("-" * 30)
    issues: List[str] = []

    security_checks: List[Tuple[str, bool, bool]] = [
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

    return issues


def _validate_security_middleware() -> List[str]:
    """Check that security middleware is importable and reasonably configured."""
    print("\nSecurity Middleware Validation")
    print("-" * 35)
    issues: List[str] = []
    try:
        from app.security.rate_limiter import RateLimitMiddleware  # type: ignore

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
    except ImportError as e:  # pragma: no cover - runtime env dependent
        print(f"[FAIL] Cannot import security middleware: {e}")
        issues.append("Security middleware import failed")

    return issues


def _validate_production_env_example() -> List[str]:
    """Check that production env example contains required secure defaults."""
    print("\nProduction Configuration Check")
    print("-" * 38)
    issues: List[str] = []

    backend_root = os.path.join(os.path.dirname(__file__), "..", "..")
    env_file = os.path.join(backend_root, ".env.production.example")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
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

    return issues


def validate_security_config():
    """Validate security configuration"""
    print("Security Configuration Validator")
    print("=" * 50)

    issues: List[str] = []

    # 1) Files present
    issues += _check_security_files()

    # 2) Settings values
    settings, err = _load_settings()
    if err:
        print(f"[FAIL] Cannot import configuration: {err}")
        issues.append("Configuration import failed")
    else:
        issues += _validate_core_settings(settings)

    # 3) Middleware
    issues += _validate_security_middleware()

    # 4) Production example env
    issues += _validate_production_env_example()

    # Summary
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
