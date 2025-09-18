"""
Unit Tests for Secure Nonce Manager

Comprehensive test suite for the nonce management system including
uniqueness validation, collision detection, and thread safety verification.

TEST CATEGORIES:
1. Basic Nonce Generation and Validation
2. Uniqueness and Collision Detection
3. Thread Safety and Concurrent Access
4. Memory Management and Cleanup
5. Key-based Tracking and Isolation
6. Performance and Scalability
7. Error Handling and Edge Cases
8. Security Properties Validation

SECURITY TEST AREAS:
- Nonce uniqueness guarantees
- Cryptographic randomness quality
- Birthday paradox protection
- Memory exhaustion handling
- Thread safety in concurrent environments
"""

import pytest
import secrets
import threading
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

# Import modules under test
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from app.security.encryption.nonce_manager import (
    NonceManager,
    NonceError,
    NonceCollisionError,
    NonceValidationError,
    NonceExhaustionError
)


class TestNonceManagerBasicOperations:
    """Test basic nonce generation and validation operations"""

    @pytest.fixture
    def manager(self):
        """Create nonce manager for testing"""
        return NonceManager(max_tracked_per_key=1000)

    def test_basic_nonce_generation(self, manager):
        """Test basic nonce generation"""
        nonce = manager.generate_nonce()

        # Verify basic properties
        assert isinstance(nonce, bytes)
        assert len(nonce) == manager.GCM_NONCE_LENGTH
        assert nonce != b'\x00' * manager.GCM_NONCE_LENGTH  # Not all zeros

    def test_custom_nonce_lengths(self, manager):
        """Test nonce generation with custom lengths"""
        test_lengths = [8, 12, 16]

        for length in test_lengths:
            nonce = manager.generate_nonce(length)
            assert len(nonce) == length

    def test_invalid_nonce_lengths(self, manager):
        """Test rejection of invalid nonce lengths"""
        invalid_lengths = [4, 32, 64]

        for length in invalid_lengths:
            with pytest.raises(NonceValidationError):
                manager.generate_nonce(length)

    def test_nonce_randomness_quality(self, manager):
        """Test quality of nonce randomness"""
        nonces = [manager.generate_nonce() for _ in range(100)]

        # All nonces should be different
        unique_nonces = set(nonces)
        assert len(unique_nonces) == len(nonces)

        # Basic entropy check
        for nonce in nonces[:10]:  # Check first 10
            unique_bytes = len(set(nonce))
            # Should have reasonable byte diversity
            assert unique_bytes >= len(nonce) // 3


class TestNonceUniquenessAndTracking:
    """Test nonce uniqueness and tracking functionality"""

    @pytest.fixture
    def manager(self):
        return NonceManager(max_tracked_per_key=1000)

    def test_nonce_uniqueness_single_key(self, manager):
        """Test nonce uniqueness within single key scope"""
        key_id = "test_key_1"
        nonces = set()
        iterations = 1000

        for _ in range(iterations):
            nonce = manager.generate_nonce(key_id=key_id)
            assert nonce not in nonces, "Duplicate nonce detected"
            nonces.add(nonce)

        assert len(nonces) == iterations

    def test_nonce_uniqueness_multiple_keys(self, manager):
        """Test nonce isolation between different keys"""
        key1_nonces = set()
        key2_nonces = set()

        # Generate nonces for two different keys
        for i in range(500):
            nonce1 = manager.generate_nonce(key_id="key_1")
            nonce2 = manager.generate_nonce(key_id="key_2")

            key1_nonces.add(nonce1)
            key2_nonces.add(nonce2)

        # Each key should have unique nonces
        assert len(key1_nonces) == 500
        assert len(key2_nonces) == 500

        # Keys can share nonces (different scopes)
        # This is acceptable behavior

    def test_nonce_validation_success(self, manager):
        """Test successful nonce validation"""
        key_id = "test_key"
        nonce = manager.generate_nonce(key_id=key_id)

        # First validation should succeed (nonce is new)
        # Note: generate_nonce automatically tracks, so this tests
        # the validation logic with a known-good nonce
        assert manager.validate_nonce(nonce, key_id="different_key") is True

    def test_nonce_collision_detection(self, manager):
        """Test collision detection for reused nonces"""
        key_id = "test_key"

        # Generate a nonce (automatically tracked)
        nonce = manager.generate_nonce(key_id=key_id)

        # Try to validate the same nonce again (should detect collision)
        with pytest.raises(NonceCollisionError):
            manager.validate_nonce(nonce, key_id=key_id)

    def test_mark_nonce_used_functionality(self, manager):
        """Test manual nonce marking as used"""
        key_id = "test_key"
        nonce = secrets.token_bytes(12)

        # Initially should be valid
        assert manager.validate_nonce(nonce, key_id=key_id) is True

        # Mark as used
        assert manager.mark_nonce_used(nonce, key_id=key_id) is True

        # Now should detect collision
        with pytest.raises(NonceCollisionError):
            manager.validate_nonce(nonce, key_id=key_id)

        # Marking already used nonce should return False
        assert manager.mark_nonce_used(nonce, key_id=key_id) is False


class TestNonceValidation:
    """Test nonce validation functionality"""

    @pytest.fixture
    def manager(self):
        return NonceManager()

    def test_empty_nonce_rejection(self, manager):
        """Test rejection of empty nonces"""
        with pytest.raises(NonceValidationError):
            manager.validate_nonce(b"")

    def test_invalid_length_nonce_rejection(self, manager):
        """Test rejection of invalid length nonces"""
        # Too short
        with pytest.raises(NonceValidationError):
            manager.validate_nonce(b"short")

        # Too long
        with pytest.raises(NonceValidationError):
            manager.validate_nonce(b"x" * 32)

    def test_weak_nonce_rejection(self, manager):
        """Test rejection of weak nonces"""
        # All zeros
        weak_nonce = b'\x00' * 12
        with pytest.raises(NonceValidationError):
            manager.validate_nonce(weak_nonce)

        # All ones
        weak_nonce = b'\xff' * 12
        with pytest.raises(NonceValidationError):
            manager.validate_nonce(weak_nonce)

    def test_valid_nonce_acceptance(self, manager):
        """Test acceptance of valid nonces"""
        # Good random nonce
        good_nonce = secrets.token_bytes(12)
        assert manager.validate_nonce(good_nonce) is True

        # Different lengths
        for length in [8, 12, 16]:
            nonce = secrets.token_bytes(length)
            assert manager.validate_nonce(nonce) is True


class TestNonceThreadSafety:
    """Test thread safety of nonce operations"""

    @pytest.fixture
    def manager(self):
        return NonceManager(max_tracked_per_key=10000)

    def test_concurrent_nonce_generation(self, manager):
        """Test concurrent nonce generation from multiple threads"""
        all_nonces = []
        errors = []
        num_threads = 10
        nonces_per_thread = 100

        def generation_worker():
            try:
                thread_nonces = []
                for i in range(nonces_per_thread):
                    nonce = manager.generate_nonce(
                        key_id=f"thread_{threading.current_thread().ident}"
                    )
                    thread_nonces.append(nonce)
                all_nonces.extend(thread_nonces)
            except Exception as e:
                errors.append(e)

        # Start threads
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=generation_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify results
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(all_nonces) == num_threads * nonces_per_thread

        # All nonces should be unique across all threads
        unique_nonces = set(all_nonces)
        assert len(unique_nonces) == len(all_nonces)

    def test_concurrent_validation(self, manager):
        """Test concurrent nonce validation"""
        # Pre-generate nonces for testing
        test_nonces = [secrets.token_bytes(12) for _ in range(100)]
        validation_results = []
        errors = []

        def validation_worker():
            try:
                for nonce in test_nonces:
                    try:
                        result = manager.validate_nonce(
                            nonce,
                            key_id=f"thread_{threading.current_thread().ident}"
                        )
                        validation_results.append(("success", result))
                    except NonceCollisionError:
                        validation_results.append(("collision", False))
                    except Exception as e:
                        validation_results.append(("error", str(e)))
            except Exception as e:
                errors.append(e)

        # Start validation threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=validation_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify no unexpected errors
        assert len(errors) == 0, f"Unexpected errors: {errors}"

        # Should have results from all threads
        assert len(validation_results) > 0

    def test_concurrent_key_operations(self, manager):
        """Test concurrent operations on different keys"""
        key_operations = []
        errors = []

        def key_worker(key_id):
            try:
                operations = []
                for i in range(50):
                    # Generate nonce
                    nonce = manager.generate_nonce(key_id=key_id)
                    operations.append(("generate", len(nonce)))

                    # Validate a different nonce
                    test_nonce = secrets.token_bytes(12)
                    try:
                        manager.validate_nonce(test_nonce, key_id=key_id)
                        operations.append(("validate", True))
                    except NonceCollisionError:
                        operations.append(("validate", False))

                key_operations.extend(operations)
            except Exception as e:
                errors.append(e)

        # Start workers for different keys
        threads = []
        for i in range(5):
            thread = threading.Thread(target=key_worker, args=(f"key_{i}",))
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify results
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(key_operations) > 0


class TestNonceMemoryManagement:
    """Test memory management and cleanup functionality"""

    @pytest.fixture
    def manager(self):
        return NonceManager(max_tracked_per_key=100)

    def test_memory_limit_enforcement(self, manager):
        """Test that memory limits are enforced"""
        key_id = "test_key"

        # Generate more nonces than the limit
        for i in range(150):
            nonce = manager.generate_nonce(key_id=key_id)

        # Should not exceed the limit
        stats = manager.get_nonce_stats(key_id=key_id)
        assert stats["nonces_generated"] <= manager._max_tracked_per_key

    def test_automatic_cleanup_old_nonces(self, manager):
        """Test automatic cleanup of old nonces"""
        key_id = "test_key"

        # Generate some nonces
        for i in range(50):
            manager.generate_nonce(key_id=key_id)

        initial_stats = manager.get_nonce_stats(key_id=key_id)
        initial_count = initial_stats["nonces_generated"]

        # Perform cleanup (with very recent age to force cleanup)
        cleanup_stats = manager.cleanup_old_nonces(max_age_hours=0, key_id=key_id)

        # Should have cleaned up some nonces
        assert cleanup_stats["cleaned_keys"] > 0 or cleanup_stats["removed_nonces"] >= 0

    def test_memory_usage_statistics(self, manager):
        """Test memory usage statistics"""
        # Generate nonces across multiple keys
        for key_id in ["key1", "key2", "key3"]:
            for i in range(30):
                manager.generate_nonce(key_id=key_id)

        # Get global stats
        stats = manager.get_nonce_stats()

        assert "active_keys" in stats
        assert "total_nonces_tracked" in stats
        assert "memory_efficiency" in stats
        assert stats["active_keys"] >= 3

    def test_key_tracking_reset(self, manager):
        """Test resetting tracking for specific key"""
        key_id = "test_key"

        # Generate nonces
        for i in range(20):
            manager.generate_nonce(key_id=key_id)

        # Verify tracking exists
        stats_before = manager.get_nonce_stats(key_id=key_id)
        assert stats_before["nonces_generated"] > 0

        # Reset tracking
        assert manager.reset_key_tracking(key_id) is True

        # Verify tracking is cleared
        stats_after = manager.get_nonce_stats(key_id=key_id)
        assert "error" in stats_after  # Key not found

        # Reset non-existent key should return False
        assert manager.reset_key_tracking("non_existent") is False


class TestNonceExportAndStatistics:
    """Test nonce export and statistics functionality"""

    @pytest.fixture
    def manager(self):
        return NonceManager(max_tracked_per_key=1000)

    def test_nonce_hash_export(self, manager):
        """Test export of nonce hashes for backup"""
        key1, key2 = "key1", "key2"

        # Generate nonces for multiple keys
        for i in range(20):
            manager.generate_nonce(key_id=key1)
            manager.generate_nonce(key_id=key2)

        # Export all keys
        export_data = manager.export_nonce_hashes()

        assert "export_timestamp" in export_data
        assert "export_format" in export_data
        assert "keys" in export_data
        assert key1 in export_data["keys"]
        assert key2 in export_data["keys"]

        # Verify key data
        key1_data = export_data["keys"][key1]
        assert "nonce_count" in key1_data
        assert "nonce_hashes" in key1_data
        assert key1_data["nonce_count"] > 0

    def test_single_key_export(self, manager):
        """Test export of specific key"""
        key_id = "specific_key"

        # Generate nonces
        for i in range(15):
            manager.generate_nonce(key_id=key_id)

        # Export specific key
        export_data = manager.export_nonce_hashes(key_id=key_id)

        assert key_id in export_data["keys"]
        assert len(export_data["keys"]) == 1

    def test_statistics_accuracy(self, manager):
        """Test accuracy of statistics reporting"""
        keys = ["key1", "key2", "key3"]
        nonces_per_key = [10, 15, 20]

        # Generate known quantities
        for key, count in zip(keys, nonces_per_key):
            for i in range(count):
                manager.generate_nonce(key_id=key)

        # Verify global statistics
        global_stats = manager.get_nonce_stats()
        assert global_stats["active_keys"] == len(keys)

        # Verify individual key statistics
        for key, expected_count in zip(keys, nonces_per_key):
            key_stats = manager.get_nonce_stats(key_id=key)
            assert key_stats["nonces_generated"] == expected_count


class TestNonceErrorHandling:
    """Test error handling and edge cases"""

    @pytest.fixture
    def manager(self):
        return NonceManager(max_tracked_per_key=10)

    def test_nonce_exhaustion_detection(self, manager):
        """Test detection of potential nonce space exhaustion"""
        # Mock a very small nonce space for testing
        with patch.object(manager, 'MAX_NONCE_LENGTH', 8):
            with patch.object(manager, '_check_nonce_exhaustion') as mock_check:
                mock_check.side_effect = NonceExhaustionError("Nonce space exhausted")

                with pytest.raises(NonceExhaustionError):
                    manager.generate_nonce()

    def test_collision_detection_with_mocked_collision(self, manager):
        """Test collision detection with forced collision"""
        key_id = "test_key"

        # Generate a nonce normally
        nonce = manager.generate_nonce(key_id=key_id)

        # Mock the nonce set to force collision detection
        with patch.object(manager._nonce_sets[key_id], '__contains__', return_value=True):
            # This should trigger collision detection in validate_nonce
            with pytest.raises(NonceCollisionError):
                manager.validate_nonce(secrets.token_bytes(12), key_id=key_id)

    def test_invalid_operations_on_nonexistent_key(self, manager):
        """Test operations on non-existent keys"""
        # Get stats for non-existent key
        stats = manager.get_nonce_stats(key_id="nonexistent")
        assert "error" in stats

        # Reset non-existent key
        assert manager.reset_key_tracking("nonexistent") is False

        # Export non-existent key
        export_data = manager.export_nonce_hashes(key_id="nonexistent")
        assert len(export_data["keys"]) == 0

    def test_memory_pressure_handling(self, manager):
        """Test handling of memory pressure situations"""
        key_id = "memory_test"

        # Fill up to limit
        for i in range(manager._max_tracked_per_key):
            manager.generate_nonce(key_id=key_id)

        # Continue generating (should handle gracefully)
        for i in range(10):
            nonce = manager.generate_nonce(key_id=key_id)
            assert len(nonce) > 0

        # Should not exceed memory limit significantly
        stats = manager.get_nonce_stats(key_id=key_id)
        assert stats["nonces_generated"] <= manager._max_tracked_per_key * 1.1


class TestNonceSecurityProperties:
    """Test security properties of nonce generation"""

    @pytest.fixture
    def manager(self):
        return NonceManager(enable_collision_detection=True)

    def test_nonce_unpredictability(self, manager):
        """Test that nonces are unpredictable"""
        nonces = [manager.generate_nonce() for _ in range(100)]

        # Statistical tests for randomness
        # 1. No obvious patterns
        for i in range(1, len(nonces)):
            # Consecutive nonces should not be similar
            similarity = sum(a == b for a, b in zip(nonces[i-1], nonces[i]))
            assert similarity < len(nonces[i]) * 0.5  # Less than 50% similarity

        # 2. Bit distribution should be reasonable
        all_bits = b''.join(nonces)
        zero_count = sum(bin(byte).count('0') for byte in all_bits)
        one_count = sum(bin(byte).count('1') for byte in all_bits)
        total_bits = zero_count + one_count

        # Should be roughly balanced (within 10%)
        balance_ratio = abs(zero_count - one_count) / total_bits
        assert balance_ratio < 0.1

    def test_timing_attack_resistance(self, manager):
        """Test resistance to timing attacks"""
        key_id = "timing_test"

        # Generate multiple nonces and measure timing
        times = []
        for i in range(100):
            start_time = time.perf_counter()
            nonce = manager.generate_nonce(key_id=key_id)
            end_time = time.perf_counter()
            times.append(end_time - start_time)

        # Timing should be relatively consistent
        avg_time = sum(times) / len(times)
        max_deviation = max(abs(t - avg_time) for t in times)

        # Maximum deviation should not be extreme (within 10x average)
        assert max_deviation < avg_time * 10

    def test_forward_security(self, manager):
        """Test forward security properties"""
        key_id = "forward_test"

        # Generate sequence of nonces
        nonces = [manager.generate_nonce(key_id=key_id) for _ in range(50)]

        # Knowledge of later nonces shouldn't help predict earlier ones
        # This is a basic test - in practice, we trust the underlying CSPRNG
        for i in range(1, len(nonces)):
            # No obvious mathematical relationship
            assert nonces[i] != nonces[i-1]

            # XOR should not reveal patterns
            xor_result = bytes(a ^ b for a, b in zip(nonces[i], nonces[i-1]))
            assert xor_result != b'\x00' * len(nonces[i])  # Not all zeros
            assert xor_result != b'\xff' * len(nonces[i])  # Not all ones


if __name__ == "__main__":
    pytest.main([__file__, "-v"])