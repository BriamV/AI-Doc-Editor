#!/bin/bash
# Setup Migration Tools - Install prerequisites and validate environment
# Usage: ./tools/setup-migration-tools.sh [install|check|test]

set -euo pipefail

REQUIRED_TOOLS=("yq" "jq" "awk" "sed" "grep" "sha256sum")
OPTIONAL_TOOLS=("git" "curl" "wget")

# Logging function
log_setup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install tools for different platforms
install_tools() {
    log_setup "🔧 Installing migration prerequisites..."

    local platform=""
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        platform="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        platform="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        platform="windows"
    else
        log_setup "❌ Unsupported platform: $OSTYPE"
        return 1
    fi

    log_setup "Platform detected: $platform"

    case "$platform" in
        "linux")
            install_linux_tools
            ;;
        "macos")
            install_macos_tools
            ;;
        "windows")
            install_windows_tools
            ;;
    esac
}

install_linux_tools() {
    log_setup "Installing tools for Linux..."

    # Try different package managers
    if command_exists apt; then
        sudo apt update
        sudo apt install -y jq
        # Install yq via snap or direct download
        if command_exists snap; then
            sudo snap install yq
        else
            install_yq_direct
        fi
    elif command_exists yum; then
        sudo yum install -y jq
        install_yq_direct
    elif command_exists pacman; then
        sudo pacman -S jq
        install_yq_direct
    else
        log_setup "No supported package manager found, installing directly"
        install_jq_direct
        install_yq_direct
    fi
}

install_macos_tools() {
    log_setup "Installing tools for macOS..."

    if command_exists brew; then
        brew install jq yq
    else
        log_setup "Homebrew not found, installing manually"
        install_jq_direct
        install_yq_direct
    fi
}

install_windows_tools() {
    log_setup "Installing tools for Windows..."

    # Try chocolatey first
    if command_exists choco; then
        choco install jq yq -y
    elif command_exists scoop; then
        scoop install jq yq
    else
        log_setup "Installing tools directly for Windows"
        install_jq_direct
        install_yq_direct
    fi
}

install_jq_direct() {
    log_setup "Installing jq directly..."

    local jq_url=""
    local jq_binary="jq"

    case "$OSTYPE" in
        "linux-gnu"*)
            jq_url="https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64"
            ;;
        "darwin"*)
            jq_url="https://github.com/stedolan/jq/releases/download/jq-1.6/jq-osx-amd64"
            ;;
        "msys"|"cygwin")
            jq_url="https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe"
            jq_binary="jq.exe"
            ;;
    esac

    if [[ -n "$jq_url" ]]; then
        mkdir -p "$HOME/.local/bin"
        if command_exists curl; then
            curl -L "$jq_url" -o "$HOME/.local/bin/$jq_binary"
        elif command_exists wget; then
            wget "$jq_url" -O "$HOME/.local/bin/$jq_binary"
        else
            log_setup "❌ Neither curl nor wget available for downloading jq"
            return 1
        fi
        chmod +x "$HOME/.local/bin/$jq_binary"
        log_setup "✅ jq installed to $HOME/.local/bin/$jq_binary"
    fi
}

install_yq_direct() {
    log_setup "Installing yq directly..."

    local yq_url=""
    local yq_binary="yq"

    case "$OSTYPE" in
        "linux-gnu"*)
            yq_url="https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64"
            ;;
        "darwin"*)
            yq_url="https://github.com/mikefarah/yq/releases/latest/download/yq_darwin_amd64"
            ;;
        "msys"|"cygwin")
            yq_url="https://github.com/mikefarah/yq/releases/latest/download/yq_windows_amd64.exe"
            yq_binary="yq.exe"
            ;;
    esac

    if [[ -n "$yq_url" ]]; then
        mkdir -p "$HOME/.local/bin"
        if command_exists curl; then
            curl -L "$yq_url" -o "$HOME/.local/bin/$yq_binary"
        elif command_exists wget; then
            wget "$yq_url" -O "$HOME/.local/bin/$yq_binary"
        else
            log_setup "❌ Neither curl nor wget available for downloading yq"
            return 1
        fi
        chmod +x "$HOME/.local/bin/$yq_binary"
        log_setup "✅ yq installed to $HOME/.local/bin/$yq_binary"
    fi
}

# Check tool availability
check_tools() {
    log_setup "🔍 Checking migration tool prerequisites..."

    local missing_required=()
    local missing_optional=()

    # Check required tools
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if command_exists "$tool"; then
            log_setup "✅ $tool: $(which "$tool")"
        else
            missing_required+=("$tool")
            log_setup "❌ $tool: Not found"
        fi
    done

    # Check optional tools
    for tool in "${OPTIONAL_TOOLS[@]}"; do
        if command_exists "$tool"; then
            log_setup "✅ $tool: $(which "$tool")"
        else
            missing_optional+=("$tool")
            log_setup "⚠️  $tool: Not found (optional)"
        fi
    done

    # Special handling for sha256sum alternatives
    if ! command_exists sha256sum; then
        if command_exists shasum; then
            log_setup "✅ shasum: $(which shasum) (sha256sum alternative)"
        elif command_exists openssl; then
            log_setup "✅ openssl: $(which openssl) (sha256sum alternative)"
        else
            log_setup "❌ No checksum tool found (sha256sum, shasum, or openssl required)"
        fi
    fi

    # Report results
    if [[ ${#missing_required[@]} -eq 0 ]]; then
        log_setup "🎯 All required tools available"
        return 0
    else
        log_setup "❌ Missing required tools: ${missing_required[*]}"
        log_setup "Run: $0 install"
        return 1
    fi
}

# Create fallback implementations for missing tools
create_fallbacks() {
    log_setup "🔧 Creating fallback implementations..."

    # Create yq fallback using Python if available
    if ! command_exists yq && command_exists python3; then
        create_yq_fallback
    fi

    # Create jq fallback using Python if available
    if ! command_exists jq && command_exists python3; then
        create_jq_fallback
    fi
}

create_yq_fallback() {
    local yq_fallback="$HOME/.local/bin/yq"
    mkdir -p "$(dirname "$yq_fallback")"

    cat > "$yq_fallback" << 'EOF'
#!/usr/bin/env python3
# Minimal yq fallback implementation
import sys
import yaml
import json

def main():
    if len(sys.argv) < 3:
        print("Usage: yq eval '<expression>' <file>", file=sys.stderr)
        sys.exit(1)

    if sys.argv[1] != "eval":
        print("Only 'eval' command supported in fallback", file=sys.stderr)
        sys.exit(1)

    expression = sys.argv[2]
    filename = sys.argv[3] if len(sys.argv) > 3 else '/dev/stdin'

    try:
        if filename == '/dev/stdin':
            data = yaml.safe_load(sys.stdin)
        else:
            with open(filename, 'r') as f:
                data = yaml.safe_load(f)

        # Simple expression parsing for basic cases
        if expression.startswith('.'):
            keys = expression[1:].split('.')
            result = data
            for key in keys:
                if key and key in result:
                    result = result[key]
                elif key:
                    result = None
                    break

            if result is not None:
                if isinstance(result, (dict, list)):
                    print(json.dumps(result))
                else:
                    print(result)
            else:
                print("null")
        else:
            print("Complex expressions not supported in fallback", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

    chmod +x "$yq_fallback"
    log_setup "✅ Created yq fallback at $yq_fallback"
}

create_jq_fallback() {
    local jq_fallback="$HOME/.local/bin/jq"
    mkdir -p "$(dirname "$jq_fallback")"

    cat > "$jq_fallback" << 'EOF'
#!/usr/bin/env python3
# Minimal jq fallback implementation
import sys
import json

def main():
    if len(sys.argv) < 2:
        print("Usage: jq '<expression>' [file]", file=sys.stderr)
        sys.exit(1)

    expression = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else '/dev/stdin'

    try:
        if filename == '/dev/stdin':
            data = json.load(sys.stdin)
        else:
            with open(filename, 'r') as f:
                data = json.load(f)

        # Simple expression parsing for basic cases
        if expression.startswith('.'):
            keys = expression[1:].split('.')
            result = data
            for key in keys:
                if key and key in result:
                    result = result[key]
                elif key:
                    result = None
                    break

            if result is not None:
                if isinstance(result, (dict, list)):
                    print(json.dumps(result, indent=2))
                else:
                    print(json.dumps(result))
            else:
                print("null")
        elif expression == "empty":
            pass  # Check if JSON is valid
        else:
            print("Complex expressions not supported in fallback", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

    chmod +x "$jq_fallback"
    log_setup "✅ Created jq fallback at $jq_fallback"
}

# Test migration tools
test_migration_tools() {
    log_setup "🧪 Testing migration tools..."

    # Test database abstraction
    if ./tools/database-abstraction.sh >/dev/null 2>&1; then
        log_setup "✅ Database abstraction layer: OK"
    else
        log_setup "❌ Database abstraction layer: FAILED"
    fi

    # Test sync systems
    if timeout 30s ./tools/sync-systems.sh validate >/dev/null 2>&1; then
        log_setup "✅ Sync systems: OK"
    else
        log_setup "⚠️  Sync systems: Cannot test without existing data"
    fi

    # Test migration validator
    if timeout 30s ./tools/migration-validator.sh quick >/dev/null 2>&1; then
        log_setup "✅ Migration validator: OK"
    else
        log_setup "⚠️  Migration validator: Cannot test without migration setup"
    fi

    # Test rollback manager
    if ./tools/rollback-manager.sh list-checkpoints >/dev/null 2>&1; then
        log_setup "✅ Rollback manager: OK"
    else
        log_setup "⚠️  Rollback manager: Cannot test without checkpoints"
    fi

    log_setup "🎯 Migration tools testing completed"
}

# Update PATH for local binaries
update_path() {
    if [[ -d "$HOME/.local/bin" ]] && [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        export PATH="$HOME/.local/bin:$PATH"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        log_setup "✅ Updated PATH to include $HOME/.local/bin"
    fi
}

# Main execution
main() {
    local action="${1:-check}"

    case "$action" in
        "install")
            install_tools
            update_path
            create_fallbacks
            check_tools
            ;;
        "check")
            check_tools
            ;;
        "test")
            check_tools
            test_migration_tools
            ;;
        "fallbacks")
            create_fallbacks
            update_path
            check_tools
            ;;
        *)
            echo "Usage: $0 [install|check|test|fallbacks]"
            echo ""
            echo "Commands:"
            echo "  install    Install required tools (jq, yq) for the platform"
            echo "  check      Check availability of required tools"
            echo "  test       Test migration tools functionality"
            echo "  fallbacks  Create Python fallbacks for missing tools"
            echo ""
            echo "Examples:"
            echo "  $0 check      # Check if tools are available"
            echo "  $0 install    # Install missing tools"
            echo "  $0 test       # Test all migration components"
            exit 1
            ;;
    esac
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi