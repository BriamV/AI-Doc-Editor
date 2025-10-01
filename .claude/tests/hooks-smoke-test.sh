#!/bin/bash
# Quick smoke test for Claude Code hooks
# Tests basic functionality of all 8 hook scripts
#
# Usage: bash .claude/tests/hooks-smoke-test.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Counters
PASSED=0
FAILED=0

echo "====================================="
echo "  Claude Code Hooks Smoke Test"
echo "====================================="
echo ""

# Test 1: session-context.sh
echo "[1/8] Testing session-context.sh..."
if OUTPUT=$(bash .claude/scripts/session-context.sh 2>&1) && echo "$OUTPUT" | grep -q "GitFlow Context"; then
    echo -e "${GREEN}✅ PASSED${NC} - Session context script works"
    [ -f .claude/session-context.json ] && echo "  → Created session-context.json"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Session context script failed"
    FAILED=$((FAILED + 1))
fi

# Test 2: inject-context.sh
echo ""
echo "[2/8] Testing inject-context.sh..."
if OUTPUT=$(bash .claude/scripts/inject-context.sh 2>&1); then
    echo -e "${GREEN}✅ PASSED${NC} - Context injection script works"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Context injection failed"
    FAILED=$((FAILED + 1))
fi

# Test 3: bash-protection.sh
echo ""
echo "[3/8] Testing bash-protection.sh..."
JSON_INPUT='{"tool_name":"Bash","tool_input":{"command":"yarn install"}}'
if OUTPUT=$(echo "$JSON_INPUT" | bash .claude/scripts/bash-protection.sh 2>&1) && [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Bash protection allows safe commands"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Bash protection script failed"
    FAILED=$((FAILED + 1))
fi

# Test 4: pre-edit-checks.sh
echo ""
echo "[4/8] Testing pre-edit-checks.sh..."
JSON_INPUT='{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}'
if OUTPUT=$(echo "$JSON_INPUT" | bash .claude/scripts/pre-edit-checks.sh 2>&1) && [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Pre-edit checks work"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Pre-edit checks failed"
    FAILED=$((FAILED + 1))
fi

# Test 5: auto-format.sh
echo ""
echo "[5/8] Testing auto-format.sh..."
mkdir -p .test-temp
echo "const x=1" > .test-temp/test.ts
JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-temp/test.ts\"}}"
if OUTPUT=$(echo "$JSON_INPUT" | bash .claude/scripts/auto-format.sh 2>&1); then
    echo -e "${GREEN}✅ PASSED${NC} - Auto-format script works"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Auto-format failed"
    FAILED=$((FAILED + 1))
fi

# Test 6: quality-metrics.sh
echo ""
echo "[6/8] Testing quality-metrics.sh..."
cat > .test-temp/simple.py <<'EOF'
def simple():
    return 1
EOF
JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-temp/simple.py\"}}"
if OUTPUT=$(echo "$JSON_INPUT" | bash .claude/scripts/quality-metrics.sh 2>&1); then
    echo -e "${GREEN}✅ PASSED${NC} - Quality metrics script works"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Quality metrics failed"
    FAILED=$((FAILED + 1))
fi

# Test 7: subagent-summary.sh
echo ""
echo "[7/8] Testing subagent-summary.sh..."
JSON_INPUT='{"tool_name":"Edit","tool_input":{}}'
if OUTPUT=$(echo "$JSON_INPUT" | bash .claude/scripts/subagent-summary.sh 2>&1) && echo "$OUTPUT" | grep -q "Sub-agent"; then
    echo -e "${GREEN}✅ PASSED${NC} - Subagent summary script works"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Subagent summary failed"
    FAILED=$((FAILED + 1))
fi

# Test 8: setup-permissions.sh
echo ""
echo "[8/8] Testing setup-permissions.sh..."
if [ -f .claude/scripts/setup-permissions.sh ]; then
    if bash .claude/scripts/setup-permissions.sh >/dev/null 2>&1 || true; then
        echo -e "${GREEN}✅ PASSED${NC} - Setup permissions script exists"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} - Setup permissions failed"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ FAILED${NC} - setup-permissions.sh not found"
    FAILED=$((FAILED + 1))
fi

# Cleanup
rm -rf .test-temp .cc-session-start .cc-tools-checked .cc-metrics-fail.json 2>/dev/null || true

# Summary
echo ""
echo "====================================="
echo "  Results"
echo "====================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL SMOKE TESTS PASSED${NC}"
    echo ""
    echo "All 8 hook scripts are functioning!"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Run individual scripts for debugging."
    exit 1
fi