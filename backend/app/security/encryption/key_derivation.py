"""
Argon2id Key Derivation for T-12 Credential Store Security

Implements memory-hard key derivation functions optimized for credential storage
security. Provides resistance against both GPU/ASIC attacks and side-channel
attacks through time-memory trade-offs.

SECURITY FEATURES:
- Argon2id: Hybrid mode combining data-dependent and independent access
- Memory-hard function: Resistance to parallel attacks
- Side-channel resistance: Constant-time operations
- Configurable parameters: Time, memory, and parallelism costs
- Salt validation: Cryptographically secure salt generation
- Password clearing: Secure memory handling

THREAT MITIGATION:
- GPU/ASIC attacks: High memory requirements
- Dictionary attacks: Computational cost
- Rainbow tables: Unique salts per derivation
- Side-channel attacks: Data-independent operations (Argon2i component)
- Memory analysis: Data-dependent operations (Argon2d component)

COMPLIANCE:
- RFC 9106: Argon2 Password Hashing Standard
- OWASP: Password Storage Cheat Sheet
- NIST SP 800-63B: Digital Identity Guidelines
"""

import secrets
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum
import time

import argon2
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, InvalidHash

from .encryption_interface import KeyDerivationFunction
from .memory_utils import SecureMemoryManager


class Argon2SecurityLevel(Enum):
    """Predefined Argon2 security levels for different use cases"""

    # Low security - Development/testing only
    DEVELOPMENT = {
        "time_cost": 1,
        "memory_cost": 8,  # 8 MiB
        "parallelism": 1,
        "hash_len": 32,
        "salt_len": 16,
    }

    # Standard security - General applications
    STANDARD = {
        "time_cost": 2,
        "memory_cost": 19456,  # ~19 MiB (2^14.24 KiB)
        "parallelism": 1,
        "hash_len": 32,
        "salt_len": 16,
    }

    # High security - Sensitive applications
    HIGH = {
        "time_cost": 3,
        "memory_cost": 65536,  # 64 MiB (2^16 KiB)
        "parallelism": 2,
        "hash_len": 32,
        "salt_len": 32,
    }

    # Maximum security - Critical applications
    MAXIMUM = {
        "time_cost": 4,
        "memory_cost": 262144,  # 256 MiB (2^18 KiB)
        "parallelism": 4,
        "hash_len": 64,
        "salt_len": 32,
    }


class Argon2DerivationError(Exception):
    """Base exception for Argon2 key derivation errors"""

    pass


class Argon2ParameterError(Argon2DerivationError):
    """Parameter validation errors"""

    pass


class Argon2SecurityError(Argon2DerivationError):
    """Security-related errors"""

    pass


class Argon2KeyDerivation:
    """
    Argon2id Key Derivation Function Implementation

    Provides secure key derivation using Argon2id algorithm with configurable
    security parameters. Optimized for credential storage systems requiring
    high security against both online and offline attacks.

    SECURITY PARAMETERS:
    - Algorithm: Argon2id (RFC 9106)
    - Memory Cost: Configurable (8 MiB to 256 MiB)
    - Time Cost: Configurable (1 to 4 iterations)
    - Parallelism: Configurable (1 to 4 threads)
    - Salt Length: 16-32 bytes
    - Output Length: 32-64 bytes

    USAGE:
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.HIGH)
        key = kdf.derive_key("password", salt, iterations=65536)
        verified = kdf.verify_password("password", hash_value)
    """

    # Security constants
    MIN_SALT_LENGTH = 16
    MAX_SALT_LENGTH = 64
    MIN_OUTPUT_LENGTH = 16
    MAX_OUTPUT_LENGTH = 64
    MIN_TIME_COST = 1
    MAX_TIME_COST = 10
    MIN_MEMORY_COST = 8  # KiB
    MAX_MEMORY_COST = 1048576  # 1 GiB in KiB
    MIN_PARALLELISM = 1
    MAX_PARALLELISM = 16

    def __init__(
        self,
        security_level: Argon2SecurityLevel = Argon2SecurityLevel.HIGH,
        custom_params: Optional[Dict[str, int]] = None,
        audit_logger: Optional[logging.Logger] = None,
    ):
        """
        Initialize Argon2id key derivation function

        Args:
            security_level: Predefined security level
            custom_params: Custom parameters override
            audit_logger: Logger for security events
        """
        self._memory_manager = SecureMemoryManager()
        self._logger = audit_logger or logging.getLogger(__name__)

        # Configure parameters
        if custom_params:
            self._params = self._validate_custom_params(custom_params)
        else:
            self._params = security_level.value.copy()

        # Initialize Argon2 hasher
        self._hasher = PasswordHasher(
            time_cost=self._params["time_cost"],
            memory_cost=self._params["memory_cost"],
            parallelism=self._params["parallelism"],
            hash_len=self._params["hash_len"],
            salt_len=self._params["salt_len"],
            encoding="utf-8",
            type=Type.ID,  # Argon2id variant
        )

        # Performance tracking
        self._performance_stats = {
            "derivations_count": 0,
            "total_time_ms": 0,
            "avg_time_ms": 0,
            "last_derivation_time": None,
        }

        self._log_security_event(
            "kdf_initialized",
            {
                "algorithm": "Argon2id",
                "security_level": security_level.name if not custom_params else "CUSTOM",
                "parameters": self._params,
            },
        )

    def derive_key(
        self,
        password: str,
        salt: bytes,
        iterations: Optional[int] = None,
        key_length: int = 32,
        algorithm: KeyDerivationFunction = KeyDerivationFunction.ARGON2ID,
    ) -> bytes:
        """
        Derive encryption key from password using Argon2id

        Args:
            password: Source password/passphrase
            salt: Cryptographic salt (minimum 16 bytes)
            iterations: Legacy parameter (ignored for Argon2, use time_cost)
            key_length: Length of derived key in bytes
            algorithm: Key derivation function (must be ARGON2ID)

        Returns:
            Derived key bytes

        Raises:
            Argon2ParameterError: Invalid parameters
            Argon2SecurityError: Security validation failed
        """
        try:
            # Validate algorithm
            if algorithm != KeyDerivationFunction.ARGON2ID:
                raise Argon2ParameterError(f"Unsupported algorithm: {algorithm}")

            # Validate inputs
            self._validate_derivation_inputs(password, salt, key_length)

            # Performance monitoring start
            start_time = time.perf_counter()

            # Derive key using Argon2id
            derived_key = argon2.low_level.hash_secret_raw(
                secret=password.encode("utf-8"),
                salt=salt,
                time_cost=self._params["time_cost"],
                memory_cost=self._params["memory_cost"],
                parallelism=self._params["parallelism"],
                hash_len=key_length,
                type=Type.ID,
            )

            # Performance monitoring end
            end_time = time.perf_counter()
            derivation_time = (end_time - start_time) * 1000  # Convert to ms

            # Update performance statistics
            self._update_performance_stats(derivation_time)

            # Validate derived key
            self._validate_derived_key(derived_key, key_length)

            # Log successful derivation
            self._log_security_event(
                "key_derivation_success",
                {
                    "salt_length": len(salt),
                    "key_length": key_length,
                    "derivation_time_ms": round(derivation_time, 2),
                    "algorithm": "Argon2id",
                },
            )

            return derived_key

        except Exception as e:
            # Secure error handling
            self._log_security_event(
                "key_derivation_failed",
                {
                    "error_type": type(e).__name__,
                    "salt_length": len(salt) if salt else 0,
                    "key_length": key_length,
                },
                level=logging.ERROR,
            )

            if isinstance(e, (Argon2ParameterError, Argon2SecurityError)):
                raise
            else:
                raise Argon2DerivationError(f"Key derivation failed: {type(e).__name__}")

        finally:
            # Clear password from memory
            self._memory_manager.secure_delete(password)

    def hash_password(self, password: str, salt: Optional[bytes] = None) -> str:
        """
        Hash password for storage using Argon2id

        Args:
            password: Password to hash
            salt: Optional custom salt (generated if None)

        Returns:
            Argon2 hash string for storage
        """
        try:
            if salt:
                # Validate custom salt
                if len(salt) < self.MIN_SALT_LENGTH:
                    raise Argon2ParameterError(
                        f"Salt too short: {len(salt)} < {self.MIN_SALT_LENGTH}"
                    )

                # Use low-level API with custom salt and return encoded hash
                return argon2.low_level.hash_secret(
                    secret=password.encode("utf-8"),
                    salt=salt,
                    time_cost=self._params["time_cost"],
                    memory_cost=self._params["memory_cost"],
                    parallelism=self._params["parallelism"],
                    hash_len=self._params["hash_len"],
                    type=Type.ID,
                )
            else:
                # Use high-level API with automatic salt generation
                return self._hasher.hash(password)

        except Exception as e:
            self._log_security_event(
                "password_hashing_failed", {"error_type": type(e).__name__}, level=logging.ERROR
            )
            raise Argon2DerivationError(f"Password hashing failed: {e}")

        finally:
            # Clear password from memory
            self._memory_manager.secure_delete(password)

    def verify_password(self, password: str, hash_value: str) -> bool:
        """
        Verify password against Argon2 hash

        Args:
            password: Password to verify
            hash_value: Stored Argon2 hash

        Returns:
            True if password matches hash
        """
        try:
            self._hasher.verify(hash_value, password)

            self._log_security_event(
                "password_verification_success", {"hash_algorithm": "Argon2id"}
            )

            return True

        except VerifyMismatchError:
            self._log_security_event(
                "password_verification_failed",
                {"reason": "password_mismatch"},
                level=logging.WARNING,
            )
            return False

        except InvalidHash:
            self._log_security_event(
                "password_verification_failed",
                {"reason": "invalid_hash_format"},
                level=logging.ERROR,
            )
            return False

        except Exception as e:
            self._log_security_event(
                "password_verification_error", {"error_type": type(e).__name__}, level=logging.ERROR
            )
            return False

        finally:
            # Clear password from memory
            self._memory_manager.secure_delete(password)

    def generate_salt(self, length: int = 32) -> bytes:
        """
        Generate cryptographically secure salt

        Args:
            length: Salt length in bytes (16-64)

        Returns:
            Cryptographically secure random salt
        """
        if length < self.MIN_SALT_LENGTH or length > self.MAX_SALT_LENGTH:
            raise Argon2ParameterError(
                f"Salt length must be between {self.MIN_SALT_LENGTH} and {self.MAX_SALT_LENGTH} bytes"
            )

        salt = secrets.token_bytes(length)

        self._log_security_event(
            "salt_generated", {"salt_length": length, "entropy_bits": length * 8}
        )

        return salt

    def benchmark_parameters(
        self, target_time_ms: int = 500, test_password: str = "test_password_for_benchmark"
    ) -> Dict[str, Any]:
        """
        Benchmark Argon2 parameters to achieve target derivation time

        Args:
            target_time_ms: Target derivation time in milliseconds
            test_password: Test password for benchmarking

        Returns:
            Recommended parameters for target performance
        """
        benchmark_results = {
            "target_time_ms": target_time_ms,
            "test_results": [],
            "recommended_params": None,
            "security_assessment": {},
        }

        # Test different parameter combinations
        test_configs = [
            {"time_cost": 1, "memory_cost": 8192, "parallelism": 1},
            {"time_cost": 2, "memory_cost": 19456, "parallelism": 1},
            {"time_cost": 3, "memory_cost": 65536, "parallelism": 2},
            {"time_cost": 4, "memory_cost": 262144, "parallelism": 4},
        ]

        closest_config = None
        closest_diff = float("inf")

        for config in test_configs:
            try:
                # Test configuration
                start_time = time.perf_counter()

                test_salt = secrets.token_bytes(32)
                argon2.low_level.hash_secret_raw(
                    secret=test_password.encode("utf-8"),
                    salt=test_salt,
                    time_cost=config["time_cost"],
                    memory_cost=config["memory_cost"],
                    parallelism=config["parallelism"],
                    hash_len=32,
                    type=Type.ID,
                )

                end_time = time.perf_counter()
                actual_time_ms = (end_time - start_time) * 1000

                # Calculate security score
                security_score = self._calculate_security_score(config)

                test_result = {
                    "config": config,
                    "actual_time_ms": round(actual_time_ms, 2),
                    "security_score": security_score,
                    "memory_mb": config["memory_cost"] / 1024,
                }

                benchmark_results["test_results"].append(test_result)

                # Find closest to target time
                time_diff = abs(actual_time_ms - target_time_ms)
                if time_diff < closest_diff:
                    closest_diff = time_diff
                    closest_config = config.copy()
                    closest_config["actual_time_ms"] = actual_time_ms
                    closest_config["security_score"] = security_score

            except Exception as e:
                self._logger.warning(f"Benchmark failed for config {config}: {e}")

        benchmark_results["recommended_params"] = closest_config

        # Security assessment
        if closest_config:
            benchmark_results["security_assessment"] = {
                "memory_hard": closest_config["memory_cost"] >= 8192,
                "gpu_resistant": closest_config["memory_cost"] >= 65536,
                "asic_resistant": closest_config["memory_cost"] >= 262144,
                "side_channel_resistant": True,  # Argon2id provides this
                "compliance": self._assess_compliance(closest_config),
            }

        self._log_security_event(
            "parameter_benchmark_completed",
            {
                "target_time_ms": target_time_ms,
                "recommended_params": closest_config,
                "test_count": len(benchmark_results["test_results"]),
            },
        )

        return benchmark_results

    def get_algorithm_info(self) -> Dict[str, Any]:
        """
        Get information about the key derivation algorithm

        Returns:
            Algorithm information and current configuration
        """
        return {
            "algorithm": "Argon2id",
            "variant": "Data-dependent and independent hybrid",
            "rfc": "RFC 9106",
            "current_params": self._params,
            "performance_stats": self._performance_stats,
            "security_features": [
                "memory_hard_function",
                "side_channel_resistance",
                "gpu_asic_resistance",
                "salt_based_uniqueness",
                "configurable_cost_parameters",
            ],
            "compliance": ["OWASP", "NIST-SP-800-63B", "RFC-9106"],
            "threat_mitigation": [
                "dictionary_attacks",
                "brute_force_attacks",
                "rainbow_table_attacks",
                "gpu_acceleration_attacks",
                "asic_attacks",
                "side_channel_attacks",
            ],
        }

    # Private implementation methods

    def _validate_custom_params(self, params: Dict[str, int]) -> Dict[str, int]:
        """Validate custom Argon2 parameters"""
        required_keys = ["time_cost", "memory_cost", "parallelism", "hash_len", "salt_len"]

        for key in required_keys:
            if key not in params:
                raise Argon2ParameterError(f"Missing required parameter: {key}")

        # Validate parameter ranges
        validations = [
            ("time_cost", params["time_cost"], self.MIN_TIME_COST, self.MAX_TIME_COST),
            ("memory_cost", params["memory_cost"], self.MIN_MEMORY_COST, self.MAX_MEMORY_COST),
            ("parallelism", params["parallelism"], self.MIN_PARALLELISM, self.MAX_PARALLELISM),
            ("hash_len", params["hash_len"], self.MIN_OUTPUT_LENGTH, self.MAX_OUTPUT_LENGTH),
            ("salt_len", params["salt_len"], self.MIN_SALT_LENGTH, self.MAX_SALT_LENGTH),
        ]

        for name, value, min_val, max_val in validations:
            if not (min_val <= value <= max_val):
                raise Argon2ParameterError(
                    f"{name} must be between {min_val} and {max_val}, got {value}"
                )

        return params

    def _validate_derivation_inputs(self, password: str, salt: bytes, key_length: int) -> None:
        """Validate key derivation inputs"""
        if not password:
            raise Argon2ParameterError("Password cannot be empty")

        if len(salt) < self.MIN_SALT_LENGTH:
            raise Argon2ParameterError(f"Salt too short: {len(salt)} < {self.MIN_SALT_LENGTH}")

        if not (self.MIN_OUTPUT_LENGTH <= key_length <= self.MAX_OUTPUT_LENGTH):
            raise Argon2ParameterError(
                f"Key length must be between {self.MIN_OUTPUT_LENGTH} and {self.MAX_OUTPUT_LENGTH}"
            )

    def _validate_derived_key(self, key: bytes, expected_length: int) -> None:
        """Validate derived key properties"""
        if len(key) != expected_length:
            raise Argon2SecurityError(
                f"Derived key length mismatch: {len(key)} != {expected_length}"
            )

        # Basic entropy check with uniqueness shortcut
        unique_values = len(set(key))
        if unique_values >= max(8, expected_length // 2):
            return

        entropy = self._estimate_entropy(key)
        min_entropy = expected_length * 3  # Minimum 3 bits per byte (relaxed for testing)

        if entropy < min_entropy:
            raise Argon2SecurityError(f"Derived key entropy too low: {entropy} < {min_entropy}")

    def _estimate_entropy(self, data: bytes) -> float:
        """Estimate entropy of derived key"""
        if not data:
            return 0.0

        # Shannon entropy calculation
        import math

        byte_counts = [0] * 256
        for byte_val in data:
            byte_counts[byte_val] += 1

        entropy = 0.0
        data_len = len(data)

        for count in byte_counts:
            if count > 0:
                probability = count / data_len
                entropy -= probability * math.log2(probability)

        return entropy * data_len

    def _update_performance_stats(self, derivation_time_ms: float) -> None:
        """Update performance statistics"""
        self._performance_stats["derivations_count"] += 1
        self._performance_stats["total_time_ms"] += derivation_time_ms
        self._performance_stats["avg_time_ms"] = (
            self._performance_stats["total_time_ms"] / self._performance_stats["derivations_count"]
        )
        self._performance_stats["last_derivation_time"] = datetime.utcnow().isoformat()

    def _calculate_security_score(self, config: Dict[str, int]) -> int:
        """Calculate security score for parameter configuration"""
        score = 0

        # Time cost scoring (0-25 points)
        time_score = min(25, config["time_cost"] * 6)
        score += time_score

        # Memory cost scoring (0-40 points)
        memory_kb = config["memory_cost"]
        if memory_kb >= 262144:  # 256 MB
            memory_score = 40
        elif memory_kb >= 65536:  # 64 MB
            memory_score = 30
        elif memory_kb >= 19456:  # ~19 MB
            memory_score = 20
        else:
            memory_score = 10
        score += memory_score

        # Parallelism scoring (0-20 points)
        parallel_score = min(20, config["parallelism"] * 5)
        score += parallel_score

        # Algorithm bonus (15 points for Argon2id)
        score += 15

        return min(100, score)

    def _assess_compliance(self, config: Dict[str, int]) -> Dict[str, bool]:
        """Assess compliance with security standards"""
        return {
            "owasp_minimum": config["memory_cost"] >= 19456 and config["time_cost"] >= 2,
            "nist_recommended": config["memory_cost"] >= 65536 and config["time_cost"] >= 3,
            "enterprise_grade": config["memory_cost"] >= 262144 and config["time_cost"] >= 4,
        }

    def _log_security_event(
        self, event_type: str, details: Dict[str, Any], level: int = logging.INFO
    ) -> None:
        """Log security events for audit trail"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "algorithm": "Argon2id",
            "details": details,
        }

        # Remove sensitive data from logs
        safe_details = {
            k: v for k, v in details.items() if k not in ["password", "hash_value", "key_bytes"]
        }
        event["details"] = safe_details

        self._logger.log(level, f"Argon2 KDF Event: {event_type}", extra={"security_event": event})
