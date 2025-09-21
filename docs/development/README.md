# Development Documentation

Esta carpeta contiene toda la documentación necesaria para desarrolladores, incluyendo guías de configuración, procesos de desarrollo y herramientas de calidad.

## 👩‍💻 Documentos para Desarrolladores

### Configuración del Entorno
- **[DEVELOPMENT-SETUP.md](./DEVELOPMENT-SETUP.md)** - Configuración básica del entorno
  - Requisitos del sistema
  - Instalación de dependencias
  - Configuración inicial

- **[DOCKER-SETUP.md](./DOCKER-SETUP.md)** - Configuración con Docker
  - Contenedores para desarrollo
  - Docker Compose setup
  - Entorno dockerizado

### Contribución y Procesos
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía para contribuidores
  - Workflow de desarrollo
  - Estándares de código
  - Proceso de pull requests
  - Convenciones de commits

### [Guías Técnicas](./guides/)
Guías específicas para diferentes aspectos del desarrollo:
- **T-02-BUILD-INSTRUCTIONS.md** - Instrucciones detalladas de build
- Otras guías técnicas especializadas

### Calidad y Testing
- **[AUDIT-TESTING-GUIDE.md](./AUDIT-TESTING-GUIDE.md)** - Guía de testing y auditoría
  - Estrategias de testing
  - Herramientas de calidad
  - Procesos de auditoría

- **[SECURITY-SCAN-GUIDE.md](./SECURITY-SCAN-GUIDE.md)** - Guía de escaneo de seguridad
  - Herramientas de seguridad
  - Procesos de scanning
  - Interpretación de resultados

### Protección de Código
- **[MERGE-PROTECTION-SYSTEM.md](./MERGE-PROTECTION-SYSTEM.md)** - Sistema de protección de merges
  - Hooks de git
  - Validaciones pre-merge
  - Sistema de protección automática

## 🚀 Flujo de Desarrollo

### Para Nuevos Desarrolladores
1. **[DEVELOPMENT-SETUP.md](./DEVELOPMENT-SETUP.md)** - Configurar entorno
2. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Entender el workflow
3. **[guides/](./guides/)** - Consultar guías específicas
4. **[MERGE-PROTECTION-SYSTEM.md](./MERGE-PROTECTION-SYSTEM.md)** - Entender protecciones

### Desarrollo Diario
```bash
# Comandos esenciales documentados en CONTRIBUTING.md
yarn dev                    # Desarrollo
yarn build                  # Build
yarn test                   # Testing
yarn security-scan         # Seguridad
```

### Control de Calidad
1. **[AUDIT-TESTING-GUIDE.md](./AUDIT-TESTING-GUIDE.md)** - Estrategias de testing
2. **[SECURITY-SCAN-GUIDE.md](./SECURITY-SCAN-GUIDE.md)** - Validaciones de seguridad
3. **[MERGE-PROTECTION-SYSTEM.md](./MERGE-PROTECTION-SYSTEM.md)** - Protecciones automáticas

## 🛠️ Herramientas y Comandos

### Comandos Principales
```bash
# Desarrollo (documentado en CONTRIBUTING.md)
yarn dev|build|test|security-scan

# Calidad (40+ herramientas integradas)
yarn lint|format|tsc-check
yarn python-quality         # Backend Python
yarn merge-safety-full      # Protección de merges
```

### Slash Commands (Claude Code)
```bash
/task-dev T-XX              # Desarrollo de tareas
/review-complete            # Review completo
/merge-safety               # OBLIGATORIO antes de merge
/health-check               # Diagnóstico del sistema
```

## 📋 Stack Tecnológico

### Frontend
- React 18 + TypeScript + Vite
- TailwindCSS + Zustand
- ESLint + Prettier + Jest

### Backend
- Python FastAPI + SQLAlchemy
- Black + Ruff + MyPy + pip-audit

### DevOps
- Docker + GitHub Actions
- 40+ herramientas de calidad integradas
- Sistema de hooks automatizado

## 🔒 Seguridad y Protecciones

### Validaciones Automáticas
- Hooks de git para protección de merges
- Scanning de dependencias
- Validación de secrets
- Control de calidad de código

### Procesos Obligatorios
- **MERGE PROTECTION**: Siempre ejecutar `/merge-safety` antes de merge
- **SECURITY SCAN**: Incluido en el pipeline de desarrollo
- **QUALITY GATES**: Validaciones automáticas en hooks

## 🔗 Referencias
- [Architecture](../architecture/) - Decisiones técnicas que afectan desarrollo
- [Security](../security/) - Documentación específica de seguridad
- [Project Management](../project-management/) - Contexto de tareas y planificación

---
*Documentación actualizada para desarrollo eficiente y seguro*
*Consulte CONTRIBUTING.md para el workflow completo*