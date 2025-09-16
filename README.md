# <p align="center">AI Doc Editor</p>

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

## 🚀 Características Principales

- **Generación de Documentos con IA**: Utiliza GPT-4o para crear documentos a partir de prompts o plantillas predefinidas.
- **RAG (Retrieval-Augmented Generation)**: Integración con base de conocimiento vectorial para respuestas contextuales.
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
   yarn run cmd dev
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

- **Frontend**: React 18 + TypeScript + Monaco Editor
- **Backend**: FastAPI 3.11
- **Base de Datos**: SQLite (datos de usuario) + Chroma (vector store)
- **Autenticación**: OAuth 2.0 (Google/Microsoft)
- **IA**: OpenAI GPT-4o / GPT-4o-mini con ventana de contexto de 128k tokens
- **Automatización**: Scripts Node.js modulares para desarrollo, pruebas, construcción y despliegue
- **Gobernanza**: Validación de API y generación de matrices de trazabilidad en múltiples formatos (XLSX, JSON, Markdown)

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
yarn run cmd docker-prod
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

### ¿Cómo utilizo los scripts de desarrollo?

El proyecto utiliza un sistema modular de scripts Node.js para todas las tareas de desarrollo, pruebas, construcción y despliegue. Consulta la [documentación de scripts](scripts/README.md) para ver todos los comandos disponibles.

Ejemplos de comandos comunes:

```bash
# Iniciar servidor de desarrollo
yarn run cmd dev

# Ejecutar pruebas
yarn run cmd test

# Verificar calidad del código
yarn run cmd qa-gate

# Construir para producción
yarn run cmd build

# Generar matriz de trazabilidad en todos los formatos
yarn run cmd traceability

# Generar matriz de trazabilidad en formato específico
yarn run cmd traceability --format=xlsx  # Solo Excel
yarn run cmd traceability --format=json  # Solo JSON
yarn run cmd traceability --format=md    # Solo Markdown

# Ver todos los comandos disponibles
yarn run cmd help
```

## 🤝 Agradecimientos

Este proyecto es un fork mejorado de [AI Text Editor](https://github.com/darrylschaefer/ai-text-editor) por Darryl Schaefer, que a su vez se inspiró en [BetterChatGPT](https://github.com/ztjhz/BetterChatGPT).

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).
