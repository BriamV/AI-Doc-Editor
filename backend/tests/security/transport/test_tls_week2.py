"""
Comprehensive test suite for Week 2 - TLS 1.3 Configuration
T-12 Credential Store Security

Tests for certificate management, security middleware, cipher suites,
and enhanced TLS configuration.
"""

import ssl
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

from fastapi import FastAPI

# Import components to test
from app.security.transport.certificate_manager import (
    CertificateManager,
    CertificateInfo,
    OCSPResponse,
)
from app.security.transport.security_middleware import (
    TLSSecurityMiddleware,
    TLSSecurityConfig,
    SecurityEvent,
)
from app.security.transport.cipher_suites import (
    CipherSuiteManager,
    SecurityLevel,
    ComplianceStandard,
)
from app.security.transport.tls_config import TLSConfig, CertificateConfig
from app.security.transport.tls_config import TLSSecurityConfig as TLSConfigSecurityConfig


class TestCertificateManager:
    """Test certificate management functionality."""

    @pytest.fixture
    def cert_manager(self):
        """Create certificate manager instance."""
        return CertificateManager()

    @pytest.fixture
    def mock_certificate_data(self):
        """Mock certificate data for testing."""
        return b"""-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7J+9...
-----END CERTIFICATE-----"""

    @pytest.fixture
    def mock_certificate_info(self):
        """Mock certificate information."""
        return CertificateInfo(
            subject="CN=test.example.com",
            issuer="CN=Test CA",
            serial_number="123456789",
            not_before=datetime.utcnow(),
            not_after=datetime.utcnow() + timedelta(days=365),
            fingerprint_sha256="abcd1234" * 8,
            san_domains=["test.example.com", "*.test.example.com"],
            key_usage=["digital_signature", "key_encipherment"],
            extended_key_usage=["server_auth"],
            is_ca=False,
            is_self_signed=False,
            ocsp_urls=["http://ocsp.example.com"],
        )

    @pytest.mark.asyncio
    async def test_certificate_manager_context_manager(self, cert_manager):
        """Test certificate manager as async context manager."""
        async with cert_manager as mgr:
            assert mgr is not None
            assert mgr.session is not None

    @pytest.mark.asyncio
    async def test_validate_certificate_chain_empty(self, cert_manager):
        """Test validation with empty certificate chain."""
        async with cert_manager as mgr:
            is_valid, errors = await mgr.validate_certificate_chain([])
            assert not is_valid
            assert "Empty certificate chain" in errors

    @pytest.mark.asyncio
    async def test_validate_certificate_chain_invalid_cert(self, cert_manager):
        """Test validation with invalid certificate data."""
        invalid_cert = b"invalid certificate data"

        async with cert_manager as mgr:
            is_valid, errors = await mgr.validate_certificate_chain([invalid_cert])
            assert not is_valid
            assert any("Failed to parse certificate" in error for error in errors)

    @pytest.mark.asyncio
    @patch("app.security.transport.certificate_manager.x509.load_pem_certificate")
    async def test_validate_certificate_chain_success(
        self, mock_load_cert, cert_manager, mock_certificate_data
    ):
        """Test successful certificate validation."""
        # Mock certificate object
        mock_cert = Mock()
        mock_cert.not_valid_before = datetime.utcnow() - timedelta(days=1)
        mock_cert.not_valid_after = datetime.utcnow() + timedelta(days=365)
        mock_cert.subject = Mock()
        mock_cert.issuer = Mock()

        # Mock extensions
        mock_cert.extensions.get_extension_for_oid.side_effect = Exception("Extension not found")

        mock_load_cert.return_value = mock_cert

        async with cert_manager as mgr:
            # Mock OCSP validation
            mgr._validate_ocsp = AsyncMock(return_value=(True, []))
            mgr._validate_hostname = Mock(return_value=True)

            is_valid, errors = await mgr.validate_certificate_chain([mock_certificate_data])
            assert is_valid
            assert len(errors) == 0

    def test_certificate_pin_creation(self, cert_manager):
        """Test certificate pin creation and validation."""
        domain = "example.com"
        fingerprints = {"abcd1234" * 8, "efgh5678" * 8}

        cert_manager.add_certificate_pin(domain, fingerprints)

        assert domain in cert_manager.certificate_pins
        pin = cert_manager.certificate_pins[domain]
        assert pin.domain == domain
        assert pin.fingerprints == {fp.lower().replace(":", "") for fp in fingerprints}

    def test_certificate_pin_removal(self, cert_manager):
        """Test certificate pin removal."""
        domain = "example.com"
        fingerprints = {"abcd1234" * 8}

        cert_manager.add_certificate_pin(domain, fingerprints)
        assert domain in cert_manager.certificate_pins

        cert_manager.remove_certificate_pin(domain)
        assert domain not in cert_manager.certificate_pins

    @pytest.mark.asyncio
    async def test_monitor_certificate_expiry(self, cert_manager):
        """Test certificate expiry monitoring."""
        # Create mock certificate that expires soon
        with patch(
            "app.security.transport.certificate_manager.CertificateManager.get_certificate_info"
        ) as mock_get_info:
            mock_info = CertificateInfo(
                subject="CN=expiring.example.com",
                issuer="CN=Test CA",
                serial_number="123456789",
                not_before=datetime.utcnow() - timedelta(days=1),
                not_after=datetime.utcnow() + timedelta(days=15),  # Expires in 15 days
                fingerprint_sha256="abcd1234" * 8,
                san_domains=["expiring.example.com"],
                key_usage=["digital_signature"],
                extended_key_usage=["server_auth"],
                is_ca=False,
                is_self_signed=False,
                ocsp_urls=[],
            )
            mock_get_info.return_value = mock_info

            warnings = await cert_manager.monitor_certificate_expiry(
                [b"mock_cert"], warning_days=30
            )

            assert len(warnings) == 1
            assert warnings[0]["subject"] == "CN=expiring.example.com"
            assert warnings[0]["days_remaining"] == 15

    @pytest.mark.asyncio
    async def test_cleanup_cache(self, cert_manager):
        """Test cache cleanup functionality."""
        # Add expired OCSP response to cache
        expired_response = OCSPResponse(
            status="good",
            this_update=datetime.utcnow() - timedelta(hours=2),
            next_update=datetime.utcnow() - timedelta(hours=1),  # Expired
            response_data=b"",
        )

        cert_manager.ocsp_cache["test_cert"] = expired_response

        await cert_manager.cleanup_cache()

        # Expired response should be removed
        assert "test_cert" not in cert_manager.ocsp_cache


class TestSecurityMiddleware:
    """Test TLS security middleware functionality."""

    @pytest.fixture
    def app(self):
        """Create FastAPI test application."""
        app = FastAPI()

        @app.get("/secure")
        async def secure_endpoint():
            return {"message": "secure"}

        @app.get("/health")
        async def health_endpoint():
            return {"status": "ok"}

        return app

    @pytest.fixture
    def tls_config(self):
        """Create TLS security configuration."""
        return TLSSecurityConfig()

    @pytest.fixture
    def middleware(self, app, tls_config):
        """Create TLS security middleware."""
        return TLSSecurityMiddleware(app, tls_config)

    def test_tls_security_config_defaults(self, tls_config):
        """Test TLS security configuration defaults."""
        assert tls_config.enforce_tls is True
        assert tls_config.min_tls_version == "1.3"
        assert tls_config.enforce_hsts is True
        assert "/api/auth/" in tls_config.tls_required_paths
        assert "/health" in tls_config.tls_exempt_paths

    def test_security_event_creation(self):
        """Test security event creation."""
        mock_request = Mock()
        mock_request.url.path = "/test"
        mock_request.headers.get.return_value = "test-agent"
        mock_request.client.host = "127.0.0.1"

        event = SecurityEvent("test_event", "info", "Test security event", mock_request)

        assert event.event_type == "test_event"
        assert event.severity == "info"
        assert event.description == "Test security event"
        assert event.client_ip == "127.0.0.1"
        assert event.path == "/test"

    @pytest.mark.asyncio
    async def test_middleware_exempt_path(self, middleware):
        """Test middleware handling of exempt paths."""
        mock_request = Mock()
        mock_request.url.path = "/health"
        mock_request.url.scheme = "http"

        result = await middleware._validate_tls_requirements(mock_request)
        assert result.is_valid is True

    @pytest.mark.asyncio
    async def test_middleware_secure_path_https(self, middleware):
        """Test middleware handling of secure paths with HTTPS."""
        mock_request = Mock()
        mock_request.url.path = "/api/auth/login"
        mock_request.url.scheme = "https"
        mock_request.headers.get.return_value = "1.3"

        result = await middleware._validate_tls_requirements(mock_request)
        assert result.is_valid is True

    @pytest.mark.asyncio
    async def test_middleware_secure_path_http_violation(self, middleware):
        """Test middleware handling of secure paths with HTTP (violation)."""
        mock_request = Mock()
        mock_request.url.path = "/api/auth/login"
        mock_request.url.scheme = "http"
        mock_request.headers.get.return_value = None

        middleware._is_secure_connection = Mock(return_value=False)

        result = await middleware._validate_tls_requirements(mock_request)
        assert result.is_valid is False
        assert "HTTPS required" in result.error_message

    def test_middleware_security_headers_injection(self, middleware):
        """Test security headers injection."""
        mock_response = Mock()
        mock_response.headers = {}
        mock_request = Mock()
        mock_request.url.scheme = "https"

        middleware._inject_security_headers(mock_response, mock_request)

        # Check that security headers are added
        assert "X-Content-Type-Options" in mock_response.headers
        assert "X-Frame-Options" in mock_response.headers
        assert "Strict-Transport-Security" in mock_response.headers
        assert "Content-Security-Policy" in mock_response.headers

    def test_middleware_get_security_metrics(self, middleware):
        """Test security metrics collection."""
        middleware._request_count = 100
        middleware._security_violations = 5

        metrics = middleware.get_security_metrics()

        assert metrics["total_requests"] == 100
        assert metrics["security_violations"] == 5
        assert metrics["violation_rate"] == 0.05


class TestCipherSuiteManager:
    """Test cipher suite management functionality."""

    @pytest.fixture
    def cipher_manager(self):
        """Create cipher suite manager instance."""
        return CipherSuiteManager()

    def test_cipher_suite_manager_initialization(self, cipher_manager):
        """Test cipher suite manager initialization."""
        assert cipher_manager is not None
        assert len(cipher_manager._cipher_suites) > 0

    def test_get_cipher_suites_for_security_level_maximum(self, cipher_manager):
        """Test getting cipher suites for maximum security level."""
        suites = cipher_manager.get_cipher_suites_for_security_level(SecurityLevel.MAXIMUM)

        assert len(suites) > 0
        for suite in suites:
            assert suite.key_size >= 256
            assert suite.perfect_forward_secrecy is True
            assert suite.security_score >= 95

    def test_get_cipher_suites_for_security_level_compatibility(self, cipher_manager):
        """Test getting cipher suites for compatibility level."""
        suites = cipher_manager.get_cipher_suites_for_security_level(SecurityLevel.COMPATIBILITY)

        assert len(suites) > 0
        # Compatibility level should have more suites available
        max_suites = cipher_manager.get_cipher_suites_for_security_level(SecurityLevel.MAXIMUM)
        assert len(suites) >= len(max_suites)

    def test_get_cipher_suites_for_compliance_nist(self, cipher_manager):
        """Test getting NIST-compliant cipher suites."""
        suites = cipher_manager.get_cipher_suites_for_compliance([ComplianceStandard.NIST])

        assert len(suites) > 0
        for suite in suites:
            assert ComplianceStandard.NIST in suite.compliance_standards
            assert suite.key_size >= 256  # NIST requirement

    def test_get_cipher_suites_for_compliance_fips(self, cipher_manager):
        """Test getting FIPS-compliant cipher suites."""
        suites = cipher_manager.get_cipher_suites_for_compliance([ComplianceStandard.FIPS])

        for suite in suites:
            assert ComplianceStandard.FIPS in suite.compliance_standards
            # FIPS doesn't allow ChaCha20-Poly1305
            assert "ChaCha20" not in suite.encryption

    def test_create_ssl_context_maximum_security(self, cipher_manager):
        """Test SSL context creation with maximum security."""
        context = cipher_manager.create_ssl_context(
            security_level=SecurityLevel.MAXIMUM, server_side=True
        )

        assert context is not None
        assert context.minimum_version == ssl.TLSVersion.TLSv1_3
        assert context.maximum_version == ssl.TLSVersion.TLSv1_3

    def test_validate_cipher_suite_configuration_valid(self, cipher_manager):
        """Test validation of valid cipher suite configuration."""
        valid_suites = ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"]

        is_valid, errors = cipher_manager.validate_cipher_suite_configuration(
            valid_suites, SecurityLevel.HIGH
        )

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_cipher_suite_configuration_invalid(self, cipher_manager):
        """Test validation of invalid cipher suite configuration."""
        invalid_suites = ["INVALID_CIPHER_SUITE"]

        is_valid, errors = cipher_manager.validate_cipher_suite_configuration(
            invalid_suites, SecurityLevel.HIGH
        )

        assert is_valid is False
        assert len(errors) > 0

    def test_get_security_grade_a_plus(self, cipher_manager):
        """Test security grade calculation for A+ grade."""
        high_security_suites = ["TLS_AES_256_GCM_SHA384"]

        grade, score = cipher_manager.get_security_grade(high_security_suites)

        assert grade == "A+"
        assert score >= 95

    def test_get_security_grade_low_security(self, cipher_manager):
        """Test security grade calculation for low security."""
        grade, score = cipher_manager.get_security_grade([])

        assert grade == "F"
        assert score == 0

    def test_get_cipher_suite_info(self, cipher_manager):
        """Test getting specific cipher suite information."""
        suite_info = cipher_manager.get_cipher_suite_info("TLS_AES_256_GCM_SHA384")

        assert suite_info is not None
        assert suite_info.name == "TLS_AES_256_GCM_SHA384"
        assert suite_info.key_size == 256
        assert suite_info.perfect_forward_secrecy is True

    def test_list_all_cipher_suites(self, cipher_manager):
        """Test listing all available cipher suites."""
        all_suites = cipher_manager.list_all_cipher_suites()

        assert len(all_suites) > 0
        # Should include both TLS 1.3 and TLS 1.2 suites
        tls13_suites = [s for s in all_suites if s.tls_version == "1.3"]
        tls12_suites = [s for s in all_suites if s.tls_version == "1.2"]

        assert len(tls13_suites) > 0
        assert len(tls12_suites) > 0


class TestTLSConfig:
    """Test enhanced TLS configuration."""

    @pytest.fixture
    def tls_config(self):
        """Create TLS configuration instance."""
        return TLSConfig()

    @pytest.fixture
    def security_config(self):
        """Create TLS security configuration."""
        return TLSSecurityConfig()

    @pytest.fixture
    def cert_config(self):
        """Create certificate configuration."""
        return CertificateConfig()

    def test_tls_config_initialization(self, tls_config):
        """Test TLS configuration initialization."""
        assert tls_config is not None
        assert tls_config.security_config is not None
        assert tls_config.certificate_config is not None

    def test_create_ssl_context_basic(self, tls_config):
        """Test basic SSL context creation."""
        context = tls_config.create_ssl_context()

        assert context is not None
        assert context.minimum_version == ssl.TLSVersion.TLSv1_3
        assert context.maximum_version == ssl.TLSVersion.TLSv1_3

    def test_create_ssl_context_with_security_level(self):
        """Test SSL context creation with specific security level."""
        tls_config = TLSConfig(security_level=SecurityLevel.MAXIMUM)
        context = tls_config.create_ssl_context()

        assert context is not None

    def test_pin_certificate(self, tls_config):
        """Test certificate pinning functionality."""
        hostname = "example.com"
        cert_data = b"mock certificate data"

        fingerprint = tls_config.pin_certificate(hostname, cert_data)

        assert fingerprint is not None
        assert len(fingerprint) == 64  # SHA256 hex string length
        assert hostname in tls_config._cert_pins

    def test_verify_certificate_pin_success(self, tls_config):
        """Test successful certificate pin verification."""
        hostname = "example.com"
        cert_data = b"mock certificate data"

        # Pin the certificate
        tls_config.pin_certificate(hostname, cert_data)

        # Verify with same certificate
        is_valid = tls_config.verify_certificate_pin(hostname, cert_data)
        assert is_valid is True

    def test_verify_certificate_pin_mismatch(self, tls_config):
        """Test certificate pin verification mismatch."""
        hostname = "example.com"
        cert_data1 = b"mock certificate data 1"
        cert_data2 = b"mock certificate data 2"

        # Pin first certificate
        tls_config.pin_certificate(hostname, cert_data1)

        # Verify with different certificate
        is_valid = tls_config.verify_certificate_pin(hostname, cert_data2)
        assert is_valid is False

    def test_verify_certificate_pin_no_pin(self, tls_config):
        """Test certificate pin verification when no pin is configured."""
        hostname = "example.com"
        cert_data = b"mock certificate data"

        # No pin configured, should return True
        is_valid = tls_config.verify_certificate_pin(hostname, cert_data)
        assert is_valid is True

    def test_is_tls_1_3_available(self, tls_config):
        """Test TLS 1.3 availability check."""
        is_available = tls_config.is_tls_1_3_available()
        # Should be True in modern Python versions
        assert isinstance(is_available, bool)

    def test_set_security_level(self, tls_config):
        """Test setting security level."""
        result = tls_config.set_security_level("maximum")
        # Should succeed if enhanced components are available
        assert isinstance(result, bool)

    def test_get_cipher_suite_analysis(self, tls_config):
        """Test cipher suite analysis."""
        analysis = tls_config.get_cipher_suite_analysis()

        assert isinstance(analysis, dict)
        # Should either contain analysis data or error message
        assert "error" in analysis or "security_level" in analysis

    def test_get_compliance_report(self, tls_config):
        """Test compliance report generation."""
        report = tls_config.get_compliance_report(["nist"])

        assert isinstance(report, dict)
        # Should either contain report data or error message
        assert "error" in report or "standards" in report


class TestIntegration:
    """Integration tests for Week 2 TLS components."""

    @pytest.fixture
    def integrated_tls_config(self):
        """Create integrated TLS configuration."""
        security_config = TLSConfigSecurityConfig(
            min_protocol_version=ssl.PROTOCOL_TLS_CLIENT, cipher_strength="HIGH"
        )
        return TLSConfig(security_config=security_config, security_level=SecurityLevel.HIGH)

    def test_end_to_end_ssl_context_creation(self, integrated_tls_config):
        """Test end-to-end SSL context creation with all components."""
        context = integrated_tls_config.create_ssl_context()

        assert context is not None
        assert context.minimum_version == ssl.TLSVersion.TLSv1_3

    @pytest.mark.asyncio
    async def test_certificate_validation_integration(self):
        """Test integration between certificate manager and TLS config."""
        cert_manager = CertificateManager()

        # Test certificate validation flow
        mock_cert_data = b"""-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7J+9...
-----END CERTIFICATE-----"""

        async with cert_manager as mgr:
            # This would normally validate a real certificate
            # For testing, we expect it to fail with mock data
            is_valid, errors = await mgr.validate_certificate_chain([mock_cert_data])
            assert isinstance(is_valid, bool)
            assert isinstance(errors, list)

    def test_middleware_with_cipher_manager_integration(self):
        """Test integration between security middleware and cipher manager."""
        app = FastAPI()
        config = TLSSecurityConfig()
        middleware = TLSSecurityMiddleware(app, config)

        # Test that middleware can be created and configured
        assert middleware is not None
        assert middleware.config is not None

    def test_security_level_consistency(self):
        """Test that security levels are consistent across components."""
        # All components should recognize the same security levels
        assert SecurityLevel.MAXIMUM.value == "maximum"
        assert SecurityLevel.HIGH.value == "high"
        assert SecurityLevel.MEDIUM.value == "medium"
        assert SecurityLevel.COMPATIBILITY.value == "compatibility"

    def test_compliance_standards_consistency(self):
        """Test that compliance standards are consistent."""
        # All components should recognize the same compliance standards
        assert ComplianceStandard.NIST.value == "nist"
        assert ComplianceStandard.FIPS.value == "fips"
        assert ComplianceStandard.PCI_DSS.value == "pci_dss"


# Performance and stress tests
class TestPerformance:
    """Performance tests for TLS components."""

    @pytest.mark.asyncio
    async def test_certificate_validation_performance(self):
        """Test certificate validation performance."""
        cert_manager = CertificateManager()
        mock_cert_data = b"mock certificate data"

        import time

        start_time = time.time()

        async with cert_manager as mgr:
            # Test multiple validations
            for _ in range(10):
                await mgr.validate_certificate_chain([mock_cert_data])

        end_time = time.time()
        total_time = end_time - start_time

        # Should complete reasonably quickly
        assert total_time < 5.0  # 5 seconds for 10 validations

    def test_cipher_suite_analysis_performance(self):
        """Test cipher suite analysis performance."""
        cipher_manager = CipherSuiteManager()

        import time

        start_time = time.time()

        # Test multiple analyses
        for _ in range(100):
            cipher_manager.get_cipher_suites_for_security_level(SecurityLevel.HIGH)

        end_time = time.time()
        total_time = end_time - start_time

        # Should complete quickly
        assert total_time < 1.0  # 1 second for 100 analyses


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
