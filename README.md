# <p align="center">AI Doc Editor</p>

## ⚠️ Status Notice

**Current Status**: Production-ready AI-powered document editor with comprehensive development toolchain
**Architecture**: React 18 + TypeScript + Python FastAPI + AI integration
**Role**: User-facing application with multi-tier documentation and infrastructure support

<p align="center">
  <img src="https://github.com/BriamV/AI-Doc-Editor/raw/main/public/icon-rounded.png" width="100" alt="AI Doc Editor Logo">
</p>

<p align="center">Editor de documentos con IA que permite generar, editar y exportar documentos seguros con capacidades avanzadas de procesamiento de lenguaje natural.</p>

<p align="center">
  <a href="#características-principales">Características</a> •
  <a href="#requisitos">Requisitos</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#uso">Uso</a> •
  <a href="#contribuir">Contribuir</a> •
  <a href="#licencia">Licencia</a>
</p>

## 🔍 Visión General

Este proyecto es un fork mejorado de [AI Text Editor](https://github.com/darrylschaefer/ai-text-editor), diseñado específicamente para la generación y edición de documentos.

### 📚 Documentation Navigation (4-Tier Architecture)

| Tier | Location | Purpose | Target Audience |
|------|----------|---------|----------------|
| **Tier 1** | [Root README](README.md) | **User-facing guide and installation** | **End users and contributors** |
| **Tier 2** | [Frontend Docs](src/docs/) | React implementation details | Frontend developers |
| **Tier 3** | [Backend Docs](backend/docs/) | API and database architecture | Backend developers |
| **Tier 4** | [Infrastructure](tools/README.md) | Cross-platform utilities | DevOps and infrastructure |

**Cross-References:**
- **[Development Guide](CLAUDE.md)** - Comprehensive developer setup and workflow
- **[Architecture Documentation](docs/architecture/)** - Technical design and ADRs
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Contribution guidelines and standards

## 🚀 Características Principales

- **Generación de Documentos con IA**: Utiliza GPT-4o para crear documentos a partir de prompts o plantillas predefinidas.
- **Generación en Tiempo Real**: Respuestas de IA con streaming para mejor experiencia de usuario.
- **Editor Markdown Avanzado**: Basado en Monaco Editor con vista previa en tiempo real.
- **Exportación Segura**: Soporte para exportar a múltiples formatos (PDF, DOCX, MD) con cifrado.
- **Versionado y Auditoría**: Historial de cambios completo con capacidad de rollback.
- **Autenticación OAuth 2.0**: Soporte para inicio de sesión con Google/Microsoft.

## 📋 Requisitos

- Node.js 18+
- Python 3.11+
- Docker (opcional, para despliegue)
- Cuenta de OpenAI con API key

## 🛠️ Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/BriamV/AI-Doc-Editor.git
   cd AI-Doc-Editor
   ```

2. Instala las dependencias del frontend. **Nota: Este proyecto utiliza `yarn` para asegurar la correcta resolución de dependencias.**

   ```bash
   yarn install
   ```

3. Configura las variables de entorno (copia el archivo .env.example):

   ```bash
   cp .env.example .env
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   yarn dev
   ```

## 🚀 Uso

1. Inicia sesión con tu cuenta de Google o Microsoft.
2. Crea un nuevo documento o selecciona una plantilla.
3. Usa comandos de IA para generar o modificar contenido.
4. Exporta tu documento en el formato deseado.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [guía de contribución](docs/CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

## 🙏 Créditos

- Basado en [AI Text Editor](https://github.com/darrylschaefer/ai-text-editor) por Darryl Schaefer
- Icono por [Icons8](https://icons8.com)

## 📊 Características Técnicas

### Arquitectura

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Monaco Editor
- **Backend**: Python FastAPI + SQLAlchemy + Alembic
- **AI Integration**: OpenAI Chat Completions (GPT-4o, GPT-4, GPT-3.5-turbo) + Frontend Streaming
- **Desktop**: Electron + auto-updater
- **State Management**: Zustand + IndexedDB encryption
- **Base de Datos**: SQLite (datos de usuario) + Chroma (vector store)
- **Autenticación**: OAuth 2.0 (Google/Microsoft)
- **Testing**: Playwright E2E + Jest unit tests
- **Quality Tools**: 40+ integrated tools (ESLint, Prettier, Black, Ruff, Semgrep, etc.)
- **Infrastructure**: Cross-platform scripts, merge protection, automated hooks

### Seguridad

- Cifrado en tránsito (TLS 1.3+)
- Cifrado en reposo (AES-256)
- Almacenamiento local seguro de claves API
- Auditoría de acciones de usuario

## 🌐 Despliegue

### Requisitos del Sistema

- **CPU**: 2+ núcleos
- **RAM**: 4GB+ (8GB recomendado)
- **Almacenamiento**: 50GB+ (dependiendo del volumen de documentos)
- **Sistema Operativo**: Linux/Windows/macOS

### Despliegue con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/BriamV/AI-Doc-Editor.git
cd AI-Doc-Editor

# Crear archivo .env
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar con Docker Compose
yarn docker:prod
```

## 📈 Métricas y Monitoreo

El sistema incluye un dashboard con métricas clave:

- Uso de tokens de OpenAI
- Tiempo medio de generación
- Uso de almacenamiento
- Auditoría de acciones

## ❓ Preguntas Frecuentes

### ¿Cómo se almacenan mis documentos?

Tus documentos se almacenan localmente en tu dispositivo. Solo se envían a los servidores de OpenAI cuando utilizas funciones de IA, y siempre con tu consentimiento explícito.

### ¿Es compatible con estándares de seguridad?

Sí, el sistema está diseñado para cumplir con GDPR, HIPAA e ISO 27001, con características como:

- Cifrado de extremo a extremo
- Registro de auditoría completo
- Políticas de retención de datos

### ¿Cómo puedo contribuir al proyecto?

Consulta nuestra [guía de contribución](docs/CONTRIBUTING.md) para más detalles sobre cómo contribuir con código, reportar errores o sugerir mejoras.

### ¿Cómo utilizo los comandos de desarrollo?

El proyecto utiliza comandos directos de yarn y comandos slash para desarrollo. Consulta la [documentación de desarrollo](CLAUDE.md) para ver todos los comandos disponibles.

**Comandos Esenciales:**

```bash
# Desarrollo
yarn dev                          # Iniciar servidor de desarrollo
yarn build                        # Construir para producción
yarn test                         # Ejecutar todas las pruebas
yarn test:e2e                     # Pruebas E2E con Playwright

# Calidad de Código
yarn lint                         # Validar frontend
yarn tsc-check                    # Verificar TypeScript
yarn python-quality               # Validar backend Python
yarn quality-gate                 # Pipeline completo de calidad
yarn security-scan                # Auditoría de seguridad

# Protección de Fusiones (OBLIGATORIO antes de merge)
yarn merge-safety-full            # Validación completa de seguridad
yarn install-merge-hooks          # Instalar protección git

# Documentación y Trazabilidad
# Usar comandos slash en lugar de scripts:
/docs-update                      # Actualizar documentación y matrices
/health-check                     # Diagnóstico del sistema
/context-analyze                  # Análisis del proyecto
```

**Comandos Slash Avanzados:**
```bash
/task-dev T-XX                    # Desarrollo de tareas con contexto
/review-complete --scope T-XX     # Revisión multi-agente
/commit-smart                     # Commits inteligentes
/merge-safety                     # Protección de fusiones
```

## 🤝 Agradecimientos

Este proyecto es un fork mejorado de [AI Text Editor](https://github.com/darrylschaefer/ai-text-editor) por Darryl Schaefer, que a su vez se inspiró en [BetterChatGPT](https://github.com/ztjhz/BetterChatGPT).

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).
