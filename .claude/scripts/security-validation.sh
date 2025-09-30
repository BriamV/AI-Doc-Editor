#!/bin/bash
# PostToolUse(Edit|Write|MultiEdit): Security validation on edited files
# Exit 2 to BLOCK, exit 1 for warnings, exit 0 to pass

# Ensure CLAUDE_PROJECT_DIR is set
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

echo "🛡️ Security validation..." >&2

# Extract file path from JSON stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 - <<'PYEOF'
import json, sys
try:
    data = json.load(sys.stdin)
    ti = data.get('tool_input', {})
    tr = data.get('tool_response', {})

    # Check both tool_input and tool_response for file_path
    for key in ('file_path', 'path'):
        path = ti.get(key) or tr.get(key)
        if path:
            print(path)
            sys.exit(0)
except:
    pass
PYEOF
)

# Fallback if parsing failed
if [ -z "$FILE_PATH" ]; then
    FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")
fi

if [ -z "$FILE_PATH" ]; then
    echo "⚠️ No file path detected, skipping security validation" >&2
    exit 0
fi

echo "Validating: $FILE_PATH" >&2

# 1. CRITICAL: Block sensitive files
case "$FILE_PATH" in
    .env|.env.*|*.credentials|*secret*|*password*|*.key|*.pem|*.pfx|*.p12)
        echo "🚫 CRITICAL: Sensitive file detected" >&2
        echo "File: $FILE_PATH" >&2
        echo "Security policy: Do not commit secrets/credentials" >&2
        echo "Use environment variables or secure vaults instead" >&2
        exit 2  # BLOCK operation
        ;;
esac

# 2. Fast path for non-security-critical files
case "$FILE_PATH" in
    *.md|*.txt|*.json|*.yml|*.yaml|*.toml|*.xml|*.html|*.css|*.scss)
        echo "No security validation needed for $FILE_PATH" >&2
        exit 0
        ;;
esac

# 3. Python files: SAST + complexity security patterns
if [[ "$FILE_PATH" == *.py ]]; then
    echo "🔍 Python SAST scanning..." >&2

    # Run Semgrep SAST (non-blocking, informational)
    if ! yarn sec:sast 2>/dev/null | grep -q "$FILE_PATH"; then
        # No issues found for this file
        echo "✅ No SAST issues in $FILE_PATH" >&2
    else
        echo "⚠️ SAST findings detected in $FILE_PATH" >&2
        echo "Run 'yarn sec:sast' for full report" >&2
        echo "Common issues: SQL injection, XSS, command injection" >&2
    fi
fi

# 4. TypeScript/JavaScript files: SAST scanning
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
    echo "🔍 JavaScript/TypeScript SAST scanning..." >&2

    # Run Semgrep SAST (non-blocking, informational)
    if ! yarn sec:sast 2>/dev/null | grep -q "$FILE_PATH"; then
        echo "✅ No SAST issues in $FILE_PATH" >&2
    else
        echo "⚠️ SAST findings detected in $FILE_PATH" >&2
        echo "Run 'yarn sec:sast' for full report" >&2
        echo "Common issues: XSS, prototype pollution, unsafe DOM manipulation" >&2
    fi
fi

# 5. Package files: Dependency audit (critical for supply chain security)
case "$FILE_PATH" in
    package.json|yarn.lock)
        echo "🔍 Frontend dependency audit..." >&2
        if ! yarn sec:deps:fe >/dev/null 2>&1; then
            echo "⚠️ Frontend dependency vulnerabilities detected" >&2
            echo "Run 'yarn sec:deps:fe' for details" >&2
            echo "Fix with 'yarn upgrade' or 'yarn dedupe'" >&2
        else
            echo "✅ No frontend dependency vulnerabilities" >&2
        fi
        ;;

    requirements*.txt|pyproject.toml)
        echo "🔍 Backend dependency audit..." >&2
        if ! yarn sec:deps:be >/dev/null 2>&1; then
            echo "⚠️ Backend dependency vulnerabilities detected" >&2
            echo "Run 'yarn sec:deps:be' for details" >&2
            echo "Fix by updating requirements.txt versions" >&2
        else
            echo "✅ No backend dependency vulnerabilities" >&2
        fi
        ;;
esac

# 6. SQL/Database files: Check for SQL injection patterns
if [[ "$FILE_PATH" =~ \.(sql|db)$ ]] || grep -q "CREATE TABLE\|INSERT INTO\|SELECT.*FROM" "$FILE_PATH" 2>/dev/null; then
    echo "🔍 SQL injection pattern check..." >&2
    if grep -qE "(execute\(.*%|execute\(.*\+|query\(.*%|query\(.*\+)" "$FILE_PATH" 2>/dev/null; then
        echo "⚠️ Potential SQL injection vulnerability" >&2
        echo "Use parameterized queries instead of string concatenation" >&2
        echo "Example: cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))" >&2
    fi
fi

# 7. Shell scripts: Check for command injection patterns
if [[ "$FILE_PATH" =~ \.(sh|bash)$ ]]; then
    echo "🔍 Shell script security check..." >&2
    if grep -qE "(\$\(.*\$|eval|exec.*\$)" "$FILE_PATH" 2>/dev/null; then
        echo "⚠️ Potential command injection vulnerability" >&2
        echo "Avoid using eval/exec with user input" >&2
        echo "Quote all variables: \"$VAR\" instead of $VAR" >&2
    fi
fi

echo "✅ Security validation passed for $FILE_PATH" >&2
exit 0