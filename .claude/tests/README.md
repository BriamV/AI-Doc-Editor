# Claude Code Hooks Test Suite

Comprehensive validation suite for `.claude/hooks.json` integration with all 8 hook scripts.

## Quick Start

```bash
# Run complete test suite
bash .claude/tests/hooks-validation-suite.sh

# Run from Windows Git Bash
bash .claude/tests/hooks-validation-suite.sh

# Run from WSL/Linux
./.claude/tests/hooks-validation-suite.sh
```

## Test Coverage

### 8 Hook Scripts Tested

1. **session-context.sh** (SessionStart)
   - Feature branch detection (feature/T-123)
   - Release branch detection (release/R1)
   - Main/develop branch handling
   - Task ID extraction
   - Workflow type determination

2. **inject-context.sh** (UserPromptSubmit)
   - Context injection from session file
   - Task context display
   - Graceful handling of missing context

3. **bash-protection.sh** (PreToolUse:Bash)
   - Block git push on main branch
   - Block git merge on protected branches
   - Allow safe operations on feature branches
   - Merge protection validation

4. **pre-edit-checks.sh** (PreToolUse:Edit)
   - Tool availability detection
   - Secret scanning (git-secrets)
   - Document placement validation
   - Session-based caching

5. **auto-format.sh** (PostToolUse:Edit)
   - TypeScript/JavaScript formatting (ESLint + Prettier)
   - Python formatting (Black + Ruff)
   - Markdown formatting (markdownlint + Prettier)
   - Multi-file format detection

6. **quality-metrics.sh** (PostToolUse:Edit)
   - Cyclomatic complexity validation (CC ≤ 15)
   - Lines of code validation (LOC ≤ 300)
   - Python analysis (radon)
   - TypeScript/JavaScript analysis (ESLint complexity)
   - Failure reporting with suggestions

7. **subagent-summary.sh** (SubagentStop)
   - Work summary generation
   - Context-aware next steps
   - DoD validation for tasks
   - Workflow-specific suggestions

8. **setup-permissions.sh** (Setup)
   - Script permissions validation
   - Cross-platform compatibility
   - Executable verification

### Integration Test

Complete workflow simulation:

1. SessionStart → Initialize context
2. UserPromptSubmit → Inject context
3. PreToolUse:Bash → Protection check
4. PreToolUse:Edit → Pre-checks
5. PostToolUse:Edit → Auto-format
6. PostToolUse:Edit → Quality metrics
7. SubagentStop → Summary

## Test Results Format

```
[TEST 1] SessionStart Hook (session-context.sh)
----------------------------------------
Test 1.1: Feature branch (feature/T-123-test-feature)
✓ Exit code: 0 (expected: 0) - Feature branch detection
✓ Contains 'T-123' - Task ID extraction
✓ Contains 'task-development' - Workflow type detection
✓ File exists: .claude/session-context.json - Context file creation
✓ JSON field 'task_id' = 'T-123' - Task ID in JSON
✅ PASSED
```

## Exit Codes

- **0** - All tests passed
- **1** - One or more tests failed

## Skipped Tests

Tests are automatically skipped when required tools are missing:

- Python formatting tests require: `black`, `ruff`
- Python complexity tests require: `radon`
- Permission tests skip on Windows

## Test Artifacts

Temporary files created during testing:

- `.test-artifacts/` - Temporary test files
- `.cc-session-start` - Session marker
- `.cc-tools-checked` - Tool check cache
- `.cc-metrics-fail.json` - Quality metrics failure report
- `.claude/session-context.json` - Session context data

All artifacts are automatically cleaned up after test execution.

## Cross-Platform Support

### Windows (Git Bash)

```bash
bash .claude/tests/hooks-validation-suite.sh
```

### WSL/Linux

```bash
./.claude/tests/hooks-validation-suite.sh
```

### Platform Detection

The suite automatically detects:

- Windows (Git Bash/MSYS)
- WSL (Windows Subsystem for Linux)
- Native Linux

## Requirements

### Essential

- Git
- Bash
- Python 3
- Node.js + npm/yarn

### Optional (enhanced testing)

- `black` - Python formatting
- `ruff` - Python linting
- `radon` - Python complexity analysis
- `git-secrets` - Secret scanning
- `markdownlint-cli2` - Markdown formatting
- `shellcheck` - Shell script linting

## Integration with CI/CD

Add to `.github/workflows/`:

```yaml
- name: Validate Hooks Integration
  run: bash .claude/tests/hooks-validation-suite.sh
```

## Troubleshooting

### Test Failures

1. **Permission denied**
   ```bash
   chmod +x .claude/tests/hooks-validation-suite.sh
   chmod +x .claude/scripts/*.sh
   ```

2. **Missing tools**
   - Install required tools: `yarn repo:install`
   - Check tool availability: `yarn repo:env:validate`

3. **Git branch conflicts**
   - Commit or stash changes before running tests
   - Tests create temporary branches

### Common Issues

**Issue**: Tests fail with "command not found"
**Solution**: Install missing tools or skip will be automatic

**Issue**: Permission errors on WSL
**Solution**: Run `.claude/scripts/setup-permissions.sh`

**Issue**: Git branch warnings
**Solution**: Tests automatically cleanup test branches

## Development

### Adding New Tests

```bash
test_new_hook() {
    echo "Testing new hook..."

    # Setup
    JSON_INPUT='{"tool_name":"Edit","tool_input":{}}'

    # Execute
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/new-hook.sh 2>&1)
    EXIT_CODE=$?

    # Validate
    assert_exit_code 0 $EXIT_CODE "Hook execution" || return 1
    assert_contains "$OUTPUT" "expected" "Output validation" || return 1

    return 0
}
```

### Running Individual Tests

Modify `main()` function to run specific tests:

```bash
run_test "1. SessionStart Hook" test_session_start_hook
# Comment out other tests
```

## Documentation

- **Architecture**: [ADR-011 Dual Directory Architecture](../../docs/architecture/adr/ADR-011-dual-directory-architecture.md)
- **Hooks Guide**: [hooks.json documentation](../README.md)
- **Quality Gates**: [QA Pipeline](../../docs/development/qa-pipeline.md)

## Maintenance

- Run after hook script modifications
- Run after hooks.json changes
- Include in PR validation workflow
- Execute before releases

## Success Criteria

- All 8 hook scripts pass individual tests
- Integration workflow completes successfully
- Cross-platform compatibility verified
- No false positives or flaky tests
- Comprehensive coverage of success and failure paths

## License

Part of AI-Doc-Editor project.
See main repository for license details.