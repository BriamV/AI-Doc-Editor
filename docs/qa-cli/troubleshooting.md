# Troubleshooting - QA CLI System

**Guía de Solución de Problemas Comunes**

Esta guía proporciona soluciones para los problemas más frecuentes que pueden aparecer al usar el QA CLI System.

## 📚 Tabla de Contenidos

1. [Problemas de Instalación](#problemas-de-instalación)
2. [Errores de Configuración](#errores-de-configuración)
3. [Problemas de Herramientas](#problemas-de-herramientas)
4. [Errores de Ejecución](#errores-de-ejecución)
5. [Problemas de Performance](#problemas-de-performance)
6. [Integración CI/CD](#integración-cicd)
7. [Feedback y Reporte](#feedback-y-reporte)

---

## 🛠 Problemas de Instalación

### ❌ Error: "command not found: yarn/npm/pnpm"

**Síntomas:**
```bash
yarn run cmd qa
# zsh: command not found: yarn
```

**Soluciones:**
```bash
# Verificar instalación de Node.js
node --version
npm --version

# Instalar yarn si es necesario
npm install -g yarn

# O usar npm directamente
npm run cmd qa

# Verificar PATH
echo $PATH
```

### ❌ Error: "Module not found" o dependencias faltantes

**Síntomas:**
```bash
Error: Cannot find module 'yargs'
```

**Soluciones:**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules
rm package-lock.json # o yarn.lock
npm install

# O con yarn
yarn cache clean
yarn install

# Verificar que scripts/qa existe
ls -la scripts/qa/
```

### ❌ Error: "Permission denied" (Linux/macOS)

**Síntomas:**
```bash
./scripts/setup-qa-environment.sh
# bash: ./scripts/setup-qa-environment.sh: Permission denied
```

**Soluciones:**
```bash
# Dar permisos de ejecución
chmod +x scripts/setup-qa-environment.sh

# Ejecutar con bash directamente
bash scripts/setup-qa-environment.sh

# Verificar permisos
ls -la scripts/setup-qa-environment.sh
```

---

## ⚙️ Errores de Configuración

### ❌ Error: "Config file not found"

**Síntomas:**
```bash
Error: Configuration file not found: qa-config.json
```

**Soluciones:**
```bash
# Verificar ubicación del archivo
ls -la scripts/qa/qa-config.json

# Crear configuración básica si no existe
cp scripts/qa/qa-config.json.example scripts/qa/qa-config.json

# Especificar configuración custom
yarn run cmd qa --config="/path/to/custom-config.json"
```

### ❌ Error: "Invalid JSON in config file"

**Síntomas:**
```bash
SyntaxError: Unexpected token } in JSON at position 245
```

**Soluciones:**
```bash
# Validar JSON
cat scripts/qa/qa-config.json | jq .
# o
python -m json.tool scripts/qa/qa-config.json

# Corregir syntax JSON común
# - Comas finales: { "key": "value", } ❌
# - Comillas: { key: "value" } ❌
# - Comentarios: { /* comment */ } ❌
```

### ❌ Error: "Unknown DoD configuration"

**Síntomas:**
```bash
Warning: Unknown DoD tag "custom-dod", using default code-review
```

**Soluciones:**
```bash
# Verificar mapeos disponibles
grep -A 10 "dodMappings" scripts/qa/qa-config.json

# Agregar mapeo personalizado
{
  "dodMappings": {
    "custom-dod": ["format", "test", "security"]
  }
}

# Usar mapeo estándar
yarn run cmd qa --dod code-review
```

---

## 🔧 Problemas de Herramientas

### ❌ Error: "Tool not found in PATH"

**Síntomas:**
```bash
❌ ERROR: 'snyk' no encontrado. Por favor, instálelo globalmente
```

**Soluciones por herramienta:**

#### Snyk
```bash
# Instalar globalmente
npm install -g snyk

# O agregar al proyecto
npm install --save-dev snyk

# Verificar instalación
snyk --version
```

#### MegaLinter
```bash
# Instalar MegaLinter runner
npm install --save-dev mega-linter-runner

# O ejecutar vía Docker
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter:latest

# Verificar instalación
npx mega-linter-runner --version
```

#### Python Tools (Black, Pylint, Pytest)
```bash
# Activar virtual environment
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# Instalar herramientas Python
pip install black pylint pytest pytest-cov

# Verificar instalación
black --version
pylint --version
pytest --version
```

### ❌ Error: "SNYK_TOKEN not set"

**Síntomas:**
```bash
Snyk requires authentication. Please set SNYK_TOKEN environment variable.
```

**Soluciones:**
```bash
# Configurar token temporal
export SNYK_TOKEN="your-token-here"

# Configurar permanente en .env
echo "SNYK_TOKEN=your-token-here" >> .env

# Obtener token desde Snyk
snyk auth
```

### ❌ Error: "Virtual environment not found"

**Síntomas:**
```bash
⚠️ Virtual environment not detected. Using system Python.
```

**Soluciones:**
```bash
# Crear virtual environment
python -m venv .venv

# Activar
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# Instalar dependencias Python
pip install -r requirements.txt

# Verificar activación
which python
```

---

## 🚀 Errores de Ejecución

### ❌ Error: "No files to process"

**Síntomas:**
```bash
[ℹ️] No files found matching scope criteria
```

**Soluciones:**
```bash
# Verificar archivos en el directorio
ls -la src/

# Verificar git status
git status

# Usar scope más amplio
yarn run cmd qa --scope all

# Verificar patrones en configuración
grep -A 5 "scopes" scripts/qa/qa-config.json
```

### ❌ Error: "Git not found or not a git repository"

**Síntomas:**
```bash
Error: Current directory is not a git repository
```

**Soluciones:**
```bash
# Verificar que estás en un repositorio git
git status

# Inicializar git si es necesario
git init

# Verificar que git está instalado
git --version

# Verificar directorio actual
pwd
```

### ❌ Error: "Timeout during execution"

**Síntomas:**
```bash
Error: Tool execution timed out after 600 seconds
```

**Soluciones:**
```bash
# Aumentar timeout
export QA_TIMEOUT=900  # 15 minutos

# Usar modo fast para operaciones rápidas
yarn run cmd qa --fast

# Limitar scope
yarn run cmd qa --scope="src/specific-dir"

# Verificar resources del sistema
top
df -h
```

### ❌ Error: "Exit code 1" sin mensaje específico

**Síntomas:**
```bash
[❌] VALIDACIÓN FALLIDA
Process exited with code 1
```

**Soluciones:**
```bash
# Ejecutar con verbose para más información
yarn run cmd qa --verbose

# Verificar logs específicos
ls -la qa-reports/

# Ejecutar dimensión específica para aislar problema
yarn run cmd qa --dimension format
yarn run cmd qa --dimension test
yarn run cmd qa --dimension security
```

---

## ⚡ Problemas de Performance

### ❌ Ejecución muy lenta (>30s en modo fast)

**Síntomas:**
```bash
[ℹ️] QA validation completed in 45.2s (expected <15s)
```

**Diagnóstico:**
```bash
# Verificar archivos siendo procesados
yarn run cmd qa --fast --verbose

# Verificar espacio en disco
df -h

# Verificar memoria
free -h

# Verificar procesos
top
```

**Soluciones:**
```bash
# Habilitar ejecución paralela
export QA_PARALLEL_EXECUTION=true

# Limpiar cache
rm -rf .qa-cache
rm -rf node_modules/.cache

# Usar scope más específico
yarn run cmd qa --fast --scope="src/modified-files"

# Verificar configuración de herramientas
grep -A 5 "timeout" scripts/qa/qa-config.json
```

### ❌ Consumo excesivo de memoria

**Síntomas:**
```bash
# Sistema se ralentiza, swap usage alto
```

**Soluciones:**
```bash
# Desactivar paralelización
export QA_PARALLEL_EXECUTION=false

# Reducir scope
yarn run cmd qa --scope frontend

# Ejecutar dimensiones por separado
yarn run cmd qa --dimension format
yarn run cmd qa --dimension test
yarn run cmd qa --dimension security

# Verificar memoria disponible
free -h
```

---

## 🔄 Integración CI/CD

### ❌ Error: "GitHub Actions workflow fails"

**Síntomas:**
```yaml
Error: Process completed with exit code 1
```

**Soluciones:**
```bash
# Verificar sintaxis del workflow
cat .github/workflows/reusable-qa.yml

# Verificar inputs del workflow
# En el workflow que usa reusable-qa.yml:
with:
  mode: 'auto'  # Verificar que sea valor válido
  node-version: '20.x'  # Verificar versión soportada
```

### ❌ Error: "Dependencies installation fails in CI"

**Síntomas:**
```bash
Error: Unable to resolve dependency tree
```

**Soluciones:**
```bash
# Verificar lockfile está commitado
git add yarn.lock  # o package-lock.json
git commit -m "Update lockfile"

# Limpiar cache en CI
- name: Clear cache
  run: |
    yarn cache clean
    rm -rf node_modules

# Usar instalación específica
- name: Install dependencies
  run: yarn install --frozen-lockfile
```

### ❌ Error: "Timeout in CI/CD"

**Síntomas:**
```bash
Error: The job running on runner GitHub Actions 2 has exceeded the maximum execution time of 15 minutes.
```

**Soluciones:**
```yaml
# Aumentar timeout en workflow
jobs:
  qa-validation:
    timeout-minutes: 30
    
# Usar modo fast en PR
with:
  mode: 'fast'
  
# Configurar timeout por herramienta
env:
  QA_TIMEOUT: 900
```

---

## 🐛 Feedback y Reporte

### ❌ Error: "Cannot generate issue report"

**Síntomas:**
```bash
Failed to generate issue report: Permission denied
```

**Soluciones:**
```bash
# Verificar permisos del directorio
ls -la qa-reports/
mkdir -p qa-reports/issues

# Verificar espacio en disco
df -h

# Generar reporte manual
yarn run cmd qa report-issue --tool="manual" --error="Test error"
```

### ❌ Error: "Browser cannot open issue URL"

**Síntomas:**
```bash
⚠️ Could not open browser: xdg-open command not found
```

**Soluciones:**
```bash
# Linux: Instalar xdg-utils
sudo apt-get install xdg-utils

# O copiar URL manualmente
yarn run cmd qa report-issue
# Copiar URL mostrada y abrir en browser

# Verificar URL generada
ls -la qa-reports/issues/
cat qa-reports/issues/latest.md
```

### ❌ Error: "Issue template not found"

**Síntomas:**
```bash
Error: Template file not found: scripts/qa/templates/report-issue.md
```

**Soluciones:**
```bash
# Verificar archivo template
ls -la scripts/qa/templates/

# Restaurar template desde backup
cp scripts/qa/templates/report-issue.md.backup scripts/qa/templates/report-issue.md

# Crear template básico
mkdir -p scripts/qa/templates
cat > scripts/qa/templates/report-issue.md << 'EOF'
# QA System Issue Report
## Problem Description
{{ERROR_MESSAGE}}
## Environment
- QA Version: {{QA_VERSION}}
- Command: {{COMMAND_EXECUTED}}
EOF
```

---

## 🔍 Debugging General

### Obtener información de debug

```bash
# Información completa del sistema
yarn run cmd qa --verbose --dimension format

# Verificar configuración cargada
node -e "console.log(require('./scripts/qa/qa-config.json'))"

# Verificar herramientas instaladas
which snyk
which npx
which python
which git

# Verificar variables de entorno
env | grep QA_
env | grep SNYK_

# Verificar versiones
node --version
npm --version
yarn --version
python --version
git --version
```

### Logs detallados

```bash
# Logs de ejecución
ls -la qa-reports/

# Logs de CI/CD
# Revisar GitHub Actions logs

# Logs de herramientas específicas
cat .mega-linter.log
cat snyk.log
```

### Verificar estado del sistema

```bash
# Verificar integridad del proyecto
yarn run cmd qa --dimension build

# Verificar configuración de git
git config --list

# Verificar archivos de configuración
find . -name "*qa*" -type f
find . -name ".megalinter*" -type f
find . -name "*.json" -path "*/qa/*"
```

---

## 🆘 Obtener Ayuda

### Usar el sistema de feedback integrado

```bash
# Reportar problema específico
yarn run cmd qa --report-issue

# Incluir contexto detallado
yarn run cmd qa report-issue --tool="problematic-tool" --error="specific error message"
```

### Información para reportes de bugs

Al reportar un problema, incluye:

1. **Comando exacto ejecutado**
2. **Mensaje de error completo**
3. **Información del entorno**:
   ```bash
   node --version
   npm --version
   yarn --version
   git --version
   uname -a
   ```
4. **Configuración relevante**:
   ```bash
   cat scripts/qa/qa-config.json
   cat .mega-linter.yml
   ```
5. **Logs de ejecución**:
   ```bash
   ls -la qa-reports/
   ```

### Recursos adicionales

- **[User Guide](user-guide.md)**: Casos de uso y ejemplos
- **[API Reference](api-reference.md)**: Referencia completa de comandos
- **[Workflow Integration](workflow-integration.md)**: Configuración CI/CD avanzada
- **[QA Setup Guide](../QA-SETUP-GUIDE.md)**: Instalación y configuración inicial

---

**¿Problema no resuelto?** Usa `yarn run cmd qa --report-issue` para crear un reporte detallado que será enviado al equipo de desarrollo.