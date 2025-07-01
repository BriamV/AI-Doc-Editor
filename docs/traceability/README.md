# Matriz de Trazabilidad

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

## 🌟 Características

La matriz de trazabilidad proporciona un mapeo entre requisitos, tareas y pruebas, permitiendo:

- ✅ **Seguimiento completo**: Verificar que todos los requisitos están implementados y probados
- ✅ **Múltiples formatos**: Generar la matriz en XLSX, JSON y Markdown para diferentes usos
- ✅ **Integración con IDEs**: Visualización directa en editores de código con soporte Markdown
- ✅ **Automatización**: Integración con scripts y herramientas mediante formato JSON
- ✅ **Reportes formales**: Generación de informes en Excel para presentaciones y documentación

## 🚀 Uso

### Generación de matriz de trazabilidad en todos los formatos

```bash
# Usando yarn
yarn traceability

# Usando el CLI unificado
yarn run cmd traceability

# Especificando directorio de salida
yarn traceability --output=./docs/custom-dir
```

### Generación en formatos específicos

#### Formato Excel (XLSX)

```bash
# Usando yarn
yarn traceability:xlsx

# Usando el CLI unificado
yarn run cmd traceability --format=xlsx
```

#### Formato JSON

```bash
# Usando yarn
yarn traceability:json

# Usando el CLI unificado
yarn run cmd traceability --format=json
```

#### Formato Markdown

```bash
# Usando yarn
yarn traceability:md

# Usando el CLI unificado
yarn run cmd traceability --format=md
```

## 📊 Estructura de los archivos generados

### Formato XLSX

El archivo `traceability.xlsx` contiene tres hojas:

1. **Traceability Matrix**: Mapeo completo entre requisitos, tareas y pruebas
2. **Summary**: Resumen estadístico con totales y porcentaje de cobertura
3. **Requirements Breakdown**: Desglose de requisitos por categoría

### Formato JSON

El archivo `traceability.json` contiene un array de objetos con la siguiente estructura:

```json
[
  {
    "reqId": "USR-001",
    "requirement": "OAuth 2.0 Google/MS + JWT",
    "taskId": "T-02",
    "taskName": "OAuth 2.0 + JWT con Roles y Refresh Token",
    "testFile": "cypress/e2e/auth.cy.ts",
    "testName": "OAuth login flow",
    "status": "Planned",
    "release": "R0.WP2",
    "adr": "ADR-009"
  },
  // ... más elementos
]
```

### Formato Markdown

El archivo `traceability.md` contiene:

1. **Tabla principal**: Mapeo entre requisitos, tareas y pruebas
2. **Resumen**: Estadísticas generales
3. **Desglose por categoría**: Distribución de requisitos por tipo

## 🔄 Integración en flujos de trabajo

### Verificación de gobernanza

La matriz de trazabilidad forma parte del proceso de gobernanza:

```bash
yarn run cmd governance
```

Este comando ejecuta tanto la validación de la especificación OpenAPI como la generación de la matriz de trazabilidad.

### Integración en CI/CD

Para integrar en pipelines de CI/CD, se recomienda usar:

```bash
yarn traceability --format=json --output=./reports/traceability
```

### Visualización en IDEs

Para una mejor experiencia de desarrollo, el formato Markdown permite visualizar la matriz directamente en IDEs como VS Code:

```bash
yarn traceability:md
```

## 📝 Personalización

### Fuentes de datos

Los datos de trazabilidad se obtienen del módulo `generate-traceability-data.cjs`, que:

1. Intenta extraer datos de archivos PRD y WORK-PLAN
2. Si no están disponibles, utiliza datos de ejemplo predefinidos

Para personalizar las fuentes de datos, modifica este módulo para conectarlo con tus sistemas de gestión de requisitos y tareas.

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT.

## 🔮 Next Steps

1. **Integración en CI/CD**: Considerar la integración de la generación de trazabilidad en múltiples formatos en los pipelines de CI/CD.
2. **Mejora de la visualización**: Explorar opciones para mejorar la visualización de la matriz de trazabilidad en Markdown y JSON.
3. **Automatización adicional**: Considerar la automatización de la actualización de la matriz de trazabilidad cuando se modifiquen requisitos o tareas.
