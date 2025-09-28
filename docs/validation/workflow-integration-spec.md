# Document Placement Validation - Workflow Integration Specifications

## Overview

This document specifies how to integrate the document placement validation system into existing development workflows to prevent organizational failures like the migration files misplacement incident.

## Integration Points

### 1. Pre-commit Hook Integration

**Purpose**: Catch misplaced files before they enter the repository

**Implementation**:
```bash
# Add to .claude/hooks.json PostToolUse section
{
  "matcher": "Write|MultiEdit",
  "hooks": [
    {
      "type": "command",
      "timeout": 8,
      "command": "echo 'Validating document placement (timeout: 8s)...'; bash tools/validate-document-placement.sh --strict || { echo '🚫 Document placement violations found. Run: yarn docs:validate:fix'; exit 1; }"
    }
  ]
}
```

**Behavior**:
- Validates placement of any newly written/edited documentation
- Fails fast with clear error message and remediation command
- Auto-runs during Claude Code Edit/Write operations
- 8-second timeout prevents workflow delays

### 2. Quality Gate Integration

**Purpose**: Include document organization in quality standards

**Implementation**:
```json
// Add to package.json quality-gate command
"quality-gate": "... && yarn run validate-docs"
```

**Behavior**:
- Document validation becomes part of standard quality checks
- Blocks builds/deployments when documentation is misorganized
- Integrates with existing 40+ tool quality ecosystem
- Maintains 54% optimized performance profile

### 3. CI/CD Pipeline Integration

**Purpose**: Prevent misplaced documentation from reaching production

**GitHub Actions Workflow**:
```yaml
name: Documentation Validation
on: [push, pull_request]

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Document Placement
        run: |
          chmod +x tools/validate-document-placement.sh
          bash tools/validate-document-placement.sh --strict --report
      - name: Upload Validation Report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: document-validation-report
          path: docs/project-management/migrations/reports/DOCUMENT-PLACEMENT-VALIDATION-REPORT.md
```

**Behavior**:
- Runs on every push and pull request
- Generates reports for failed validations
- Blocks merge when placement violations exist
- Integrates with existing merge protection system

### 4. Developer Workflow Commands

**Purpose**: Easy-to-use validation commands for developers

**Daily Commands**:
```bash
# Quick validation check
yarn docs:validate

# Auto-fix placement issues
yarn docs:validate:fix

# Generate detailed report
yarn docs:validate:report

# Strict validation for CI/CD
yarn docs:validate:strict
```

**Integration with Existing Commands**:
- Integrates with `/health-check` slash command
- Available through `/docs-update` workflow
- Part of quality gate validation
- Accessible via direct yarn commands

### 5. Sub-Agent Workflow Integration

**Purpose**: Intelligent document placement during automated workflows

**Sub-Agent Selection Logic**:
```bash
# Add to .claude/hooks.json preSubAgent
case "$WORKFLOW_TYPE" in
  'documentation')
    export SUB_AGENT="technical-writer"
    ;;
  'migration'|'testing')
    export SUB_AGENT="project-manager"
    ;;
  *)
    export SUB_AGENT="workflow-architect"
    ;;
esac
```

**Behavior**:
- Automatically selects appropriate sub-agent based on document type
- Technical-writer for documentation tasks
- Project-manager for migration/testing artifacts
- Workflow-architect for general organizational tasks

### 6. Real-time Validation During Development

**Purpose**: Immediate feedback during document creation

**Claude Code Integration**:
```javascript
// PostToolUse hook for immediate validation
{
  "matcher": "Write|MultiEdit",
  "hooks": [
    {
      "type": "command",
      "timeout": 5,
      "command": "if [[ \"$file_path\" =~ \\.md$ ]]; then bash tools/validate-document-placement.sh --file=\"$file_path\" || echo '⚠️ Consider document placement: Run yarn docs:validate:fix'; fi"
    }
  ]
}
```

**Behavior**:
- Validates placement immediately after document creation/modification
- Provides non-blocking warnings with fix suggestions
- 5-second timeout for fast feedback
- File-specific validation for performance

## Error Handling and Recovery

### Graceful Degradation
```bash
# Validation with fallback
validation_result=0
bash tools/validate-document-placement.sh --strict || validation_result=$?

case $validation_result in
  0) echo "✅ Document placement validated" ;;
  1) echo "⚠️ Placement warnings found - continuing" ;;
  2) echo "🚫 Critical placement violations - blocking" && exit 2 ;;
  *) echo "❓ Validation script error - continuing with warning" ;;
esac
```

### Timeout Handling
- 8-second timeout for pre-commit validation
- 15-second timeout for comprehensive validation
- Graceful fallback when validation times out
- Clear error messages with remediation steps

### Failure Recovery
```bash
# Auto-recovery for common issues
if ! bash tools/validate-document-placement.sh --strict; then
  echo "Attempting auto-fix..."
  if bash tools/validate-document-placement.sh --fix; then
    echo "✅ Auto-fix successful"
  else
    echo "🚫 Manual intervention required"
    bash tools/validate-document-placement.sh --report
    exit 1
  fi
fi
```

## Performance Optimization

### Selective Validation
- Only validate changed files in incremental mode
- Skip validation for excluded patterns (node_modules, etc.)
- Cache validation results for unchanged files
- Parallel validation for multiple files

### Resource Management
- Memory-efficient file processing
- Cleanup temporary files automatically
- Respect existing timeout constraints
- Integrate with current 54% performance optimization

## Testing Strategy

### Unit Tests
```bash
# Test individual validation functions
test_classify_document() {
  local result=$(classify_document "MIGRATION-SUCCESS-REPORT.md")
  assertEquals "migration_artifact:project_management" "$result"
}

test_get_expected_location() {
  local result=$(get_expected_location "TEST-REPORT.md" "migration_artifact:project_management")
  assertEquals "docs/project-management/migrations/testing/" "$result"
}
```

### Integration Tests
```bash
# Test full workflow integration
test_pre_commit_validation() {
  # Create misplaced file
  echo "# Test Migration" > MIGRATION-TEST.md

  # Run validation
  ! bash tools/validate-document-placement.sh --strict

  # Verify error message
  bash tools/validate-document-placement.sh 2>&1 | grep -q "docs/project-management"

  # Cleanup
  rm MIGRATION-TEST.md
}
```

### End-to-End Tests
```bash
# Test complete workflow
test_e2e_document_workflow() {
  # 1. Create document in wrong location
  # 2. Trigger validation
  # 3. Verify failure
  # 4. Run auto-fix
  # 5. Verify correct placement
  # 6. Verify validation passes
}
```

## Rollback Strategy

### Immediate Rollback
```bash
# Disable validation in emergency
export SKIP_DOC_VALIDATION=true

# Remove from quality gate temporarily
sed -i 's/&& yarn run validate-docs//' package.json
```

### Gradual Rollback
```bash
# Convert to warning-only mode
bash tools/validate-document-placement.sh --warning-only

# Disable specific validations
export SKIP_MIGRATION_VALIDATION=true
export SKIP_CONWAYS_LAW_VALIDATION=true
```

### Full Rollback
```bash
# Remove all validation
git revert <validation-commit>
rm tools/validate-document-placement.sh
# Update package.json to remove commands
# Update .claude/hooks.json to remove hooks
```

## Monitoring and Metrics

### Success Metrics
- **Placement Accuracy**: 95%+ documents in correct locations
- **Detection Rate**: 100% misplacement detection in CI/CD
- **Fix Rate**: 80%+ auto-fixable violations
- **Performance**: <10s average validation time

### Alerting
- Slack notifications for critical violations in CI/CD
- Weekly reports on placement compliance
- Dashboard showing validation trends
- Auto-escalation for repeated violations

### Continuous Improvement
- Monthly review of placement rules
- Feedback collection from developers
- Performance optimization based on metrics
- Rule refinement based on violation patterns

## Security Considerations

### Script Security
- Input validation for all file paths
- Safe execution environment (sandbox mode)
- No privileged operations required
- Audit trail for all placement changes

### Access Control
- Validation scripts require no special permissions
- Read-only access to repository structure
- Safe file movement operations only
- Integration with existing security gates

This comprehensive integration specification ensures the document placement validation system seamlessly integrates into existing workflows while preventing future organizational failures like the migration files incident.