---
task_id: "T-10"
titulo: "Export Service"
estado: "Pendiente"
dependencias: "T-01"
prioridad: "Media"
release_target: "Release 4"
complejidad: 10
descripcion: "Crear un servicio asíncrono que permita a los usuarios exportar sus documentos (que están en formato Markdown) a formatos comunes como PDF y DOCX."

# Technical Details
detalles_tecnicos: |
  **Asincronía:** Celery con un broker (Redis o RabbitMQ).
  **Conversión:** Librería Pandoc.
  **UI:** Botón de exportación y notificaciones "toast" para informar al usuario del progreso.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Una tarea de Celery que toma un string Markdown y verifica que los archivos PDF y DOCX generados son válidos.
  **E2E Tests (Cypress):** Probar el flujo desde el clic en "Exportar" hasta la descarga del archivo.

# Documentation
documentacion: |
  ADR sobre la elección de Celery y Pandoc.

# Acceptance Criteria
criterios_aceptacion: |
  El archivo PDF generado se abre en visores estándar sin advertencias de formato.
  El archivo DOCX generado pasa la validación del validador de OpenXML.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, E2E) pasan.
  Documentación (ADR) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R4.WP1-T10-ST1"
    description: "Configurar Celery y un broker (ej. Redis/RabbitMQ) para gestionar tareas asíncronas de exportación."
    complejidad: 4
    entregable: "Tarea de prueba "hello world" se ejecuta correctamente a través de Celery."
    status: "pendiente"
  - id: "R4.WP1-T10-ST2"
    description: "Implementar la tarea de Celery que utiliza Pandoc para convertir el contenido Markdown a PDF y DOCX."
    complejidad: 4
    entregable: "La tarea toma un string Markdown y genera un fichero PDF y DOCX válidos."
    status: "pendiente"
  - id: "R4.WP1-T10-ST3"
    description: "Integrar la funcionalidad en la UI con un botón de "Exportar" y un toast de notificación de progreso."
    complejidad: 2
    entregable: "Test Cypress que hace clic en "Exportar", verifica que se muestra el toast y que el archivo se descarga al completarse."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:23Z"
  checksum: "c71c4fb773a2fc89836acf6e586a29cf2b027041c64f7496ddef387d98782bef"
  version: "1758753383"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-10: Export Service

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Media
**Release Target:** Release 4
**Complejidad Total:** 10

## Descripción
Crear un servicio asíncrono que permita a los usuarios exportar sus documentos (que están en formato Markdown) a formatos comunes como PDF y DOCX.

## Detalles Técnicos
**Asincronía:** Celery con un broker (Redis o RabbitMQ).
**Conversión:** Librería Pandoc.
**UI:** Botón de exportación y notificaciones "toast" para informar al usuario del progreso.

## Estrategia de Test
**Integration Tests:** Una tarea de Celery que toma un string Markdown y verifica que los archivos PDF y DOCX generados son válidos.
**E2E Tests (Cypress):** Probar el flujo desde el clic en "Exportar" hasta la descarga del archivo.

## Documentación Requerida
ADR sobre la elección de Celery y Pandoc.

## Criterios de Aceptación
El archivo PDF generado se abre en visores estándar sin advertencias de formato.
El archivo DOCX generado pasa la validación del validador de OpenXML.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, E2E) pasan.
Documentación (ADR) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R4.WP1-T10-ST1"
- description: "Configurar Celery y un broker (ej. Redis/RabbitMQ) para gestionar tareas asíncronas de exportación."
- complejidad: 4
- entregable: "Tarea de prueba "hello world" se ejecuta correctamente a través de Celery."
- status: "pendiente"
### id: "R4.WP1-T10-ST2"
- description: "Implementar la tarea de Celery que utiliza Pandoc para convertir el contenido Markdown a PDF y DOCX."
- complejidad: 4
- entregable: "La tarea toma un string Markdown y genera un fichero PDF y DOCX válidos."
- status: "pendiente"
### id: "R4.WP1-T10-ST3"
- description: "Integrar la funcionalidad en la UI con un botón de "Exportar" y un toast de notificación de progreso."
- complejidad: 2
- entregable: "Test Cypress que hace clic en "Exportar", verifica que se muestra el toast y que el archivo se descarga al completarse."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:23 UTC*
*Validador: task-data-parser.sh v1.0*
