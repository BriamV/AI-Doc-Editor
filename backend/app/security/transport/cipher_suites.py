"""
Cipher Suite Manager for TLS 1.3 Implementation
Week 2 - T-12 Credential Store Security

Hardened TLS 1.3 cipher suite management with security-first selection,
compliance validation, and SSL context integration.
"""

import logging
import ssl
from enum import Enum
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """Security levels for cipher suite selection."""

    MAXIMUM = "maximum"  # 256-bit keys only, highest security
    HIGH = "high"  # Balanced security and performance
    MEDIUM = "medium"  # Performance-optimized with good security
    COMPATIBILITY = "compatibility"  # Legacy support with minimum security


class ComplianceStandard(Enum):
    """Security compliance standards."""

    NIST = "nist"  # NIST SP 800-52 Rev. 2
    FIPS = "fips"  # FIPS 140-2 Level 3+
    PCI_DSS = "pci_dss"  # PCI DSS requirements
    SUITE_B = "suite_b"  # NSA Suite B
    CNSA = "cnsa"  # NSA Commercial National Security Algorithm Suite


class CipherSuiteInfo(BaseModel):
    """Cipher suite information and security properties."""

    name: str
    openssl_name: str
    tls_version: str
    key_exchange: str
    authentication: str
    encryption: str
    key_size: int
    mac: str
    security_score: int  # 0-100
    perfect_forward_secrecy: bool
    quantum_resistant: bool
    compliance_standards: List[ComplianceStandard]
    performance_score: int  # 0-100, higher is better
    recommended: bool

    class Config:
        use_enum_values = True


class CipherSuiteManager:
    """
    Hardened cipher suite manager for TLS 1.3 configuration.

    Features:
    - Security-first cipher selection
    - Compliance validation (NIST, FIPS, PCI-DSS)
    - Performance optimization
    - SSL context integration
    - Dynamic cipher ranking
    """

    def __init__(self):
        self._cipher_suites = self._initialize_cipher_suites()
        self._security_policies = self._initialize_security_policies()
        self._compliance_requirements = self._initialize_compliance_requirements()

    def _initialize_cipher_suites(self) -> Dict[str, CipherSuiteInfo]:
        """Initialize TLS 1.3 cipher suite database."""
        cipher_suites = {}

        # TLS 1.3 cipher suites (RFC 8446)
        tls13_suites = [
            {
                "name": "TLS_AES_256_GCM_SHA384",
                "openssl_name": "AEAD-AES256-GCM-SHA384",
                "tls_version": "1.3",
                "key_exchange": "ECDHE",
                "authentication": "ECDSA/RSA",
                "encryption": "AES-256-GCM",
                "key_size": 256,
                "mac": "AEAD",
                "security_score": 100,
                "perfect_forward_secrecy": True,
                "quantum_resistant": False,  # AES-256 has some quantum resistance
                "compliance_standards": [
                    ComplianceStandard.NIST,
                    ComplianceStandard.FIPS,
                    ComplianceStandard.PCI_DSS,
                    ComplianceStandard.SUITE_B,
                    ComplianceStandard.CNSA,
                ],
                "performance_score": 85,
                "recommended": True,
            },
            {
                "name": "TLS_CHACHA20_POLY1305_SHA256",
                "openssl_name": "AEAD-CHACHA20-POLY1305-SHA256",
                "tls_version": "1.3",
                "key_exchange": "ECDHE",
                "authentication": "ECDSA/RSA",
                "encryption": "ChaCha20-Poly1305",
                "key_size": 256,
                "mac": "AEAD",
                "security_score": 95,
                "perfect_forward_secrecy": True,
                "quantum_resistant": False,
                "compliance_standards": [ComplianceStandard.NIST, ComplianceStandard.PCI_DSS],
                "performance_score": 95,  # Better performance on mobile/ARM
                "recommended": True,
            },
            {
                "name": "TLS_AES_128_GCM_SHA256",
                "openssl_name": "AEAD-AES128-GCM-SHA256",
                "tls_version": "1.3",
                "key_exchange": "ECDHE",
                "authentication": "ECDSA/RSA",
                "encryption": "AES-128-GCM",
                "key_size": 128,
                "mac": "AEAD",
                "security_score": 85,
                "perfect_forward_secrecy": True,
                "quantum_resistant": False,
                "compliance_standards": [ComplianceStandard.NIST, ComplianceStandard.PCI_DSS],
                "performance_score": 90,
                "recommended": True,
            },
        ]

        # TLS 1.2 cipher suites (for compatibility)
        tls12_suites = [
            {
                "name": "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
                "openssl_name": "ECDHE-ECDSA-AES256-GCM-SHA384",
                "tls_version": "1.2",
                "key_exchange": "ECDHE",
                "authentication": "ECDSA",
                "encryption": "AES-256-GCM",
                "key_size": 256,
                "mac": "AEAD",
                "security_score": 90,
                "perfect_forward_secrecy": True,
                "quantum_resistant": False,
                "compliance_standards": [
                    ComplianceStandard.NIST,
                    ComplianceStandard.FIPS,
                    ComplianceStandard.PCI_DSS,
                ],
                "performance_score": 80,
                "recommended": False,  # TLS 1.3 preferred
            },
            {
                "name": "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
                "openssl_name": "ECDHE-RSA-AES256-GCM-SHA384",
                "tls_version": "1.2",
                "key_exchange": "ECDHE",
                "authentication": "RSA",
                "encryption": "AES-256-GCM",
                "key_size": 256,
                "mac": "AEAD",
                "security_score": 85,
                "perfect_forward_secrecy": True,
                "quantum_resistant": False,
                "compliance_standards": [ComplianceStandard.NIST, ComplianceStandard.PCI_DSS],
                "performance_score": 75,
                "recommended": False,
            },
            {
                "name": "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
                "openssl_name": "ECDHE-ECDSA-CHACHA20-POLY1305",
                "tls_version": "1.2",
                "key_exchange": "ECDHE",
                "authentication": "ECDSA",
                "encryption": "ChaCha20-Poly1305",
                "key_size": 256,
                "mac": "AEAD",
                "security_score": 88,
                "perfect_forward_secrecy": True,
                "quantum_resistant": False,
                "compliance_standards": [ComplianceStandard.NIST],
                "performance_score": 85,
                "recommended": False,
            },
        ]

        # Convert to CipherSuiteInfo objects
        for suite_data in tls13_suites + tls12_suites:
            suite = CipherSuiteInfo(**suite_data)
            cipher_suites[suite.name] = suite

        return cipher_suites

    def _initialize_security_policies(self) -> Dict[SecurityLevel, Dict]:
        """Initialize security policies for different security levels."""
        return {
            SecurityLevel.MAXIMUM: {
                "min_key_size": 256,
                "require_pfs": True,
                "require_aead": True,
                "allowed_tls_versions": ["1.3"],
                "min_security_score": 95,
                "require_compliance": [ComplianceStandard.NIST, ComplianceStandard.FIPS],
                "max_cipher_count": 3,
            },
            SecurityLevel.HIGH: {
                "min_key_size": 256,
                "require_pfs": True,
                "require_aead": True,
                "allowed_tls_versions": ["1.3", "1.2"],
                "min_security_score": 85,
                "require_compliance": [ComplianceStandard.NIST],
                "max_cipher_count": 5,
            },
            SecurityLevel.MEDIUM: {
                "min_key_size": 128,
                "require_pfs": True,
                "require_aead": True,
                "allowed_tls_versions": ["1.3", "1.2"],
                "min_security_score": 75,
                "require_compliance": [],
                "max_cipher_count": 8,
            },
            SecurityLevel.COMPATIBILITY: {
                "min_key_size": 128,
                "require_pfs": False,
                "require_aead": False,
                "allowed_tls_versions": ["1.3", "1.2", "1.1"],
                "min_security_score": 60,
                "require_compliance": [],
                "max_cipher_count": 12,
            },
        }

    def _initialize_compliance_requirements(self) -> Dict[ComplianceStandard, Dict]:
        """Initialize compliance requirements."""
        return {
            ComplianceStandard.NIST: {
                "min_key_size": 256,
                "require_pfs": True,
                "allowed_encryptions": ["AES-256-GCM", "AES-128-GCM", "ChaCha20-Poly1305"],
                "forbidden_encryptions": ["RC4", "DES", "3DES"],
                "min_tls_version": "1.2",
            },
            ComplianceStandard.FIPS: {
                "min_key_size": 256,
                "require_pfs": True,
                "allowed_encryptions": ["AES-256-GCM", "AES-128-GCM"],
                "forbidden_encryptions": ["RC4", "DES", "3DES", "ChaCha20-Poly1305"],
                "min_tls_version": "1.2",
            },
            ComplianceStandard.PCI_DSS: {
                "min_key_size": 128,
                "require_pfs": True,
                "allowed_encryptions": ["AES-256-GCM", "AES-128-GCM", "ChaCha20-Poly1305"],
                "forbidden_encryptions": ["RC4", "DES", "3DES"],
                "min_tls_version": "1.2",
            },
            ComplianceStandard.SUITE_B: {
                "min_key_size": 256,
                "require_pfs": True,
                "allowed_encryptions": ["AES-256-GCM"],
                "forbidden_encryptions": ["RC4", "DES", "3DES", "ChaCha20-Poly1305"],
                "min_tls_version": "1.2",
            },
            ComplianceStandard.CNSA: {
                "min_key_size": 256,
                "require_pfs": True,
                "allowed_encryptions": ["AES-256-GCM"],
                "forbidden_encryptions": ["RC4", "DES", "3DES", "ChaCha20-Poly1305", "AES-128-GCM"],
                "min_tls_version": "1.3",
            },
        }

    def get_cipher_suites_for_security_level(
        self, security_level: SecurityLevel, optimize_for_performance: bool = False
    ) -> List[CipherSuiteInfo]:
        """Get cipher suites for specified security level."""
        policy = self._security_policies[security_level]
        suitable_suites = []

        for suite in self._cipher_suites.values():
            # Check key size requirement
            if suite.key_size < policy["min_key_size"]:
                continue

            # Check PFS requirement
            if policy["require_pfs"] and not suite.perfect_forward_secrecy:
                continue

            # Check AEAD requirement
            if policy["require_aead"] and suite.mac != "AEAD":
                continue

            # Check TLS version
            if suite.tls_version not in policy["allowed_tls_versions"]:
                continue

            # Check security score
            if suite.security_score < policy["min_security_score"]:
                continue

            # Check compliance requirements
            if policy["require_compliance"]:
                has_required_compliance = any(
                    compliance in suite.compliance_standards
                    for compliance in policy["require_compliance"]
                )
                if not has_required_compliance:
                    continue

            suitable_suites.append(suite)

        # Sort by security score, then by performance if requested
        if optimize_for_performance:
            suitable_suites.sort(
                key=lambda s: (s.security_score, s.performance_score), reverse=True
            )
        else:
            suitable_suites.sort(key=lambda s: s.security_score, reverse=True)

        # Limit to max cipher count
        return suitable_suites[: policy["max_cipher_count"]]

    def get_cipher_suites_for_compliance(
        self, compliance_standards: List[ComplianceStandard]
    ) -> List[CipherSuiteInfo]:
        """Get cipher suites that meet compliance requirements."""
        compliant_suites = []

        for suite in self._cipher_suites.values():
            # Check if suite meets all compliance standards
            meets_all_requirements = True

            for standard in compliance_standards:
                requirements = self._compliance_requirements[standard]

                # Check key size
                if suite.key_size < requirements["min_key_size"]:
                    meets_all_requirements = False
                    break

                # Check PFS
                if requirements["require_pfs"] and not suite.perfect_forward_secrecy:
                    meets_all_requirements = False
                    break

                # Check encryption algorithm
                if suite.encryption not in requirements["allowed_encryptions"]:
                    meets_all_requirements = False
                    break

                if suite.encryption in requirements["forbidden_encryptions"]:
                    meets_all_requirements = False
                    break

                # Check TLS version
                min_version = requirements["min_tls_version"]
                if self._compare_tls_versions(suite.tls_version, min_version) < 0:
                    meets_all_requirements = False
                    break

            if meets_all_requirements:
                compliant_suites.append(suite)

        # Sort by security score
        return sorted(compliant_suites, key=lambda s: s.security_score, reverse=True)

    def get_recommended_cipher_suites(
        self,
        security_level: Optional[SecurityLevel] = None,
        compliance_standards: Optional[List[ComplianceStandard]] = None,
        optimize_for_performance: bool = False,
    ) -> List[CipherSuiteInfo]:
        """Get recommended cipher suites based on criteria."""
        # Default to HIGH security level
        if security_level is None:
            security_level = SecurityLevel.HIGH

        # Get base set from security level
        base_suites = self.get_cipher_suites_for_security_level(
            security_level, optimize_for_performance
        )

        # Filter by compliance if specified
        if compliance_standards:
            compliant_suites = self.get_cipher_suites_for_compliance(compliance_standards)
            # Intersection of both sets
            suite_names = {s.name for s in compliant_suites}
            base_suites = [s for s in base_suites if s.name in suite_names]

        # Filter to only recommended suites for production
        recommended_suites = [s for s in base_suites if s.recommended]

        return recommended_suites

    def create_ssl_context(
        self,
        security_level: Optional[SecurityLevel] = None,
        compliance_standards: Optional[List[ComplianceStandard]] = None,
        server_side: bool = True,
    ) -> ssl.SSLContext:
        """Create SSL context with configured cipher suites."""
        # Determine security level from settings
        if security_level is None:
            security_level_str = getattr(settings, "TLS_SECURITY_LEVEL", "high").lower()
            security_level = SecurityLevel(security_level_str)

        # Get recommended cipher suites
        cipher_suites = self.get_recommended_cipher_suites(
            security_level=security_level,
            compliance_standards=compliance_standards,
            optimize_for_performance=getattr(settings, "TLS_OPTIMIZE_PERFORMANCE", False),
        )

        # Create SSL context
        if server_side:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        else:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

        # Configure TLS versions
        context.minimum_version = ssl.TLSVersion.TLSv1_3
        if security_level in [SecurityLevel.MEDIUM, SecurityLevel.COMPATIBILITY]:
            context.minimum_version = ssl.TLSVersion.TLSv1_2

        context.maximum_version = ssl.TLSVersion.TLSv1_3

        # Configure cipher suites
        if cipher_suites:
            # Convert to OpenSSL format
            openssl_ciphers = [suite.openssl_name for suite in cipher_suites]
            cipher_string = ":".join(openssl_ciphers)

            try:
                context.set_ciphers(cipher_string)
                logger.info(
                    f"Configured {len(cipher_suites)} cipher suites for {security_level.value} security"
                )
            except ssl.SSLError as e:
                logger.warning(f"Failed to set cipher suites: {e}")
                # Fallback to secure defaults
                context.set_ciphers(
                    "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS"
                )

        # Additional security options
        context.options |= ssl.OP_NO_SSLv2
        context.options |= ssl.OP_NO_SSLv3
        context.options |= ssl.OP_NO_TLSv1
        context.options |= ssl.OP_NO_TLSv1_1
        context.options |= ssl.OP_CIPHER_SERVER_PREFERENCE
        context.options |= ssl.OP_SINGLE_DH_USE
        context.options |= ssl.OP_SINGLE_ECDH_USE

        # Disable compression (CRIME attack mitigation)
        context.options |= ssl.OP_NO_COMPRESSION

        # Set security level (OpenSSL security levels)
        security_level_map = {
            SecurityLevel.MAXIMUM: 4,  # 256-bit minimum
            SecurityLevel.HIGH: 3,  # 192-bit minimum
            SecurityLevel.MEDIUM: 2,  # 128-bit minimum
            SecurityLevel.COMPATIBILITY: 1,  # 80-bit minimum
        }

        try:
            context.set_security_level(security_level_map[security_level])
        except AttributeError:
            # set_security_level not available in all Python versions
            pass

        return context

    def _compare_tls_versions(self, version1: str, version2: str) -> int:
        """Compare TLS versions. Returns -1, 0, or 1."""

        def version_to_tuple(version):
            parts = version.replace("TLS", "").replace("v", "").split(".")
            return tuple(int(p) for p in parts)

        v1_tuple = version_to_tuple(version1)
        v2_tuple = version_to_tuple(version2)

        if v1_tuple < v2_tuple:
            return -1
        elif v1_tuple > v2_tuple:
            return 1
        else:
            return 0

    def validate_cipher_suite_configuration(
        self, cipher_suites: List[str], security_level: SecurityLevel
    ) -> Tuple[bool, List[str]]:
        """Validate cipher suite configuration."""
        errors = []
        policy = self._security_policies[security_level]

        # Check if any cipher suites are provided
        if not cipher_suites:
            errors.append("No cipher suites specified")
            return False, errors

        # Validate each cipher suite
        valid_suites = []
        for cipher_name in cipher_suites:
            if cipher_name not in self._cipher_suites:
                errors.append(f"Unknown cipher suite: {cipher_name}")
                continue

            suite = self._cipher_suites[cipher_name]

            # Check against policy
            if suite.key_size < policy["min_key_size"]:
                errors.append(f"Cipher suite {cipher_name} key size too small")
                continue

            if policy["require_pfs"] and not suite.perfect_forward_secrecy:
                errors.append(f"Cipher suite {cipher_name} lacks perfect forward secrecy")
                continue

            if suite.security_score < policy["min_security_score"]:
                errors.append(f"Cipher suite {cipher_name} security score too low")
                continue

            valid_suites.append(suite)

        # Check minimum number of suites
        if len(valid_suites) == 0:
            errors.append("No valid cipher suites found")

        return len(errors) == 0, errors

    def get_security_grade(self, cipher_suites: List[str]) -> Tuple[str, int]:
        """Calculate security grade for cipher suite configuration."""
        if not cipher_suites:
            return "F", 0

        total_score = 0
        max_score = 0
        valid_count = 0

        for cipher_name in cipher_suites:
            if cipher_name in self._cipher_suites:
                suite = self._cipher_suites[cipher_name]
                total_score += suite.security_score
                max_score += 100
                valid_count += 1

        if valid_count == 0:
            return "F", 0

        average_score = total_score / valid_count

        # Grade assignment
        if average_score >= 95:
            grade = "A+"
        elif average_score >= 90:
            grade = "A"
        elif average_score >= 85:
            grade = "A-"
        elif average_score >= 80:
            grade = "B+"
        elif average_score >= 75:
            grade = "B"
        elif average_score >= 70:
            grade = "B-"
        elif average_score >= 65:
            grade = "C+"
        elif average_score >= 60:
            grade = "C"
        elif average_score >= 55:
            grade = "C-"
        elif average_score >= 50:
            grade = "D"
        else:
            grade = "F"

        return grade, int(average_score)

    def get_cipher_suite_info(self, cipher_name: str) -> Optional[CipherSuiteInfo]:
        """Get information about a specific cipher suite."""
        return self._cipher_suites.get(cipher_name)

    def list_all_cipher_suites(self) -> List[CipherSuiteInfo]:
        """List all available cipher suites."""
        return list(self._cipher_suites.values())


# Global cipher suite manager instance
cipher_manager = CipherSuiteManager()
