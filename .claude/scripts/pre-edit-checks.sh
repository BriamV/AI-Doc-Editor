#!/bin/bash
# PreToolUse(Edit|Write|MultiEdit): Quick pre-edit validations
# Delegates to yarn commands for heavy lifting

# Ensure CLAUDE_PROJECT_DIR is set
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

echo "🔍 Pre-edit checks..." >&2

# Read stdin once and store for reuse
INPUT=$(cat)

# 1. Extract file path early for sensitive file detection
FILE_PATH=$(echo "$INPUT" | python3 - <<'PYEOF'
import json, sys
try:
    data = json.load(sys.stdin)
    ti = data.get('tool_input', {})
    # Check tool_input for file_path
    for key in ('file_path', 'path'):
        path = ti.get(key)
        if path:
            print(path)
            break
except:
    pass
PYEOF
)

# Fallback if parsing failed (python3 not available)
if [ -z "$FILE_PATH" ]; then
    FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")
fi

# 2. Check if editing sensitive files (early warning - blocks in PostToolUse)
if echo "$FILE_PATH" | grep -qE '(\.env|credentials|secret|password|\.key|\.pem|\.pfx|\.p12)'; then
    echo "⚠️ WARNING: Editing sensitive file: $FILE_PATH" >&2
    echo "Ensure secrets are not committed to repository" >&2
    echo "Use environment variables or secure vaults instead" >&2
    echo "This operation will be blocked in PostToolUse if secrets detected" >&2
fi

# 3. Secret scanning (enhanced - delegate to yarn sec:secrets)
if ! yarn sec:secrets >/dev/null 2>&1; then
    echo "⚠️ Secrets detected in repository" >&2
    echo "Run 'yarn sec:secrets' to identify and remove secrets" >&2
    echo "Commit will be blocked if secrets are present" >&2
fi

# 4. Tool availability check (only on first edit of session)
CHECKED_FILE="$CLAUDE_PROJECT_DIR/.cc-tools-checked"
if [ ! -f "$CHECKED_FILE" ]; then
    missing=0
    for tool in git node yarn python3; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            echo "⚠️ Missing: $tool" >&2
            missing=1
        fi
    done

    if [ $missing -eq 0 ]; then
        touch "$CHECKED_FILE"
        echo "✅ Development tools available" >&2
    fi
fi

# 5. Document placement validation (delegate to yarn)
# Only validate if editing documentation (reuse FILE_PATH from above)
if echo "$FILE_PATH" | grep -qE '\.(md|mdx)$'; then
    # Quick check only - full validation in PostToolUse
    if ! yarn docs:validate >/dev/null 2>&1; then
        echo "⚠️ Document placement issues detected" >&2
        echo "Run 'yarn docs:validate:fix' after editing" >&2
    fi
fi

echo "✅ Pre-edit checks passed" >&2
exit 0