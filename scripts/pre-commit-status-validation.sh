#!/bin/bash
# Pre-commit hook for status tracking validation
# Validates hierarchy consistency when T-XX-STATUS.md files are modified
# Part of Phase 3: Automated Status Tracking (Pre-commit Hooks)

set -e

# Get the project root directory
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect changed task status files
changed_task_files=$(git diff --cached --name-only | grep 'docs/tasks/T-[0-9]\+-STATUS.md' || true)

if [[ -z "$changed_task_files" ]]; then
    # No task status files changed, skip validation
    exit 0
fi

echo -e "${BLUE}🔍 Status Tracking Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract task IDs from changed files
task_ids=$(echo "$changed_task_files" | sed 's|docs/tasks/||; s|-STATUS.md||')

validation_failed=0

for task_id in $task_ids; do
    echo -e "${BLUE}  → Validating ${task_id} hierarchy...${NC}"

    # Run validation (non-destructive, --validate mode)
    if bash tools/sync-project-status.sh "$task_id" --validate --quiet 2>/dev/null; then
        echo -e "${GREEN}    ✅ ${task_id} hierarchy is consistent${NC}"
    else
        echo -e "${RED}    ❌ ${task_id} hierarchy has inconsistencies!${NC}"
        echo ""
        echo -e "${YELLOW}    Detected changes in ${task_id}-STATUS.md but hierarchy may be inconsistent.${NC}"
        echo -e "${YELLOW}    Please ensure WP/Release/Project status files are also updated.${NC}"
        echo ""
        echo -e "${BLUE}    💡 Fix with:${NC}"
        echo -e "${BLUE}       /sync-project-status ${task_id} --dry-run${NC}  (preview changes)"
        echo -e "${BLUE}       /sync-project-status ${task_id}${NC}            (apply updates)"
        echo ""
        validation_failed=1
    fi
done

if [[ $validation_failed -eq 1 ]]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Status hierarchy validation FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Your commit has been blocked to prevent inconsistencies.${NC}"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo -e "${BLUE}  1. Run: /sync-project-status <TASK_ID>${NC} to auto-update hierarchy"
    echo -e "${BLUE}  2. Manually update WP/Release/Project status files${NC}"
    echo -e "${BLUE}  3. Stage additional files: git add <files>${NC}"
    echo -e "${BLUE}  4. Override (NOT recommended): git commit --no-verify${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All status hierarchies are consistent${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
exit 0
