#!/bin/bash
# PostToolUse(Edit|Write|MultiEdit): Auto-format modified files
# Maximizes delegation to yarn commands (which use multiplatform.cjs wrapper)
# - Python: yarn be:lint:fix + yarn be:format (multiplatform handles venv)
# - Frontend: npx eslint + npx prettier (TODO: migrate to yarn when supporting single files)
# - Other: Direct tool invocation (markdown, yaml, toml, shell, json, css)

echo "🎨 Auto-formatting..." >&2

# Get files from JSON input or git status
INPUT=$(cat)
FILES=$(echo "$INPUT" | python3 - <<'PYEOF' 2>/dev/null || echo ""
import sys, json
try:
    j = json.load(sys.stdin)
    paths = set()

    # Extract from tool_input
    ti = j.get('tool_input', {})
    for key in ('file_path', 'path', 'filePath'):
        if ti.get(key):
            paths.add(ti[key])

    # Extract from tool_response
    tr = j.get('tool_response', {})
    for key in ('file_path', 'path', 'filePath'):
        if tr.get(key):
            paths.add(tr[key])

    # Handle file arrays
    for key in ('files', 'changes', 'editedFiles'):
        val = tr.get(key)
        if isinstance(val, list):
            for item in val:
                if isinstance(item, str):
                    paths.add(item)
                elif isinstance(item, dict):
                    for k in ('file', 'path', 'filePath'):
                        if item.get(k):
                            paths.add(item[k])

    for path in sorted(paths):
        print(path)
except:
    pass
PYEOF
)

# Fallback to git detection
if [ -z "$FILES" ]; then
    FILES=$(git status --porcelain 2>/dev/null | awk '{print $2}')
fi

# Filter out irrelevant files
FILES=$(echo "$FILES" | grep -Ev '(node_modules|\.venv|build|dist|\.git|coverage)' || true)

if [ -z "$FILES" ]; then
    echo "No files to format" >&2
    exit 0
fi

echo "Formatting: $(echo "$FILES" | wc -l) files" >&2

# Format each file based on type
for FILE in $FILES; do
    [ ! -f "$FILE" ] && continue

    case "$FILE" in
        *.py)
            if [[ "$FILE" == backend/* ]]; then
                # Delegate to yarn commands (multiplatform wrapper handles venv activation)
                yarn be:lint:fix 2>/dev/null || true
                yarn be:format 2>/dev/null || true
            fi
            ;;
        *.ts|*.tsx|*.js|*.jsx|*.cjs|*.mjs)
            # Keep npx for now - yarn commands use globs, not single files
            # TODO: Enhance yarn fe:lint:fix and yarn fe:format to support single file paths
            npx eslint "$FILE" --max-warnings=0 --fix 2>/dev/null || true
            npx prettier --write "$FILE" 2>/dev/null || true
            ;;
        *.md|*.mdx)
            markdownlint-cli2 --fix "$FILE" 2>/dev/null || true
            npx prettier --write "$FILE" 2>/dev/null || true
            ;;
        *.yml|*.yaml)
            command -v yamlfix >/dev/null 2>&1 && yamlfix "$FILE" 2>/dev/null || true
            npx prettier --write "$FILE" 2>/dev/null || true
            ;;
        *.toml)
            command -v taplo >/dev/null 2>&1 && taplo format "$FILE" 2>/dev/null || true
            ;;
        *.sh|*.bash)
            command -v shellcheck >/dev/null 2>&1 && {
                DIFF=$(shellcheck -f diff "$FILE" 2>/dev/null || true)
                [ -n "$DIFF" ] && echo "$DIFF" | patch -p0 --silent 2>/dev/null || true
            }
            command -v shfmt >/dev/null 2>&1 && shfmt -w -i 2 -ci -sr "$FILE" 2>/dev/null || true
            ;;
        *.json|*.jsonc)
            npx prettier --write "$FILE" 2>/dev/null || true
            ;;
        *.css|*.scss)
            npx prettier --write "$FILE" 2>/dev/null || true
            ;;
    esac
done

echo "✅ Auto-formatting complete" >&2