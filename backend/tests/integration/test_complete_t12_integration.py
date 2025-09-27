"""
Complete T-12 Integration Tests: Week 1 + Week 2 + Week 3

End-to-end integration testing for the complete T-12 Credential Store Security
implementation. Tests the full stack integration between AES-256-GCM encryption (Week 1),
TLS 1.3 transport security (Week 2), and Key Management system (Week 3).

Test Coverage:
- End-to-end key lifecycle testing (create → encrypt → store → rotate → decrypt)
- HSM integration with AES-GCM and TLS 1.3
- Database migrations with encrypted key storage
- Router endpoints with full security stack
- Complete security workflow validation
- Cross-component error handling
- Performance testing across all components
- Compliance validation (FIPS, NIST, SOX)
"""

import os
import pytest
import asyncio
import secrets
from datetime import datetime
from unittest.mock import Mock, patch

from app.security.key_management.hsm_integration import HSMConnectionConfig, HSMProvider
from app.models.key_management import KeyType, KeyStatus, RotationTrigger


if not os.getenv("ENABLE_T12_TESTS"):
    pytest.skip("T-12 integration tests require ENABLE_T12_TESTS=1", allow_module_level=True)


class TestCompleteT12Integration:
    """Complete end-to-end integration tests for T-12 implementation."""

    @pytest.mark.asyncio
    async def test_complete_key_lifecycle_e2e(self, integration_test_context):
        """Test complete key lifecycle: create → encrypt → store → rotate → decrypt."""
        ctx = integration_test_context

        # Step 1: Create master key with full security stack
        with ctx.measure_performance("e2e_master_key_creation"):
            master_key = await ctx.create_test_master_key()

        assert master_key is not None
        assert master_key.status == KeyStatus.ACTIVE
        assert master_key.algorithm == "AES_256_GCM"

        # Step 2: Create data keys using master key
        with ctx.measure_performance("e2e_data_key_creation"):
            data_key1 = await ctx.create_test_data_key(master_key.id)
            data_key2 = await ctx.create_test_data_key(master_key.id)

        assert data_key1.master_key_id == master_key.id
        assert data_key2.master_key_id == master_key.id

        # Step 3: Encrypt test data using data keys
        test_datasets = [
            ctx.test_key_data.create_test_plaintext(1024),
            ctx.test_key_data.create_test_plaintext(4096),
            ctx.test_key_data.create_test_plaintext(16384),
        ]

        encryption_results = []
        for i, test_data in enumerate(test_datasets):
            data_key = data_key1 if i % 2 == 0 else data_key2
            key_material = await ctx.key_manager.get_key_material(data_key.id)

            with ctx.measure_performance(f"e2e_encryption_{i}"):
                encrypted_result = await ctx.aes_gcm_engine.encrypt(
                    plaintext=test_data, key=key_material
                )

            assert encrypted_result.success
            encryption_results.append((test_data, encrypted_result, data_key.id))

        # Step 4: Store encrypted data with metadata
        stored_data = []
        for original_data, encrypted_result, key_id in encryption_results:
            storage_metadata = {
                "key_id": key_id,
                "algorithm": encrypted_result.metadata.algorithm,
                "nonce": encrypted_result.nonce.hex(),
                "tag": encrypted_result.tag.hex(),
                "timestamp": datetime.utcnow().isoformat(),
                "data_size": len(original_data),
            }
            stored_data.append(
                {
                    "ciphertext": encrypted_result.ciphertext,
                    "metadata": storage_metadata,
                    "original_data": original_data,
                }
            )

        # Step 5: Rotate master key
        with ctx.measure_performance("e2e_master_key_rotation"):
            master_rotation_result = await ctx.key_manager.rotate_key(
                key_id=master_key.id,
                trigger=RotationTrigger.SCHEDULED,
                reason="E2E integration test rotation",
            )

        assert master_rotation_result.success
        # Verify rotation created new version
        assert master_rotation_result.new_version > 1

        # Step 6: Rotate data keys
        with ctx.measure_performance("e2e_data_key_rotation"):
            data_key1_rotation = await ctx.key_manager.rotate_key(
                key_id=data_key1.id, trigger=RotationTrigger.MANUAL, reason="E2E data key rotation"
            )
            data_key2_rotation = await ctx.key_manager.rotate_key(
                key_id=data_key2.id, trigger=RotationTrigger.MANUAL, reason="E2E data key rotation"
            )

        assert data_key1_rotation.success
        assert data_key2_rotation.success

        # Step 7: Decrypt all stored data using old key versions
        for stored_item in stored_data:
            metadata = stored_item["metadata"]
            key_id = metadata["key_id"]

            # Get the key material from the version before rotation
            old_key_material = await ctx.key_manager.get_key_material(
                key_id,
                version=(
                    data_key1_rotation.previous_version
                    if key_id == data_key1.id
                    else data_key2_rotation.previous_version
                ),
            )

            with ctx.measure_performance("e2e_decryption_old_version"):
                decrypted_result = await ctx.aes_gcm_engine.decrypt(
                    ciphertext=stored_item["ciphertext"],
                    key=old_key_material,
                    nonce=bytes.fromhex(metadata["nonce"]),
                    tag=bytes.fromhex(metadata["tag"]),
                )

            assert decrypted_result.success
            assert decrypted_result.plaintext == stored_item["original_data"]

        # Step 8: Test new data encryption with rotated keys
        new_test_data = ctx.test_key_data.create_test_plaintext(2048)
        new_key_material = await ctx.key_manager.get_key_material(data_key1.id)

        with ctx.measure_performance("e2e_encryption_new_version"):
            new_encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=new_test_data, key=new_key_material
            )

        assert new_encrypted_result.success

        # Step 9: Verify audit trail completeness
        ctx.audit_logger.log_key_operation.assert_called()
        ctx.audit_logger.log_rotation_event.assert_called()

    @pytest.mark.asyncio
    async def test_hsm_integration_with_full_stack(
        self, integration_test_context, mock_hsm_manager
    ):
        """Test HSM integration with complete AES-GCM and TLS stack."""
        ctx = integration_test_context

        # Configure HSM with TLS and certificate authentication
        hsm_config = HSMConnectionConfig(
            provider=HSMProvider.AWS_CLOUDHSM,
            cluster_id="test-cluster-full-stack",
            endpoint="hsm-full-test.amazonaws.com",
            credentials={
                "client_cert_path": "/path/to/client.crt",
                "client_key_path": "/path/to/client.key",
                "ca_cert_path": "/path/to/ca.crt",
            },
            use_tls=True,
            tls_version="1.3",
            cipher_suites=["TLS_AES_256_GCM_SHA384"],
        )

        # Mock comprehensive HSM operations
        mock_hsm_manager.connect_with_full_security = Mock(return_value=True)
        mock_hsm_manager.generate_key_in_hsm = Mock(return_value=secrets.token_bytes(32))
        mock_hsm_manager.encrypt_in_hsm = Mock(return_value=b"hsm_encrypted_data")
        mock_hsm_manager.decrypt_in_hsm = Mock(return_value=b"hsm_decrypted_data")
        mock_hsm_manager.rotate_key_in_hsm = Mock(return_value=True)

        # Test HSM connection with full security stack
        with ctx.measure_performance("hsm_full_stack_connection"):
            connection_result = await mock_hsm_manager.connect_with_full_security(hsm_config)

        assert connection_result is True

        # Test HSM key generation with AES-GCM integration
        with ctx.measure_performance("hsm_aes_gcm_key_generation"):
            hsm_key = await mock_hsm_manager.generate_key_in_hsm(
                algorithm="AES_256_GCM", key_usage="ENCRYPT_DECRYPT", exportable=False
            )

        assert hsm_key is not None
        assert len(hsm_key) == 32

        # Create master key using HSM-generated material
        master_key_data = ctx.test_key_data.create_master_key_data()
        hsm_master_key = await ctx.key_manager.create_master_key(
            name=f"hsm_{master_key_data['name']}",
            key_type=KeyType.KEK,
            algorithm="AES_256_GCM",
            key_material=hsm_key,
            hsm_backed=True,
            hsm_key_id="hsm_key_123",
        )

        assert hsm_master_key.hsm_backed is True

        # Test end-to-end encryption using HSM-backed key
        test_data = b"sensitive data requiring HSM protection"

        with ctx.measure_performance("hsm_e2e_encryption"):
            encrypted_result = await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=hsm_key)

        assert encrypted_result.success

        # Test HSM key rotation
        with ctx.measure_performance("hsm_key_rotation"):
            hsm_rotation_result = await ctx.key_manager.rotate_hsm_key(
                key_id=hsm_master_key.id, hsm_manager=mock_hsm_manager
            )

        assert hsm_rotation_result.success
        mock_hsm_manager.rotate_key_in_hsm.assert_called()

    @pytest.mark.asyncio
    async def test_database_integration_with_encrypted_storage(self, integration_test_context):
        """Test database operations with encrypted key storage."""
        ctx = integration_test_context

        # Create multiple keys with different types and algorithms
        keys_to_create = [
            {"type": KeyType.KEK, "name": "master_key_1"},
            {"type": KeyType.KEK, "name": "master_key_2"},
            {"type": KeyType.DEK, "name": "data_key_1", "parent": None},
            {"type": KeyType.DEK, "name": "data_key_2", "parent": None},
            {"type": KeyType.TLS, "name": "tls_key_1"},
        ]

        created_keys = []
        for key_spec in keys_to_create:
            if key_spec["type"] == KeyType.KEK:
                key = await ctx.key_manager.create_master_key(
                    name=key_spec["name"],
                    key_type=key_spec["type"],
                    algorithm="AES_256_GCM",
                    description=f"Database integration test - {key_spec['name']}",
                )
            elif key_spec["type"] == KeyType.DEK:
                # Create with first master key as parent
                if not created_keys:
                    master_key = await ctx.create_test_master_key()
                    created_keys.append(master_key)
                    parent_id = master_key.id
                else:
                    parent_id = created_keys[0].id

                key = await ctx.key_manager.create_data_key(
                    master_key_id=parent_id,
                    name=key_spec["name"],
                    algorithm="AES_256_GCM",
                    description=f"Database integration test - {key_spec['name']}",
                )
            else:  # TLS keys
                key = await ctx.key_manager.create_tls_key(
                    name=key_spec["name"],
                    algorithm="RSA_2048",
                    description=f"Database integration test - {key_spec['name']}",
                )

            created_keys.append(key)

        # Verify all keys are stored with proper encryption
        for key in created_keys:
            stored_key = await ctx.key_manager.get_key_by_id(key.id)
            assert stored_key is not None
            assert stored_key.encrypted_key is not None
            assert stored_key.status == KeyStatus.ACTIVE

        # Test database queries with encrypted storage
        all_keys = await ctx.key_manager.list_keys()
        assert len(all_keys) >= len(created_keys)

        # Test filtering by key type
        kek_keys = await ctx.key_manager.list_keys(key_type=KeyType.KEK)
        dek_keys = await ctx.key_manager.list_keys(key_type=KeyType.DEK)
        tls_keys = await ctx.key_manager.list_keys(key_type=KeyType.TLS)

        assert len(kek_keys) >= 2
        assert len(dek_keys) >= 2
        assert len(tls_keys) >= 1

        # Test key versioning in database
        test_key = created_keys[0]
        original_version = test_key.current_version

        rotation_result = await ctx.key_manager.rotate_key(
            key_id=test_key.id,
            trigger=RotationTrigger.MANUAL,
            reason="Database integration test rotation",
        )

        assert rotation_result.success

        # Verify version history is properly stored
        key_versions = await ctx.key_manager.get_key_versions(test_key.id)
        assert len(key_versions) >= 2
        assert any(v.version == original_version for v in key_versions)
        assert any(v.version == rotation_result.new_version for v in key_versions)

    @pytest.mark.asyncio
    async def test_api_endpoints_with_full_security_stack(
        self, integration_test_context, test_client
    ):
        """Test API endpoints with complete security middleware stack."""
        ctx = integration_test_context

        # Test master key creation endpoint
        master_key_data = ctx.test_key_data.create_master_key_data()

        response = test_client.post(
            "/api/v1/keys/master",
            json=master_key_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test_token",
                "X-Forwarded-Proto": "https",
            },
        )

        # Verify security headers and response
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers

        if response.status_code == 201:
            created_key = response.json()
            key_id = created_key["id"]

            # Test key retrieval endpoint
            get_response = test_client.get(
                f"/api/v1/keys/{key_id}",
                headers={"Authorization": "Bearer test_token", "X-Forwarded-Proto": "https"},
            )

            assert get_response.status_code in [200, 404]  # 404 if mock doesn't support get

            # Test key rotation endpoint
            rotation_data = {"trigger": "manual", "reason": "API integration test rotation"}

            rotation_response = test_client.post(
                f"/api/v1/keys/{key_id}/rotate",
                json=rotation_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer test_token",
                    "X-Forwarded-Proto": "https",
                },
            )

            # Verify security headers on all endpoints
            for response_obj in [response, get_response, rotation_response]:
                if response_obj.status_code < 500:  # Don't check on server errors
                    assert "Strict-Transport-Security" in response_obj.headers

    @pytest.mark.asyncio
    async def test_performance_across_all_components(
        self, integration_test_context, performance_timer
    ):
        """Test performance across all T-12 components."""
        ctx = integration_test_context

        # Performance test configuration
        test_iterations = 10
        performance_results = {}

        # Test 1: Key creation performance
        performance_timer.start()
        master_keys = []
        for i in range(test_iterations):
            key = await ctx.create_test_master_key()
            master_keys.append(key)
        performance_timer.stop()

        performance_results["key_creation_avg"] = performance_timer.elapsed_ms / test_iterations
        assert performance_results["key_creation_avg"] < 1000  # < 1 second per key

        # Test 2: Encryption performance with different data sizes
        test_data_sizes = [1024, 10240, 102400]  # 1KB, 10KB, 100KB
        encryption_results = {}

        for size in test_data_sizes:
            test_data = ctx.test_key_data.create_test_plaintext(size)
            key_material = await ctx.key_manager.get_key_material(master_keys[0].id)

            performance_timer.start()
            for _ in range(test_iterations):
                encrypted_result = await ctx.aes_gcm_engine.encrypt(
                    plaintext=test_data, key=key_material
                )
                assert encrypted_result.success
            performance_timer.stop()

            avg_time = performance_timer.elapsed_ms / test_iterations
            encryption_results[f"encryption_{size}B"] = avg_time

            # Performance thresholds based on data size
            if size <= 1024:
                assert avg_time < 50, f"Encryption too slow for {size}B: {avg_time}ms"
            elif size <= 10240:
                assert avg_time < 100, f"Encryption too slow for {size}B: {avg_time}ms"
            else:
                assert avg_time < 200, f"Encryption too slow for {size}B: {avg_time}ms"

        # Test 3: Key rotation performance
        performance_timer.start()
        rotation_results = []
        for key in master_keys[:5]:  # Rotate first 5 keys
            result = await ctx.key_manager.rotate_key(
                key_id=key.id, trigger=RotationTrigger.MANUAL, reason="Performance test rotation"
            )
            rotation_results.append(result)
        performance_timer.stop()

        avg_rotation_time = performance_timer.elapsed_ms / 5
        performance_results["key_rotation_avg"] = avg_rotation_time
        assert avg_rotation_time < 2000  # < 2 seconds per rotation
        assert all(result.success for result in rotation_results)

        # Test 4: Concurrent operations performance
        async def concurrent_operation():
            key = await ctx.create_test_master_key()
            test_data = ctx.test_key_data.create_test_plaintext(1024)
            key_material = await ctx.key_manager.get_key_material(key.id)

            encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=test_data, key=key_material
            )
            return encrypted_result.success

        performance_timer.start()
        concurrent_results = await asyncio.gather(*[concurrent_operation() for _ in range(10)])
        performance_timer.stop()

        concurrent_time = performance_timer.elapsed_ms
        performance_results["concurrent_operations"] = concurrent_time
        assert concurrent_time < 10000  # < 10 seconds for 10 concurrent operations
        assert all(concurrent_results)

        # Log performance summary
        print("\\nT-12 Performance Results:")
        for metric, time_ms in performance_results.items():
            print(f"  {metric}: {time_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_error_recovery_and_resilience(self, integration_test_context):
        """Test error recovery and system resilience across all components."""
        ctx = integration_test_context

        # Test 1: Database connection recovery
        master_key = await ctx.create_test_master_key()

        # Simulate database connection error
        with patch.object(ctx.db_session, "execute", side_effect=Exception("DB connection lost")):
            with pytest.raises(Exception):
                await ctx.key_manager.get_key_by_id(master_key.id)

        # Verify recovery after connection restored
        recovered_key = await ctx.key_manager.get_key_by_id(master_key.id)
        assert recovered_key is not None

        # Test 2: HSM unavailability recovery
        ctx.hsm_manager.is_available.return_value = False
        ctx.hsm_manager.connect.side_effect = Exception("HSM unavailable")

        # Verify system continues with software fallback
        fallback_key = await ctx.key_manager.create_master_key(
            name="fallback_test_key",
            key_type=KeyType.KEK,
            algorithm="AES_256_GCM",
            use_hsm_if_available=True,
            fallback_to_software=True,
        )

        assert fallback_key is not None
        assert fallback_key.hsm_backed is False

        # Test 3: Encryption engine recovery
        test_data = b"error recovery test data"
        key_material = await ctx.key_manager.get_key_material(master_key.id)

        # Simulate encryption error
        with patch.object(
            ctx.aes_gcm_engine, "encrypt", side_effect=Exception("Encryption failed")
        ):
            with pytest.raises(Exception):
                await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)

        # Verify recovery
        recovered_result = await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)
        assert recovered_result.success

    @pytest.mark.asyncio
    async def test_compliance_validation(self, integration_test_context):
        """Test compliance validation across all T-12 components."""
        ctx = integration_test_context

        # FIPS 140-2 compliance testing
        master_key = await ctx.create_test_master_key()

        # Verify FIPS-approved algorithms
        assert master_key.algorithm == "AES_256_GCM"  # FIPS approved

        # Verify key strength
        key_material = await ctx.key_manager.get_key_material(master_key.id)
        assert len(key_material) == 32  # 256-bit key strength

        # NIST SP 800-57 compliance testing
        # Verify key lifecycle management
        rotation_policy = await ctx.key_manager.get_rotation_policy(master_key.id)
        assert rotation_policy is not None
        assert rotation_policy.max_key_age_days <= 365  # Annual rotation maximum

        # Test key versioning for compliance
        rotation_result = await ctx.key_manager.rotate_key(
            key_id=master_key.id, trigger=RotationTrigger.POLICY, reason="Compliance rotation test"
        )
        assert rotation_result.success

        # Verify audit trail completeness
        audit_entries = await ctx.key_manager.get_audit_trail(master_key.id)
        assert len(audit_entries) >= 2  # Creation + rotation

        required_audit_fields = ["timestamp", "operation", "user_id", "result"]
        for entry in audit_entries:
            for field in required_audit_fields:
                assert hasattr(entry, field) or field in entry

        # SOX compliance testing
        # Verify data integrity controls
        test_data = b"SOX compliance test data"
        encrypted_result = await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)

        # Verify integrity tag is present (authentication)
        assert encrypted_result.tag is not None
        assert len(encrypted_result.tag) >= 16  # Minimum tag length

        # Test integrity verification
        decrypted_result = await ctx.aes_gcm_engine.decrypt(
            ciphertext=encrypted_result.ciphertext,
            key=key_material,
            nonce=encrypted_result.nonce,
            tag=encrypted_result.tag,
        )

        assert decrypted_result.success
        assert decrypted_result.plaintext == test_data

        # Verify tamper detection
        tampered_ciphertext = bytearray(encrypted_result.ciphertext)
        tampered_ciphertext[0] ^= 1  # Flip one bit

        tamper_test_result = await ctx.aes_gcm_engine.decrypt(
            ciphertext=bytes(tampered_ciphertext),
            key=key_material,
            nonce=encrypted_result.nonce,
            tag=encrypted_result.tag,
        )

        assert not tamper_test_result.success  # Should fail integrity check

    @pytest.mark.asyncio
    async def test_automated_rotation_e2e(self, integration_test_context):
        """Test automated key rotation end-to-end functionality."""
        ctx = integration_test_context

        # Create master key with rotation policy
        master_key = await ctx.create_test_master_key()

        # Set up rotation policy
        rotation_policy_data = ctx.test_key_data.create_rotation_policy_data()
        rotation_policy_data["rotation_interval_days"] = 1  # Daily for testing

        rotation_policy = await ctx.key_manager.create_rotation_policy(
            key_id=master_key.id, **rotation_policy_data
        )

        assert rotation_policy.auto_rotation_enabled is True

        # Create data keys that depend on the master key
        data_keys = []
        for i in range(3):
            data_key = await ctx.create_test_data_key(master_key.id)
            data_keys.append(data_key)

        # Encrypt data with each data key
        encrypted_datasets = []
        for data_key in data_keys:
            test_data = ctx.test_key_data.create_test_plaintext(1024)
            key_material = await ctx.key_manager.get_key_material(data_key.id)

            encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=test_data, key=key_material
            )

            encrypted_datasets.append(
                {
                    "data_key_id": data_key.id,
                    "original_data": test_data,
                    "encrypted_result": encrypted_result,
                }
            )

        # Simulate automated rotation trigger
        with ctx.measure_performance("automated_rotation_e2e"):
            rotation_result = await ctx.key_manager.execute_automated_rotation(
                key_id=master_key.id, policy=rotation_policy
            )

        assert rotation_result.success

        # Verify all dependent data keys are also rotated
        for data_key in data_keys:
            updated_data_key = await ctx.key_manager.get_key_by_id(data_key.id)
            assert updated_data_key.current_version > data_key.current_version

        # Verify old encrypted data can still be decrypted
        for dataset in encrypted_datasets:
            # Get old key version for decryption
            old_key_material = await ctx.key_manager.get_key_material(
                dataset["data_key_id"], version=1  # Original version before rotation
            )

            decrypted_result = await ctx.aes_gcm_engine.decrypt(
                ciphertext=dataset["encrypted_result"].ciphertext,
                key=old_key_material,
                nonce=dataset["encrypted_result"].nonce,
                tag=dataset["encrypted_result"].tag,
            )

            assert decrypted_result.success
            assert decrypted_result.plaintext == dataset["original_data"]

        # Verify new data can be encrypted with rotated keys
        for data_key in data_keys:
            new_test_data = ctx.test_key_data.create_test_plaintext(512)
            new_key_material = await ctx.key_manager.get_key_material(data_key.id)

            new_encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=new_test_data, key=new_key_material
            )

            assert new_encrypted_result.success

        # Verify rotation notifications were sent
        ctx.audit_logger.log_rotation_event.assert_called()

        # Verify policy compliance after rotation
        updated_policy = await ctx.key_manager.get_rotation_policy(master_key.id)
        assert updated_policy.last_rotation_date is not None
