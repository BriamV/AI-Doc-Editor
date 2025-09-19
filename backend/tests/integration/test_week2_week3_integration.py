"""
Integration Tests: Week 2 (TLS 1.3) + Week 3 (Key Management)

Tests the integration between the TLS 1.3 transport security from Week 2
and the Key Management system from Week 3. Validates that key management
operations work securely over TLS, certificate-based HSM authentication,
and secure key transport protocols.

Test Coverage:
- Key management endpoints with TLS security middleware
- Certificate-based HSM authentication
- Secure key transport over TLS 1.3
- Integration with security headers and HSTS
- TLS certificate management for key operations
- Performance validation for secure transport
- Security event logging and monitoring
- Error handling for TLS/Key Management interactions
"""

import pytest
import asyncio
import ssl
import secrets
from datetime import datetime
from unittest.mock import Mock, patch

from app.security.key_management.hsm_integration import HSMConnectionConfig, HSMProvider
from app.models.key_management import KeyType, KeyStatus, RotationTrigger


class TestWeek2Week3Integration:
    """Integration tests for TLS 1.3 transport security with Key Management."""

    @pytest.mark.asyncio
    async def test_key_management_with_tls_middleware(
        self, integration_test_context, mock_tls_config, security_middleware
    ):
        """Test key management operations with TLS security middleware."""
        ctx = integration_test_context

        # Configure TLS middleware for key management operations
        mock_tls_config.is_tls13_enabled.return_value = True
        mock_tls_config.get_cipher_suites.return_value = [
            "TLS_AES_256_GCM_SHA384",
            "TLS_CHACHA20_POLY1305_SHA256",
        ]

        # Test key creation with TLS middleware
        with ctx.measure_performance("key_creation_with_tls"):
            master_key = await ctx.create_test_master_key()

        assert master_key is not None
        assert master_key.status == KeyStatus.ACTIVE

        # Verify TLS configuration was checked during operation
        mock_tls_config.is_tls13_enabled.assert_called()

        # Test key retrieval with TLS security
        with ctx.measure_performance("key_retrieval_with_tls"):
            retrieved_key = await ctx.key_manager.get_key_by_id(master_key.id)

        assert retrieved_key is not None
        assert retrieved_key.id == master_key.id

        # Test key rotation with TLS protection
        with ctx.measure_performance("key_rotation_with_tls"):
            rotation_result = await ctx.key_manager.rotate_key(
                key_id=master_key.id,
                trigger=RotationTrigger.MANUAL,
                reason="TLS integration test rotation",
            )

        assert rotation_result.success

    @pytest.mark.asyncio
    async def test_certificate_based_hsm_authentication(
        self, integration_test_context, mock_hsm_manager
    ):
        """Test certificate-based HSM authentication with key management."""
        ctx = integration_test_context

        # Mock certificate-based HSM configuration
        hsm_config = HSMConnectionConfig(
            provider=HSMProvider.AWS_CLOUDHSM,
            cluster_id="test-cluster-tls",
            endpoint="hsm-test.amazonaws.com",
            credentials={
                "client_cert_path": "/path/to/client.crt",
                "client_key_path": "/path/to/client.key",
                "ca_cert_path": "/path/to/ca.crt",
            },
            use_tls=True,
            tls_version="1.3",
        )

        # Configure HSM manager with certificate authentication
        mock_hsm_manager.configure_certificate_auth = Mock(return_value=True)
        mock_hsm_manager.validate_certificate = Mock(return_value=True)
        mock_hsm_manager.connect_with_tls = Mock(return_value=True)

        # Test HSM connection with certificate authentication
        with ctx.measure_performance("hsm_certificate_auth"):
            connection_result = await mock_hsm_manager.connect_with_tls(hsm_config)

        assert connection_result is True
        mock_hsm_manager.configure_certificate_auth.assert_called()
        mock_hsm_manager.validate_certificate.assert_called()

        # Test key operations with certificate-authenticated HSM
        master_key = await ctx.create_test_master_key()
        assert master_key is not None
        assert master_key.key_type in ["kek", "dek"]

        # Mock HSM key operations with certificate authentication
        mock_hsm_manager.generate_key_with_auth = Mock(return_value=secrets.token_bytes(32))
        mock_hsm_manager.store_key_with_auth = Mock(return_value=True)

        # Test HSM key generation with certificate auth
        with ctx.measure_performance("hsm_key_generation_with_certs"):
            hsm_key = await mock_hsm_manager.generate_key_with_auth(
                key_type="AES", key_size=256, cert_auth=True
            )

        assert hsm_key is not None
        assert len(hsm_key) == 32

    @pytest.mark.asyncio
    async def test_secure_key_transport_over_tls13(self, integration_test_context, mock_tls_config):
        """Test secure key transport over TLS 1.3."""
        ctx = integration_test_context

        # Configure TLS 1.3 for secure key transport
        mock_tls_config.is_tls13_enabled.return_value = True
        mock_tls_config.get_minimum_version.return_value = ssl.TLSVersion.TLSv1_3
        mock_tls_config.get_cipher_suites.return_value = ["TLS_AES_256_GCM_SHA384"]

        # Create master key for transport testing
        master_key = await ctx.create_test_master_key()
        key_material = await ctx.key_manager.get_key_material(master_key.id)

        # Mock secure transport layer
        with patch("app.security.transport.tls_config.TLSConfig") as mock_transport:
            mock_transport.return_value = mock_tls_config

            # Test key export with TLS 1.3 protection
            with ctx.measure_performance("secure_key_export"):
                export_result = await ctx.key_manager.export_key(
                    key_id=master_key.id,
                    format="JWK",
                    encryption_required=True,
                    transport_security="TLS_1_3",
                )

            assert export_result is not None
            assert "encryption" in export_result.get("metadata", {})

            # Test key import with TLS 1.3 protection
            import_data = {
                "key_material": key_material.hex(),
                "algorithm": "AES_256_GCM",
                "metadata": {"source": "secure_transport_test"},
            }

            with ctx.measure_performance("secure_key_import"):
                import_result = await ctx.key_manager.import_key(
                    key_data=import_data, transport_security="TLS_1_3", verify_integrity=True
                )

            assert import_result.success

    @pytest.mark.asyncio
    async def test_security_headers_integration(self, integration_test_context, test_client):
        """Test integration with security headers and HSTS."""
        ctx = integration_test_context

        # Test key management API endpoints with security headers
        key_data = ctx.test_key_data.create_master_key_data()

        # Make API request for key creation
        response = test_client.post(
            "/api/v1/keys/master",
            json=key_data,
            headers={"Content-Type": "application/json", "X-Forwarded-Proto": "https"},
        )

        # Verify security headers are present
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-XSS-Protection" in response.headers

        # Test HSTS header configuration
        hsts_header = response.headers.get("Strict-Transport-Security")
        assert "max-age=" in hsts_header
        assert "includeSubDomains" in hsts_header

        # Test key retrieval with security headers
        if response.status_code == 201:
            key_id = response.json().get("id")
            if key_id:
                get_response = test_client.get(
                    f"/api/v1/keys/{key_id}", headers={"X-Forwarded-Proto": "https"}
                )

                # Verify security headers on GET request
                assert "Strict-Transport-Security" in get_response.headers
                assert "Cache-Control" in get_response.headers

    @pytest.mark.asyncio
    async def test_tls_certificate_management_for_keys(
        self, integration_test_context, mock_tls_config
    ):
        """Test TLS certificate management for key operations."""
        ctx = integration_test_context

        # Mock certificate manager
        cert_manager = Mock()
        cert_manager.load_certificate = Mock(return_value=True)
        cert_manager.validate_certificate = Mock(return_value=True)
        cert_manager.get_certificate_chain = Mock(return_value=["cert1", "cert2"])
        cert_manager.is_certificate_valid = Mock(return_value=True)

        # Test certificate validation for key operations
        master_key = await ctx.create_test_master_key()

        # Mock certificate-based key access
        with patch(
            "app.security.transport.certificate_manager.CertificateManager"
        ) as mock_cert_mgr:
            mock_cert_mgr.return_value = cert_manager

            # Test key access with certificate validation
            with ctx.measure_performance("certificate_validated_key_access"):
                key_access_result = await ctx.key_manager.access_key_with_certificate(
                    key_id=master_key.id,
                    certificate_path="/path/to/client.crt",
                    validate_chain=True,
                )

            assert key_access_result.success
            cert_manager.validate_certificate.assert_called()

        # Test certificate rotation impact on key access
        cert_manager.is_certificate_expired = Mock(return_value=True)
        cert_manager.renew_certificate = Mock(return_value=True)

        with ctx.measure_performance("certificate_renewal_key_access"):
            renewal_result = await ctx.key_manager.handle_certificate_renewal(
                key_id=master_key.id, auto_renew=True
            )

        assert renewal_result.success

    @pytest.mark.asyncio
    async def test_performance_with_tls_overhead(
        self, integration_test_context, mock_tls_config, performance_timer
    ):
        """Test performance impact of TLS overhead on key operations."""
        ctx = integration_test_context

        # Configure TLS with different cipher suites
        cipher_suites = [
            "TLS_AES_256_GCM_SHA384",
            "TLS_CHACHA20_POLY1305_SHA256",
            "TLS_AES_128_GCM_SHA256",
        ]

        performance_results = {}

        for cipher_suite in cipher_suites:
            mock_tls_config.get_cipher_suites.return_value = [cipher_suite]

            # Test key creation performance with specific cipher
            performance_timer.start()
            master_key = await ctx.create_test_master_key()
            performance_timer.stop()

            performance_results[f"creation_{cipher_suite}"] = performance_timer.elapsed_ms

            # Test key retrieval performance
            performance_timer.start()
            retrieved_key = await ctx.key_manager.get_key_by_id(master_key.id)
            performance_timer.stop()

            # Verify retrieval was successful
            assert retrieved_key is not None
            assert retrieved_key.id == master_key.id

            performance_results[f"retrieval_{cipher_suite}"] = performance_timer.elapsed_ms

            # Test key rotation performance
            performance_timer.start()
            rotation_result = await ctx.key_manager.rotate_key(
                key_id=master_key.id,
                trigger=RotationTrigger.MANUAL,
                reason=f"Performance test with {cipher_suite}",
            )
            performance_timer.stop()

            # Verify rotation was successful
            assert rotation_result.success
            assert rotation_result.new_version > 1

            performance_results[f"rotation_{cipher_suite}"] = performance_timer.elapsed_ms

        # Verify performance is within acceptable thresholds
        for operation, time_ms in performance_results.items():
            if "creation" in operation:
                assert time_ms < 2000, f"{operation} took {time_ms}ms (max: 2000ms)"
            elif "retrieval" in operation:
                assert time_ms < 1000, f"{operation} took {time_ms}ms (max: 1000ms)"
            elif "rotation" in operation:
                assert time_ms < 5000, f"{operation} took {time_ms}ms (max: 5000ms)"

    @pytest.mark.asyncio
    async def test_security_event_logging_integration(
        self, integration_test_context, mock_tls_config
    ):
        """Test security event logging for TLS and key management integration."""
        ctx = integration_test_context

        # Test TLS security events
        mock_tls_config.log_security_event = Mock()
        mock_tls_config.log_cipher_negotiation = Mock()
        mock_tls_config.log_certificate_validation = Mock()

        # Create key with TLS logging
        with ctx.measure_performance("key_creation_with_logging"):
            master_key = await ctx.create_test_master_key()

        # Verify key creation was successful
        assert master_key is not None
        assert master_key.key_type in ["kek", "dek"]

        # Verify security events are logged
        ctx.audit_logger.log_security_event.assert_called()

        # Test HSM security events
        hsm_security_events = []

        def capture_hsm_event(event_type, details):
            hsm_security_events.append(
                {"type": event_type, "details": details, "timestamp": datetime.utcnow()}
            )

        ctx.hsm_manager.log_security_event = Mock(side_effect=capture_hsm_event)

        # Perform HSM operations with security logging
        await ctx.hsm_manager.generate_key()
        await ctx.hsm_manager.encrypt(b"test data")

        # Verify HSM security events were captured
        assert len(hsm_security_events) >= 2
        assert any(event["type"] == "key_generation" for event in hsm_security_events)

    @pytest.mark.asyncio
    async def test_error_handling_tls_key_management(
        self, integration_test_context, mock_tls_config
    ):
        """Test error handling for TLS and key management interactions."""
        ctx = integration_test_context

        # Test TLS configuration errors
        mock_tls_config.is_tls13_enabled.return_value = False
        mock_tls_config.get_minimum_version.return_value = ssl.TLSVersion.TLSv1_2

        # Test key operation with insufficient TLS version
        with pytest.raises(Exception) as exc_info:
            await ctx.key_manager.create_master_key_with_tls_validation(
                name="test_key_tls_error", require_tls13=True
            )

        assert "TLS 1.3 required" in str(exc_info.value)

        # Test certificate validation errors
        mock_tls_config.validate_certificate.return_value = False

        master_key = await ctx.create_test_master_key()

        # Test key access with invalid certificate
        with pytest.raises(Exception) as exc_info:
            await ctx.key_manager.access_key_with_certificate(
                key_id=master_key.id, certificate_path="/invalid/cert/path"
            )

        assert "certificate validation failed" in str(exc_info.value).lower()

        # Test HSM connection errors with TLS
        ctx.hsm_manager.connect_with_tls = Mock(side_effect=Exception("TLS handshake failed"))

        with pytest.raises(Exception) as exc_info:
            await ctx.hsm_manager.connect_with_tls({"use_tls": True, "tls_version": "1.3"})

        assert "TLS handshake failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_concurrent_tls_key_operations(
        self, integration_test_context, mock_tls_config, performance_timer
    ):
        """Test concurrent TLS-protected key operations."""
        ctx = integration_test_context

        # Configure TLS for concurrent operations
        mock_tls_config.is_tls13_enabled.return_value = True
        mock_tls_config.supports_concurrent_connections.return_value = True

        # Test concurrent key creation with TLS
        async def create_key_with_tls():
            return await ctx.create_test_master_key()

        performance_timer.start()
        concurrent_keys = await asyncio.gather(*[create_key_with_tls() for _ in range(10)])
        performance_timer.stop()

        assert len(concurrent_keys) == 10
        assert all(key.status == KeyStatus.ACTIVE for key in concurrent_keys)
        assert performance_timer.elapsed_ms < 10000  # Should complete within 10 seconds

        # Test concurrent key rotations with TLS
        async def rotate_key_with_tls(key):
            return await ctx.key_manager.rotate_key(
                key_id=key.id, trigger=RotationTrigger.MANUAL, reason="Concurrent TLS rotation test"
            )

        performance_timer.start()
        rotation_results = await asyncio.gather(
            *[rotate_key_with_tls(key) for key in concurrent_keys[:5]]
        )
        performance_timer.stop()

        assert all(result.success for result in rotation_results)
        assert performance_timer.elapsed_ms < 15000  # Should complete within 15 seconds

    @pytest.mark.asyncio
    async def test_tls_cipher_suite_compatibility(self, integration_test_context, mock_tls_config):
        """Test TLS cipher suite compatibility with key management operations."""
        ctx = integration_test_context

        # Test different TLS cipher suites
        cipher_suites = [
            "TLS_AES_256_GCM_SHA384",
            "TLS_CHACHA20_POLY1305_SHA256",
            "TLS_AES_128_GCM_SHA256",
            "TLS_AES_128_CCM_SHA256",
        ]

        for cipher_suite in cipher_suites:
            mock_tls_config.get_cipher_suites.return_value = [cipher_suite]
            mock_tls_config.is_cipher_suite_supported.return_value = True

            # Test key operations with specific cipher suite
            master_key = await ctx.create_test_master_key()
            assert master_key is not None

            # Test key material operations
            key_material = await ctx.key_manager.get_key_material(master_key.id)
            assert key_material is not None

            # Test encryption with cipher suite context
            test_data = b"cipher suite compatibility test"
            encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=test_data, key=key_material
            )

            assert encrypted_result.success

            # Verify cipher suite was used
            mock_tls_config.is_cipher_suite_supported.assert_called()

    @pytest.mark.asyncio
    async def test_tls_session_management_with_keys(
        self, integration_test_context, mock_tls_config
    ):
        """Test TLS session management integration with key operations."""
        ctx = integration_test_context

        # Mock TLS session management
        mock_tls_config.create_session = Mock(return_value="session_123")
        mock_tls_config.validate_session = Mock(return_value=True)
        mock_tls_config.close_session = Mock(return_value=True)

        # Test key operations within TLS session
        session_id = mock_tls_config.create_session()

        with ctx.measure_performance("tls_session_key_operations"):
            # Create key within TLS session
            master_key = await ctx.key_manager.create_key_in_session(
                session_id=session_id,
                name="session_test_key",
                key_type=KeyType.KEK,
                algorithm="AES_256_GCM",
            )

            # Perform operations within the same session
            key_material = await ctx.key_manager.get_key_material_in_session(
                session_id=session_id, key_id=master_key.id
            )

            # Rotate key within session
            rotation_result = await ctx.key_manager.rotate_key_in_session(
                session_id=session_id, key_id=master_key.id, trigger=RotationTrigger.MANUAL
            )

        assert master_key is not None
        assert key_material is not None
        assert rotation_result.success

        # Verify session management calls
        mock_tls_config.create_session.assert_called()
        mock_tls_config.validate_session.assert_called()

        # Close TLS session
        close_result = mock_tls_config.close_session(session_id)
        assert close_result is True
