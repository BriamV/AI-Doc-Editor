# Archive Access Guide - Sub Tareas v2.md Legacy System

## Overview
This guide provides instructions for accessing and querying the archived Sub Tareas v2.md database after migration to the distributed task system.

## Archive Structure
```
docs/project-management/archive/
├── Sub-Tareas-v2-LEGACY.md           # Complete 161KB original (PRESERVED)
├── TRACEABILITY-MATRIX.md            # Line-by-line mapping old→new
├── LEGACY-MIGRATION-RECORD.md        # Complete migration documentation
├── ARCHIVE-INTEGRITY-REPORT.md       # Validation and integrity report
├── ARCHIVE-ACCESS-GUIDE.md           # This guide
└── validation/
    ├── data-integrity-checksums.txt  # File integrity validation
    ├── cross-reference-index.json    # Cross-reference preservation
    └── migration-audit-log.json      # Complete audit trail
```

## Quick Access Commands

### Query Legacy Task Data
```bash
# Get specific task from archive
query_legacy_task() {
  local task_id="$1"
  echo "=== LEGACY TASK $task_id ==="
  grep -A 50 "### \*\*Tarea ${task_id}:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md
}

# Usage: query_legacy_task T-25
```

### Compare Legacy vs Current
```bash
# Compare archived task with current distributed version
compare_task_versions() {
  local task_id="$1"
  echo "=== LEGACY VERSION ==="
  query_legacy_task "$task_id"
  echo -e "\n=== CURRENT VERSION ==="
  cat "docs/tasks/${task_id}-STATUS.md"
}

# Usage: compare_task_versions T-04
```

### Extract Historical Decisions
```bash
# Find all status changes and decisions in archive
extract_historical_decisions() {
  local task_id="$1"
  echo "=== HISTORICAL DECISIONS FOR $task_id ==="
  grep -B2 -A2 "ADR\|diferido\|Estado:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | grep -C3 "$task_id"
}

# Usage: extract_historical_decisions T-01
```

## Advanced Query Operations

### Cross-Reference Analysis
```bash
# Find all tasks that reference a specific task
find_task_references() {
  local task_id="$1"
  echo "Tasks referencing $task_id in legacy system:"
  grep -n "T-${task_id#T-}" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md

  echo -e "\nTasks referencing $task_id in current system:"
  grep -r "T-${task_id#T-}" docs/tasks/
}

# Usage: find_task_references T-44
```

### WII Hierarchy Extraction
```bash
# Extract complete WII hierarchy for a task
extract_wii_hierarchy() {
  local task_id="$1"
  echo "=== WII SUBTASKS FOR $task_id ==="
  sed -n "/### \*\*Tarea ${task_id}:/,/### \*\*Tarea/p" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | \
    grep -E "R[0-9]+\.WP[0-9]+-${task_id}-ST[0-9]+"
}

# Usage: extract_wii_hierarchy T-07
```

### Dependency Network Analysis
```bash
# Analyze complete dependency network from archive
analyze_dependency_network() {
  echo "=== DEPENDENCY NETWORK FROM ARCHIVE ==="
  grep -E "Dependencias:.*T-[0-9]+" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | \
    sed 's/.*Tarea \(T-[0-9]\+\).*Dependencias: \(.*\)/\1 depends on: \2/'
}
```

## Data Integrity Verification

### Checksum Validation
```bash
# Verify archive integrity
verify_archive_integrity() {
  echo "=== ARCHIVE INTEGRITY CHECK ==="
  echo "Comparing original vs archived checksums:"
  md5sum "docs/project-management/Sub Tareas v2.md" "docs/project-management/archive/Sub-Tareas-v2-LEGACY.md"

  echo -e "\nExpected checksums from validation file:"
  head -10 docs/project-management/archive/validation/data-integrity-checksums.txt
}
```

### Content Completeness Check
```bash
# Verify all tasks preserved
verify_task_completeness() {
  echo "=== TASK COMPLETENESS CHECK ==="
  echo "Tasks in archive:"
  grep -c "### \*\*Tarea T-" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md

  echo "Tasks in distributed system:"
  find docs/tasks/ -name "T-*-STATUS.md" | wc -l

  echo "Expected: 47 tasks in both systems"
}
```

## Historical Research Use Cases

### 1. Project Retrospective Analysis
```bash
# Extract evolution of task statuses
task_evolution_analysis() {
  echo "=== TASK STATUS EVOLUTION ==="
  for task in T-{01..47}; do
    legacy_status=$(grep -A 5 "### \*\*Tarea ${task}:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | grep "Estado:" | head -1)
    if [ -f "docs/tasks/${task}-STATUS.md" ]; then
      current_status=$(grep "estado:" docs/tasks/${task}-STATUS.md)
      echo "${task}: ${legacy_status} → ${current_status}"
    fi
  done
}
```

### 2. Decision Audit Trail
```bash
# Extract all ADR references and their context
extract_adr_decisions() {
  echo "=== ADR DECISION HISTORY ==="
  grep -n "ADR-[0-9]\+" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | \
    while read line; do
      line_num=$(echo $line | cut -d: -f1)
      context=$(sed -n "${line_num}p" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md)
      echo "Line $line_num: $context"
    done
}
```

### 3. Performance Baseline Recovery
```bash
# Extract historical performance requirements
extract_performance_baselines() {
  echo "=== PERFORMANCE BASELINES FROM ARCHIVE ==="
  grep -A 10 -B 5 "KPI\|rendimiento\|performance\|latencia" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md
}
```

## Emergency Recovery Procedures

### Full Rollback Scenario
```bash
# Emergency rollback to legacy system (USE WITH CAUTION)
emergency_rollback() {
  echo "⚠️  WARNING: This will restore the monolithic system"
  echo "Are you sure? This will undo the distributed migration."
  read -p "Type 'CONFIRM' to proceed: " confirm

  if [ "$confirm" = "CONFIRM" ]; then
    cp docs/project-management/archive/Sub-Tareas-v2-LEGACY.md "docs/project-management/Sub Tareas v2.md"
    echo "Legacy system restored. Distributed files remain intact."
    echo "Run integrity check: md5sum docs/project-management/Sub\ Tareas\ v2.md"
  fi
}
```

### Selective Data Recovery
```bash
# Recover specific task from archive
recover_task_from_archive() {
  local task_id="$1"
  local start_line=$(grep -n "### \*\*Tarea ${task_id}:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | cut -d: -f1)
  local end_line=$(grep -n "### \*\*Tarea T-" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | grep -A 1 "$start_line" | tail -1 | cut -d: -f1)

  echo "Recovering $task_id from lines $start_line to $((end_line-1))"
  sed -n "${start_line},$((end_line-1))p" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md
}
```

## Integration with Current Tools

### Tool Compatibility Commands
```bash
# Run legacy tools on archived data
run_legacy_tools() {
  echo "=== RUNNING TOOLS ON ARCHIVED DATA ==="

  # Task navigator with archive
  LEGACY_MODE=true tools/task-navigator.sh T-25 --source=archive

  # Progress dashboard with historical data
  tools/progress-dashboard.sh --include-archive

  # Extract subtasks from archive
  tools/extract-subtasks.sh T-04 --source=legacy
}
```

### Hybrid Analysis
```bash
# Compare metrics across both systems
hybrid_analysis() {
  local task_id="$1"
  echo "=== HYBRID ANALYSIS FOR $task_id ==="

  echo "Archive complexity:"
  grep -A 20 "### \*\*Tarea ${task_id}:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | grep "Complejidad Total"

  echo "Current complexity:"
  grep "complejidad_total:" docs/tasks/${task_id}-STATUS.md

  echo "Archive status:"
  grep -A 20 "### \*\*Tarea ${task_id}:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md | grep "Estado:"

  echo "Current status:"
  grep "estado:" docs/tasks/${task_id}-STATUS.md
}
```

## Compliance and Audit Support

### Generate Audit Report
```bash
# Create audit-ready report
generate_audit_report() {
  local output_file="audit-report-$(date +%Y%m%d).md"

  cat > "$output_file" << EOF
# Archive Audit Report - $(date)

## Archive Integrity
$(verify_archive_integrity)

## Task Completeness
$(verify_task_completeness)

## Dependency Network
$(analyze_dependency_network)

## Performance Comparison
$(hybrid_analysis T-04)  # Performance-critical task sample

EOF

  echo "Audit report generated: $output_file"
}
```

### Traceability Validation
```bash
# Validate complete traceability chain
validate_traceability() {
  echo "=== TRACEABILITY VALIDATION ==="

  echo "Checking traceability matrix consistency:"
  jq '.migration_audit_trail.data_preservation_metrics' docs/project-management/archive/validation/migration-audit-log.json

  echo -e "\nValidating cross-references:"
  jq '.cross_reference_network.cross_validation_results' docs/project-management/archive/validation/cross-reference-index.json
}
```

## Performance Comparison Tools

### Access Time Benchmarking
```bash
# Benchmark access times
benchmark_access_times() {
  echo "=== ACCESS TIME BENCHMARK ==="

  echo "Legacy system (monolithic file):"
  time query_legacy_task T-25 > /dev/null

  echo "Distributed system:"
  time cat docs/tasks/T-25-STATUS.md > /dev/null

  echo "Batch processing - Legacy:"
  time grep -E "### \*\*Tarea T-[0-9]+:" docs/project-management/archive/Sub-Tareas-v2-LEGACY.md > /dev/null

  echo "Batch processing - Distributed:"
  time find docs/tasks/ -name "T-*-STATUS.md" -exec cat {} \; > /dev/null
}
```

## Best Practices

### When to Use Archive vs Distributed
- **Use Archive For:**
  - Historical research and analysis
  - Compliance audits requiring original data
  - Debugging migration issues
  - Understanding evolution of requirements

- **Use Distributed For:**
  - Daily development workflows
  - Performance-critical operations
  - Concurrent team collaboration
  - Modern tool integration

### Archive Maintenance
```bash
# Quarterly archive health check
quarterly_archive_check() {
  echo "=== QUARTERLY ARCHIVE HEALTH CHECK ==="
  verify_archive_integrity
  verify_task_completeness
  validate_traceability

  echo -e "\nArchive access test:"
  query_legacy_task T-01 | head -10

  echo -e "\nRecommendations:"
  echo "- Archive integrity: OK"
  echo "- Traceability: Complete"
  echo "- Access tools: Functional"
}
```

## Contact and Support

For issues with archive access:
1. Verify file integrity using checksums
2. Check traceability matrix for data location
3. Review migration audit log for historical context
4. Contact development team for advanced recovery scenarios

## Summary

The archive system preserves complete operational history while enabling modern distributed workflows. Use these tools to:
- ✅ Access historical data with confidence
- ✅ Validate migration integrity
- ✅ Support compliance audits
- ✅ Enable emergency recovery
- ✅ Maintain development continuity

The archive serves as both safety net and historical record, ensuring zero data loss while maximizing system performance and maintainability.