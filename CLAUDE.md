# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Commands (Recommended)
- `make dev` - Start development server (preferred over npm run dev)
- `make build` - Build for production with full validation 
- `make qa-gate` - Run complete quality gate (TypeScript, ESLint, Prettier, tests, build, security)
- `make test` - Run unit tests
- `make security-scan` - Run T-43 dependency security scanning

### Build and Development
- `npm run dev` - Start development server (Vite + React)
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run preview` - Preview production build

### Electron Desktop App
- `npm run electron` - Run as Electron desktop app (concurrent dev server + Electron)
- `npm run pack` - Package Electron app for current platform
- `npm run make` - Build and package Electron app for distribution

### Quality & Testing
- `make lint` - Run ESLint with auto-fix capability
- `make format` - Format code with Prettier
- `make test-coverage` - Run tests with coverage report
- `make audit` - Check for security vulnerabilities

### Docker Commands (T-01.5)
- `make docker-dev` - Start development environment with Docker
- `make docker-build` - Build production Docker image
- `make docker-stop` - Stop all Docker services

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Editor**: Monaco Editor for Markdown editing with live preview
- **UI Framework**: TailwindCSS with custom configuration
- **State Management**: Zustand with IndexedDB persistence
- **Desktop**: Electron wrapper for cross-platform distribution
- **AI Integration**: OpenAI GPT-4o/GPT-4o-mini with custom API layer
- **RAG**: Vector embeddings with OpenAI text-embedding-3-small

### Core Features
This is an AI-powered document editor that supports:
- Document generation using AI prompts and templates
- RAG (Retrieval-Augmented Generation) with knowledge base
- Markdown editing with real-time preview
- Document versioning and audit trails
- Multiple export formats (PDF, DOCX, MD)
- OAuth authentication (Google/Microsoft)
- Secure document storage with encryption

### Project Structure

#### Source Organization (`src/`)
- `components/` - React components organized by feature
  - `Chat/` - AI chat interface and message handling
  - `Document/` - Document editor with Lexical/Monaco integration
  - `Menu/` - Navigation menus (AI, Document, Settings)
  - `GoogleSync/` - Google Drive integration
- `store/` - Zustand state management slices
- `api/` - API client for OpenAI and Google services
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `constants/` - Application constants

#### State Management
- Uses Zustand with IndexedDB persistence (`idb-keyval`)
- Store slices: documents, input, auth, config, prompts, toast
- Custom IDB storage implementation for browser persistence

#### Path Aliases (Vite Config)
- `@components/` → `src/components/`
- `@store/` → `src/store/`
- `@api/` → `src/api/`
- `@hooks/` → `src/hooks/`
- `@types/` → `src/types/`
- `@utils/` → `src/utils/`
- `@constants/` → `src/constants/`

### Key Dependencies
- **Editor**: `@lexical/react`, `react-markdown`, `katex` for math
- **State**: `zustand`, `idb-keyval` for persistence
- **UI**: `tailwindcss`, `@tailwindcss/typography`
- **Auth**: `@react-oauth/google`
- **Build**: `vite`, `@vitejs/plugin-react-swc`
- **Desktop**: `electron`, `electron-builder`
- **AI**: Custom OpenAI API integration

### Development Notes
- Uses SWC for faster TypeScript compilation
- IndexedDB for client-side persistence (not localStorage)
- Custom Tailwind configuration with extended gray scale
- Electron build outputs to `release/` directory
- Supports multiple languages via i18next

### Critical Development Methodology
**IMPORTANT**: This project requires surgical precision in data handling and verification:

1. **Multilingual Context**: Core documentation (PRD, WORK-PLAN, Sub Tareas, UX-FLOW) is in **SPANISH**, while codebase is in English. Always verify language context before making assumptions.

2. **Data Verification Protocol**: 
   - NEVER assume numerical data (complexity points, task counts, file sizes, timelines)
   - ALWAYS verify by reading source documents directly  
   - Use `ls -lh` and `wc -c` for precise file sizes
   - Cross-reference multiple sources for critical metrics

3. **Efficient Task Execution**:
   - For simple data updates: Go directly to source files, avoid over-tooling
   - For complex searches: Use Task tool for broad discovery
   - For specific file/code searches: Use targeted Grep/Glob patterns
   - For Sub Tareas v2.md (120KB): **ALWAYS use Grep/search patterns - never full read**
   - For specific updates: Read → Verify → Edit in sequence

4. **Quality Gates**: Before any commit, run `make qa-gate` and verify that updated data matches source documents exactly. Inaccurate documentation undermines project credibility.

5. **Branch Strategy**: Create feature branches for development work instead of working directly on main branch to minimize impact

## Current Project Phase
**Phase**: R0.WP2 (User Management & API Security)
**Previous**: R0.WP1 ✅ Complete (CI/CD, Security, Governance, Tools)

📊 **Detailed Status**: [DEVELOPMENT-STATUS.md](docs/DEVELOPMENT-STATUS.md)
📋 **Task Progress**: `bash tools/progress-dashboard.sh`

### Security Considerations
- API keys stored encrypted in IndexedDB
- TLS 1.3+ required for network traffic
- AES-256 encryption for document storage
- OAuth 2.0 authentication flow
- GDPR compliance features built-in

### Performance Targets
- Document generation: ≤8 minutes for 10-page documents
- Markdown preview: ≤200ms render time
- File upload processing: ≤120s for 10MB files
- RAG search: <1s response time for 15 documents

## Project Context
**Current**: AI text editor with basic features
**Target**: Professional document generation platform with RAG
**Architecture**: Frontend-only → Full-stack (R1+)

📑 **Complete Vision**: [PRD v2.md](docs/PRD v2.md) (37KB, Spanish)
📐 **Gap Analysis**: [ARCH-GAP-ANALYSIS.md](docs/ARCH-GAP-ANALYSIS.md) (5KB)

### Supporting Documentation
- **PRD v2.md** (37KB): Complete product requirements document defining the AI-powered document generator with RAG capabilities, functional requirements, KPIs, and 6-phase roadmap (R0-R6) - **IN SPANISH**
- **WORK-PLAN v5.md** (42KB): Comprehensive 6-release execution plan (484 complexity points) with 47 tasks (T-01 to T-47), detailed WBS methodology, and delivery timeline - **IN SPANISH**
- **Sub Tareas v2.md** (120KB): Extensive detailed breakdown of implementation subtasks with complexity scoring and dependency mapping - **USE WITH CAUTION: Large file, use targeted searches/reads** - **IN SPANISH**
- **DESIGN_GUIDELINES.md** (6KB): UI/UX design standards and component guidelines
- **ARCH-GAP-ANALYSIS.md** (5KB): Technical gap analysis showing ~65% PRD coverage with current base architecture, identifying 11 functional gaps and 9 NFR gaps
- **UX-FLOW.md** (5KB): User experience design document with 4 UI sprint roadmap, performance tolerances (streaming 30 tok/s, <150ms WS handshake), and UX risk mitigations - **IN SPANISH**
- **CONTRIBUTING.md** (1KB): Development workflow, coding standards, and contribution guidelines
- **ADR-001.md** (4KB): Adoptar Pydantic v2 como capa de validación - 5-8x performance improvement, deferred to R1 backend implementation
- **ADR-002.md** (6KB): Posponer orquestadores (LangChain/Haystack) hasta R4 - mantener dispatcher LiteLLM/SDK nativos, decisión revisar en T-47

## Codebase Quick Facts
- **Size**: ~962MB (959MB node_modules + 3MB source)
- **Tasks**: 47 tasks across 6 releases (484 complexity points)
- **Critical Files**: Sub Tareas v2.md (120KB) - use grep only

📈 **Detailed Analytics**: `bash tools/progress-dashboard.sh`

## File Access Quick Reference
**Large Files (120KB+)**: Use grep patterns - `grep -n "T-02" "docs/Sub Tareas v2.md"`
**Medium Files (37-42KB)**: Safe for full read - PRD v2.md, WORK-PLAN v5.md  
**Small Files (<10KB)**: Direct read - ADR files, UX-FLOW.md

📚 **Complete Strategy**: [DEVELOPMENT-IMPACT-ANALYSIS.md](docs/DEVELOPMENT-IMPACT-ANALYSIS.md)


## Environment Configuration

### Development Environment
- **Platform**: WSL2 (Ubuntu) on Windows 11
- **Claude Code**: Running through WSL2 environment  
- **Terminal**: Windows Terminal with WSL2 integration
- **Docker**: Requires `sg docker -c` prefix for WSL2 Docker commands
- **Note**: `claude doctor` command has known compatibility issues with WSL2 but core functionality works normally
- **Claude Code Version**: 1.0.25 (verified working)

## Custom Development Workflow

### Quality Assurance Protocol
**MANDATORY**: Before any commit, run the full quality gate:
```bash
make qa-gate
```
This runs: TypeScript → ESLint → Prettier → Tests → Build → Security Scan

### Task Navigation Commands
- `make task-nav TASK=T-02` - Navigate to specific task documentation  
- `make dev-status` - Show development progress dashboard
- ~~`make extract-work`~~ - Use `bash tools/extract-subtasks.sh T-02` directly
- ~~`make r0-wp1-status`~~ - Removed (see DEVELOPMENT-STATUS.md)

### Development Tools Integration
**Essential workflow commands from tools/ directory:**
```bash
# Navigate directly to task with line numbers
bash tools/task-navigator.sh T-02

# Extract actionable subtasks for development
bash tools/extract-subtasks.sh T-02

# Update task status (3 seconds vs 30 seconds manual)
bash tools/status-updater.sh T-02 "En progreso - OAuth providers configured"

# Real-time progress across all releases
bash tools/progress-dashboard.sh
```

### Governance & Compliance Workflow
```bash
# Generate Excel traceability matrix (req ↔ task ↔ test mapping)
make traceability

# Validate OpenAPI 3.1 specification
make api-spec

# Complete governance validation
make governance

# Use certification template for task validation
cp docs/templates/ACTA-CERTIFICACION.md docs/certifications/CERT-T-02-$(date +%Y%m%d).md
```

### Docker Development (WSL2)
```bash
# Check Docker availability
make docker-check

# Development with Docker
make docker-dev

# Production build
make docker-build
```

### File Access Strategy
**Optimized approach based on file sizes:**

```bash
# Large files - Use targeted searches
grep -n "T-02" "docs/Sub Tareas v2.md"                    # 120KB
bash tools/task-navigator.sh T-02                         # Direct navigation

# Medium files - Safe for full reads
Read "docs/WORK-PLAN v5.md"                              # 42KB
Read "docs/PRD v2.md"                                    # 37KB

# Small files - Read directly
Read "docs/ARCH-GAP-ANALYSIS.md"                         # 5KB
Read "docs/UX-FLOW.md"                                   # 5KB
Read "docs/adr/ADR-006-dependency-security-scanning.md"  # ADR files

# Source code - Use Task tool for discovery
Task "search for OAuth implementation"                    # Broad searches
Glob "**/*auth*.ts"                                      # Specific patterns
```

### Development Workflow Integration

#### Pre-Development Task Setup
```bash
# 1. Extract current task work
bash tools/extract-subtasks.sh T-02 > current-task.md

# 2. Update status to in-progress
bash tools/status-updater.sh T-02 "En progreso - Iniciando desarrollo"

# 3. Create feature branch
git checkout -b feature/T-02-oauth-implementation

# 4. Validate API spec changes
make api-spec
```

#### During Development
```bash
# Update subtask progress
bash tools/status-updater.sh T-02 "En progreso - ST1: OAuth providers completado"

# Run quality gate before commits
make qa-gate

# Generate traceability after significant changes
make traceability
```

#### Task Completion Workflow
```bash
# 1. Final quality validation
make qa-gate

# 2. Create certification document
cp docs/templates/ACTA-CERTIFICACION.md docs/certifications/CERT-T-02-$(date +%Y%m%d).md
# (Fill certification criteria and evidence)

# 3. Update final status
bash tools/status-updater.sh T-02 "Completado 100% - Certificado"

# 4. Update traceability matrix
make traceability
```

#### ADR Integration Workflow
**When making architectural decisions:**
```bash
# 1. Check existing ADRs
ls docs/adr/ADR-*.md

# 2. Use template for new decisions
cp docs/adr/ADR-000-template.md docs/adr/ADR-007-new-decision.md

# 3. Reference in traceability matrix
make traceability

# 4. Update API spec if needed
make api-spec
```

#### Security & Compliance Integration
```bash
# Before any commit - security scan
make security-scan

# Validate no CRITICAL vulnerabilities  
npm audit --audit-level=critical
```

## Custom Slash Commands (Future Enhancement)
📋 **Planned Enhancement**: [SLASH-COMMANDS-SPEC.md](docs/SLASH-COMMANDS-SPEC.md)
- `/task`, `/qg`, `/cert`, `/doc`, `/dev` workflows planned
- Integration with existing make commands and tools/ scripts
- Target implementation: Post R0.WP2

**Current Alternative**: Use direct commands:
- `bash tools/task-navigator.sh T-02` (instead of /task T-02)
- `make qa-gate` (instead of /qg run)

## **CRITICAL: Development Workflow Integration Policy**

### **Mandatory Integration Rule**
**🚨 EVERY development enhancement MUST be operationally integrated into this workflow - NO exceptions.**

**When implementing ANY feature that impacts development:**

1. **IMMEDIATELY document operational usage** in this CLAUDE.md file
2. **Create concrete commands/scripts** - not just conceptual descriptions  
3. **Map to existing workflow sections** - tools/, make commands, or slash commands
4. **Test integration** - verify commands work before documenting
5. **Remove redundant processes** - eliminate what the new enhancement replaces

### **Integration Categories**

#### **A. Development Tools Enhancement**
```bash
# New script created → ADD to tools/ directory documentation
# Example: New validation script
echo "bash tools/validate-feature.sh T-02" >> workflow commands

# New make command → ADD to Primary Commands section  
# Example: New testing command
echo "make test-integration - Run integration tests" >> Primary Commands
```

#### **B. Quality/Security Enhancement** 
```bash
# New quality check → ADD to qa-gate workflow
# New security scan → ADD to security-scan command
# New compliance → ADD to governance workflow
```

#### **C. Documentation/Navigation Enhancement**
```bash
# New file access pattern → UPDATE File Access Strategy
# New search optimization → UPDATE search commands
# New template → ADD to certification/governance workflow
```

#### **D. Slash Command Extension**
```bash
# New workflow → CREATE new slash command or EXTEND existing
# Map to actual make/tools commands - NO abstract concepts
```

### **Anti-Patterns - DO NOT CREATE**
❌ **Documentation without operational integration**
❌ **Tools that aren't mapped to daily workflow**  
❌ **Features implemented "for completeness" without clear usage**
❌ **Duplicate workflows that don't replace existing ones**
❌ **Abstract concepts without concrete commands**

### **Example Integration Process**
```bash
# WRONG: Just document that X was implemented
# RIGHT: Document HOW to use X operationally

# If implementing new auth validation:
# 1. Create: tools/validate-auth.sh T-02
# 2. Add to Makefile: auth-check target  
# 3. Document in CLAUDE.md: "bash tools/validate-auth.sh T-02"
# 4. Add to /qg slash command: "/qg auth - Validate authentication"
# 5. Remove old manual auth validation steps
```

**🎯 OBJECTIVE**: Every enhancement strengthens the development velocity, never creates overhead. This CLAUDE.md becomes the single source of truth for operational development workflow.

### **Smart Documentation Impact Validation**
**After each action, validate documentation impact intelligently:**

```bash
# New tool/script → Check CLAUDE.md tools/ section
# Task status change → Update specific task docs only  
# Command modified → Check CLAUDE.md commands section
# No brute force searches - target specific impact
```

**Validation Tiers**:
- **Tier 1**: CLAUDE.md, Makefile, package.json (always check)
- **Tier 2**: DEVELOPMENT-STATUS.md, traceability.xlsx (context-based)
- **Tier 3**: PRD, WORK-PLAN (rare changes only)