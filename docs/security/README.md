# Security Documentation

Comprehensive security documentation for the AI-Doc-Editor project.

## Directory Structure

### 📐 Architecture (`architecture/`)
Core security architecture and design documentation:
- [Backend Security Overview](architecture/backend-security-overview.md) - Main security framework and components
- Security design patterns and principles
- System security architecture diagrams

### ⚙️ Implementation (`implementation/`)
Detailed implementation guides and specifications:
- [T12 Implementation Specification](implementation/T12-implementation-spec.md) - Security feature T-12 implementation details
- [T12 Roadmap](implementation/T12-roadmap.md) - T-12 development roadmap and milestones
- [Encryption Module](implementation/encryption-module.md) - Encryption implementation details
- [Key Management Integration Fixes](implementation/key-management-integration-fixes.md) - Key management system fixes and updates

### 🔍 Audits (`audits/`)
Security audit reports and assessments:
- [HSM Security Audit - Week 3](audits/HSM-security-audit-week3.md) - Hardware Security Module audit findings
- [General Security Audit Report](audits/general-security-audit-report.md) - Comprehensive security assessment

### 📋 Compliance (`compliance/`)
Compliance documentation and regulatory requirements:
- [OAuth Production Deployment](compliance/oauth-production-deployment.md) - OAuth production deployment guidelines
- [OAuth Security Implementation Report](compliance/oauth-security-implementation-report.md) - OAuth security compliance report

## Related Documentation

- [ADR-006: Security](../architecture/adr/ADR-006-dependency-security-scanning.md) - Dependency security scanning architecture decision
- [Development Security Guidelines](../development/guides/) - Security-focused development practices
- [Security Certifications](../certifications/) - Security compliance certifications

## Quick Navigation

### Current Security Status
- Latest audit findings: `audits/`
- Active implementations: `implementation/T12-*`
- Compliance status: `compliance/oauth-*`

### For Developers
- Security implementation guides: `implementation/`
- Architecture decisions: `architecture/` + `../architecture/adr/`
- Development security practices: `../development/guides/`

### For Auditors
- Current audit reports: `audits/`
- Compliance documentation: `compliance/`
- Architecture documentation: `architecture/`

---

**Note**: This documentation has been consolidated from scattered locations throughout the repository for better organization and accessibility. Original locations are preserved in the backend/ directory for implementation reference.