"""
Encryption Interface for T-12 Credential Store Security

Defines the standard interface for all encryption operations in the credential
storage system. Ensures consistent security patterns across all encryption modules.

SECURITY DESIGN PRINCIPLES:
1. Defense in Depth: Multiple layers of encryption protection
2. Fail Secure: Operations fail to secure state, never expose data
3. Least Privilege: Minimal required permissions for operations
4. Zero Trust: Verify all inputs and operations
5. Forward Secrecy: Past compromises don't affect future security

THREAT MODEL ADDRESSED:
- Data at Rest Attacks (CVSS: 8.1)
- Memory Dump Attacks (CVSS: 7.4)
- Cryptographic Side-Channel Attacks (CVSS: 6.2)
- Key Recovery Attacks (CVSS: 7.8)
- Replay Attacks (CVSS: 5.9)
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union, Tuple
from datetime import datetime
from enum import Enum
import secrets
from dataclasses import dataclass


class EncryptionAlgorithm(Enum):
    """Supported encryption algorithms with security ratings"""
    AES_256_GCM = "AES-256-GCM"  # Recommended: AEAD with 256-bit key
    AES_128_GCM = "AES-128-GCM"  # Acceptable: AEAD with 128-bit key
    CHACHA20_POLY1305 = "ChaCha20-Poly1305"  # Alternative: Fast AEAD


class KeyDerivationFunction(Enum):
    """Supported key derivation functions"""
    PBKDF2_SHA256 = "PBKDF2-SHA256"  # Standard: RFC 2898
    ARGON2ID = "Argon2id"  # Recommended: Memory-hard function
    SCRYPT = "scrypt"  # Alternative: Memory-hard function


@dataclass
class EncryptionMetadata:
    """Metadata for encrypted data"""
    algorithm: EncryptionAlgorithm
    key_version: int
    created_at: datetime
    key_rotation_due: datetime
    nonce: bytes
    auth_tag: Optional[bytes] = None
    additional_data: Optional[bytes] = None


@dataclass
class EncryptionResult:
    """Result of encryption operation"""
    encrypted_data: bytes
    metadata: EncryptionMetadata
    success: bool
    error_message: Optional[str] = None


@dataclass
class DecryptionResult:
    """Result of decryption operation"""
    decrypted_data: bytes
    metadata: EncryptionMetadata
    success: bool
    error_message: Optional[str] = None
    integrity_verified: bool = False


class EncryptionInterface(ABC):
    """
    Abstract base class for all encryption implementations

    Defines the contract that all encryption engines must implement
    for the T-12 credential store security system.

    SECURITY REQUIREMENTS:
    - All implementations MUST use authenticated encryption (AEAD)
    - All implementations MUST provide forward secrecy
    - All implementations MUST validate integrity on decryption
    - All implementations MUST use cryptographically secure random nonces
    - All implementations MUST support key rotation
    """

    @abstractmethod
    def encrypt(
        self,
        plaintext: Union[str, bytes],
        key_id: Optional[str] = None,
        additional_data: Optional[bytes] = None
    ) -> EncryptionResult:
        """
        Encrypt plaintext data using authenticated encryption

        Args:
            plaintext: Data to encrypt (string will be UTF-8 encoded)
            key_id: Optional specific key to use (uses current if None)
            additional_data: Optional additional authenticated data (AAD)

        Returns:
            EncryptionResult with encrypted data and metadata

        Security Requirements:
        - MUST use cryptographically secure random nonce
        - MUST include authentication tag for integrity
        - MUST fail securely on any error
        - MUST not expose sensitive data in logs or exceptions
        """
        pass

    @abstractmethod
    def decrypt(
        self,
        encrypted_data: bytes,
        metadata: EncryptionMetadata,
        additional_data: Optional[bytes] = None
    ) -> DecryptionResult:
        """
        Decrypt data and verify authenticity

        Args:
            encrypted_data: Encrypted data to decrypt
            metadata: Encryption metadata including algorithm and key version
            additional_data: Optional additional authenticated data (AAD)

        Returns:
            DecryptionResult with decrypted data and verification status

        Security Requirements:
        - MUST verify authentication tag before returning data
        - MUST fail securely if integrity check fails
        - MUST support multiple key versions for rotation
        - MUST clear sensitive data from memory after use
        """
        pass

    @abstractmethod
    def rotate_key(self, old_key_id: str) -> str:
        """
        Rotate encryption key to new version

        Args:
            old_key_id: ID of key to rotate

        Returns:
            New key ID

        Security Requirements:
        - MUST generate cryptographically secure new key
        - MUST maintain access to old key for existing data
        - MUST update key rotation schedule
        - MUST log rotation event securely
        """
        pass

    @abstractmethod
    def derive_key(
        self,
        password: str,
        salt: bytes,
        iterations: int,
        key_length: int = 32,
        algorithm: KeyDerivationFunction = KeyDerivationFunction.ARGON2ID
    ) -> bytes:
        """
        Derive encryption key from password using secure KDF

        Args:
            password: Source password/passphrase
            salt: Cryptographic salt (minimum 16 bytes)
            iterations: Number of iterations (algorithm-specific)
            key_length: Length of derived key in bytes
            algorithm: Key derivation function to use

        Returns:
            Derived key bytes

        Security Requirements:
        - MUST use memory-hard KDF for password-based keys
        - MUST use minimum 100,000 iterations for PBKDF2
        - MUST use cryptographically secure salt
        - MUST clear password from memory after use
        """
        pass

    @abstractmethod
    def generate_nonce(self, length: int = 12) -> bytes:
        """
        Generate cryptographically secure nonce

        Args:
            length: Nonce length in bytes (default 12 for GCM)

        Returns:
            Cryptographically secure random nonce

        Security Requirements:
        - MUST use cryptographically secure random number generator
        - MUST never reuse nonces with same key
        - MUST be unpredictable and uniformly distributed
        """
        pass

    @abstractmethod
    def validate_key_strength(self, key: bytes) -> Dict[str, Any]:
        """
        Validate encryption key strength and entropy

        Args:
            key: Key bytes to validate

        Returns:
            Validation results including strength score and recommendations

        Security Requirements:
        - MUST check key length meets algorithm requirements
        - MUST validate key entropy and randomness
        - MUST identify weak or predictable keys
        - MUST not log or expose key material
        """
        pass

    @abstractmethod
    def get_algorithm_info(self) -> Dict[str, Any]:
        """
        Get information about the encryption algorithm implementation

        Returns:
            Algorithm information including security parameters
        """
        pass

    @abstractmethod
    def secure_delete(self, data: Union[bytes, str]) -> bool:
        """
        Securely delete sensitive data from memory

        Args:
            data: Sensitive data to delete

        Returns:
            True if secure deletion successful

        Security Requirements:
        - MUST overwrite memory containing sensitive data
        - MUST prevent data recovery from memory dumps
        - MUST handle both string and bytes data types
        """
        pass


class HSMInterface(ABC):
    """
    Interface for Hardware Security Module integration

    Defines methods for secure key storage and operations using HSM
    for the highest level of key protection.
    """

    @abstractmethod
    def store_key(self, key_id: str, key_data: bytes) -> bool:
        """Store encryption key in HSM"""
        pass

    @abstractmethod
    def retrieve_key(self, key_id: str) -> Optional[bytes]:
        """Retrieve encryption key from HSM"""
        pass

    @abstractmethod
    def encrypt_with_hsm(self, key_id: str, plaintext: bytes) -> bytes:
        """Perform encryption using HSM-stored key"""
        pass

    @abstractmethod
    def decrypt_with_hsm(self, key_id: str, ciphertext: bytes) -> bytes:
        """Perform decryption using HSM-stored key"""
        pass

    @abstractmethod
    def generate_key_in_hsm(self, key_id: str, algorithm: str) -> bool:
        """Generate encryption key directly in HSM"""
        pass

    @abstractmethod
    def delete_key_from_hsm(self, key_id: str) -> bool:
        """Securely delete key from HSM"""
        pass


def create_secure_encryption_context() -> Dict[str, Any]:
    """
    Create secure context for encryption operations

    Returns:
        Security context with all required parameters
    """
    return {
        "session_id": secrets.token_hex(16),
        "created_at": datetime.utcnow(),
        "security_level": "HIGH",
        "algorithm": EncryptionAlgorithm.AES_256_GCM,
        "key_derivation": KeyDerivationFunction.ARGON2ID,
        "require_hsm": False,  # Set to True for HSM-required environments
        "audit_enabled": True,
        "memory_protection": True
    }


def validate_encryption_config(config: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validate encryption configuration for security compliance

    Args:
        config: Encryption configuration to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    required_fields = ["algorithm", "key_derivation", "security_level"]

    for field in required_fields:
        if field not in config:
            return False, f"Missing required field: {field}"

    # Validate algorithm security
    algorithm = config.get("algorithm")
    if algorithm not in [algo.value for algo in EncryptionAlgorithm]:
        return False, f"Unsupported encryption algorithm: {algorithm}"

    # Validate security level
    security_level = config.get("security_level")
    if security_level not in ["HIGH", "MAXIMUM"]:
        return False, f"Security level must be HIGH or MAXIMUM, got: {security_level}"

    return True, "Configuration valid"