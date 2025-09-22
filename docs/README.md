# AI Document Editor - Documentation

Este directorio contiene toda la documentación del proyecto AI Document Editor, organizada por categorías para facilitar la navegación y el mantenimiento.

## 📁 Estructura de Documentación

### 📋 [Project Management](./project-management/)
Documentos de gestión de proyecto, planificación y seguimiento:
- **Sub Tareas v2.md** - Detalle completo de tareas y subtareas (161KB)
- **WORK-PLAN v5.md** - Plan de trabajo actualizado (85KB)
- **PRD v2.md** - Product Requirements Document (41KB)
- **DEVELOPMENT-STATUS.md** - Estado actual del desarrollo
- **T-13** - Documentación técnica y resúmenes de implementación

### 🏗️ [Architecture](./architecture/)
Decisiones arquitectónicas, diseño del sistema y análisis técnico:
- **[ADRs](./architecture/adr/)** - Architecture Decision Records
- **[API Documentation](./architecture/api/)** - Especificaciones completas de APIs y contratos
- **DESIGN_GUIDELINES.md** - Guías de diseño del sistema
- **ARCH-GAP-ANALYSIS.md** - Análisis de brechas arquitectónicas
- **UX-FLOW.md** - Flujos de experiencia de usuario

### 👩‍💻 [Development](./development/)
Guías de desarrollo, configuración y procesos:
- **CONTRIBUTING.md** - Guía para contribuidores
- **DEVELOPMENT-SETUP.md** - Configuración del entorno de desarrollo
- **DOCKER-SETUP.md** - Configuración con Docker
- **[guides/](./development/guides/)** - Guías técnicas específicas
- **MERGE-PROTECTION-SYSTEM.md** - Sistema de protección de merges
- **SECURITY-SCAN-GUIDE.md** - Guía de escaneo de seguridad
- **AUDIT-TESTING-GUIDE.md** - Guía de testing y auditoría

### 🗄️ [Archive](./archive/)
Documentos históricos y análisis previos:
- **refactors/** - Documentación de refactorizaciones pasadas
- **DEVELOPMENT-IMPACT-ANALYSIS.md** - Análisis de impacto previos
- **REFACTORING-SUMMARY.md** - Resúmenes de refactorizaciones
- **CI-FIXES.md** y **CI-SSH-ISSUES.md** - Soluciones históricas de CI/CD

### 🔒 [Security](./security/)
Documentación de seguridad centralizada:
- **[Architecture](./security/architecture/)** - Diseño y componentes de seguridad
- **[Implementation](./security/implementation/)** - Guías de implementación (T-12, encriptación, gestión de claves)
- **[Audits](./security/audits/)** - Reportes de auditoría de seguridad
- **[Compliance](./security/compliance/)** - Documentación de cumplimiento OAuth

### 🛠️ [Setup](./setup/)
Configuración y guías de instalación:
- **[Development](./setup/development/)** - Entorno de desarrollo y estándares de complejidad
- **[Testing](./setup/testing/)** - Configuración de testing y frameworks
- **[Tools](./setup/tools/)** - Herramientas de desarrollo y scripts

### 📊 [Reports](./reports/)
Reportes de proyecto y análisis:
- **[Current](./reports/current/)** - Reportes activos y análisis recientes
- **[Archive](./reports/archive/)** - Reportes históricos y completados

### 📄 [Templates](./templates/)
Plantillas para documentación:
- **ACTA-CERTIFICACION.md** - Plantilla para actas de certificación

### 🏆 [Certifications](./certifications/)
Certificaciones y actas de tareas completadas

### 📊 [Traceability](./traceability/)
Matrices de trazabilidad y seguimiento de requisitos

### 🔌 [API Spec](./api-spec/)
Especificaciones de API (Legacy - Ver [Architecture/API](./architecture/api/) para documentación actualizada)

## 💻 Documentación de Implementación

### 🖥️ [Frontend Implementation](../src/docs/)
Documentación específica de implementación frontend:
- **[Components](../src/docs/components/)** - Arquitectura y patrones de componentes React
- **[State Management](../src/docs/state/)** - Zustand stores y gestión de estado
- **[API Integration](../src/docs/api/)** - Integración con backend y servicios externos
- **[Custom Hooks](../src/docs/hooks/)** - 18 hooks personalizados y lógica reutilizable
- **[Architecture](../src/docs/architecture/)** - Decisiones arquitectónicas frontend
- **[Testing](../src/docs/testing/)** - Estrategias de testing (Jest, RTL, Playwright)

### ⚙️ [Backend Implementation](../backend/docs/)
Documentación específica de implementación backend:
- **[API](../backend/docs/api/)** - Endpoints y esquemas de API
- **[Database](../backend/docs/database/)** - Esquemas y migraciones de base de datos
- **[Security](../backend/docs/security/)** - Implementación de seguridad backend
- **[Testing](../backend/docs/testing/)** - Procedimientos de testing backend
- **[Complexity](../backend/docs/complexity/)** - Análisis de complejidad de código

### 🔧 [Claude Code Integration](../.claude/docs/)
Documentación de herramientas de desarrollo:
- **Hooks Configuration** - Sistema de hooks de calidad
- **Commands** - Comandos personalizados de Claude Code
- **Automation** - Workflows automatizados y validaciones

## 🧭 Navegación Rápida

### Por Fase de Desarrollo
- **Planificación**: [Project Management](./project-management/)
- **Arquitectura**: [Architecture](./architecture/) → [ADRs](./architecture/adr/)
- **Desarrollo**: [Development](./development/) → [Guides](./development/guides/)
- **Implementación**: [Frontend](../src/docs/) + [Backend](../backend/docs/)
- **Histórico**: [Archive](./archive/)

### Por Tipo de Documento
- **Guías Estratégicas**: [Development](./development/) + [Setup](./setup/)
- **Implementación**: [Frontend Docs](../src/docs/) + [Backend Docs](../backend/docs/)
- **Decisiones**: [Architecture ADRs](./architecture/adr/)
- **Planes**: [Project Management](./project-management/)
- **Seguridad**: [Security](./security/)
- **Reportes**: [Reports](./reports/)
- **Configuración**: [Setup](./setup/)

### Por Stack Tecnológico
- **Frontend (React)**: [Frontend Implementation](../src/docs/)
- **Backend (Python)**: [Backend Implementation](../backend/docs/)
- **APIs**: [API Documentation](./architecture/api/) - Especificaciones y contratos completos
- **Desarrollo**: [Development Tools](../.claude/docs/)
- **Arquitectura**: [System Architecture](./architecture/)

## 📈 Estado del Proyecto
- **Rama Actual**: develop
- **Fase**: R0.WP3 (Seguridad y Auditoría)
- **Estado**: Ver [DEVELOPMENT-STATUS.md](./project-management/DEVELOPMENT-STATUS.md)

## 🔍 Buscar Documentación
- Use la estructura de carpetas para encontrar documentos por categoría
- Consulte los archivos README.md específicos de cada categoría
- Para detalles de tareas específicas, vea [Project Management](./project-management/)

---
*Última actualización: 2025-09-21*
*Estructura reorganizada para mejorar navegación y mantenimiento*