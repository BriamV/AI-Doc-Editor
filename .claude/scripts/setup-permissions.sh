#!/usr/bin/env bash
# setup-permissions.sh - Configure executable permissions for Claude scripts
# Works on Windows/WSL/Linux environments

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Configuring executable permissions for Claude scripts..."

# Find all .sh files in .claude/scripts directory
shopt -s nullglob
SCRIPTS=("$SCRIPT_DIR"/*.sh)

if [ ${#SCRIPTS[@]} -eq 0 ]; then
    echo "No .sh files found in $SCRIPT_DIR"
    exit 0
fi

# Make all .sh files executable
for script in "${SCRIPTS[@]}"; do
    chmod +x "$script"
done

echo "✓ Successfully configured ${#SCRIPTS[@]} script(s):"
for script in "${SCRIPTS[@]}"; do
    echo "  - $(basename "$script")"
done

echo "All scripts are now executable."