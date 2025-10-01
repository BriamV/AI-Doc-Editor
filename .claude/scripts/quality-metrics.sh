#!/bin/bash
# PostToolUse(Edit|Write|MultiEdit): Analyze quality metrics (CC≤15, LOC≤300)
# Exit 2 if metrics fail, stderr sent to Claude

# Ensure CLAUDE_PROJECT_DIR is set
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

echo "📊 Quality metrics analysis..." >&2

# Detect OS for venv
detect_os() {
    if [ -n "$WSL_DISTRO_NAME" ] || ([ -f /proc/version ] && grep -q Microsoft /proc/version 2>/dev/null); then
        echo "wsl"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

OS_TYPE=$(detect_os)

# Get files to analyze
INPUT=$(cat)
FILES=$(echo "$INPUT" | python3 - <<'PYEOF' 2>/dev/null || echo ""
import sys, json
try:
    j = json.load(sys.stdin)
    paths = set()
    ti = j.get('tool_input', {})
    tr = j.get('tool_response', {})

    for key in ('file_path', 'path'):
        if ti.get(key): paths.add(ti[key])
        if tr.get(key): paths.add(tr[key])

    for path in sorted(paths):
        print(path)
except:
    pass
PYEOF
)

# Fallback to git
if [ -z "$FILES" ]; then
    FILES=$(git status --porcelain 2>/dev/null | awk '{print $2}')
fi

# Filter code files only
CODE_FILES=$(echo "$FILES" | grep -E '\.(py|ts|tsx|js|jsx)$' || true)

if [ -z "$CODE_FILES" ]; then
    echo "No code files to analyze" >&2
    exit 0
fi

FAIL=0
REPORT="["
SEP=""

for FILE in $CODE_FILES; do
    [ ! -f "$FILE" ] && continue

    LOC=$(wc -l < "$FILE" 2>/dev/null || echo 0)

    case "$FILE" in
        *.py)
            # Delegate to python-cc-gate.cjs with single-file support
            if [[ "$FILE" == backend/* ]]; then
                CC_DATA=$(yarn be:complexity --file "$FILE" --json 2>/dev/null || echo '{"max_cc":0}')
                MAX_CC=$(echo "$CC_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('max_cc',0))" 2>/dev/null || echo 0)
            else
                MAX_CC=0
            fi

            # Determine bands
            if [ "$MAX_CC" -le 10 ]; then CC_BAND="green"
            elif [ "$MAX_CC" -le 15 ]; then CC_BAND="yellow"
            else CC_BAND="red"; FAIL=1; fi

            if [ "$LOC" -le 212 ]; then LOC_BAND="green"
            elif [ "$LOC" -le 300 ]; then LOC_BAND="yellow"
            else LOC_BAND="red"; FAIL=1; fi

            REPORT="$REPORT$SEP{\"lang\":\"py\",\"file\":\"$FILE\",\"cc\":$MAX_CC,\"ccBand\":\"$CC_BAND\",\"loc\":$LOC,\"locBand\":\"$LOC_BAND\"}"
            SEP=","
            ;;

        *.ts|*.tsx|*.js|*.jsx)
            # Use ESLint complexity rule to check
            npx eslint "$FILE" --no-error-on-unmatched-pattern --rule '{"complexity":["error",10]}' >/dev/null 2>&1
            EC10=$?
            npx eslint "$FILE" --no-error-on-unmatched-pattern --rule '{"complexity":["error",15]}' >/dev/null 2>&1
            EC15=$?

            if [ $EC10 -eq 0 ]; then CC_BAND="green"
            elif [ $EC15 -eq 0 ]; then CC_BAND="yellow"
            else CC_BAND="red"; FAIL=1; fi

            if [ "$LOC" -le 212 ]; then LOC_BAND="green"
            elif [ "$LOC" -le 300 ]; then LOC_BAND="yellow"
            else LOC_BAND="red"; FAIL=1; fi

            REPORT="$REPORT$SEP{\"lang\":\"js\",\"file\":\"$FILE\",\"ccBand\":\"$CC_BAND\",\"loc\":$LOC,\"locBand\":\"$LOC_BAND\"}"
            SEP=","
            ;;
    esac
done

REPORT="$REPORT]"

if [ $FAIL -ne 0 ]; then
    echo "$REPORT" > "$CLAUDE_PROJECT_DIR/.cc-metrics-fail.json"
    echo "❌ QUALITY METRICS FAILED:" >&2
    echo "Some files exceed CC>15 or LOC>300" >&2
    echo "Run 'cat .cc-metrics-fail.json' for details" >&2
    echo "" >&2
    echo "💡 Refactoring suggestions:" >&2
    echo "  - Extract complex functions into smaller ones" >&2
    echo "  - Use early returns to reduce nesting" >&2
    echo "  - Split large files into modules" >&2
    exit 2
else
    rm -f "$CLAUDE_PROJECT_DIR/.cc-metrics-fail.json" 2>/dev/null || true
    echo "✅ Quality metrics passed (CC≤15, LOC≤300)" >&2
fi