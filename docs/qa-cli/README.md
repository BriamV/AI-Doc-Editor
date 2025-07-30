# QA CLI System Documentation

**Sistema de Automatización QA para Desarrollo con Agentes IA**

Documentación completa del sistema QA CLI implementado según el PRD-QA CLI.md y completado en el Release 0.4.0 (R0.WP6).

## 📚 Documentación Disponible

### 🚀 Para Usuarios
- **[Guía de Usuario](user-guide.md)** - Casos de uso, ejemplos prácticos y workflows completos
- **[Referencia de API](api-reference.md)** - Comandos, flags y opciones detalladas
- **[Solución de Problemas](troubleshooting.md)** - FAQs y resolución de errores comunes

### 🔧 Para Desarrolladores e Integradores
- **[Integración de Workflows](workflow-integration.md)** - DoD, CI/CD y Feedback (T-13, T-14, T-15)
- **[Guía de Configuración](../QA-SETUP-GUIDE.md)** - Setup completo del entorno QA

### 📋 Documentación Técnica
- **[PRD QA CLI](../PRD-QA%20CLI.md)** - Especificaciones completas del producto
- **[Plan de Trabajo](../WorkPlan%20QA%20CLI.md)** - Plan de implementación por releases

## 🎯 Release 0.4.0: Workflow & Integration (COMPLETADO)

El **R0.WP6** ha sido **100% completado** según las especificaciones del PRD, incluyendo:

### ✅ T-13: DoD Configuration & Validation
- Configuración y validación de Definition of Done
- Mapeo automático de etiquetas DoD a dimensiones de validación
- Soporte para `dod:code-review`, `dod:all-tests`, y mapeos personalizados

### ✅ T-14: CI/CD Integration (GitHub Actions)
- Workflow GitHub Actions reutilizable (`reusable-qa.yml`)
- Integración automática en Pull Requests como QA Gate
- Soporte multi-modo: fast, full, dod, automático

### ✅ T-15: Feedback Mechanism (--report-issue)
- Sistema completo de reporte de issues local y GitHub
- Templates pre-configurados para reportes de problemas
- Integración cross-platform (Windows, Linux, macOS)

## 🚀 Inicio Rápido

```bash
# Ejecutar validación automática
yarn run cmd qa

# Validación rápida (pre-commit)
yarn run cmd qa --fast

# Validación con Definition of Done
yarn run cmd qa --dod code-review

# Reportar un problema
yarn run cmd qa --report-issue

# Ayuda completa
yarn run cmd qa --help
```

## 📊 Arquitectura del Sistema

El sistema sigue el patrón **"Orquestador Inteligente sobre Herramientas Externas"**:

```
scripts/qa/
├── qa-cli.cjs              # Entry point CLI
├── core/
│   ├── Orchestrator.cjs    # Coordinador principal
│   ├── PlanSelector.cjs    # Selector de dimensiones
│   ├── modes/
│   │   ├── DoDMode.cjs     # T-13: Modo Definition of Done
│   │   └── ...
│   ├── feedback/
│   │   ├── FeedbackManager.cjs  # T-15: Sistema de feedback
│   │   └── TemplateManager.cjs
│   └── execution/
├── templates/
│   └── report-issue.md     # T-15: Template de reportes
└── tests/
```

## 🛠 Herramientas Integradas

### Dimensiones de Validación
- **Error Detection**: ESLint, Prettier, Pylint, Black (vía MegaLinter)
- **Testing & Coverage**: Jest (Frontend), Pytest (Backend)
- **Build & Dependencies**: npm/yarn, TypeScript, pip
- **Security & Audit**: Snyk, Semgrep
- **Design Metrics**: Complejidad ciclomática, LOC, longitud de línea
- **Data & Compatibility**: Spectral (OpenAPI), migraciones DB

### Modos de Ejecución
- **Automático**: Basado en contexto detectado (tipo de rama, archivos modificados)
- **Por Scope**: Validación de directorios/archivos específicos
- **Rápido**: Optimizado para pre-commit hooks
- **Definition of Done**: Validación contra criterios DoD específicos

## 🔄 Integración CI/CD

El sistema se integra completamente en pipelines CI/CD:

```yaml
# En tu workflow de GitHub Actions
- name: QA Validation
  uses: ./.github/workflows/reusable-qa.yml
  with:
    mode: 'dod'
    dod-config: 'code-review'
```

## 📈 Métricas y Rendimiento

### Objetivos de Performance (RNF-002)
- **Regresión**: <20% incremento sobre baseline
- **Modo Rápido**: P95 < 15s para cambios típicos (≤10 archivos)
- **Escalabilidad**: Tiempo sub-lineal con paralelización

### KPIs Monitoreados
- Tasa de falsos positivos: <5%
- Cobertura de pruebas: >80%
- Vulnerabilidades críticas: 0
- Adopción por Agentes IA: >90%

## 🆘 Soporte y Contribuciones

- **Reportar Issues**: `yarn run cmd qa --report-issue`
- **Documentación**: Esta carpeta (`docs/qa-cli/`)
- **Desarrollo**: Ver [CONTRIBUTING.md](../CONTRIBUTING.md)

## 📜 Licencia y Créditos

Implementado según especificaciones del **PRD-QA CLI.md** como parte del proyecto AI-Doc-Editor.

---

**Estado**: ✅ R0.WP6 Completado (Release 0.4.0)  
**Próximo**: R1.WP1 Production Ready (T-16, T-17)