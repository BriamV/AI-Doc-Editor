# Contributing to AI Doc Editor

¡Gracias por tu interés en contribuir al AI Doc Editor! Este documento te guiará a través del proceso de contribución.

## 🚀 Guía Rápida

### Requisitos Previos
- Node.js 20.x+ (current LTS recommended)
- Python 3.11+
- Git
- Conocimientos básicos de React y TypeScript

### Configuración del Entorno
1. Fork del repositorio
2. Clona tu fork: `git clone https://github.com/tu-usuario/AI-Doc-Editor.git`
3. Instala dependencias: `yarn repo:install`
4. Configura variables de entorno: `cp .env.example .env`
5. Inicia el servidor de desarrollo: `yarn all:dev`

## 📋 Proceso de Contribución

### 1. Planificación
- Revisa los [issues abiertos](https://github.com/BriamV/AI-Doc-Editor/issues)
- Comenta en el issue que quieres trabajar
- Espera confirmación antes de empezar

### 2. Desarrollo
- Crea una rama descriptiva: `git checkout -b feature/descripcion-corta`
- Sigue las [guías de estilo](#guías-de-estilo)
- Escribe tests para nuevas funcionalidades
- Mantén commits atómicos y descriptivos

### 3. Testing y Calidad
```bash
# Ejecuta todos los tests
yarn all:test                         # Complete test suite
yarn fe:test                          # Frontend tests (Jest)
yarn e2e:fe                           # E2E tests (Playwright)

# Valida calidad del código (Local: ~5-15s cada comando)
yarn fe:lint                          # ESLint validation
yarn fe:typecheck                     # TypeScript validation
yarn be:quality                       # Python quality pipeline

# Quality Gates (Local vs CI performance)
yarn qa:gate                          # Full pipeline (~70s local, 10-15 min CI)
yarn qa:gate:fast                     # Fast validation (~30s local)
yarn sec:all                          # Security audit (0 vulnerabilities)
```

### 4. Pull Request
- Asegúrate de que todos los tests pasen
- Ejecuta la validación completa: `yarn repo:merge:validate` o `/merge-safety`
- Crea el PR con descripción detallada
- Los [workflows de GitHub Actions](../.github/workflows/README.md) validarán automáticamente tu código
- **Arquitectura Zero-Overlap**: ci.yml (post-push, 10-15 min) vs pr-validation.yml (pre-merge, 5-8 min)
- Vincula issues relacionados

## 📏 Guías de Estilo

### Frontend (TypeScript/React)
- Usa TypeScript estricto
- Componentes funcionales con hooks
- Nombres descriptivos en camelCase
- Props tipadas con interfaces
- Manejo de errores apropiado

### Backend (Python)
- Sigue PEP 8 y PEP 257
- Type hints obligatorios
- Docstrings para todas las funciones públicas
- Manejo de excepciones apropiado
- Tests unitarios para nueva funcionalidad

### Documentación
- Documentación en español para usuarios
- Comentarios de código en inglés
- README actualizado para nuevas funcionalidades
- ADRs para decisiones arquitectónicas importantes

## 🔒 Seguridad

### Reportar Vulnerabilidades
- **NO** abras issues públicos para vulnerabilidades
- Envía email a: [security@ai-doc-editor.com]
- Incluye pasos para reproducir
- Esperaremos confirmación antes de disclosure público

### Guías de Seguridad
- Nunca commits claves API o secrets
- Valida todas las entradas de usuario
- Usa HTTPS en producción
- Audita dependencias regularmente

## 🧪 Testing

### Estructura de Tests
```
tests/
├── unit/           # Tests unitarios (Jest)
├── integration/    # Tests de integración
├── e2e/           # Tests end-to-end (Playwright)
└── fixtures/      # Datos de prueba
```

### Escribir Tests
- Un test file por componente/módulo
- Tests descriptivos con nombres claros
- Mocks apropiados para APIs externas
- Cobertura mínima del 80%

## 🏗️ Arquitectura

### Estructura del Proyecto
- `src/components/` - Componentes React reutilizables
- `src/pages/` - Páginas principales
- `src/hooks/` - Hooks personalizados
- `src/store/` - Estado global (Zustand)
- `backend/` - API Python (FastAPI)

### Patrones Recomendados
- Componentes de presentación vs. contenedores
- Custom hooks para lógica reutilizable
- Context API para estado compartido
- Error boundaries para manejo de errores

## 📝 Commit Messages

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add OAuth 2.0 Google integration
fix(ui): resolve mobile responsive issues
docs(readme): update installation instructions
refactor(api): optimize database queries
test(components): add Chat component tests
```

### Tipos Permitidos
- `feat`: Nueva funcionalidad
- `fix`: Corrección de errores
- `docs`: Cambios en documentación
- `style`: Cambios de formato (sin cambios de lógica)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

## 🔄 Workflow de Desarrollo

### 🎆 Arquitectura Zero-Overlap CI/CD

Nuestro sistema elimina redundancias con triggers mutuamente exclusivos:

| Workflow | Propósito | Triggers | Tiempo Ejecución |
|----------|----------|----------|--------------------|
| **ci.yml** | Testing integral post-integración | Push a `main`, `develop`, `release/**` | ~10-15 min |
| **pr-validation.yml** | Validación pre-merge rápida | PRs a `main`, `develop` | ~5-8 min |

### Branches GitFlow
- `main` - Código estable en producción
- `develop` - Desarrollo activo (integración continua)
- `feature/T-XX-nombre` - Nuevas funcionalidades (task-based)
- `fix/nombre` - Corrección de errores
- `hotfix/nombre` - Correcciones urgentes
- `release/RX` - Preparación de releases

### Merge Requirements
- Todos los tests pasan (local + CI workflows)
- Code review aprobado
- Conflictos resueltos
- Documentación actualizada
- **Validación de seguridad MANDATORIA**: `yarn repo:merge:validate` o `/merge-safety`
- CI/CD validation: pr-validation.yml (5-8 min) debe pasar

## 💡 Tips para Contribuidores

### Primeras Contribuciones
- Busca issues etiquetados como "good first issue"
- Lee la documentación completa
- Pregunta si tienes dudas
- Empieza con cambios pequeños

### Comunicación
- Sé respetuoso y constructivo
- Usa español para discusiones de producto
- Usa inglés para comentarios técnicos
- Proporciona contexto suficiente

### Herramientas Útiles
- [Claude Code](https://claude.ai/code) - AI assistant para desarrollo
- **Comandos slash para workflows**: `/task-dev T-XX`, `/review-complete`, `/pr-flow`, `/merge-safety`
- **Tools de navegación**: `tools/task-navigator.sh T-XX`, `tools/progress-dashboard.sh`
- **Namespace commands**: 185/185 operacionales (100% success rate)

### 🚀 Performance Optimizado

**Local Development** (54% faster execution):
```bash
yarn qa:gate                          # ~70s pipeline completo
yarn qa:gate:fast                     # ~30s validation esencial
yarn fe:lint:fix && yarn be:format    # ~5-15s quick fixes
```

**CI/CD Performance**:
- **PR Validation**: 5-8 min (feedback rápido)
- **Integration Testing**: 10-15 min (testing integral)
- **Zero Overlap**: Sin ejecución redundante de workflows

## 🏆 Reconocimientos

Los contribuidores son reconocidos en:
- README principal del proyecto
- Changelog de releases
- Hall of Fame de contribuidores

## 📞 Soporte

¿Necesitas ayuda?
- [Documentación completa](../README.md)
- [Issues de GitHub](https://github.com/BriamV/AI-Doc-Editor/issues)
- [Discusiones](https://github.com/BriamV/AI-Doc-Editor/discussions)

---

¡Gracias por contribuir al AI Doc Editor! 🚀