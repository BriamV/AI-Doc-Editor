"""
Integration Tests: Week 1 (AES-GCM) + Week 3 (Key Management)

Tests the integration between the AES-256-GCM encryption engine from Week 1
and the Key Management system from Week 3. Validates that encrypted keys
are properly managed, stored, and rotated while maintaining data integrity.

Test Coverage:
- KeyManager using AES-256-GCM encryption from Week 1
- Key derivation integration with Argon2
- Encrypted key storage and retrieval workflows
- Key rotation with encrypted storage
- Performance validation for encryption operations
- Error handling and edge cases
- Data integrity verification across operations
"""

import os
import pytest
import asyncio
import secrets

if not os.getenv("ENABLE_T12_TESTS"):
    pytest.skip("T-12 integration tests require ENABLE_T12_TESTS=1", allow_module_level=True)

from app.security.encryption.key_derivation import Argon2KeyDerivation
from app.models.key_management import KeyType, KeyStatus, RotationTrigger


class TestWeek1Week3Integration:
    """Integration tests for AES-GCM encryption with Key Management."""

    @pytest.mark.asyncio
    async def test_key_manager_with_aes_gcm_encryption(self, integration_test_context):
        """Test KeyManager operations using AES-GCM encryption engine."""
        ctx = integration_test_context

        # Test master key creation with AES-GCM
        with ctx.measure_performance("master_key_creation"):
            master_key = await ctx.create_test_master_key()

        assert master_key is not None
        assert master_key.algorithm == "AES_256_GCM"
        assert master_key.status == KeyStatus.ACTIVE

        # Verify the key is properly encrypted and stored
        assert master_key.encrypted_key is not None
        assert len(master_key.encrypted_key) > 0

        # Test data key creation using the master key
        with ctx.measure_performance("data_key_creation"):
            data_key = await ctx.create_test_data_key(master_key.id)

        assert data_key is not None
        assert data_key.master_key_id == master_key.id
        assert data_key.algorithm == "AES_256_GCM"
        assert data_key.status == KeyStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_key_derivation_integration(self, integration_test_context, test_encryption_key):
        """Test Argon2 key derivation integration with Key Management."""
        ctx = integration_test_context

        # Create a master key using derived key material
        password = test_encryption_key["password"]
        salt = test_encryption_key["salt"]

        # Derive key using Argon2
        key_derivation = Argon2KeyDerivation()
        derived_key = await key_derivation.derive_key(
            password=password.encode(), salt=salt, key_length=32, iterations=100
        )

        # Create master key with derived key material
        master_key_data = ctx.test_key_data.create_master_key_data()
        master_key = await ctx.key_manager.create_master_key(
            name=master_key_data["name"],
            key_type=KeyType.KEK,
            algorithm="AES_256_GCM",
            key_material=derived_key,
            description="Master key created with Argon2 derivation",
        )

        assert master_key is not None
        assert master_key.status == KeyStatus.ACTIVE

        # Verify key can be used for encryption/decryption
        test_data = b"test data for encryption with derived key"

        # Encrypt data using the master key
        with ctx.measure_performance("encryption_with_derived_key"):
            encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=test_data, key=derived_key
            )

        assert encrypted_result.success
        assert encrypted_result.ciphertext != test_data
        assert encrypted_result.metadata.algorithm == "AES_256_GCM"

        # Decrypt data to verify integrity
        with ctx.measure_performance("decryption_with_derived_key"):
            decrypted_result = await ctx.aes_gcm_engine.decrypt(
                ciphertext=encrypted_result.ciphertext,
                key=derived_key,
                nonce=encrypted_result.nonce,
                tag=encrypted_result.tag,
            )

        assert decrypted_result.success
        assert decrypted_result.plaintext == test_data

    @pytest.mark.asyncio
    async def test_encrypted_key_storage_and_retrieval(self, integration_test_context):
        """Test encrypted key storage and retrieval workflows."""
        ctx = integration_test_context

        # Create multiple keys with different types
        master_key = await ctx.create_test_master_key()
        data_key1 = await ctx.create_test_data_key(master_key.id)
        data_key2 = await ctx.create_test_data_key(master_key.id)

        # Retrieve keys and verify they're properly encrypted
        retrieved_master = await ctx.key_manager.get_key_by_id(master_key.id)
        retrieved_data1 = await ctx.key_manager.get_key_by_id(data_key1.id)
        retrieved_data2 = await ctx.key_manager.get_key_by_id(data_key2.id)

        # Verify all keys are retrieved correctly
        assert retrieved_master.id == master_key.id
        assert retrieved_data1.id == data_key1.id
        assert retrieved_data2.id == data_key2.id

        # Verify encrypted key storage
        assert retrieved_master.encrypted_key is not None
        assert retrieved_data1.encrypted_key is not None
        assert retrieved_data2.encrypted_key is not None

        # Verify keys are different (proper entropy)
        assert retrieved_master.encrypted_key != retrieved_data1.encrypted_key
        assert retrieved_data1.encrypted_key != retrieved_data2.encrypted_key

        # Test key listing functionality
        all_keys = await ctx.key_manager.list_keys()
        key_ids = [key.id for key in all_keys]

        assert master_key.id in key_ids
        assert data_key1.id in key_ids
        assert data_key2.id in key_ids

    @pytest.mark.asyncio
    async def test_key_rotation_with_aes_gcm(self, integration_test_context):
        """Test key rotation while maintaining AES-GCM encryption."""
        ctx = integration_test_context

        # Create a master key
        master_key = await ctx.create_test_master_key()
        original_version = master_key.current_version

        # Create some test data encrypted with the original key
        test_data = ctx.test_key_data.create_test_plaintext(1024)

        # Get the original key material for encryption
        original_key_material = await ctx.key_manager.get_key_material(
            master_key.id, version=original_version
        )

        # Encrypt test data with original key
        with ctx.measure_performance("encryption_before_rotation"):
            encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=test_data, key=original_key_material
            )

        assert encrypted_result.success

        # Perform key rotation
        with ctx.measure_performance("key_rotation"):
            rotation_result = await ctx.key_manager.rotate_key(
                key_id=master_key.id,
                trigger=RotationTrigger.MANUAL,
                reason="Integration test key rotation",
            )

        assert rotation_result.success
        new_version = rotation_result.new_version
        assert new_version > original_version

        # Verify the key has been rotated
        rotated_key = await ctx.key_manager.get_key_by_id(master_key.id)
        assert rotated_key.current_version == new_version
        assert rotated_key.status == KeyStatus.ACTIVE

        # Verify old key version is still accessible for decryption
        old_key_material = await ctx.key_manager.get_key_material(
            master_key.id, version=original_version
        )

        # Decrypt data with old key version
        with ctx.measure_performance("decryption_with_old_key"):
            decrypted_result = await ctx.aes_gcm_engine.decrypt(
                ciphertext=encrypted_result.ciphertext,
                key=old_key_material,
                nonce=encrypted_result.nonce,
                tag=encrypted_result.tag,
            )

        assert decrypted_result.success
        assert decrypted_result.plaintext == test_data

        # Test encryption with new key version
        new_key_material = await ctx.key_manager.get_key_material(
            master_key.id, version=new_version
        )

        # Encrypt new data with rotated key
        new_test_data = ctx.test_key_data.create_test_plaintext(1024)

        with ctx.measure_performance("encryption_after_rotation"):
            new_encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=new_test_data, key=new_key_material
            )

        assert new_encrypted_result.success

        # Decrypt with new key to verify functionality
        with ctx.measure_performance("decryption_with_new_key"):
            new_decrypted_result = await ctx.aes_gcm_engine.decrypt(
                ciphertext=new_encrypted_result.ciphertext,
                key=new_key_material,
                nonce=new_encrypted_result.nonce,
                tag=new_encrypted_result.tag,
            )

        assert new_decrypted_result.success
        assert new_decrypted_result.plaintext == new_test_data

    @pytest.mark.asyncio
    async def test_performance_with_multiple_key_operations(
        self, integration_test_context, performance_timer
    ):
        """Test performance of multiple concurrent key operations."""
        ctx = integration_test_context

        # Create multiple master keys concurrently
        async def create_master_key_task():
            return await ctx.create_test_master_key()

        # Test concurrent master key creation
        performance_timer.start()
        master_keys = await asyncio.gather(*[create_master_key_task() for _ in range(5)])
        performance_timer.stop()

        create_time = performance_timer.elapsed_ms
        assert create_time < 5000  # Should complete within 5 seconds
        assert len(master_keys) == 5
        assert all(key.status == KeyStatus.ACTIVE for key in master_keys)

        # Create data keys for each master key
        async def create_data_key_task(master_key):
            return await ctx.create_test_data_key(master_key.id)

        performance_timer.start()
        data_keys = await asyncio.gather(
            *[create_data_key_task(master_key) for master_key in master_keys]
        )
        performance_timer.stop()

        data_key_create_time = performance_timer.elapsed_ms
        assert data_key_create_time < 5000  # Should complete within 5 seconds
        assert len(data_keys) == 5

        # Test concurrent encryption operations
        test_data = ctx.test_key_data.create_test_plaintext(1024)

        async def encryption_task(data_key):
            key_material = await ctx.key_manager.get_key_material(data_key.id)
            return await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)

        performance_timer.start()
        encryption_results = await asyncio.gather(
            *[encryption_task(data_key) for data_key in data_keys]
        )
        performance_timer.stop()

        encryption_time = performance_timer.elapsed_ms
        assert encryption_time < 2000  # Should complete within 2 seconds
        assert all(result.success for result in encryption_results)

    @pytest.mark.asyncio
    async def test_data_integrity_across_operations(self, integration_test_context):
        """Test data integrity across multiple key management operations."""
        ctx = integration_test_context

        # Create test data with known checksums
        test_datasets = [
            ctx.test_key_data.create_test_plaintext(size) for size in [1024, 4096, 16384]
        ]

        # Create master key
        master_key = await ctx.create_test_master_key()
        key_material = await ctx.key_manager.get_key_material(master_key.id)

        # Encrypt all datasets
        encrypted_results = []
        for test_data in test_datasets:
            result = await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)
            assert result.success
            encrypted_results.append((test_data, result))

        # Rotate the key
        rotation_result = await ctx.key_manager.rotate_key(
            key_id=master_key.id,
            trigger=RotationTrigger.MANUAL,
            reason="Data integrity test rotation",
        )
        assert rotation_result.success

        # Verify all encrypted data can still be decrypted with old key version
        old_key_material = await ctx.key_manager.get_key_material(
            master_key.id, version=rotation_result.previous_version
        )

        for original_data, encrypted_result in encrypted_results:
            decrypted_result = await ctx.aes_gcm_engine.decrypt(
                ciphertext=encrypted_result.ciphertext,
                key=old_key_material,
                nonce=encrypted_result.nonce,
                tag=encrypted_result.tag,
            )

            assert decrypted_result.success
            assert decrypted_result.plaintext == original_data

    @pytest.mark.asyncio
    async def test_error_handling_and_edge_cases(self, integration_test_context):
        """Test error handling and edge cases in Week 1 + Week 3 integration."""
        ctx = integration_test_context

        # Test encryption with invalid key
        with pytest.raises(Exception):
            await ctx.aes_gcm_engine.encrypt(plaintext=b"test data", key=b"invalid_key_too_short")

        # Test key retrieval with non-existent ID
        non_existent_key = await ctx.key_manager.get_key_by_id("non-existent-id")
        assert non_existent_key is None

        # Test key rotation on non-existent key
        rotation_result = await ctx.key_manager.rotate_key(
            key_id="non-existent-id",
            trigger=RotationTrigger.MANUAL,
            reason="Test rotation on non-existent key",
        )
        assert not rotation_result.success

        # Test decryption with wrong key
        master_key = await ctx.create_test_master_key()
        key_material = await ctx.key_manager.get_key_material(master_key.id)

        test_data = b"test data for wrong key test"
        encrypted_result = await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)
        assert encrypted_result.success

        # Try to decrypt with a different key
        wrong_key = secrets.token_bytes(32)
        decrypted_result = await ctx.aes_gcm_engine.decrypt(
            ciphertext=encrypted_result.ciphertext,
            key=wrong_key,
            nonce=encrypted_result.nonce,
            tag=encrypted_result.tag,
        )
        assert not decrypted_result.success

    @pytest.mark.asyncio
    async def test_memory_security_integration(self, integration_test_context):
        """Test memory security features across Week 1 and Week 3 components."""
        ctx = integration_test_context

        # Create key and verify secure memory handling
        master_key = await ctx.create_test_master_key()
        key_material = await ctx.key_manager.get_key_material(master_key.id)

        # Test that key material is properly secured in memory
        assert isinstance(key_material, bytes)
        assert len(key_material) == 32  # AES-256 key length

        # Perform encryption operation
        test_data = b"sensitive data requiring secure memory handling"
        encrypted_result = await ctx.aes_gcm_engine.encrypt(plaintext=test_data, key=key_material)

        assert encrypted_result.success

        # Verify cleanup operations
        await ctx.key_manager.cleanup()
        await ctx.aes_gcm_engine.cleanup()

        # Verify audit logging for security operations
        ctx.audit_logger.log_key_operation.assert_called()
        ctx.audit_logger.log_security_event.assert_called()

    @pytest.mark.asyncio
    async def test_algorithm_consistency(self, integration_test_context):
        """Test algorithm consistency between Week 1 and Week 3 components."""
        ctx = integration_test_context

        # Create keys with different supported algorithms
        algorithms = ["AES_256_GCM"]  # Can be extended when more algorithms are supported

        for algorithm in algorithms:
            # Create master key with specific algorithm
            key_data = ctx.test_key_data.create_master_key_data()
            master_key = await ctx.key_manager.create_master_key(
                name=f"{key_data['name']}_{algorithm}",
                key_type=KeyType.KEK,
                algorithm=algorithm,
                description=f"Test key for {algorithm} algorithm",
            )

            assert master_key.algorithm == algorithm

            # Verify encryption engine supports the algorithm
            key_material = await ctx.key_manager.get_key_material(master_key.id)
            test_data = b"algorithm consistency test data"

            encrypted_result = await ctx.aes_gcm_engine.encrypt(
                plaintext=test_data, key=key_material
            )

            assert encrypted_result.success
            assert encrypted_result.metadata.algorithm == "AES_256_GCM"

            # Verify decryption works with the same algorithm
            decrypted_result = await ctx.aes_gcm_engine.decrypt(
                ciphertext=encrypted_result.ciphertext,
                key=key_material,
                nonce=encrypted_result.nonce,
                tag=encrypted_result.tag,
            )

            assert decrypted_result.success
            assert decrypted_result.plaintext == test_data
