# Debug Analyze - Intelligent Debugging and Analysis

---
description: Advanced debugging and error analysis with debugger sub-agent
argument-hint: "[error-type] [--trace]"
allowed-tools: Bash(yarn run cmd *), Bash(git status), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose
Conducts intelligent debugging and error analysis using specialized debugger sub-agent with context-aware error detection.

## Usage
```bash
/debug-analyze                      # Auto-detect debugging context
/debug-analyze runtime              # Focus on runtime errors
/debug-analyze --trace              # Enable detailed tracing
/debug-analyze build                # Focus on build errors
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Git status: !`git status --porcelain`
- Recent errors: !`yarn run cmd validate-modified 2>&1 | tail -10`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for error type and trace flag. Auto-detect debugging context from validation logs and git status.

**Sub-agent delegation for debugging analysis:**

> Use the debugger sub-agent to analyze error patterns, trace execution flow, identify root causes, and provide comprehensive debugging solutions

**Debug context detection:**
- **Runtime errors** (TypeError/ReferenceError): Execution flow analysis
- **Build errors** (build/compile/syntax): Compilation and syntax issues  
- **Test errors** (test/spec/jest): Test failure investigation
- **General debugging**: Comprehensive error analysis

**Trace mode integration:**
When --trace flag is used, enable detailed execution tracing and comprehensive debugging output.
```