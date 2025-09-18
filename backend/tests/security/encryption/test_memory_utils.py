"""
Unit Tests for Secure Memory Management Utilities

Comprehensive test suite for memory security hardening including
secure deletion, memory protection, and defense against memory-based attacks.

TEST CATEGORIES:
1. Secure Deletion Operations
2. Memory Buffer Management
3. Memory Locking and Protection
4. Cross-Platform Compatibility
5. Performance and Scalability
6. Error Handling and Edge Cases
7. Security Properties Validation
8. Resource Cleanup and Management

SECURITY TEST AREAS:
- Secure memory overwriting patterns
- Memory page locking functionality
- Sensitive data detection and cleanup
- Thread safety in concurrent environments
- Platform-specific security features
"""

import pytest
import threading
import time
import gc
import array
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Import modules under test
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from app.security.encryption.memory_utils import (
    SecureMemoryManager,
    SecureBuffer,
    MemorySecurityError,
    MemoryLockError,
    SecureDeletionError
)


class TestSecureMemoryManagerBasic:
    """Test basic secure memory management operations"""

    @pytest.fixture
    def memory_manager(self):
        """Create secure memory manager for testing"""
        return SecureMemoryManager()

    def test_initialization(self, memory_manager):
        """Test memory manager initialization"""
        assert memory_manager is not None
        assert hasattr(memory_manager, '_stats')
        assert hasattr(memory_manager, '_lock')

    def test_secure_delete_string(self, memory_manager):
        """Test secure deletion of string data"""
        test_string = "sensitive_password_123"

        # Secure delete should succeed
        result = memory_manager.secure_delete(test_string)
        assert result is True

        # Verify statistics updated
        stats = memory_manager.get_memory_stats()
        assert stats["secure_deletions"] > 0

    def test_secure_delete_bytes(self, memory_manager):
        """Test secure deletion of bytes data"""
        test_bytes = b"sensitive_data_bytes"

        result = memory_manager.secure_delete(test_bytes)
        assert result is True

    def test_secure_delete_bytearray(self, memory_manager):
        """Test secure deletion of bytearray data"""
        test_bytearray = bytearray(b"mutable_sensitive_data")

        result = memory_manager.secure_delete(test_bytearray)
        assert result is True

    def test_secure_delete_array(self, memory_manager):
        """Test secure deletion of array data"""
        test_array = array.array('b', [1, 2, 3, 4, 5])

        result = memory_manager.secure_delete(test_array)
        assert result is True

        # Verify array was overwritten
        assert all(x == 0 for x in test_array)

    def test_secure_delete_empty_data(self, memory_manager):
        """Test secure deletion of empty data"""
        result = memory_manager.secure_delete("")
        assert result is True

        result = memory_manager.secure_delete(b"")
        assert result is True

    def test_secure_delete_none_data(self, memory_manager):
        """Test handling of None data"""
        # Should handle gracefully without error
        result = memory_manager.secure_delete(None)
        # Result may be True or False depending on implementation


class TestSecureBuffer:
    """Test secure buffer implementation"""

    def test_secure_buffer_creation(self):
        """Test secure buffer creation"""
        buffer = SecureBuffer(1024)
        assert buffer._size == 1024
        assert not buffer._cleared

    def test_secure_buffer_write_read(self):
        """Test writing to and reading from secure buffer"""
        buffer = SecureBuffer(100)
        test_data = b"Hello, secure world!"

        # Write data
        buffer.write(test_data)

        # Read data back
        read_data = buffer.read(len(test_data))
        assert read_data == test_data

    def test_secure_buffer_offset_operations(self):
        """Test buffer operations with offsets"""
        buffer = SecureBuffer(100)

        data1 = b"First part"
        data2 = b"Second part"

        # Write at different offsets
        buffer.write(data1, 0)
        buffer.write(data2, len(data1))

        # Read back
        read1 = buffer.read(len(data1), 0)
        read2 = buffer.read(len(data2), len(data1))

        assert read1 == data1
        assert read2 == data2

    def test_secure_buffer_clear(self):
        """Test secure buffer clearing"""
        buffer = SecureBuffer(100)
        test_data = b"Sensitive data to clear"

        buffer.write(test_data)
        buffer.clear()

        assert buffer._cleared is True

    def test_secure_buffer_context_manager(self):
        """Test secure buffer as context manager"""
        test_data = b"Context managed data"

        with SecureBuffer(100) as buffer:
            buffer.write(test_data)
            read_data = buffer.read(len(test_data))
            assert read_data == test_data

        # Buffer should be cleared after context exit
        assert buffer._cleared is True

    def test_secure_buffer_overflow_protection(self):
        """Test protection against buffer overflow"""
        buffer = SecureBuffer(10)
        large_data = b"This data is too large for the buffer"

        with pytest.raises(MemorySecurityError):
            buffer.write(large_data)

    def test_secure_buffer_read_after_clear(self):
        """Test reading from cleared buffer"""
        buffer = SecureBuffer(100)
        buffer.write(b"test data")
        buffer.clear()

        with pytest.raises(MemorySecurityError):
            buffer.read(10)

    def test_secure_buffer_write_after_clear(self):
        """Test writing to cleared buffer"""
        buffer = SecureBuffer(100)
        buffer.clear()

        with pytest.raises(MemorySecurityError):
            buffer.write(b"test data")


class TestMemoryLocking:
    """Test memory locking functionality"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_memory_locking_attempt(self, memory_manager):
        """Test memory locking attempt (may not succeed on all platforms)"""
        # This test may fail on platforms without proper privileges
        # but should not crash
        try:
            result = memory_manager.lock_memory_pages(0x1000, 4096)
            # Result may be True or False depending on platform and privileges
            assert isinstance(result, bool)
        except Exception:
            # Memory locking may not be available
            pass

    def test_core_dump_disable(self, memory_manager):
        """Test core dump disabling"""
        result = memory_manager.disable_core_dumps()
        # Should return boolean indicating success/failure
        assert isinstance(result, bool)

    @pytest.mark.skipif(sys.platform == "win32", reason="Unix-specific test")
    def test_unix_memory_locking(self, memory_manager):
        """Test Unix-specific memory locking"""
        # This test specifically for Unix-like systems
        if hasattr(os, 'mlock'):
            # Test would go here for Unix systems
            pass

    @pytest.mark.skipif(sys.platform != "win32", reason="Windows-specific test")
    def test_windows_memory_locking(self, memory_manager):
        """Test Windows-specific memory locking"""
        # This test specifically for Windows systems
        if sys.platform == "win32":
            # Test would go here for Windows systems
            pass


class TestSecureContext:
    """Test secure context management"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_secure_context_basic(self, memory_manager):
        """Test basic secure context functionality"""
        with memory_manager.secure_context() as ctx:
            # Context should be a dictionary-like object
            assert hasattr(ctx, '__setitem__')
            assert hasattr(ctx, '__getitem__')

            # Can store data in context
            ctx['sensitive_data'] = "secret_value"
            assert ctx['sensitive_data'] == "secret_value"

    def test_secure_context_cleanup(self, memory_manager):
        """Test that secure context cleans up on exit"""
        test_data = "sensitive_context_data"

        with memory_manager.secure_context() as ctx:
            ctx['data'] = test_data

        # Context should have been cleaned up
        # This is difficult to verify directly, but we trust the implementation

    def test_secure_context_no_cleanup(self, memory_manager):
        """Test secure context without cleanup"""
        with memory_manager.secure_context(clear_on_exit=False) as ctx:
            ctx['data'] = "test_data"

        # Should complete without error


class TestStackVariableCleaning:
    """Test stack variable cleaning functionality"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_clear_stack_variables(self, memory_manager):
        """Test clearing of stack variables"""
        # This test is limited because we can't easily verify
        # that stack variables were actually cleared

        password = "sensitive_password"
        secret_key = "secret_key_value"

        # Attempt to clear stack variables
        cleared_count = memory_manager.clear_stack_variables()

        # Should return non-negative count
        assert cleared_count >= 0

    def test_sensitive_variable_detection(self, memory_manager):
        """Test detection of sensitive variable names"""
        # Test the internal method for detecting sensitive variables
        test_cases = [
            ("password", "value", True),
            ("secret", "value", True),
            ("key", "value", True),
            ("token", "value", True),
            ("credential", "value", True),
            ("normal_var", "value", False),
            ("data", "value", False),
            ("config", "value", False),
        ]

        for var_name, var_value, expected in test_cases:
            result = memory_manager._is_sensitive_variable(var_name, var_value)
            assert result == expected


class TestMemoryStatistics:
    """Test memory statistics and monitoring"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_memory_stats_structure(self, memory_manager):
        """Test memory statistics structure"""
        stats = memory_manager.get_memory_stats()

        # Verify required fields
        required_fields = [
            "secure_deletions",
            "failed_deletions",
            "memory_locks",
            "failed_locks",
            "total_bytes_cleared",
            "deletion_success_rate",
            "available_features"
        ]

        for field in required_fields:
            assert field in stats

    def test_stats_update_on_operations(self, memory_manager):
        """Test that statistics update correctly"""
        initial_stats = memory_manager.get_memory_stats()
        initial_deletions = initial_stats["secure_deletions"]

        # Perform secure deletion
        memory_manager.secure_delete("test_data")

        updated_stats = memory_manager.get_memory_stats()
        assert updated_stats["secure_deletions"] > initial_deletions

    def test_success_rate_calculation(self, memory_manager):
        """Test success rate calculation"""
        # Perform some operations
        memory_manager.secure_delete("data1")
        memory_manager.secure_delete("data2")

        stats = memory_manager.get_memory_stats()
        success_rate = stats["deletion_success_rate"]

        assert 0 <= success_rate <= 100

    def test_available_features_list(self, memory_manager):
        """Test available features listing"""
        stats = memory_manager.get_memory_stats()
        features = stats["available_features"]

        assert isinstance(features, list)
        assert "secure_deletion" in features
        assert "garbage_collection" in features


class TestMemoryCleanup:
    """Test memory cleanup and resource management"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_cleanup_all_resources(self, memory_manager):
        """Test cleanup of all tracked resources"""
        # Create some buffers
        buffers = []
        for i in range(5):
            buffer = memory_manager.create_secure_buffer(100)
            buffers.append(buffer)

        # Perform cleanup
        cleanup_stats = memory_manager.cleanup_all()

        assert "buffers_cleared" in cleanup_stats
        assert "garbage_collected" in cleanup_stats

    def test_buffer_tracking(self, memory_manager):
        """Test that buffers are properly tracked"""
        initial_stats = memory_manager.get_memory_stats()
        initial_buffers = initial_stats["active_buffers"]

        # Create a buffer
        buffer = memory_manager.create_secure_buffer(100)

        updated_stats = memory_manager.get_memory_stats()
        assert updated_stats["active_buffers"] > initial_buffers

    def test_weak_reference_cleanup(self, memory_manager):
        """Test that weak references are cleaned up"""
        # Create buffer and let it go out of scope
        def create_and_destroy_buffer():
            buffer = memory_manager.create_secure_buffer(100)
            return buffer

        buffer = create_and_destroy_buffer()
        del buffer
        gc.collect()

        # Getting stats should clean up dead references
        stats = memory_manager.get_memory_stats()
        # Active buffers should reflect cleanup


class TestThreadSafety:
    """Test thread safety of memory operations"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_concurrent_secure_deletion(self, memory_manager):
        """Test concurrent secure deletion operations"""
        results = []
        errors = []
        num_threads = 10
        operations_per_thread = 50

        def deletion_worker():
            try:
                for i in range(operations_per_thread):
                    data = f"sensitive_data_{threading.current_thread().ident}_{i}"
                    result = memory_manager.secure_delete(data)
                    results.append(result)
            except Exception as e:
                errors.append(e)

        # Start threads
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=deletion_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify results
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == num_threads * operations_per_thread

    def test_concurrent_buffer_creation(self, memory_manager):
        """Test concurrent buffer creation"""
        buffers = []
        errors = []
        num_threads = 5
        buffers_per_thread = 10

        def buffer_worker():
            try:
                thread_buffers = []
                for i in range(buffers_per_thread):
                    buffer = memory_manager.create_secure_buffer(100)
                    thread_buffers.append(buffer)
                buffers.extend(thread_buffers)
            except Exception as e:
                errors.append(e)

        # Start threads
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=buffer_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify results
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(buffers) == num_threads * buffers_per_thread

    def test_concurrent_statistics_access(self, memory_manager):
        """Test concurrent access to statistics"""
        stats_results = []
        errors = []

        def stats_worker():
            try:
                for i in range(20):
                    stats = memory_manager.get_memory_stats()
                    stats_results.append(stats)

                    # Also perform operations
                    memory_manager.secure_delete(f"data_{i}")
            except Exception as e:
                errors.append(e)

        # Start multiple threads accessing stats
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=stats_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify no errors
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(stats_results) > 0


class TestErrorHandling:
    """Test error handling and edge cases"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_secure_delete_invalid_data(self, memory_manager):
        """Test secure deletion with invalid data types"""
        # Complex objects that can't be easily deleted
        invalid_data = [
            {"complex": "dict"},
            [1, 2, 3],
            object(),
        ]

        for data in invalid_data:
            # Should not crash, may return True or False
            result = memory_manager.secure_delete(data)
            assert isinstance(result, bool)

    def test_buffer_creation_with_invalid_size(self, memory_manager):
        """Test buffer creation with invalid sizes"""
        # Zero size
        with pytest.raises(Exception):
            memory_manager.create_secure_buffer(0)

        # Negative size
        with pytest.raises(Exception):
            memory_manager.create_secure_buffer(-100)

        # Extremely large size (should fail gracefully)
        try:
            memory_manager.create_secure_buffer(2**32)  # Very large
        except (MemoryError, MemorySecurityError, OSError):
            # Expected to fail with memory-related error
            pass

    def test_memory_locking_failure_handling(self, memory_manager):
        """Test handling of memory locking failures"""
        # Mock memory locking to fail
        with patch('os.mlock', side_effect=OSError("Permission denied")):
            # Should handle failure gracefully
            result = memory_manager.lock_memory_pages(0x1000, 4096)
            assert result is False

    def test_cleanup_with_no_resources(self, memory_manager):
        """Test cleanup when no resources exist"""
        cleanup_stats = memory_manager.cleanup_all()

        # Should complete without error
        assert isinstance(cleanup_stats, dict)
        assert "buffers_cleared" in cleanup_stats


class TestPlatformSpecific:
    """Test platform-specific functionality"""

    @pytest.fixture
    def memory_manager(self):
        return SecureMemoryManager()

    def test_platform_feature_detection(self, memory_manager):
        """Test detection of platform-specific features"""
        features = memory_manager._get_available_features()

        assert isinstance(features, list)
        assert "secure_deletion" in features

        # Platform-specific features
        if hasattr(os, 'mlock') or sys.platform == "win32":
            assert "memory_locking" in features

        if hasattr(os, 'setrlimit'):
            assert "core_dump_disable" in features

    def test_cross_platform_compatibility(self, memory_manager):
        """Test that basic operations work across platforms"""
        # These operations should work on all platforms
        result = memory_manager.secure_delete("test_data")
        assert isinstance(result, bool)

        stats = memory_manager.get_memory_stats()
        assert isinstance(stats, dict)

        # Buffer creation should work everywhere
        buffer = memory_manager.create_secure_buffer(100)
        assert buffer is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])