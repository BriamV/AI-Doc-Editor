# Claude Code Best Practices Research (September 2025)

**Research Date**: September 30, 2025
**Researcher**: Claude Code Search Agent
**Scope**: CLAUDE.md best practices, size recommendations, structure evolution, and recent updates

---

## Executive Summary

Based on comprehensive research of official Anthropic documentation, community best practices, and real-world implementations (September 2025), the **5,000 token recommendation** found in our Q&A documentation appears to be **community-derived guidance**, not official Anthropic policy. Official documentation emphasizes **"concise and human-readable"** without specific token limits, though Anthropic acknowledges that memory files consume context window space.

**Key Finding**: No official token limit exists, but community consensus is **under 5,000 tokens** for optimal performance.

---

## 1. Key Findings

### Finding 1: No Official Token Limit
**Source**: [Anthropic Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

> "There's no required format for CLAUDE.md files, and it's recommended to keep them concise and human-readable."

**Official guidance**: Focus on quality over quantity. CLAUDE.md files become part of Claude's prompts, so they should be refined like any frequently used prompt.

### Finding 2: Community Consensus on 5,000 Tokens
**Source**: [Practical Workflow for Token Reduction](https://gist.github.com/artemgetmann/74f28d2958b53baf50597b669d4bce43)

> "Keep project context file under 5,000 tokens"

**Community practice**: This threshold emerged from real-world usage and is widely cited in tutorials and guides, but is **not an official Anthropic recommendation**.

### Finding 3: Modular Approaches Show 50-80% Token Savings
**Source**: [Claude Modular Framework](https://github.com/oxygen-fragment/claude-modular)

Production frameworks using hierarchical configuration and progressive loading demonstrate:
- **50-80% token savings** vs monolithic CLAUDE.md files
- Sub-30-second setup time for new projects
- Better scalability for large codebases

### Finding 4: September 2025 Major Updates
**Source**: [Anthropic News](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)

**Released September 29, 2025**:
- Native VS Code extension (beta)
- Claude Code 2.0 terminal interface
- **Checkpoints feature**: Automatic code state saving with instant rewind (/rewind command)
- **Subagents**: Parallel development workflows
- **Enhanced hooks**: Automatic action triggers
- Claude Agent SDK released for building custom agents
- Claude Sonnet 4.5 as default model (best coding model available)

### Finding 5: @import System Evolution
**Source**: [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

**Status**: CLAUDE.local.md **deprecated** in favor of @import system

```markdown
# Example imports
@README                              # Project overview
@package.json                        # npm commands
@docs/git-instructions.md            # Specific instructions
@~/.claude/my-project-instructions.md # Home directory imports
```

**Features**:
- Recursive imports (max 5 hops)
- Cross-worktree compatibility
- On-demand loading to save tokens
- Imports don't work inside code spans/blocks

---

## 2. Size & Token Recommendations

### Official Anthropic Guidance
**Source**: [Claude Code Memory Management](https://docs.claude.com/en/docs/claude-code/memory)

| Aspect | Recommendation |
|--------|----------------|
| **Official Size Limit** | None specified |
| **Official Guidance** | "Concise and human-readable" |
| **Context Impact** | Memory files "take up the context window space" |
| **Iteration Advice** | "Take time to experiment and determine what produces the best instruction following" |

### Community Consensus

| Source | Recommendation | Rationale |
|--------|----------------|-----------|
| **Token Reduction Workflow** | Under 5,000 tokens | Optimal context management |
| **Memory Management Best Practices** | "Keep CLAUDE.md minimal and lean" | Avoid context overload |
| **Modular Framework** | 50-80% token savings via progressive loading | Scalability for large projects |

### Examples Observed

**Anthropic's Own CLAUDE.md** (GitHub Action example):
- **Structure**: ~50 lines
- **Sections**: 4 main sections (Development Tools, Tasks, Architecture, Conventions)
- **Estimated tokens**: ~800-1,000 tokens
- **Style**: Extremely concise, bullet-point format
- **Focus**: Essential commands, key architecture notes, strict conventions

**Browser-Use Monorepo CLAUDE.md**:
- **Structure**: Comprehensive multi-project guidelines
- **Sections**: 8+ main sections including project structure, development principles, testing strategy
- **Estimated tokens**: ~3,000-4,000 tokens
- **Style**: Detailed but organized, clear hierarchies
- **Focus**: Cross-project coordination, async patterns, type safety

**Mature Codebase Approach**:
- **Strategy**: Minimal core CLAUDE.md + separate failure case documentation
- **Focus**: Universal processes, code discovery, editing protocols
- **Principle**: "Only include instructions if they are necessary"

---

## 3. Structural Recommendations

### Required Sections
**Source**: Multiple community best practices

No officially required sections, but common patterns:

1. **Project Overview** (1-2 sentences)
2. **Development Tools** (commands, setup)
3. **Common Tasks** (npm/yarn scripts)
4. **Architecture Notes** (key components)
5. **Code Conventions** (style, patterns)
6. **Workflow Guidelines** (git, testing)

### Recommended Patterns

#### Pattern 1: Hierarchical Memory System
**Source**: [Official Memory Management](https://docs.claude.com/en/docs/claude-code/memory)

```
Memory Hierarchy (precedence order):
1. Enterprise Policy Memory (system-wide)
2. Project Memory (./CLAUDE.md)
3. User Memory (~/.claude/CLAUDE.md)
```

#### Pattern 2: Modular Architecture with @import
**Source**: [Best Practices Guide](https://www.anthropic.com/engineering/claude-code-best-practices)

```markdown
# CLAUDE.md (core - keep under 5k tokens)
@README                              # Project overview
@docs/architecture.md                # Architecture details
@~/.claude/personal-preferences.md   # User preferences

## Essential Commands
[Only frequently used commands here]

## Critical Conventions
[Only non-standard conventions here]
```

#### Pattern 3: Structured Markdown Organization
**Source**: [Community Best Practices](https://cuong.io/blog/2025/06/15-claude-code-best-practices-memory-management)

```markdown
# Project Name

## Development
- Command 1: Description
- Command 2: Description

## Architecture
- Component 1: Purpose
- Component 2: Purpose

## Conventions
- Pattern 1: When to use
- Pattern 2: When to use
```

#### Pattern 4: XML for Critical Rules
**Source**: [Anti-patterns Discussion](https://dev.to/siddhantkcode/an-easy-way-to-stop-claude-code-from-forgetting-the-rules-h36)

```markdown
<critical_rules>
  <rule id="1">NEVER modify files in archive/ directories</rule>
  <rule id="2">ALWAYS run tests before committing</rule>
</critical_rules>
```

**Rationale**: XML structure prevents Claude from paraphrasing critical rules. Anthropic's documentation recommends XML tags for structured prompts because Claude handles them particularly well.

### Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Better Approach |
|--------------|--------------|-----------------|
| **Adding content without iteration** | Clutters context without benefit | Experiment, measure effectiveness |
| **Generic advice** ("write clean code") | No actionable guidance | Specific commands and examples |
| **Extensive documentation dumps** | Crowds context window | Use @import for docs, keep core lean |
| **No emphasis on critical rules** | Claude forgets important constraints | Use XML tags or IMPORTANT markers |
| **Monolithic single file** | Token inefficiency | Modular with @import |
| **Ignoring context decay** | Rules at top lose importance | Place critical rules at end, use XML |

---

## 4. Recent Changes/Updates (September 2025)

### September 29, 2025 - Major Release
**Source**: [Enabling Claude Code to Work More Autonomously](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)

#### New Features:

1. **Checkpoints System**
   - Automatic code state saving before each change
   - Instant rewind: Tap Esc twice or use /rewind command
   - Enables more ambitious wide-scale tasks

2. **Native VS Code Extension (Beta)**
   - Available in VS Code Extension Marketplace
   - Inline edit proposals
   - IDE-integrated workflow

3. **Enhanced Autonomous Operation**
   - **Subagents**: Delegate specialized tasks for parallel workflows
   - **Hooks**: Automatic action triggers at specific points
   - **Background tasks**: Long-running processes without blocking

4. **Claude Agent SDK Release**
   - Infrastructure powering Claude Code now available to developers
   - Build custom agents and applications
   - Production-ready agent framework

5. **Model Update**
   - Claude Sonnet 4.5 now default model
   - Described as "best coding model in the world"
   - Handles longer, more complex development tasks

### CLAUDE.local.md Deprecation
**Date**: 2025 (specific month unclear)
**Status**: Deprecated in favor of @import system
**Reason**: Better cross-worktree compatibility

### No Changes to Core CLAUDE.md Functionality
**Important**: Despite major feature releases, the fundamental CLAUDE.md guidelines remain unchanged. Anthropic continues to recommend:
- Keep files concise and human-readable
- Iterate on effectiveness
- Use hierarchical structure for complex projects

---

## 5. Comparison with Current Implementation

### Alignment Areas (Where We Match Best Practices)

✅ **Hierarchical Structure**
- **Current**: Sections organized by topic (commands, structure, quality)
- **Best Practice**: Structured markdown with clear headings
- **Status**: ✅ Aligned

✅ **Command Documentation**
- **Current**: Extensive yarn/npm command reference
- **Best Practice**: Include common commands with descriptions
- **Status**: ✅ Aligned (though may be verbose)

✅ **Critical Rules with Emphasis**
- **Current**: Uses ✅/❌ markers, "MANDATORY" emphasis
- **Best Practice**: Use emphasis (IMPORTANT, MUST) for adherence
- **Status**: ✅ Aligned

✅ **Workflow Integration**
- **Current**: Task management workflow, git practices
- **Best Practice**: Document repository etiquette and workflows
- **Status**: ✅ Aligned

✅ **Architecture Overview**
- **Current**: Project structure, tech stack documented
- **Best Practice**: Include architecture notes
- **Status**: ✅ Aligned

### Gap Areas (Where We Deviate)

⚠️ **File Size (Most Significant Gap)**
- **Current**: ~6,000+ lines (estimated 15,000-20,000 tokens)
- **Best Practice**: "Concise", community suggests under 5,000 tokens
- **Gap**: **3-4x over community recommendation**
- **Impact**: High context consumption, potential performance impact

⚠️ **Modularization**
- **Current**: Single monolithic file
- **Best Practice**: Use @import for supplementary content
- **Gap**: No use of @import system
- **Impact**: All content loaded every session

⚠️ **Redundancy**
- **Current**: Some command duplication (slash commands + yarn commands)
- **Best Practice**: Minimize instructions, defer to conventional sources
- **Gap**: Moderate redundancy identified
- **Impact**: Token inefficiency

⚠️ **Documentation vs Instructions**
- **Current**: Extensive documentation embedded (ADR references, tool descriptions)
- **Best Practice**: "Only include instructions if necessary", use @docs/ for details
- **Gap**: More documentation than instruction
- **Impact**: Context crowding

⚠️ **Self-Management Meta-Instructions**
- **Current**: CLAUDE.md contains rules about editing itself
- **Best Practice**: Not commonly recommended (may cause confusion)
- **Gap**: Unusual pattern
- **Impact**: Unclear, needs monitoring

### Opportunities for Improvement

#### High Priority (Significant Impact)

1. **Token Reduction (Target: Under 5,000 tokens)**
   ```markdown
   # Proposed Approach:
   # CLAUDE.md (core - ~3,000 tokens)
   @docs/development-guide.md        # Extended commands reference
   @docs/architecture-reference.md   # Detailed architecture
   @docs/quality-tools.md            # Tool ecosystem details

   ## Quick Start
   [Only essential startup commands]

   ## Critical Rules
   [Only non-standard, project-specific rules]
   ```

2. **Adopt @import System**
   - Move extensive command lists to `@docs/commands.md`
   - Move tool ecosystem to `@docs/tools.md`
   - Move detailed architecture to `@docs/architecture.md`
   - Keep only essential, frequently-referenced content in core CLAUDE.md

3. **Consolidate Redundant Sections**
   - Merge duplicate command references
   - Remove extensive explanations, keep commands
   - Consolidate workflow sections

#### Medium Priority (Moderate Impact)

4. **Implement XML for Critical Rules**
   ```markdown
   <critical_rules>
     <rule id="archive">NEVER modify archive/ directories</rule>
     <rule id="merge">MANDATORY: Run /merge-safety before merges</rule>
     <rule id="audit">NEVER modify audit report files</rule>
   </critical_rules>
   ```

5. **Add Context Boundaries**
   - Document when to load supplementary files
   - Clear guidance on what's in core vs @import files

6. **Minimize Principle Application**
   - Remove generic advice ("follow best practices")
   - Keep only project-specific, non-obvious instructions
   - Defer to conventional sources (package.json for commands)

#### Low Priority (Minor Impact)

7. **Restructure for Context Decay**
   - Place most critical rules at end (less affected by context decay)
   - Use XML structure for persistence

8. **Session Management Documentation**
   - Document /compact workflow
   - Add progress.md tracking pattern

---

## 6. Self-Management Meta-Instructions: Analysis

### Current Approach
Our CLAUDE.md contains extensive self-management instructions:
- Update protocols
- Decision trees for content classification
- Quality thresholds
- Rollback conditions
- Maintenance commands

### Community Practice
**Finding**: Self-management instructions are **uncommon** in researched examples.

**Examples Found**:
- **Anthropic's own CLAUDE.md**: No self-management instructions
- **Browser-Use monorepo**: No self-management instructions
- **Mature codebase guide**: Separate document for tracking failures, not in CLAUDE.md

**Alternative Approaches**:
1. **External Documentation**: Maintain CLAUDE.md guidelines in separate docs/
2. **Iterative Refinement**: Use # shortcut to update based on mistakes
3. **Validation Hooks**: Use .claude/hooks.json for validation

### Recommendation
**Status**: ⚠️ Experimental pattern, not widely adopted

**Pros**:
- Self-documenting
- Prevents degradation through explicit rules
- Integrated validation guidance

**Cons**:
- Consumes tokens for meta-instruction
- May confuse Claude about primary vs meta tasks
- Not aligned with community practice
- Adds complexity

**Suggested Action**: Consider moving self-management to external documentation (`docs/claude-md-management.md`) and using @import only when actually updating CLAUDE.md.

---

## 7. Performance Optimization Recommendations

### Token Budget Allocation

Based on research, optimal token distribution:

```
Total Context Window: 200,000 tokens (Claude Sonnet 4.5)

Recommended Allocation:
- CLAUDE.md core: 3,000-5,000 tokens (1.5-2.5%)
- On-demand @imports: 2,000-5,000 tokens (1-2.5%)
- Codebase files: 150,000+ tokens (75%+)
- Conversation history: 40,000+ tokens (20%+)
```

### Modular Loading Strategy

**Framework Example** (50-80% token savings):

```markdown
# CLAUDE.md (always loaded - 3,000 tokens)
Project: AI Document Editor
Stack: React + TypeScript + Python FastAPI
Model: GPT-4o integration

## Commands
@docs/commands/development.md    # Load only when developing
@docs/commands/security.md       # Load only for security tasks
@docs/commands/quality.md        # Load only for QA tasks

## Critical Rules
<critical_rules>
  <rule id="1">NEVER modify archive/ or *audit*.md files</rule>
  <rule id="2">MANDATORY: /merge-safety before merges</rule>
</critical_rules>
```

### Session Management

**Compaction Workflow** (from community best practices):

```bash
# Every ~40 messages:
/compact                         # Focus on code samples and API usage

# Save session state:
docs/progress.md                 # Current progress
docs/session-summary.md          # Summary of decisions

# New session startup:
@CLAUDE.md                       # Core context
@docs/progress.md                # Where we left off
@docs/session-summary.md         # Recent decisions (optional)
```

---

## 8. Validation Strategy Recommendations

### Structural Validation

**Community Tools**:
- Shell scripts for token counting
- Automated duplicate detection
- Cross-reference validation

**Example Validation Checks**:
```bash
# Token count (rough estimate: 1 token ≈ 4 characters)
wc -c CLAUDE.md | awk '{print $1/4 " tokens (estimated)"}'

# Line length violations
awk 'length > 200 {print NR": "substr($0,1,50)"..."}' CLAUDE.md

# Section structure validation
grep -E "^#{1,3} " CLAUDE.md  # Check heading hierarchy
```

### Quality Metrics

Based on our current validation tools + research:

```bash
Recommended Thresholds:
✓ Token count: <5,000 tokens (vs current ~15,000-20,000)
✓ Zero exact duplicates
✓ <3 near-duplicates (85%+ similarity)
✓ All commands ≤5 lines
✓ All lines ≤200 characters
✓ 100% reference validity
✓ All core sections present
✓ Quality score: 95+/100
```

---

## 9. Migration Path Recommendation

### Phase 1: Analyze Current State
```bash
# 1. Count actual tokens
wc -c CLAUDE.md | awk '{print $1/4 " tokens (estimated)"}'

# 2. Identify high-value vs low-value content
# 3. Map sections to potential @import files
```

### Phase 2: Create Modular Structure
```markdown
# Proposed File Structure:
CLAUDE.md (core - 3,000 tokens)
docs/claude/
├── commands-reference.md          # All command lists
├── architecture-detailed.md       # Extended architecture notes
├── tools-ecosystem.md             # Tool descriptions
├── workflow-guides.md             # Detailed workflow docs
└── self-management.md             # Meta-instructions (load on-demand)
```

### Phase 3: Implement @import System
```markdown
# New CLAUDE.md structure:

# AI Document Editor

@README                            # Project overview
@docs/claude/commands-reference.md # When commands needed

## Essential Commands
yarn all:dev                       # Start development
yarn qa:gate                       # Quality validation
/merge-safety                      # MANDATORY before merge

## Critical Rules
<critical_rules>
  <rule id="1">NEVER modify archive/ directories</rule>
  <rule id="2">NEVER modify *audit*.md or *-report.md files</rule>
  <rule id="3">MANDATORY: /merge-safety before merges</rule>
  <rule id="4">ALWAYS use sub-agents for complex analysis</rule>
</critical_rules>

## Tech Stack
- Frontend: React 18 + TypeScript + Vite
- Backend: Python FastAPI + SQLAlchemy
- AI: OpenAI GPT-4o + Streaming

## Quick Reference
@docs/claude/architecture-detailed.md    # When architecture needed
@docs/claude/workflow-guides.md          # When workflow guidance needed
@docs/claude/self-management.md          # When updating CLAUDE.md
```

### Phase 4: Validation & Iteration
```bash
# 1. Validate new structure
tools/validate-claude-md.sh --verbose

# 2. Test with real development tasks
# 3. Measure token usage improvement
# 4. Iterate based on effectiveness
```

---

## 10. Sources

### Official Anthropic Documentation
1. [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) - Official best practices guide (2025)
2. [Claude Code Memory Management](https://docs.claude.com/en/docs/claude-code/memory) - Official memory system documentation
3. [Claude Code Overview](https://docs.claude.com/en/docs/claude-code/overview) - Official product overview
4. [Enabling Claude Code Autonomy](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously) - September 29, 2025 announcement

### Community Best Practices
5. [Claude Code Memory Management Guide](https://cuong.io/blog/2025/06/15-claude-code-best-practices-memory-management) - June 15, 2025
6. [Writing CLAUDE.md for Mature Codebases](https://blog.huikang.dev/2025/05/31/writing-claude-md.html) - May 31, 2025
7. [CLAUDE.md Structure and Best Practices](https://callmephilip.com/posts/notes-on-claude-md-structure-and-best-practices/) - 2025
8. [Token Reduction Workflow](https://gist.github.com/artemgetmann/74f28d2958b53baf50597b669d4bce43) - Practical workflow guide

### Production Examples
9. [Anthropic GitHub Action CLAUDE.md](https://github.com/anthropics/claude-code-action/blob/main/CLAUDE.md) - Official example
10. [Browser-Use Monorepo CLAUDE.md](https://gist.github.com/pirate/ef7b8923de3993dd7d96dbbb9c096501) - Large monorepo example

### Frameworks & Tools
11. [Claude Modular Framework](https://github.com/oxygen-fragment/claude-modular) - Production-ready modular framework
12. [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) - Community resources collection

### Real-World Case Studies
13. [6 Weeks of Claude Code - Puzzmo](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/) - July 30, 2025
14. [How I Use Claude Code - Builder.io](https://www.builder.io/blog/claude-code) - 2025
15. [Claude Code Anti-patterns](https://dev.to/siddhantkcode/an-easy-way-to-stop-claude-code-from-forgetting-the-rules-h36) - Community insights

---

## 11. Actionable Recommendations Summary

### Immediate Actions (High Impact)

1. **Measure Current Token Usage**
   ```bash
   wc -c CLAUDE.md | awk '{print "Current: " $1/4 " tokens (estimated)"}'
   echo "Target: <5,000 tokens"
   ```

2. **Identify Modularization Opportunities**
   - Commands reference → `@docs/claude/commands-reference.md`
   - Tool ecosystem → `@docs/claude/tools-ecosystem.md`
   - Detailed architecture → `@docs/claude/architecture-detailed.md`

3. **Extract Critical Rules to XML Structure**
   ```markdown
   <critical_rules>
     <rule id="archive">NEVER modify archive/ directories</rule>
     <rule id="audit">NEVER modify *audit*.md or *-report.md files</rule>
     <rule id="merge">MANDATORY: /merge-safety before merges</rule>
     <rule id="subagent">ALWAYS use sub-agents for complex analysis</rule>
   </critical_rules>
   ```

### Medium-Term Actions (Moderate Impact)

4. **Implement @import System**
   - Create modular documentation structure
   - Migrate low-frequency content to @import files
   - Test with real development workflows

5. **Consolidate Redundant Content**
   - Merge duplicate command references
   - Remove generic advice
   - Keep only project-specific, non-obvious instructions

6. **Add Session Management Patterns**
   ```markdown
   ## Session Management
   - Run /compact every ~40 messages
   - Save progress to docs/progress.md
   - New session: @CLAUDE.md + @docs/progress.md
   ```

### Long-Term Actions (Continuous Improvement)

7. **Establish Monitoring**
   - Track token usage over time
   - Monitor Claude's instruction following effectiveness
   - Document cases where Claude forgets rules

8. **Iterate Based on Mistakes**
   - Use # shortcut to update CLAUDE.md when mistakes occur
   - Periodically run through prompt improver
   - Review and prune unused instructions

9. **Align with Anthropic Updates**
   - Monitor Anthropic release notes for CLAUDE.md changes
   - Adopt new features (checkpoints, hooks, subagents)
   - Stay current with best practices

---

## 12. Conclusion

### Key Takeaways

1. **No Official Token Limit**: Anthropic recommends "concise and human-readable" without specific thresholds
2. **Community Consensus**: Under 5,000 tokens is widely recommended
3. **Current State**: Our CLAUDE.md is ~3-4x over community recommendation at 15,000-20,000 tokens
4. **Optimization Potential**: 50-80% token savings possible through modularization
5. **September 2025 Updates**: Major new features (checkpoints, subagents, hooks) don't change core CLAUDE.md guidelines
6. **Self-Management**: Our meta-instruction approach is experimental and uncommon

### Recommended Next Steps

**Priority 1**: Measure and reduce token usage (target: <5,000 tokens)
**Priority 2**: Implement @import system for modularization
**Priority 3**: Convert critical rules to XML structure
**Priority 4**: Move self-management to external documentation
**Priority 5**: Establish continuous monitoring and iteration

### Success Metrics

```
Target State (3-6 months):
✓ Core CLAUDE.md: <5,000 tokens (vs current 15,000-20,000)
✓ @import system operational for supplementary content
✓ Critical rules in XML format
✓ Zero redundant content
✓ 95+ quality score maintained
✓ Self-management externalized
✓ Session management patterns documented
```

---

**Research completed**: September 30, 2025
**Next review**: December 2025 (or when major Anthropic updates released)