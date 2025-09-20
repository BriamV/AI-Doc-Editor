"""
Unit Tests for Argon2id Key Derivation Function

Comprehensive test suite for the Argon2id key derivation implementation
including security validation, performance benchmarks, and compliance verification.

TEST CATEGORIES:
1. Basic Key Derivation Operations
2. Parameter Validation and Security
3. Password Hashing and Verification
4. Salt Generation and Validation
5. Performance Benchmarking
6. Security Level Configuration
7. Error Handling and Edge Cases
8. Compliance and Standards Validation

SECURITY TEST AREAS:
- Argon2id parameter validation
- Memory-hard function verification
- Salt uniqueness and entropy
- Password strength requirements
- Timing attack resistance
"""

import pytest
import time
import threading

# Import modules under test
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from app.security.encryption.key_derivation import (
    Argon2KeyDerivation,
    Argon2SecurityLevel,
    Argon2ParameterError,
)
from app.security.encryption.encryption_interface import KeyDerivationFunction


class TestArgon2KeyDerivationBasic:
    """Test basic key derivation operations"""

    @pytest.fixture
    def kdf(self):
        """Create Argon2 KDF with standard security level for testing"""
        return Argon2KeyDerivation(security_level=Argon2SecurityLevel.STANDARD)

    @pytest.fixture
    def test_passwords(self):
        """Test passwords of various strengths"""
        return {
            "simple": "password123",
            "complex": "MyC0mpl3x!P@ssw0rd",
            "unicode": "пароль123🔐",
            "long": "a" * 100,
            "symbols": "!@#$%^&*()_+-=[]{}|;:,.<>?",
            "empty": "",
            "spaces": "password with spaces",
        }

    def test_basic_key_derivation(self, kdf, test_passwords):
        """Test basic key derivation functionality"""
        password = test_passwords["simple"]
        salt = kdf.generate_salt(32)

        # Derive key
        derived_key = kdf.derive_key(password=password, salt=salt, key_length=32)

        # Verify key properties
        assert len(derived_key) == 32
        assert derived_key != b"\x00" * 32  # Not all zeros
        assert derived_key != b"\xff" * 32  # Not all ones

        # Verify deterministic behavior
        derived_key2 = kdf.derive_key(password=password, salt=salt, key_length=32)
        assert derived_key == derived_key2

    def test_different_passwords_different_keys(self, kdf):
        """Test that different passwords produce different keys"""
        salt = kdf.generate_salt(32)

        key1 = kdf.derive_key("password1", salt, key_length=32)
        key2 = kdf.derive_key("password2", salt, key_length=32)

        assert key1 != key2

    def test_different_salts_different_keys(self, kdf, test_passwords):
        """Test that different salts produce different keys"""
        password = test_passwords["simple"]

        salt1 = kdf.generate_salt(32)
        salt2 = kdf.generate_salt(32)

        key1 = kdf.derive_key(password, salt1, key_length=32)
        key2 = kdf.derive_key(password, salt2, key_length=32)

        assert key1 != key2

    def test_variable_key_lengths(self, kdf, test_passwords):
        """Test key derivation with different output lengths"""
        password = test_passwords["simple"]
        salt = kdf.generate_salt(32)

        for key_length in [16, 32, 48, 64]:
            derived_key = kdf.derive_key(password, salt, key_length=key_length)
            assert len(derived_key) == key_length

    def test_unicode_password_handling(self, kdf, test_passwords):
        """Test handling of Unicode passwords"""
        password = test_passwords["unicode"]
        salt = kdf.generate_salt(32)

        derived_key = kdf.derive_key(password, salt, key_length=32)
        assert len(derived_key) == 32

        # Verify consistency
        derived_key2 = kdf.derive_key(password, salt, key_length=32)
        assert derived_key == derived_key2

    def test_long_password_handling(self, kdf, test_passwords):
        """Test handling of very long passwords"""
        password = test_passwords["long"]
        salt = kdf.generate_salt(32)

        derived_key = kdf.derive_key(password, salt, key_length=32)
        assert len(derived_key) == 32


class TestArgon2PasswordHashing:
    """Test password hashing and verification functionality"""

    @pytest.fixture
    def kdf(self):
        return Argon2KeyDerivation(security_level=Argon2SecurityLevel.STANDARD)

    def test_password_hashing_verification(self, kdf):
        """Test password hashing and verification"""
        password = "test_password_123"

        # Hash password
        hash_value = kdf.hash_password(password)

        # Verify correct password
        assert kdf.verify_password(password, hash_value) is True

        # Verify incorrect password
        assert kdf.verify_password("wrong_password", hash_value) is False

    def test_password_hash_uniqueness(self, kdf):
        """Test that same password produces different hashes (due to random salt)"""
        password = "test_password"

        hash1 = kdf.hash_password(password)
        hash2 = kdf.hash_password(password)

        # Hashes should be different due to random salt
        assert hash1 != hash2

        # But both should verify correctly
        assert kdf.verify_password(password, hash1) is True
        assert kdf.verify_password(password, hash2) is True

    def test_password_hash_with_custom_salt(self, kdf):
        """Test password hashing with custom salt"""
        password = "test_password"
        custom_salt = kdf.generate_salt(32)

        hash_value = kdf.hash_password(password, salt=custom_salt)

        # Verify password
        assert kdf.verify_password(password, hash_value) is True

        # Same salt should produce same hash
        hash_value2 = kdf.hash_password(password, salt=custom_salt)
        assert hash_value == hash_value2

    def test_invalid_hash_format_handling(self, kdf):
        """Test handling of invalid hash formats"""
        password = "test_password"

        # Invalid hash formats
        invalid_hashes = [
            "",
            "invalid_hash",
            "not_argon2_hash",
            "$argon2id$v=19$m=65536,t=2,p=1$invalid",
        ]

        for invalid_hash in invalid_hashes:
            result = kdf.verify_password(password, invalid_hash)
            assert result is False


class TestArgon2SaltGeneration:
    """Test salt generation functionality"""

    @pytest.fixture
    def kdf(self):
        return Argon2KeyDerivation()

    def test_salt_generation_default_length(self, kdf):
        """Test default salt generation"""
        salt = kdf.generate_salt()
        assert len(salt) == 32  # Default length

    def test_salt_generation_custom_lengths(self, kdf):
        """Test salt generation with custom lengths"""
        for length in [16, 24, 32, 48, 64]:
            salt = kdf.generate_salt(length)
            assert len(salt) == length

    def test_salt_uniqueness(self, kdf):
        """Test that generated salts are unique"""
        salts = set()
        iterations = 1000

        for _ in range(iterations):
            salt = kdf.generate_salt(32)
            assert salt not in salts, "Duplicate salt detected"
            salts.add(salt)

        assert len(salts) == iterations

    def test_salt_entropy(self, kdf):
        """Test salt entropy quality"""
        salt = kdf.generate_salt(32)

        # Basic entropy checks
        assert salt != b"\x00" * 32  # Not all zeros
        assert salt != b"\xff" * 32  # Not all ones

        # Check for reasonable byte distribution
        unique_bytes = len(set(salt))
        assert unique_bytes >= len(salt) // 3  # At least 1/3 unique bytes

    def test_salt_length_validation(self, kdf):
        """Test salt length validation"""
        # Valid lengths
        for length in range(16, 65):
            salt = kdf.generate_salt(length)
            assert len(salt) == length

        # Invalid lengths
        with pytest.raises(Argon2ParameterError):
            kdf.generate_salt(8)  # Too short

        with pytest.raises(Argon2ParameterError):
            kdf.generate_salt(128)  # Too long


class TestArgon2SecurityLevels:
    """Test different security level configurations"""

    def test_development_level(self):
        """Test development security level"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.DEVELOPMENT)

        password = "test_password"
        salt = kdf.generate_salt(32)

        # Should be fast for development
        start_time = time.time()
        derived_key = kdf.derive_key(password, salt, key_length=32)
        end_time = time.time()

        assert len(derived_key) == 32
        assert (end_time - start_time) < 0.1  # Should be very fast

    def test_standard_level(self):
        """Test standard security level"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.STANDARD)

        password = "test_password"
        salt = kdf.generate_salt(32)

        derived_key = kdf.derive_key(password, salt, key_length=32)
        assert len(derived_key) == 32

    def test_high_level(self):
        """Test high security level"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.HIGH)

        password = "test_password"
        salt = kdf.generate_salt(32)

        derived_key = kdf.derive_key(password, salt, key_length=32)
        assert len(derived_key) == 32

    def test_maximum_level(self):
        """Test maximum security level"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.MAXIMUM)

        password = "test_password"
        salt = kdf.generate_salt(32)

        # This will be slow but should work
        derived_key = kdf.derive_key(password, salt, key_length=32)
        assert len(derived_key) == 32
        assert len(derived_key) == 32  # Maximum level uses 64-byte output by default

    def test_custom_parameters(self):
        """Test custom parameter configuration"""
        custom_params = {
            "time_cost": 1,
            "memory_cost": 1024,  # 1 MiB
            "parallelism": 1,
            "hash_len": 32,
            "salt_len": 16,
        }

        kdf = Argon2KeyDerivation(custom_params=custom_params)

        password = "test_password"
        salt = kdf.generate_salt(16)

        derived_key = kdf.derive_key(password, salt, key_length=32)
        assert len(derived_key) == 32


class TestArgon2ParameterValidation:
    """Test parameter validation and error handling"""

    def test_invalid_custom_parameters(self):
        """Test validation of invalid custom parameters"""
        # Missing required parameters
        with pytest.raises(Argon2ParameterError):
            Argon2KeyDerivation(custom_params={"time_cost": 1})

        # Invalid time cost
        with pytest.raises(Argon2ParameterError):
            Argon2KeyDerivation(
                custom_params={
                    "time_cost": 0,  # Too low
                    "memory_cost": 1024,
                    "parallelism": 1,
                    "hash_len": 32,
                    "salt_len": 16,
                }
            )

        # Invalid memory cost
        with pytest.raises(Argon2ParameterError):
            Argon2KeyDerivation(
                custom_params={
                    "time_cost": 1,
                    "memory_cost": 4,  # Too low
                    "parallelism": 1,
                    "hash_len": 32,
                    "salt_len": 16,
                }
            )

    def test_key_derivation_input_validation(self):
        """Test input validation for key derivation"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.DEVELOPMENT)

        # Empty password
        with pytest.raises(Argon2ParameterError):
            kdf.derive_key("", kdf.generate_salt(32), key_length=32)

        # Salt too short
        with pytest.raises(Argon2ParameterError):
            kdf.derive_key("password", b"short", key_length=32)

        # Invalid key length
        with pytest.raises(Argon2ParameterError):
            kdf.derive_key("password", kdf.generate_salt(32), key_length=8)

        # Invalid algorithm
        with pytest.raises(Argon2ParameterError):
            kdf.derive_key(
                "password",
                kdf.generate_salt(32),
                key_length=32,
                algorithm=KeyDerivationFunction.PBKDF2_SHA256,
            )


class TestArgon2Performance:
    """Test performance characteristics and benchmarking"""

    @pytest.fixture
    def kdf(self):
        return Argon2KeyDerivation(security_level=Argon2SecurityLevel.DEVELOPMENT)

    def test_derivation_performance(self, kdf):
        """Test key derivation performance"""
        password = "test_password"
        salt = kdf.generate_salt(32)

        # Measure multiple derivations
        iterations = 10
        start_time = time.time()

        for _ in range(iterations):
            derived_key = kdf.derive_key(password, salt, key_length=32)
            assert len(derived_key) == 32

        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / iterations

        # Performance should be reasonable for development level
        assert avg_time < 0.1, f"Derivation too slow: {avg_time}s per operation"

    def test_parameter_benchmarking(self):
        """Test parameter benchmarking functionality"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.DEVELOPMENT)

        # Test benchmarking with low target time for testing
        results = kdf.benchmark_parameters(target_time_ms=100)

        assert "target_time_ms" in results
        assert "test_results" in results
        assert "recommended_params" in results
        assert "security_assessment" in results

        # Should have test results
        assert len(results["test_results"]) > 0

        # Should have recommended parameters
        assert results["recommended_params"] is not None

    def test_memory_usage_scaling(self):
        """Test memory usage with different parameters"""
        # Test with different memory costs
        memory_costs = [1024, 4096, 16384]  # 1MB, 4MB, 16MB

        for memory_cost in memory_costs:
            custom_params = {
                "time_cost": 1,
                "memory_cost": memory_cost,
                "parallelism": 1,
                "hash_len": 32,
                "salt_len": 16,
            }

            kdf = Argon2KeyDerivation(custom_params=custom_params)
            password = "test_password"
            salt = kdf.generate_salt(32)

            # Should work with all memory levels
            derived_key = kdf.derive_key(password, salt, key_length=32)
            assert len(derived_key) == 32


class TestArgon2ThreadSafety:
    """Test thread safety of Argon2 operations"""

    @pytest.fixture
    def kdf(self):
        return Argon2KeyDerivation(security_level=Argon2SecurityLevel.DEVELOPMENT)

    def test_concurrent_key_derivation(self, kdf):
        """Test concurrent key derivation operations"""
        results = []
        errors = []
        num_threads = 5
        operations_per_thread = 10

        def derivation_worker():
            try:
                for i in range(operations_per_thread):
                    password = f"password_{threading.current_thread().ident}_{i}"
                    salt = kdf.generate_salt(32)
                    key = kdf.derive_key(password, salt, key_length=32)
                    results.append(key)
            except Exception as e:
                errors.append(e)

        # Start threads
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=derivation_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify results
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == num_threads * operations_per_thread

        # All keys should be unique
        unique_keys = set(results)
        assert len(unique_keys) == len(results)

    def test_concurrent_password_verification(self, kdf):
        """Test concurrent password verification"""
        # Setup test data
        test_passwords, password_hashes = self._setup_test_passwords(kdf)
        verification_results, errors = self._run_concurrent_verification(
            kdf, test_passwords, password_hashes
        )

        # Validate results
        self._validate_verification_results(verification_results, errors)

    def _setup_test_passwords(self, kdf):
        """Setup test passwords and their hashes"""
        test_passwords = [f"password_{i}" for i in range(10)]
        password_hashes = [kdf.hash_password(pwd) for pwd in test_passwords]
        return test_passwords, password_hashes

    def _run_concurrent_verification(self, kdf, test_passwords, password_hashes):
        """Run concurrent password verification threads"""
        verification_results = []
        errors = []

        def verification_worker():
            self._perform_password_verifications(
                kdf, test_passwords, password_hashes, verification_results, errors
            )

        # Start and manage threads
        threads = self._start_verification_threads(verification_worker, num_threads=3)
        self._wait_for_thread_completion(threads)

        return verification_results, errors

    def _perform_password_verifications(
        self, kdf, test_passwords, password_hashes, verification_results, errors
    ):
        """Perform password verification operations in worker thread"""
        try:
            for i, (password, hash_value) in enumerate(zip(test_passwords, password_hashes)):
                # Verify correct password
                result = kdf.verify_password(password, hash_value)
                verification_results.append(("correct", result))

                # Verify incorrect password
                wrong_password = f"wrong_password_{i}"
                result = kdf.verify_password(wrong_password, hash_value)
                verification_results.append(("incorrect", result))
        except Exception as e:
            errors.append(e)

    def _start_verification_threads(self, worker_function, num_threads):
        """Start verification worker threads"""
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=worker_function)
            threads.append(thread)
            thread.start()
        return threads

    def _wait_for_thread_completion(self, threads):
        """Wait for all threads to complete"""
        for thread in threads:
            thread.join()

    def _validate_verification_results(self, verification_results, errors):
        """Validate verification results and check for errors"""
        # Check for errors
        assert len(errors) == 0, f"Errors occurred: {errors}"

        # Separate and validate results
        correct_results = [r[1] for r in verification_results if r[0] == "correct"]
        incorrect_results = [r[1] for r in verification_results if r[0] == "incorrect"]

        assert all(correct_results), "Some correct password verifications failed"
        assert not any(incorrect_results), "Some incorrect password verifications succeeded"


class TestArgon2Compliance:
    """Test compliance with standards and best practices"""

    def test_algorithm_info(self):
        """Test algorithm information compliance"""
        kdf = Argon2KeyDerivation()
        info = kdf.get_algorithm_info()

        # Verify required fields
        assert info["algorithm"] == "Argon2id"
        assert info["variant"] == "Data-dependent and independent hybrid"
        assert info["rfc"] == "RFC 9106"

        # Verify security features
        expected_features = [
            "memory_hard_function",
            "side_channel_resistance",
            "gpu_asic_resistance",
            "salt_based_uniqueness",
            "configurable_cost_parameters",
        ]

        for feature in expected_features:
            assert feature in info["security_features"]

        # Verify compliance standards
        expected_compliance = ["OWASP", "NIST-SP-800-63B", "RFC-9106"]
        for standard in expected_compliance:
            assert standard in info["compliance"]

    def test_security_level_compliance(self):
        """Test that security levels meet compliance requirements"""
        # Test standard level meets OWASP minimum
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.STANDARD)
        params = kdf._params

        assert params["memory_cost"] >= 19456  # ~19 MiB minimum
        assert params["time_cost"] >= 2

        # Test high level meets NIST recommendations
        kdf_high = Argon2KeyDerivation(security_level=Argon2SecurityLevel.HIGH)
        params_high = kdf_high._params

        assert params_high["memory_cost"] >= 65536  # 64 MiB minimum
        assert params_high["time_cost"] >= 3

    def test_entropy_requirements(self):
        """Test that derived keys meet entropy requirements"""
        kdf = Argon2KeyDerivation(security_level=Argon2SecurityLevel.STANDARD)

        password = "test_password"
        salt = kdf.generate_salt(32)
        derived_key = kdf.derive_key(password, salt, key_length=32)

        # Basic entropy validation
        unique_bytes = len(set(derived_key))
        entropy_ratio = unique_bytes / len(derived_key)

        # Should have reasonable entropy (at least 50% unique bytes)
        assert entropy_ratio >= 0.5

        # Should not be predictable patterns
        assert derived_key != b"\x00" * 32
        assert derived_key != b"\xff" * 32
        assert derived_key != bytes(range(32))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
