# User-Facing Application README Template

## Template Overview

**Category**: A. User-Facing Application Template
**Purpose**: Main project README for end-user applications with bilingual content and comprehensive navigation
**Target Audience**: End users, contributors, and stakeholders
**Examples**: Root project README.md, application entry points

---

## Template Structure

```markdown
# <p align="center">[PROJECT NAME]</p>

## ⚠️ Status Notice

**Current Status**: [Production-ready/Development/Beta] - [Brief status description]
**Architecture**: [Brief tech stack summary]
**Role**: [Primary purpose and position in ecosystem]

<p align="center">
  <img src="[LOGO_PATH]" width="100" alt="[PROJECT] Logo">
</p>

<p align="center">[Spanish description of the project - user-facing summary]</p>

<p align="center">
  <a href="#características-principales">Características</a> •
  <a href="#requisitos">Requisitos</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#uso">Uso</a> •
  <a href="#contribuir">Contribuir</a> •
  <a href="#licencia">Licencia</a>
</p>

## 🔍 Visión General

[Spanish project overview, including fork information if applicable]

### 📚 Documentation Navigation (4-Tier Architecture)

| Tier | Location | Purpose | Target Audience |
|------|----------|---------|----------------|
| **Tier 1** | [Root README](README.md) | **User-facing guide and installation** | **End users and contributors** |
| **Tier 2** | [Frontend Docs](src/docs/) | Implementation details | Frontend developers |
| **Tier 3** | [Backend Docs](backend/docs/) | API and database architecture | Backend developers |
| **Tier 4** | [Infrastructure](scripts/README.md) | Cross-platform utilities | DevOps and infrastructure |

**Cross-References:**
- **[Development Guide](CLAUDE.md)** - Comprehensive developer setup and workflow
- **[Architecture Documentation](docs/architecture/)** - Technical design and ADRs
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Contribution guidelines and standards

## 🚀 Características Principales

- **[Feature 1]**: [Spanish description with technical keywords]
- **[Feature 2]**: [Spanish description focusing on user benefits]
- **[Feature 3]**: [Spanish description with security/compliance highlights]
- **[Feature 4]**: [Spanish description with integration capabilities]
- **[Feature 5]**: [Spanish description with workflow features]

## 📋 Requisitos

- [Technology] [Version]+
- [Technology] [Version]+
- [Optional Tool] (opcional, para [purpose])
- [External Service] con [requirement]

## 🛠️ Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/[USER]/[REPO].git
   cd [REPO]
   ```

2. [Installation step with explanation in Spanish]:

   ```bash
   [command]
   ```

3. [Configuration step]:

   ```bash
   [command with example]
   ```

4. [Start development server]:
   ```bash
   [command]
   ```

## 🚀 Uso

1. [Step 1 in Spanish]
2. [Step 2 in Spanish]
3. [Step 3 in Spanish]
4. [Step 4 in Spanish]

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [guía de contribución](docs/CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

## 🙏 Créditos

- [Credit information in Spanish]
- [Attribution with links]

## 📊 Características Técnicas

### Arquitectura

- **Frontend**: [Tech stack with versions]
- **Backend**: [Tech stack with versions]
- **[Integration]**: [Services and tools]
- **[Feature]**: [Technology description]
- **[Storage]**: [Database and storage solutions]
- **[Auth]**: [Authentication system]
- **[Testing]**: [Testing frameworks]
- **[Quality Tools]**: [Number]+ integrated tools ([list key tools])
- **[Infrastructure]**: [Platform support and automation]

### Seguridad

- [Security feature 1]
- [Security feature 2]
- [Security feature 3]
- [Security feature 4]

## 🌐 Despliegue

### Requisitos del Sistema

- **CPU**: [Requirements]
- **RAM**: [Requirements]
- **Almacenamiento**: [Requirements]
- **Sistema Operativo**: [Supported platforms]

### Despliegue con Docker (Recomendado)

```bash
# [Step description in Spanish]
git clone https://github.com/[USER]/[REPO].git
cd [REPO]

# [Configuration step]
cp .env.example .env
# [Edit instruction in Spanish]

# [Start instruction]
[deployment command]
```

## 📈 Métricas y Monitoreo

[Description of monitoring capabilities in Spanish]:

- [Metric 1]
- [Metric 2]
- [Metric 3]
- [Metric 4]

## ❓ Preguntas Frecuentes

### [Common Question 1]?

[Answer in Spanish with technical details]

### [Common Question 2]?

[Answer in Spanish with compliance information]:

- [Compliance point 1]
- [Compliance point 2]
- [Compliance point 3]

### [Common Question 3]?

[Answer referring to contribution guide]

### [Common Question 4]?

[Answer about development commands and tools]

**Comandos Esenciales:**

```bash
# Desarrollo
[dev-command]                         # [Description in Spanish]
[build-command]                       # [Description in Spanish]
[test-command]                        # [Description in Spanish]
[e2e-command]                         # [Description in Spanish]

# Calidad de Código
[lint-command]                        # [Description in Spanish]
[type-check-command]                  # [Description in Spanish]
[backend-quality-command]             # [Description in Spanish]
[quality-gate-command]                # [Description in Spanish]
[security-command]                    # [Description in Spanish]

# Protección de Fusiones (OBLIGATORIO antes de merge)
[merge-safety-command]                # [Description in Spanish]
[install-hooks-command]               # [Description in Spanish]

# Documentación y Trazabilidad
# Usar comandos slash en lugar de scripts:
[docs-command]                        # [Description in Spanish]
[health-command]                      # [Description in Spanish]
[context-command]                     # [Description in Spanish]
```

**Comandos Slash Avanzados:**
```bash
[slash-command-1]                     # [Description in Spanish]
[slash-command-2]                     # [Description in Spanish]
[slash-command-3]                     # [Description in Spanish]
[slash-command-4]                     # [Description in Spanish]
```

## 🤝 Agradecimientos

[Acknowledgments in Spanish with proper attribution]

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).
```

---

## Template Guidelines

### **Status Notice Requirements**
- **MANDATORY**: Always include current status (Production-ready/Development/Beta)
- **Architecture**: Brief tech stack summary (1 line)
- **Role**: Clear positioning within project ecosystem

### **Bilingual Content Standards**
- **Spanish Content**: User-facing descriptions, features, installation steps, FAQ
- **English Content**: Technical commands, code blocks, cross-references
- **Mixed**: Navigation tables and technical specifications may combine both

### **4-Tier Navigation Integration**
- **MANDATORY**: Include documentation navigation table
- **Cross-References**: Always link to CLAUDE.md, architecture docs, and contributing guide
- **Consistency**: Use standard tier naming and purposes

### **Command Reference Standards**
- **Essential Commands**: Group by purpose (Development, Quality, Protection, Documentation)
- **Slash Commands**: Separate advanced workflow commands
- **Language**: Commands in English, descriptions in Spanish
- **Mandatory Merge Protection**: Always highlight merge safety requirements

### **Required Sections**
1. Status notice with visual hierarchy
2. Logo and bilingual description
3. Quick navigation links
4. 4-tier documentation table
5. Spanish feature descriptions
6. Technical architecture section
7. Deployment information
8. FAQ with compliance information
9. Essential command reference
10. License and credits

### **Visual Formatting**
- **Icons**: Use emoji for section headers (🚀, 📋, 🛠️, etc.)
- **Code Blocks**: Properly formatted with language specification
- **Tables**: Consistent formatting for navigation and requirements
- **Emphasis**: Bold for important commands and warnings

### **Cross-Reference Requirements**
- Link to development guide (CLAUDE.md)
- Reference architecture documentation
- Include contributing guidelines
- Connect to tier-specific documentation

### **Content Localization**
- **User-facing content**: Spanish primary
- **Technical content**: English for international standards
- **Commands**: English with Spanish descriptions
- **Compliance**: Include regional standards (GDPR, etc.)

---

## Usage Instructions

1. **Copy this template** for new user-facing application READMEs
2. **Replace bracketed placeholders** with project-specific information
3. **Maintain bilingual standards** as specified above
4. **Include mandatory sections** and cross-references
5. **Validate compliance** using the README validation checklist
6. **Update 4-tier navigation** to match project structure

This template ensures consistency across user-facing documentation while maintaining the project's bilingual approach and comprehensive navigation structure.