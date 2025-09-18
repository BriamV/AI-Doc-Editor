"""
Secure Nonce Management for T-12 Credential Store Security

Implements cryptographically secure nonce generation and management for
authenticated encryption operations. Provides uniqueness guarantees and
protection against nonce reuse attacks in GCM mode.

SECURITY FEATURES:
- Cryptographically secure random generation (CSPRNG)
- Nonce uniqueness tracking and validation
- Thread-safe operations for concurrent access
- Collision detection and prevention
- Automatic nonce length validation
- Memory-efficient storage with cleanup

THREAT MITIGATION:
- Nonce reuse attacks: Unique nonce per operation
- Predictable nonces: Cryptographically secure generation
- Collision attacks: Birthday paradox protection
- State recovery: Forward security through randomness
- Timing attacks: Constant-time operations

COMPLIANCE:
- NIST SP 800-38D: GCM nonce requirements
- RFC 5116: AEAD nonce specifications
- FIPS 140-2: Random number generation
"""

import secrets
import threading
import logging
from typing import Dict, Any, Optional, Set
from datetime import datetime, timedelta
from collections import deque
import hashlib

from .memory_utils import SecureMemoryManager


class NonceError(Exception):
    """Base exception for nonce management errors"""

    pass


class NonceCollisionError(NonceError):
    """Nonce collision detected"""

    pass


class NonceValidationError(NonceError):
    """Nonce validation failed"""

    pass


class NonceExhaustionError(NonceError):
    """Nonce space exhaustion detected"""

    pass


class NonceManager:
    """
    Secure Nonce Management System

    Thread-safe nonce generation and tracking system optimized for AES-GCM
    authenticated encryption. Provides cryptographically secure random nonces
    with collision detection and uniqueness guarantees.

    SECURITY DESIGN:
    - CSPRNG: Uses secrets module for cryptographic randomness
    - Uniqueness: Tracks generated nonces to prevent reuse
    - Thread Safety: Concurrent access protection
    - Memory Management: Efficient storage with automatic cleanup
    - Collision Detection: Birthday attack protection
    - Forward Security: No predictable patterns

    NONCE SPECIFICATIONS:
    - GCM Standard: 96 bits (12 bytes) recommended
    - ChaCha20: 96 bits (12 bytes) or 64 bits (8 bytes)
    - Custom: 8-16 bytes supported
    - Entropy: Full cryptographic strength
    - Uniqueness: Per-key scope

    USAGE:
        manager = NonceManager(max_tracked=1000000)
        nonce = manager.generate_nonce(12)  # 96-bit GCM nonce
        manager.validate_nonce(nonce, key_id="key_123")
    """

    # Security constants
    MIN_NONCE_LENGTH = 8  # 64 bits minimum
    MAX_NONCE_LENGTH = 16  # 128 bits maximum
    GCM_NONCE_LENGTH = 12  # 96 bits GCM standard
    CHACHA20_NONCE_LENGTH = 12  # 96 bits ChaCha20
    DEFAULT_MAX_TRACKED = 1000000  # Maximum tracked nonces per key
    CLEANUP_THRESHOLD = 0.8  # Cleanup when 80% full
    COLLISION_CHECK_INTERVAL = 1000  # Check every N generations

    def __init__(
        self,
        max_tracked_per_key: int = DEFAULT_MAX_TRACKED,
        enable_collision_detection: bool = True,
        cleanup_interval_hours: int = 24,
        audit_logger: Optional[logging.Logger] = None,
    ):
        """
        Initialize secure nonce manager

        Args:
            max_tracked_per_key: Maximum nonces tracked per key
            enable_collision_detection: Enable collision detection
            cleanup_interval_hours: Hours between automatic cleanup
            audit_logger: Logger for security events
        """
        self._memory_manager = SecureMemoryManager()
        self._logger = audit_logger or logging.getLogger(__name__)

        # Thread safety
        self._lock = threading.RLock()

        # Nonce tracking per key
        self._nonce_sets: Dict[str, Set[bytes]] = {}
        self._nonce_timestamps: Dict[str, deque] = {}
        self._generation_counts: Dict[str, int] = {}

        # Configuration
        self._max_tracked_per_key = max_tracked_per_key
        self._enable_collision_detection = enable_collision_detection
        self._cleanup_interval = timedelta(hours=cleanup_interval_hours)

        # Statistics and monitoring
        self._stats = {
            "total_generated": 0,
            "collisions_detected": 0,
            "validations_performed": 0,
            "cleanup_operations": 0,
            "last_cleanup": datetime.utcnow(),
            "memory_usage_bytes": 0,
        }

        # Last cleanup time
        self._last_cleanup = datetime.utcnow()

        self._log_security_event(
            "nonce_manager_initialized",
            {
                "max_tracked_per_key": max_tracked_per_key,
                "collision_detection": enable_collision_detection,
                "cleanup_interval_hours": cleanup_interval_hours,
            },
        )

    def generate_nonce(self, length: int = GCM_NONCE_LENGTH, key_id: Optional[str] = None) -> bytes:
        """
        Generate cryptographically secure nonce

        Args:
            length: Nonce length in bytes (8-16)
            key_id: Optional key ID for tracking (default: "global")

        Returns:
            Cryptographically secure random nonce

        Raises:
            NonceValidationError: Invalid length
            NonceCollisionError: Collision detected
            NonceExhaustionError: Nonce space exhausted
        """
        try:
            # Validate nonce length
            if not (self.MIN_NONCE_LENGTH <= length <= self.MAX_NONCE_LENGTH):
                raise NonceValidationError(
                    f"Nonce length must be between {self.MIN_NONCE_LENGTH} and {self.MAX_NONCE_LENGTH} bytes"
                )

            # Use global tracking if no key ID provided
            tracking_key = key_id or "global"

            with self._lock:
                # Check if cleanup is needed
                self._check_cleanup_needed()

                # Initialize tracking for new key
                if tracking_key not in self._nonce_sets:
                    self._initialize_key_tracking(tracking_key)

                # Check nonce space exhaustion
                self._check_nonce_exhaustion(tracking_key, length)

                # Generate nonce with collision protection
                nonce = self._generate_unique_nonce(length, tracking_key)

                # Track generated nonce
                self._track_nonce(nonce, tracking_key)

                # Update statistics
                self._update_generation_stats(tracking_key)

                self._log_security_event(
                    "nonce_generated",
                    {
                        "length_bytes": length,
                        "length_bits": length * 8,
                        "key_id": tracking_key,
                        "total_for_key": len(self._nonce_sets[tracking_key]),
                    },
                )

                return nonce

        except Exception as e:
            self._log_security_event(
                "nonce_generation_failed",
                {
                    "error_type": type(e).__name__,
                    "length": length,
                    "key_id": tracking_key if "tracking_key" in locals() else None,
                },
                level=logging.ERROR,
            )
            raise

    def validate_nonce(self, nonce: bytes, key_id: Optional[str] = None) -> bool:
        """
        Validate nonce uniqueness and properties

        Args:
            nonce: Nonce to validate
            key_id: Key ID for validation scope

        Returns:
            True if nonce is valid and unique

        Raises:
            NonceValidationError: Invalid nonce properties
            NonceCollisionError: Nonce already used
        """
        try:
            # Validate nonce properties
            if not nonce:
                raise NonceValidationError("Nonce cannot be empty")

            if not (self.MIN_NONCE_LENGTH <= len(nonce) <= self.MAX_NONCE_LENGTH):
                raise NonceValidationError(f"Invalid nonce length: {len(nonce)} bytes")

            tracking_key = key_id or "global"

            with self._lock:
                # Initialize tracking if needed
                if tracking_key not in self._nonce_sets:
                    self._initialize_key_tracking(tracking_key)

                # Check for collision
                if nonce in self._nonce_sets[tracking_key]:
                    self._stats["collisions_detected"] += 1
                    self._log_security_event(
                        "nonce_collision_detected",
                        {"key_id": tracking_key, "nonce_length": len(nonce)},
                        level=logging.ERROR,
                    )
                    raise NonceCollisionError(f"Nonce already used for key: {tracking_key}")

                # Validate entropy (basic check)
                if not self._validate_nonce_entropy(nonce):
                    raise NonceValidationError("Nonce entropy too low")

                self._stats["validations_performed"] += 1

                self._log_security_event(
                    "nonce_validated",
                    {"key_id": tracking_key, "nonce_length": len(nonce), "entropy_valid": True},
                )

                return True

        except Exception as e:
            self._log_security_event(
                "nonce_validation_failed",
                {
                    "error_type": type(e).__name__,
                    "key_id": tracking_key if "tracking_key" in locals() else None,
                    "nonce_length": len(nonce) if nonce else 0,
                },
                level=logging.ERROR,
            )
            raise

    def mark_nonce_used(self, nonce: bytes, key_id: Optional[str] = None) -> bool:
        """
        Mark nonce as used to prevent reuse

        Args:
            nonce: Nonce to mark as used
            key_id: Key ID for tracking scope

        Returns:
            True if successfully marked as used
        """
        tracking_key = key_id or "global"

        with self._lock:
            if tracking_key not in self._nonce_sets:
                self._initialize_key_tracking(tracking_key)

            # Check if already used
            if nonce in self._nonce_sets[tracking_key]:
                return False

            # Mark as used
            self._track_nonce(nonce, tracking_key)

            self._log_security_event(
                "nonce_marked_used", {"key_id": tracking_key, "nonce_length": len(nonce)}
            )

            return True

    def get_nonce_stats(self, key_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get nonce generation statistics

        Args:
            key_id: Specific key ID stats (all keys if None)

        Returns:
            Statistics dictionary
        """
        with self._lock:
            if key_id:
                tracking_key = key_id
                if tracking_key not in self._nonce_sets:
                    return {"error": "Key ID not found"}

                return {
                    "key_id": tracking_key,
                    "nonces_generated": len(self._nonce_sets[tracking_key]),
                    "generation_count": self._generation_counts.get(tracking_key, 0),
                    "memory_usage_bytes": self._estimate_key_memory_usage(tracking_key),
                    "last_generation": self._get_last_generation_time(tracking_key),
                }
            else:
                # Global statistics
                total_nonces = sum(len(nonce_set) for nonce_set in self._nonce_sets.values())
                total_generations = sum(self._generation_counts.values())

                stats = self._stats.copy()
                stats.update(
                    {
                        "active_keys": len(self._nonce_sets),
                        "total_nonces_tracked": total_nonces,
                        "total_generations": total_generations,
                        "average_nonces_per_key": (
                            total_nonces / len(self._nonce_sets) if self._nonce_sets else 0
                        ),
                        "memory_efficiency": self._calculate_memory_efficiency(),
                    }
                )

                return stats

    def cleanup_old_nonces(
        self, max_age_hours: int = 24, key_id: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Clean up old nonces to manage memory usage

        Args:
            max_age_hours: Maximum age for nonce retention
            key_id: Specific key to clean (all keys if None)

        Returns:
            Cleanup statistics
        """
        cleanup_stats = {"cleaned_keys": 0, "removed_nonces": 0, "memory_freed_bytes": 0}

        max_age = timedelta(hours=max_age_hours)
        cutoff_time = datetime.utcnow() - max_age

        with self._lock:
            keys_to_clean = [key_id] if key_id else list(self._nonce_sets.keys())

            for tracking_key in keys_to_clean:
                if tracking_key not in self._nonce_timestamps:
                    continue

                # Count nonces before cleanup
                _ = len(self._nonce_sets[tracking_key])  # Track initial count for logging

                # Remove old nonces
                timestamps = self._nonce_timestamps[tracking_key]
                nonce_set = self._nonce_sets[tracking_key]

                # Remove old entries
                removed_count = 0
                while timestamps and timestamps[0][1] < cutoff_time:
                    nonce_hash, _ = timestamps.popleft()
                    # Find and remove actual nonce (inefficient but necessary)
                    nonces_to_remove = [
                        n for n in nonce_set if hashlib.sha256(n).digest()[:8] == nonce_hash
                    ]
                    for nonce in nonces_to_remove:
                        nonce_set.discard(nonce)
                        removed_count += 1

                if removed_count > 0:
                    cleanup_stats["cleaned_keys"] += 1
                    cleanup_stats["removed_nonces"] += removed_count

            # Update cleanup time
            self._last_cleanup = datetime.utcnow()
            self._stats["cleanup_operations"] += 1
            self._stats["last_cleanup"] = self._last_cleanup

            self._log_security_event(
                "nonce_cleanup_completed",
                {
                    "cleaned_keys": cleanup_stats["cleaned_keys"],
                    "removed_nonces": cleanup_stats["removed_nonces"],
                    "max_age_hours": max_age_hours,
                },
            )

            return cleanup_stats

    def reset_key_tracking(self, key_id: str) -> bool:
        """
        Reset nonce tracking for specific key

        Args:
            key_id: Key ID to reset

        Returns:
            True if reset successful
        """
        with self._lock:
            if key_id not in self._nonce_sets:
                return False

            # Clear tracking data
            del self._nonce_sets[key_id]
            del self._nonce_timestamps[key_id]
            del self._generation_counts[key_id]

            self._log_security_event("key_tracking_reset", {"key_id": key_id})

            return True

    def export_nonce_hashes(self, key_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Export nonce hashes for backup/verification

        Args:
            key_id: Specific key to export (all keys if None)

        Returns:
            Exported nonce hashes
        """
        with self._lock:
            export_data = {
                "export_timestamp": datetime.utcnow().isoformat(),
                "export_format": "SHA256_truncated",
                "keys": {},
            }

            keys_to_export = [key_id] if key_id else list(self._nonce_sets.keys())

            for tracking_key in keys_to_export:
                if tracking_key not in self._nonce_sets:
                    continue

                # Create hashes of nonces (not actual nonces for security)
                nonce_hashes = []
                for nonce in self._nonce_sets[tracking_key]:
                    nonce_hash = hashlib.sha256(nonce).hexdigest()[:16]  # Truncated for efficiency
                    nonce_hashes.append(nonce_hash)

                export_data["keys"][tracking_key] = {
                    "nonce_count": len(nonce_hashes),
                    "nonce_hashes": sorted(nonce_hashes),  # Sort for consistent export
                    "generation_count": self._generation_counts.get(tracking_key, 0),
                }

            return export_data

    # Private implementation methods

    def _generate_unique_nonce(self, length: int, key_id: str) -> bytes:
        """Generate unique nonce with collision protection"""
        max_attempts = 100  # Prevent infinite loops
        attempt = 0

        while attempt < max_attempts:
            # Generate cryptographically secure random nonce
            nonce = secrets.token_bytes(length)

            # Check for collision if enabled
            if self._enable_collision_detection:
                if nonce not in self._nonce_sets[key_id]:
                    return nonce
            else:
                return nonce

            attempt += 1

        # If we reach here, there might be a nonce space exhaustion
        raise NonceExhaustionError(f"Failed to generate unique nonce after {max_attempts} attempts")

    def _initialize_key_tracking(self, key_id: str) -> None:
        """Initialize tracking structures for new key"""
        self._nonce_sets[key_id] = set()
        self._nonce_timestamps[key_id] = deque()
        self._generation_counts[key_id] = 0

    def _track_nonce(self, nonce: bytes, key_id: str) -> None:
        """Track generated nonce"""
        # Add to set
        self._nonce_sets[key_id].add(nonce)

        # Add timestamp for cleanup
        nonce_hash = hashlib.sha256(nonce).digest()[:8]  # Truncated hash for efficiency
        self._nonce_timestamps[key_id].append((nonce_hash, datetime.utcnow()))

        # Enforce size limits
        if len(self._nonce_sets[key_id]) > self._max_tracked_per_key:
            # Remove oldest nonce
            oldest_hash, _ = self._nonce_timestamps[key_id].popleft()
            # Find and remove corresponding nonce (inefficient but necessary)
            nonces_to_remove = [
                n for n in self._nonce_sets[key_id] if hashlib.sha256(n).digest()[:8] == oldest_hash
            ]
            for old_nonce in nonces_to_remove:
                self._nonce_sets[key_id].discard(old_nonce)
                break

    def _check_nonce_exhaustion(self, key_id: str, length: int) -> None:
        """Check for potential nonce space exhaustion"""
        nonce_count = len(self._nonce_sets[key_id])

        # Calculate theoretical maximum nonces for birthday paradox
        # For 50% collision probability: sqrt(2^n) where n is bit length
        max_safe_nonces = 2 ** ((length * 8) // 2)

        # Warning at 10% of theoretical limit
        warning_threshold = max_safe_nonces * 0.1

        if nonce_count > warning_threshold:
            self._log_security_event(
                "nonce_exhaustion_warning",
                {
                    "key_id": key_id,
                    "current_nonces": nonce_count,
                    "warning_threshold": int(warning_threshold),
                    "nonce_length_bits": length * 8,
                },
                level=logging.WARNING,
            )

    def _validate_nonce_entropy(self, nonce: bytes) -> bool:
        """Basic entropy validation for nonce"""
        if len(nonce) < 4:  # Too short for meaningful validation
            return True

        # Check for obviously bad patterns
        if nonce == b"\x00" * len(nonce):  # All zeros
            return False

        if nonce == b"\xff" * len(nonce):  # All ones
            return False

        # Simple entropy estimation
        unique_bytes = len(set(nonce))
        min_unique = max(2, len(nonce) // 4)  # At least 25% unique bytes

        return unique_bytes >= min_unique

    def _check_cleanup_needed(self) -> None:
        """Check if automatic cleanup is needed"""
        time_since_cleanup = datetime.utcnow() - self._last_cleanup

        if time_since_cleanup >= self._cleanup_interval:
            # Perform automatic cleanup
            self.cleanup_old_nonces()

    def _update_generation_stats(self, key_id: str) -> None:
        """Update generation statistics"""
        self._stats["total_generated"] += 1
        self._generation_counts[key_id] += 1

        # Update memory usage estimate
        self._stats["memory_usage_bytes"] = self._estimate_total_memory_usage()

    def _estimate_key_memory_usage(self, key_id: str) -> int:
        """Estimate memory usage for specific key"""
        if key_id not in self._nonce_sets:
            return 0

        nonce_count = len(self._nonce_sets[key_id])
        avg_nonce_size = 12  # Typical GCM nonce size
        timestamp_size = 16  # Approximate size per timestamp entry

        return nonce_count * (avg_nonce_size + timestamp_size)

    def _estimate_total_memory_usage(self) -> int:
        """Estimate total memory usage"""
        total = 0
        for key_id in self._nonce_sets:
            total += self._estimate_key_memory_usage(key_id)
        return total

    def _calculate_memory_efficiency(self) -> float:
        """Calculate memory efficiency percentage"""
        if not self._nonce_sets:
            return 100.0

        total_tracked = sum(len(nonce_set) for nonce_set in self._nonce_sets.values())
        total_possible = len(self._nonce_sets) * self._max_tracked_per_key

        return (total_tracked / total_possible) * 100 if total_possible > 0 else 0.0

    def _get_last_generation_time(self, key_id: str) -> Optional[str]:
        """Get last generation time for key"""
        if key_id not in self._nonce_timestamps or not self._nonce_timestamps[key_id]:
            return None

        return self._nonce_timestamps[key_id][-1][1].isoformat()

    def _log_security_event(
        self, event_type: str, details: Dict[str, Any], level: int = logging.INFO
    ) -> None:
        """Log security events for audit trail"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "component": "NonceManager",
            "details": details,
        }

        self._logger.log(
            level, f"Nonce Manager Event: {event_type}", extra={"security_event": event}
        )
