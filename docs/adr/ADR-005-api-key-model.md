# ADR-005: API Key Model Architecture

## Status
Proposed

## Context
As part of T-17 API-SPEC & ADR Governance, we need to define the API key management model for the AI-Doc-Editor system. The system will need to handle:

1. **OpenAI API Keys**: For AI document generation and processing
2. **User Authentication**: OAuth tokens for Google/Microsoft
3. **System API Keys**: For internal service communication
4. **Rotation and Security**: Key rotation and secure storage

Current state analysis shows the frontend-only application stores API keys in IndexedDB without encryption, which needs evolution for the backend architecture.

## Decision

### API Key Architecture Model

**Three-Tier Key Management**:

1. **User-Level API Keys** (T-41):
   - OpenAI keys owned by individual users
   - Encrypted storage in backend database
   - Per-user quota and rate limiting
   - Self-service management UI

2. **System-Level API Keys** (T-12):
   - Service-to-service authentication
   - Centralized management by admin
   - Automatic rotation capabilities
   - Hardware security module (HSM) consideration

3. **OAuth Tokens** (T-02):
   - Google/Microsoft OAuth 2.0 tokens
   - Refresh token flow implementation
   - Encrypted session storage
   - Standard JWT implementation

### Security Model

**Encryption at Rest**:
- AES-256-GCM for API key storage
- Separate encryption keys per user/service
- Key derivation using PBKDF2 or Argon2

**Encryption in Transit**:
- TLS 1.3 for all API communications
- Certificate pinning for external services
- End-to-end encryption for sensitive operations

**Access Control**:
- Role-based access control (RBAC)
- Principle of least privilege
- Audit logging for all key operations

### Implementation Strategy

**Phase 1 (R1)**: User API Key Management
- Basic encrypted storage
- User self-service UI
- Integration with OpenAI API

**Phase 2 (R2)**: System Key Management  
- Admin key management interface
- Automatic rotation capabilities
- Enhanced monitoring and alerting

**Phase 3 (R3)**: Advanced Security
- HSM integration evaluation
- Advanced threat detection
- Compliance certification

## Consequences

### Positive:
- Clear separation of concerns for different key types
- Scalable architecture supporting enterprise requirements
- Security-first design meeting GDPR/HIPAA requirements
- User empowerment through self-service key management

### Challenges:
- Complex implementation requiring careful security design
- Key rotation complexity for system-level keys
- Backup and recovery procedures for encrypted keys
- Performance impact of encryption/decryption operations

### Dependencies:
- **T-02**: OAuth implementation provides foundation
- **T-12**: Credential store provides encryption infrastructure
- **T-41**: User API key management implements user tier
- **T-37**: Admin panel provides management interface

## Alternatives Considered

1. **Single Shared API Key**: Simple but not scalable or secure
2. **External Key Management Service**: Complex integration, vendor lock-in
3. **Client-Side Only**: Current approach, insufficient for backend requirements

## Related Decisions
- **ADR-005**: Pydantic v2 (validation for API key models)
- **ADR-008**: Pydantic v2 deferral (affects implementation timeline)
- **T-02, T-12, T-37, T-41**: Implementation tasks

## Implementation Notes
- API key models will use Pydantic v2 for validation
- Integration with FastAPI dependency injection
- OpenAPI 3.1 specification will define key management endpoints
- Audit trail required for all key operations

---
**Approved by**: Pending Tech Lead Review  
**Date**: 2025-06-25  
**Related Tasks**: T-02, T-12, T-37, T-41