# Architecture Documentation

Esta carpeta contiene toda la documentación arquitectónica del proyecto, incluyendo decisiones técnicas, análisis de diseño y flujos del sistema.

## 🏗️ Contenido

### 📖 [Architecture Decision Records (ADRs)](./adr/)
Registro formal de decisiones arquitectónicas importantes:
- **ADR-001** - Pydantic v2 Validation
- **ADR-002** - Defer Orchestrators
- **ADR-003** - Baseline CI/CD
- **ADR-004** - Pydantic v2 Deferral
- **ADR-005** - API Key Model
- **ADR-006** - Dependency Security Scanning
- **ADR-007** - Migración Makefile a Node.js
- **ADR-008** - QA Workflow Enhancement
- **ADR-009** - QA CLI to Hooks Migration
- **ADR-010** - E2E Testing Playwright Migration

### 🎨 Diseño del Sistema
- **[DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)** - Guías de diseño arquitectónico
  - Patrones de diseño adoptados
  - Convenciones de código y estructura
  - Principios arquitectónicos

- **[UX-FLOW.md](./UX-FLOW.md)** - Flujos de experiencia de usuario
  - Diagramas de flujo de usuario
  - Interacciones del sistema
  - Navegación y UX patterns

### 📊 Análisis Arquitectónico
- **[ARCH-GAP-ANALYSIS.md](./ARCH-GAP-ANALYSIS.md)** - Análisis de brechas arquitectónicas
  - Identificación de gaps en la arquitectura
  - Recomendaciones de mejora
  - Roadmap de evolución arquitectónica

### 🔌 [API Documentation](./api/)
Documentación completa de APIs y contratos del sistema:
- **[OpenAPI Specification](./api/openapi-specification.yaml)** - Especificación completa de la API FastAPI
- **[TypeScript Client Documentation](./api/typescript-client-documentation.md)** - Integración y patrones del cliente frontend
- **[Cross-System Contracts](./api/cross-system-contracts.md)** - Contratos formales entre sistemas
- **[Versioning Strategy](./api/versioning-strategy.md)** - Estrategia de versionado y evolución de APIs

### 🤖 [AI Architecture](./ai/)
Arquitectura de inteligencia artificial y documentación estratégica:
- **[README.md](./ai/README.md)** - Visión general de la arquitectura de IA
- **[Current Implementation](./ai/current-implementation.md)** - Estado actual de la implementación de IA
- **[Documentation Strategy](./ai/documentation-strategy.md)** - Estrategia de documentación para componentes de IA
- **[Implementation Audit](./ai/implementation-audit.md)** - Auditoría y análisis de la implementación actual

## 🧭 Navegación por Tema

### Por Stack Tecnológico
- **Frontend**: ADR-007 (Node.js), UX-FLOW.md, [API Client Documentation](./api/typescript-client-documentation.md)
- **Backend**: ADR-001/004 (Pydantic), ADR-005 (API Keys), [OpenAPI Specification](./api/openapi-specification.yaml)
- **AI**: [AI Architecture](./ai/) - Arquitectura GPT-4o, LangChain, estrategia de IA
- **DevOps**: ADR-003 (CI/CD), ADR-006 (Security), ADR-008/009 (QA)
- **Testing**: ADR-010 (Playwright E2E)
- **APIs**: [API Documentation](./api/) - Contratos, versionado y integración

### Por Tipo de Decisión
- **Tecnológicas**: ADR-001, ADR-004, ADR-007, ADR-010
- **Proceso**: ADR-002, ADR-008, ADR-009
- **Seguridad**: ADR-006
- **Infraestructura**: ADR-003

### Por Fase del Proyecto
- **Setup Inicial**: ADR-001, ADR-003, ADR-005
- **Desarrollo**: ADR-002, ADR-007, DESIGN_GUIDELINES.md
- **QA y Testing**: ADR-008, ADR-009, ADR-010
- **Seguridad**: ADR-006

## 📋 Para Desarrolladores

### Nuevos en el Proyecto
1. Lea [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) para entender principios
2. Revise [adr/README.md](./adr/README.md) para contexto de decisiones
3. Consulte [UX-FLOW.md](./UX-FLOW.md) para entender flujos

### Arquitectos
1. [ARCH-GAP-ANALYSIS.md](./ARCH-GAP-ANALYSIS.md) para estado actual
2. ADRs relevantes para decisiones pasadas
3. Plantilla ADR-000 para nuevas decisiones

### Tech Leads
1. ADRs de stack tecnológico (001, 004, 007, 010)
2. ADRs de proceso (008, 009) para QA workflow
3. [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) para estándares

## 🔗 Referencias Cruzadas
- [Development](../development/) - Implementación de estas decisiones
- [Security](../security/) - Documentación de seguridad específica
- [Project Management](../project-management/) - Contexto de negocio
- [Integration](../integration/) - Contratos de integración entre sistemas
- [API Documentation](./api/) - Especificaciones completas de APIs
- [AI Implementation](../../src/docs/ai/) - Implementación frontend de IA

---
*Documentación técnica actualizada y organizada*
*Consulte ADRs para contexto de decisiones arquitectónicas*