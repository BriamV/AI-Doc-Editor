Auditoria archivo: hooks.js

Fecha: 21/09/2025

Analizando este archivo de hooks mal elaborado, puedo identificar que intenta implementar un **sistema de workflow automatizado para desarrollo GitFlow con quality gates** muy sofisticado, pero con varios problemas técnicos graves.

## Objetivo principal del sistema

El archivo intenta crear un sistema de automatización que:

### 1. Gestión de workflows GitFlow

* **Detección automática de contexto** : Identifica tipos de branches (`feature/T-123`, `release/R1`, `hotfix/`, etc.)
* **Selección de sub-agentes especializados** : `frontend-developer`, `release-manager`, `hotfix-specialist`, `workflow-architect`
* **Extracción de IDs** : Task IDs (`T-123`) y Release IDs (`R1`) desde nombres de branches

### 2. Quality gates automatizados

* **Protección de merge** : Previene PRs desde `main`/`master`
* **Análisis de métricas** : Complejidad ciclomática (CC≤15) y líneas de código (LOC≤300)
* **Escaneo de seguridad** : `semgrep`, `git secrets`
* **Linting** : ESLint, shellcheck, markdownlint
* **Validación de migraciones** : Django migrations check

### 3. Auto-formateo inteligente

* **Detección multi-lenguaje** : Python, TypeScript/JavaScript, CSS, YAML, Markdown, TOML, Shell
* **Manejo de entornos** : WSL, Windows, Linux con virtualenvs
* **Procesamiento de archivos** : Desde JSON de hooks o fallback a git status

### 4. Validaciones post-ejecución

* **Conventional commits** : Verifica formato `feat:`, `fix:`, etc.
* **Definition of Done (DoD)** : Validaciones de completitud de tareas
* **Métricas de calidad** : Genera reportes JSON de archivos que fallan estándares

## Problemas técnicos críticos

### 1. Eventos de hooks inexistentes

```json
"preSubAgent": [...],   // ❌ NO EXISTE
"postSubAgent": [...]   // ❌ NO EXISTE
```

Los eventos válidos son[(1)](https://docs.claude.com/en/docs/claude-code/hooks#hook-events):

* `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionStart`, `SessionEnd`

### 2. Matchers inválidos

Los matchers como `pr-flow`, `commit-smart`, `task-dev` no son herramientas válidas de Claude Code[(1)](https://docs.claude.com/en/docs/claude-code/hooks#pretooluse). Los matchers válidos incluyen:

* `Task` - Tareas de subagentes
* `Bash` - Comandos de shell
* `Read`, `Write`, `Edit`, `MultiEdit` - Operaciones de archivos

### 3. Complejidad excesiva

Los comandos son extremadamente largos y complejos, violando las mejores prácticas de hooks[(1)](https://docs.claude.com/en/docs/claude-code/hooks#debugging). Algunos comandos superan las 1000 líneas de código en una sola línea.

## Funcionalidad pretendida vs. realidad

### Lo que intenta hacer:

1. **Sistema de CI/CD integrado** con quality gates automáticos
2. **Workflow GitFlow automatizado** con validaciones de branch
3. **Sistema de métricas de código** con límites configurables
4. **Auto-formateo universal** para múltiples lenguajes
5. **Integración con herramientas externas** (Node.js scripts, Python tools)

### Lo que realmente ocurre:

* **Los hooks nunca se ejecutan** porque los eventos no existen
* **Los matchers no coinciden** con herramientas reales de Claude Code
* **Las variables de entorno no se propagan** entre hooks debido al aislamiento de contexto[(6)](https://github.com/anthropics/claude-code/issues/5812)

## Arquitectura conceptual correcta para sistema GitFlow automatizado con hooks

Si se implementara correctamente, sería un sistema muy avanzado.

Basándome en la documentación oficial de Claude Code, aquí está la arquitectura real y verificada que puede implementar el sistema deseado (solo como referencia, ya que se tiene que acomodar a la realidad del proyecto, y las herramientas disponibles para evitar redundar o crear desorden, esta propuesta debe considerarse como la base para hacer el tailoring a la realidad de proyecto y su repositorio asociado):

## Estructura base del hooks.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "timeout": 5,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/gitflow-context.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "timeout": 10,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/quality-gates.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "timeout": 5,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/merge-protection.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "timeout": 30,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/auto-format.sh"
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "timeout": 15,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/quality-metrics.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "timeout": 3,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/context-injection.sh"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "timeout": 10,
            "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/workflow-validation.sh"
          }
        ]
      }
    ]
  }
}
```


## Scripts de implementación

### 1. GitFlow Context Detection (`gitflow-context.sh`)

```bash
#!/bin/bash
# SessionStart hook para detectar contexto GitFlow

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
CONTEXT_FILE="$CLAUDE_PROJECT_DIR/.claude/context.json"

# Extraer Task ID y Release ID
TASK_ID=$(echo "$BRANCH" | sed -n 's/.*T-\([0-9]\+\).*/T-\1/p' | head -1)
RELEASE_ID=$(echo "$BRANCH" | sed -n 's/^release\/R\([0-9]\+\).*/R\1/p' | head -1)

# Determinar tipo de workflow
if [[ "$BRANCH" =~ ^feature/T-[0-9]+ ]]; then
    WORKFLOW_TYPE="task-development"
    SUB_AGENT="frontend-developer"
elif [[ "$BRANCH" =~ ^release/R[0-9]+ ]]; then
    WORKFLOW_TYPE="release-preparation"
    SUB_AGENT="release-manager"
elif [[ "$BRANCH" =~ ^hotfix/ ]]; then
    WORKFLOW_TYPE="hotfix"
    SUB_AGENT="hotfix-specialist"
elif [[ "$BRANCH" == "develop" ]]; then
    WORKFLOW_TYPE="integration"
    SUB_AGENT="workflow-architect"
elif [[ "$BRANCH" == "main" ]]; then
    WORKFLOW_TYPE="production"
    SUB_AGENT="workflow-architect"
else
    WORKFLOW_TYPE="general-development"
    SUB_AGENT="workflow-architect"
fi

# Guardar contexto en archivo JSON
cat > "$CONTEXT_FILE" <<EOF
{
  "branch": "$BRANCH",
  "workflow_type": "$WORKFLOW_TYPE",
  "sub_agent": "$SUB_AGENT",
  "task_id": "${TASK_ID:-null}",
  "release_id": "${RELEASE_ID:-null}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Para SessionStart, stdout se añade como contexto
echo "GitFlow Context Detected:"
echo "Branch: $BRANCH"
echo "Workflow: $WORKFLOW_TYPE"
echo "Recommended Sub-agent: $SUB_AGENT"
if [ -n "$TASK_ID" ]; then echo "Task: $TASK_ID"; fi
if [ -n "$RELEASE_ID" ]; then echo "Release: $RELEASE_ID"; fi
```

### 2. Context Injection (`context-injection.sh`)

```bash
#!/bin/bash
# UserPromptSubmit hook para inyectar contexto

CONTEXT_FILE="$CLAUDE_PROJECT_DIR/.claude/context.json"

if [ -f "$CONTEXT_FILE" ]; then
    # Para UserPromptSubmit, stdout se añade al contexto
    echo "Current GitFlow Context:"
    python3 -c "
import json
try:
    with open('$CONTEXT_FILE') as f:
        ctx = json.load(f)
    print(f\"Branch: {ctx['branch']}\")
    print(f\"Workflow: {ctx['workflow_type']}\")
    print(f\"Sub-agent: {ctx['sub_agent']}\")
    if ctx['task_id']: print(f\"Task: {ctx['task_id']}\")
    if ctx['release_id']: print(f\"Release: {ctx['release_id']}\")
except:
    print('No context available')
"
fi
```

### 3. Merge Protection (`merge-protection.sh`)

```bash
#!/bin/bash
# PreToolUse hook para comandos Bash - protección de merge

# Leer input JSON desde stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    pass
")

# Verificar comandos peligrosos en main/master
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    if echo "$COMMAND" | grep -qE "(git push|git merge|git rebase)"; then
        echo "🚫 BLOCKED: Direct operations on $CURRENT_BRANCH are not allowed" >&2
        echo "Create a feature branch or use proper GitFlow workflow" >&2
        exit 2  # Bloquea la operación
    fi
fi

# Verificar merge protection script si existe
if [ -f "$CLAUDE_PROJECT_DIR/scripts/merge-protection.cjs" ]; then
    if echo "$COMMAND" | grep -q "git.*merge\|git.*push.*origin.*main"; then
        node "$CLAUDE_PROJECT_DIR/scripts/merge-protection.cjs" pre-merge-check || {
            echo "🚫 PRE-MERGE CHECK FAILED - BLOCKING OPERATION" >&2
            exit 2
        }
    fi
fi
```

### 4. Quality Gates (`quality-gates.sh`)

```bash
#!/bin/bash
# PreToolUse hook para Edit|Write|MultiEdit - quality gates

# Verificar herramientas disponibles
missing_tools=()
for tool in git node npm python3; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        missing_tools+=("$tool")
    fi
done

if [ ${#missing_tools[@]} -gt 0 ]; then
    echo "⚠️ Missing tools: ${missing_tools[*]}" >&2
fi

# Escaneo de secretos
if command -v git-secrets >/dev/null 2>&1; then
    git secrets --scan 2>/dev/null || echo "⚠️ Secrets scan failed"
fi

# Verificar migraciones Django
if [ -f "manage.py" ]; then
    python3 manage.py makemigrations --check --dry-run >/dev/null 2>&1 || {
        echo "⚠️ Pending Django migrations detected"
    }
fi

# ESLint check para archivos modificados
if command -v npx >/dev/null 2>&1; then
    changed_files=$(git status --porcelain 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' | awk '{print $2}' | head -5)
    if [ -n "$changed_files" ]; then
        echo "$changed_files" | xargs npx eslint --max-warnings=0 2>/dev/null || {
            echo "⚠️ ESLint issues detected in: $changed_files"
        }
    fi
fi

echo "✅ Quality gates check completed"
```

### 5. Auto-format (`auto-format.sh`)

```bash
#!/bin/bash
# PostToolUse hook para auto-formateo

# Obtener archivos desde JSON input
INPUT=$(cat)
files=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    paths = set()
  
    # Extraer rutas de tool_input y tool_response
    ti = data.get('tool_input', {})
    tr = data.get('tool_response', {})
  
    for key in ('file_path', 'path', 'filePath'):
        if ti.get(key): paths.add(ti[key])
        if tr.get(key): paths.add(tr[key])
  
    # Manejar arrays de archivos
    for key in ('files', 'changes', 'editedFiles'):
        value = tr.get(key)
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str):
                    paths.add(item)
                elif isinstance(item, dict):
                    for k in ('file', 'path', 'filePath'):
                        if item.get(k): paths.add(item[k])
  
    for path in sorted(paths):
        print(path)
except:
    pass
")

# Fallback a git status si no hay archivos del JSON
if [ -z "$files" ]; then
    files=$(git status --porcelain 2>/dev/null | awk '{print $2}')
fi

# Filtrar archivos irrelevantes
files=$(echo "$files" | grep -Ev '(node_modules|\.venv|build|dist|\.git)' | grep -v '\.min\.' || true)

if [ -z "$files" ]; then
    echo "No files to format"
    exit 0
fi

echo "Formatting files: $files"

# Formatear por tipo de archivo
for file in $files; do
    if [ ! -f "$file" ]; then continue; fi
  
    case "$file" in
        *.py)
            if command -v black >/dev/null 2>&1; then
                black "$file" --quiet --line-length=100 2>/dev/null || true
            fi
            if command -v ruff >/dev/null 2>&1; then
                ruff "$file" --fix 2>/dev/null || true
            fi
            ;;
        *.ts|*.tsx|*.js|*.jsx|*.cjs|*.mjs)
            if command -v npx >/dev/null 2>&1; then
                npx eslint "$file" --fix 2>/dev/null || true
                npx prettier --write "$file" 2>/dev/null || true
            fi
            ;;
        *.json|*.jsonc)
            if command -v npx >/dev/null 2>&1; then
                npx prettier --write "$file" 2>/dev/null || true
            fi
            ;;
        *.md|*.mdx)
            if command -v markdownlint-cli2 >/dev/null 2>&1; then
                markdownlint-cli2 --fix "$file" 2>/dev/null || true
            fi
            if command -v npx >/dev/null 2>&1; then
                npx prettier --write "$file" 2>/dev/null || true
            fi
            ;;
        *.yml|*.yaml)
            if command -v yamlfix >/dev/null 2>&1; then
                yamlfix "$file" 2>/dev/null || true
            fi
            ;;
        *.sh|*.bash)
            if command -v shfmt >/dev/null 2>&1; then
                shfmt -w -i 2 -ci -sr "$file" 2>/dev/null || true
            fi
            ;;
        *.toml)
            if command -v taplo >/dev/null 2>&1; then
                taplo format "$file" 2>/dev/null || true
            fi
            ;;
    esac
done

echo "✅ Auto-formatting completed"
```

### 6. Quality Metrics (`quality-metrics.sh`)

```bash
#!/bin/bash
# PostToolUse hook para análisis de métricas

# Obtener archivos modificados (mismo método que auto-format)
INPUT=$(cat)
files=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    paths = set()
    ti = data.get('tool_input', {})
    tr = data.get('tool_response', {})
  
    for key in ('file_path', 'path', 'filePath'):
        if ti.get(key): paths.add(ti[key])
        if tr.get(key): paths.add(tr[key])
  
    for path in sorted(paths):
        print(path)
except:
    pass
")

if [ -z "$files" ]; then
    files=$(git status --porcelain 2>/dev/null | awk '{print $2}')
fi

# Filtrar archivos de código
code_files=$(echo "$files" | grep -E '\.(py|ts|tsx|js|jsx)$' || true)

if [ -z "$code_files" ]; then
    echo "No code files to analyze"
    exit 0
fi

metrics_failed=false
metrics_report="["
sep=""

for file in $code_files; do
    if [ ! -f "$file" ]; then continue; fi
  
    loc=$(wc -l < "$file" 2>/dev/null || echo 0)
  
    case "$file" in
        *.py)
            if command -v radon >/dev/null 2>&1; then
                max_cc=$(radon cc -s -j "$file" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    max_complexity = 0
    for _, items in data.items():
        for item in items:
            complexity = item.get('complexity', 0)
            max_complexity = max(max_complexity, complexity)
    print(max_complexity)
except:
    print(0)
")
            else
                max_cc=0
            fi
    
            # Determinar bandas de color
            if [ "$max_cc" -le 10 ]; then cc_band="green"
            elif [ "$max_cc" -le 15 ]; then cc_band="yellow"
            else cc_band="red"; metrics_failed=true; fi
    
            if [ "$loc" -le 212 ]; then loc_band="green"
            elif [ "$loc" -le 300 ]; then loc_band="yellow"
            else loc_band="red"; metrics_failed=true; fi
    
            metrics_report="$metrics_report$sep{\"lang\":\"py\",\"file\":\"$
```

## Conclusión

Este archivo representa un **intento muy ambicioso de automatización de desarrollo** que combina GitFlow, quality gates, métricas de código y auto-formateo. Sin embargo, está completamente mal implementado técnicamente debido a:

1. **Uso de eventos inexistentes** en Claude Code
2. **Matchers inválidos** que nunca coincidirán
3. **Complejidad excesiva** en comandos individuales
4. **Falta de comprensión** del modelo de ejecución de hooks

La **visión es excelente** (automatización completa del workflow de desarrollo), pero la **implementación es completamente incorrecta** y nunca funcionará con Claude Code.
