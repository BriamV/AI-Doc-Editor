# Documentation Placement Guidelines

## Overview

This document provides comprehensive guidelines for determining where to place documentation within the AI-Doc-Editor project, ensuring consistency with Conway's Law principles and the 4-tier architecture while maintaining clear boundaries between strategic and implementation documentation.

## 🏗️ Conway's Law Application

### **Code Proximity Principle**
Documentation should be placed as close as possible to the code it describes, following Conway's Law that organizations design systems that mirror their communication structure.

### **When to Place Documentation Near Code**
✅ **Place Near Code When:**
- Documenting specific implementation details
- Describing component-specific architecture
- Providing development guidance for a particular technology stack
- Documenting API endpoints or data models
- Explaining testing strategies for specific components
- Describing deployment configurations for specific services

❌ **Do NOT Place Near Code When:**
- Creating strategic architectural decisions (ADRs)
- Documenting cross-cutting concerns
- Providing project-wide guidelines
- Creating user-facing documentation
- Documenting business requirements
- Establishing organization-wide standards

### **Implementation vs Strategic Documentation**

| Type | Location Strategy | Examples | Rationale |
|------|------------------|----------|-----------|
| **Implementation** | Near Code | Component docs, API specs, testing guides | Developers need quick access while coding |
| **Strategic** | Centralized | ADRs, business requirements, project plans | Cross-team decisions need central visibility |
| **Mixed** | Both with Cross-References | Architecture that spans multiple components | Both strategic decisions and implementation details |

## 📊 4-Tier Architecture Positioning

### **Tier 1: User-Facing Documentation**
**Location**: `README.md` (root), `docs/README.md`
**Purpose**: End-user guidance and project overview
**Target Audience**: End users, contributors, stakeholders

**Content Guidelines:**
- User installation and setup instructions
- Feature descriptions in user language (Spanish for this project)
- Contribution guidelines and community information
- High-level technical architecture overview
- Cross-references to all other tiers

**Placement Rules:**
- Main README.md at project root for primary user entry point
- docs/README.md for comprehensive documentation navigation
- Always include 4-tier navigation table
- Maintain bilingual content standards (Spanish user-facing, English technical)

### **Tier 2: Frontend Implementation Documentation**
**Location**: `src/docs/`
**Purpose**: Frontend-specific implementation guidance
**Target Audience**: Frontend developers

**Content Guidelines:**
- React component architecture and patterns
- State management implementation (Zustand)
- Custom hooks documentation and usage
- Frontend testing strategies and frameworks
- API integration patterns and client-side concerns

**Placement Rules:**
- Place documentation in same directory structure as code when possible
- Use `src/docs/` for cross-cutting frontend concerns
- Link to strategic documentation in `docs/architecture/`
- Include specific code examples and implementation patterns

### **Tier 3: Backend Implementation Documentation**
**Location**: `backend/docs/`
**Purpose**: Backend-specific implementation guidance
**Target Audience**: Backend developers

**Content Guidelines:**
- FastAPI endpoint documentation and schemas
- Database models and migration strategies
- Authentication and authorization implementation
- Backend testing procedures and quality gates
- Performance optimization and monitoring

**Placement Rules:**
- Mirror backend code structure in documentation organization
- Keep API documentation close to endpoint definitions
- Reference strategic security decisions from `docs/security/`
- Include database schema and migration documentation

### **Tier 4: Infrastructure and Tools**
**Location**: `scripts/README.md`, `tools/README.md`, `.claude/`
**Purpose**: Development infrastructure and automation
**Target Audience**: DevOps engineers, tool maintainers

**Content Guidelines:**
- Cross-platform utility documentation
- Merge protection system documentation
- Quality gate and automation tool documentation
- Claude Code integration and command documentation

**Placement Rules:**
- Document tools in the same directory as the tool files
- Focus on problem-solution mapping
- Include integration patterns with development workflow
- Provide troubleshooting and maintenance guidance

## 🎯 Creation vs Reference Decision Matrix

### **When to Create New README**

✅ **Create New README When:**
- Directory contains 3+ distinct components or concepts
- Directory serves a specific audience with unique needs
- Directory represents a significant architectural boundary
- Users would benefit from directory-specific navigation
- Directory contains complex interdependencies requiring explanation

### **When to Reference Existing Documentation**

✅ **Reference Existing When:**
- Content would duplicate existing strategic documentation
- Information is already comprehensively covered elsewhere
- Directory contains only 1-2 simple utilities
- Documentation would be mainly links to other sources
- Maintenance burden would exceed user benefit

### **Minimum Complexity Thresholds**

| Directory Type | README Required If | README Optional If |
|---------------|-------------------|-------------------|
| **Implementation** | 3+ components OR complex architecture | 1-2 simple files |
| **Strategic** | 2+ related documents OR decision authority | Single document directories |
| **Tools/Scripts** | 3+ tools OR complex workflows | Simple single-purpose utilities |
| **Archive** | Historical significance OR navigation needed | Simple historical storage |

### **User Audience Considerations**

| Audience | Documentation Preference | Placement Strategy |
|----------|-------------------------|-------------------|
| **End Users** | Single entry point with clear navigation | Root README with tier navigation |
| **Frontend Developers** | Code-proximate with examples | `src/docs/` with component references |
| **Backend Developers** | API-focused with technical details | `backend/docs/` with implementation focus |
| **DevOps/Infrastructure** | Problem-solution oriented | Tool directories with workflow integration |
| **Architects** | Decision-focused with rationale | `docs/architecture/` with formal structure |

## 🌍 Bilingual Content Standards

### **Spanish vs English Content Guidelines**

| Content Type | Primary Language | Secondary Language | Examples |
|--------------|-----------------|-------------------|----------|
| **User-Facing Features** | Spanish | English (technical terms) | Feature descriptions, installation steps |
| **Technical Commands** | English | Spanish (descriptions) | Command documentation, API references |
| **Strategic Decisions** | Spanish | English (when referencing standards) | ADRs, business requirements |
| **Implementation Details** | English | Spanish (user impact) | Code documentation, technical guides |

### **Consistency Requirements**

✅ **Required Consistency:**
- Navigation elements must be bilingual (e.g., "Navegación Rápida / Quick Navigation")
- Technical terms use English with Spanish explanations
- Command examples always in English with Spanish descriptions
- Cross-references maintain language context

❌ **Avoid Inconsistency:**
- Mixing languages within single sentences without clear delineation
- Using English for user-facing content without Spanish equivalent
- Technical documentation only in Spanish
- Inconsistent terminology across documents

## 🔗 Cross-Reference Standards

### **Required Cross-Reference Patterns**

| Document Type | Must Reference | May Reference | Never Reference |
|---------------|----------------|---------------|----------------|
| **Root README** | CLAUDE.md, docs/architecture/, CONTRIBUTING.md | All tier documentation | Internal implementation details |
| **Implementation Docs** | Strategic architecture, related components | Other implementation areas | Unrelated strategic decisions |
| **Strategic Docs** | Related strategic documents, compliance standards | Implementation examples | Specific implementation details |
| **Tool Documentation** | Development workflow, integration points | Related tools and scripts | Business requirements |

### **Link Formatting Consistency**

✅ **Required Format:**
```markdown
- **[Link Description](relative/path/to/document.md)** - Purpose and relationship explanation
```

✅ **Navigation Tables:**
```markdown
| Tier | Location | Purpose | Target Audience |
|------|----------|---------|----------------|
| **Tier N** | [Document Name](path) | **Purpose description** | **Target audience** |
```

### **Maintenance Responsibility**

| Reference Type | Update Trigger | Responsible Party | Validation Method |
|---------------|----------------|-------------------|-------------------|
| **Cross-tier references** | Architecture changes | Architecture team | Link validation automation |
| **Implementation references** | Code structure changes | Development team | Documentation review process |
| **Strategic references** | Decision updates | Decision makers | ADR review process |
| **Tool references** | Workflow changes | DevOps team | Integration testing |

## 📋 Decision Framework

### **Documentation Placement Decision Tree**

```
1. Is this implementation-specific documentation?
   ├─ YES → Place near code (src/docs/, backend/docs/, scripts/)
   └─ NO → Continue to 2

2. Is this strategic/cross-cutting documentation?
   ├─ YES → Place in centralized docs/ directory
   └─ NO → Continue to 3

3. Is this user-facing documentation?
   ├─ YES → Root README or docs/README.md
   └─ NO → Continue to 4

4. Is this tool/infrastructure documentation?
   ├─ YES → Place with tool files
   └─ NO → Consider if documentation is needed
```

### **Content Organization Decision Tree**

```
1. Does directory contain 3+ distinct concepts?
   ├─ YES → Create comprehensive README
   └─ NO → Continue to 2

2. Does directory serve unique audience needs?
   ├─ YES → Create audience-specific README
   └─ NO → Continue to 3

3. Is content already well-documented elsewhere?
   ├─ YES → Create reference README with links
   └─ NO → Create minimal README or skip
```

### **Language Decision Framework**

```
1. Is this user-facing content?
   ├─ YES → Primary Spanish with English technical terms
   └─ NO → Continue to 2

2. Is this technical implementation content?
   ├─ YES → Primary English with Spanish descriptions
   └─ NO → Continue to 3

3. Is this strategic/decision content?
   ├─ YES → Primary Spanish with English references to standards
   └─ NO → Use project default (Spanish primary)
```

## 🎯 Quality Guidelines

### **Documentation Quality Standards**

| Quality Aspect | Requirement | Validation Method |
|---------------|-------------|-------------------|
| **Completeness** | All required sections included | Template compliance check |
| **Currency** | Links and commands work correctly | Automated link validation |
| **Consistency** | Language and formatting standards met | Style guide validation |
| **Relevance** | Content matches directory purpose | Peer review process |
| **Maintenance** | Update processes defined | Regular review schedule |

### **Template Compliance**

✅ **Required for All READMEs:**
- Status notice (for appropriate document types)
- Clear purpose and target audience
- Cross-references to related documentation
- Consistent formatting and language use

✅ **Required for Tier 1 (User-Facing):**
- 4-tier navigation table
- Bilingual content following standards
- Essential command reference
- Cross-references to all tiers

✅ **Required for Implementation (Tiers 2-3):**
- Code proximity explanation
- Cross-references to strategic documentation
- Technology-specific guidance
- Integration patterns

## 🔄 Maintenance and Evolution

### **Documentation Lifecycle**

| Phase | Requirements | Validation | Ownership |
|-------|-------------|------------|-----------|
| **Creation** | Template compliance, placement guidelines | Review checklist | Content creator |
| **Active** | Regular updates, link validation | Automated checks | Domain owner |
| **Evolution** | Architecture changes reflected | Change impact analysis | Architecture team |
| **Archive** | Historical preservation, clear migration path | Archive standards | Archive maintainer |

### **Update Triggers**

| Trigger Type | Required Updates | Validation Required |
|-------------|------------------|-------------------|
| **Code Structure Changes** | Implementation documentation | Link validation |
| **Architecture Decisions** | Strategic documentation cross-references | ADR review |
| **Workflow Changes** | Tool and integration documentation | Integration testing |
| **Team Structure Changes** | Audience targeting and language use | Style compliance |

### **Review Process**

1. **Quarterly Review**: Validate all cross-references and currency
2. **Architecture Change Review**: Update strategic references
3. **Release Review**: Validate implementation documentation
4. **Annual Review**: Complete placement guideline compliance

## 📊 Success Metrics

### **Documentation Effectiveness Metrics**

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **Cross-reference accuracy** | 95%+ working links | Automated link checking |
| **Template compliance** | 90%+ template adherence | Compliance auditing |
| **Language consistency** | 95%+ standard compliance | Style guide validation |
| **User satisfaction** | 4.0+ rating | User feedback surveys |

### **Placement Effectiveness**

| Indicator | Success Criteria | Measurement |
|-----------|------------------|-------------|
| **Code proximity** | Implementation docs ≤2 directories from code | Directory analysis |
| **Strategic centralization** | Cross-cutting docs in docs/ | Placement audit |
| **User accessibility** | Entry points clearly marked | Navigation analysis |
| **Maintenance efficiency** | Update time ≤1 hour for standard changes | Time tracking |

This comprehensive guideline ensures consistent, effective documentation placement that serves user needs while maintaining architectural clarity and development efficiency.