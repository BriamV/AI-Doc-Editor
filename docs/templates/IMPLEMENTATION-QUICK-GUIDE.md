# Documentation Template Implementation Quick Guide

## Overview

This guide provides step-by-step instructions for implementing documentation templates within the AI-Doc-Editor project's 4-tier architecture. Use this guide to ensure consistent, high-quality documentation that follows Conway's Law principles and bilingual content standards.

## 🚀 Quick Start (5-Minute Implementation)

### **Step 1: Determine Documentation Type**
```bash
# Use this decision tree:
# 1. Is this a main project entry point? → User-Facing Application template
# 2. Is this for tools/scripts/utilities? → Technical Infrastructure template
# 3. Is this for documentation navigation? → Documentation Hub template
# 4. Is this near code (src/, backend/)? → Implementation Guide template
# 5. Is this for ADRs/formal decisions? → Architecture Reference template
# 6. Is this for Claude Code automation? → Claude Code Integration template
```

### **Step 2: Apply Template**
```bash
# 1. Copy appropriate template from docs/templates/
cp docs/templates/README-[TEMPLATE-TYPE].md /target/directory/README.md

# 2. Fill in template sections with project-specific content
# 3. Validate placement using guidelines
```

### **Step 3: Validate Quality**
```bash
# Use validation checklist
docs/templates/README-VALIDATION-CHECKLIST.md

# Key checks:
# ✅ Template compliance
# ✅ Cross-reference accuracy
# ✅ Conway's Law compliance (implementation docs)
# ✅ Bilingual standards
# ✅ 4-tier navigation (user-facing docs)
```

## 📊 Template Selection Matrix

| Documentation Context | Template to Use | Key Indicators |
|----------------------|----------------|----------------|
| **Project root README** | User-Facing Application | Main entry point, user installation |
| **tools/, scripts/ dirs** | Technical Infrastructure | Problem-solving tools, cross-platform utilities |
| **docs/, documentation navigation** | Documentation Hub | Content organization, directory indexes |
| **src/docs/, backend/docs/** | Implementation Guide | Code proximity, tech-specific guidance |
| **docs/architecture/, ADR collections** | Architecture Reference | Formal decisions, specifications |
| **.claude/, command directories** | Claude Code Integration | Automation, workflow commands |

## 🏗️ 4-Tier Architecture Integration

### **Tier 1: User-Facing Documentation**
**Template**: User-Facing Application
**Location**: README.md (root), docs/README.md
**Requirements**:
- Status notice with visual hierarchy
- 4-tier navigation table
- Bilingual content (Spanish primary)
- Essential command reference
- Cross-references to all tiers

### **Tier 2: Frontend Implementation**
**Template**: Implementation Guide
**Location**: src/docs/
**Requirements**:
- Conway's Law compliance explanation
- Technology stack focus (React, TypeScript)
- Code proximity principle
- Cross-references to strategic docs

### **Tier 3: Backend Implementation**
**Template**: Implementation Guide
**Location**: backend/docs/
**Requirements**:
- Conway's Law compliance explanation
- Technology stack focus (FastAPI, Python)
- API and database documentation
- Cross-references to strategic docs

### **Tier 4: Infrastructure and Tools**
**Template**: Technical Infrastructure OR Claude Code Integration
**Location**: scripts/, tools/, .claude/
**Requirements**:
- Problem-solution mapping
- Command-focused layout
- Integration examples
- Performance metrics

## 🔧 Conway's Law Compliance

### **Implementation Documentation (Near Code)**
✅ **Place Near Code When**:
- Component-specific architecture
- API endpoints or data models
- Testing strategies for specific components
- Technology stack implementation details

❌ **Do NOT Place Near Code When**:
- Strategic architectural decisions
- Cross-cutting concerns
- Project-wide guidelines
- Business requirements

### **Distance Rules**
- **Implementation docs**: ≤2 directories from related code
- **Strategic docs**: Centralized in docs/
- **Mixed docs**: Both locations with cross-references

## 🌍 Bilingual Content Standards

### **Language Selection Framework**
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

### **Consistency Requirements**
✅ **Required**:
- Navigation elements bilingual
- Technical terms in English with Spanish explanations
- Command examples in English with Spanish descriptions

❌ **Avoid**:
- Mixed languages within sentences
- English-only user-facing content
- Technical docs only in Spanish

## 📋 Quality Validation Process

### **Template Compliance Check**
```bash
# 1. Section completeness
# 2. Required elements present
# 3. Cross-references functional
# 4. Language consistency
# 5. Conway's Law compliance (implementation docs)
```

### **Success Criteria**
| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Template compliance** | 90%+ | Template section audit |
| **Cross-reference accuracy** | 95%+ | Link validation |
| **Language consistency** | 95%+ | Bilingual standards check |
| **Conway's Law compliance** | 100% | Distance and placement audit |

## 🔄 Maintenance and Evolution

### **Update Triggers**
- **Architecture changes**: Update strategic references
- **Code structure changes**: Update implementation documentation
- **Workflow changes**: Update tool and integration documentation
- **Team structure changes**: Update audience targeting

### **Review Schedule**
- **Quarterly**: Validate cross-references and currency
- **Architecture reviews**: Update strategic references
- **Release reviews**: Validate implementation documentation
- **Annual**: Complete placement guideline compliance

## 🛠️ Troubleshooting Common Issues

### **Template Selection Confusion**
**Problem**: Unsure which template to use
**Solution**: Use decision tree in Step 1, consider primary audience and purpose

### **Conway's Law Violations**
**Problem**: Implementation docs too far from code
**Solution**: Move docs closer to code or create reference README with links

### **Cross-Reference Failures**
**Problem**: Links broken after restructuring
**Solution**: Use validation checklist, implement automated link checking

### **Language Inconsistency**
**Problem**: Mixed language patterns
**Solution**: Apply language selection framework consistently

## 📚 Related Resources

### **Core Templates**
- [README Templates Overview](./README.md)
- [Documentation Placement Guidelines](./DOCUMENTATION-PLACEMENT-GUIDELINES.md)
- [Validation Checklist](./README-VALIDATION-CHECKLIST.md)

### **Integration Documentation**
- [CLAUDE.md Documentation Standards](../../../CLAUDE.md#documentation-standards--templates)
- [CONTRIBUTING.md Documentation Section](../development/CONTRIBUTING.md#documentation-standards)
- [Main Documentation Navigation](../README.md#guías-de-documentación)

### **Development Workflow**
- [Claude Code Commands](../../../.claude/commands/)
- [Quality Tools Documentation](../../../.claude/docs/)
- [Development Guidelines](../development/)

This guide ensures rapid, consistent implementation of documentation templates while maintaining quality and architectural compliance across the AI-Doc-Editor project.