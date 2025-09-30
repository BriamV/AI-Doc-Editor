---
task_id: "T-08"
titulo: "Action Palette + IA Cmds"
estado: "Pendiente"
dependencias: "T-07, T-41"
prioridad: "Alta"
release_target: "Release 2"
complejidad: 12
descripcion: "Dotar al editor de una paleta de acciones (similar a VS Code) que permita al usuario invocar comandos de IA para reescribir, resumir, expandir o modificar el texto seleccionado."

# Technical Details
detalles_tecnicos: |
  **UI:** Librería como cmdk para la paleta de acciones.
  **Backend:** Endpoint POST /rewrite que recibe texto, un comando y contexto.
  **IA:** Prompts específicos para cada comando de reescritura.
  **QA:** Test harness para validar la calidad de la salida de los comandos (ROUGE-L).

# Test Strategy
estrategia_test: |
  **Unit Tests (Jest):** Probar los comandos de reescritura con textos "golden" para verificar la calidad semántica (ROUGE-L).
  **Integration Tests:** Probar el flujo completo desde la paleta de acciones hasta la actualización del texto en el editor.

# Documentation
documentacion: |
  Documentar los comandos de IA disponibles y su funcionamiento.

# Acceptance Criteria
criterios_aceptacion: |
  El comando /resume reduce el texto en al menos un 20% y obtiene un score ROUGE-L ≥ 0.7 contra un resumen de referencia.
  Un test demuestra que una reescritura que introduce una incoherencia contextual es marcada o rechazada por el sistema.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration) pasan.
  Documentación de comandos completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP1-T08-ST1"
    description: "Integrar una paleta de acciones (ej. cmdk) en el editor y registrar los 8 comandos básicos."
    complejidad: 4
    entregable: "La paleta de acciones se abre con un atajo de teclado y muestra los comandos disponibles."
    status: "pendiente"
  - id: "R2.WP1-T08-ST2"
    description: "Implementar el endpoint de backend /rewrite que toma texto y un comando (ej. "summarize") y devuelve el texto reescrito."
    complejidad: 4
    entregable: "Colección Postman que prueba el endpoint /rewrite con diferentes comandos y verifica las respuestas."
    status: "pendiente"
  - id: "R2.WP1-T08-ST3"
    description: "Crear el test harness con ROUGE-L para validar la calidad de los comandos de reescritura."
    complejidad: 4
    entregable: "Script de test que ejecuta el comando /resume sobre un texto de referencia y falla si ROUGE-L < 0.7."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:17Z"
  checksum: "072fc86bedb2bf99216c1e3dfa6729c1a066371e9752fa19fd9bba9044daa6fd"
  version: "1758753377"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-08: Action Palette + IA Cmds

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 2
**Complejidad Total:** 12

## Descripción
Dotar al editor de una paleta de acciones (similar a VS Code) que permita al usuario invocar comandos de IA para reescribir, resumir, expandir o modificar el texto seleccionado.

## Detalles Técnicos
**UI:** Librería como cmdk para la paleta de acciones.
**Backend:** Endpoint POST /rewrite que recibe texto, un comando y contexto.
**IA:** Prompts específicos para cada comando de reescritura.
**QA:** Test harness para validar la calidad de la salida de los comandos (ROUGE-L).

## Estrategia de Test
**Unit Tests (Jest):** Probar los comandos de reescritura con textos "golden" para verificar la calidad semántica (ROUGE-L).
**Integration Tests:** Probar el flujo completo desde la paleta de acciones hasta la actualización del texto en el editor.

## Documentación Requerida
Documentar los comandos de IA disponibles y su funcionamiento.

## Criterios de Aceptación
El comando /resume reduce el texto en al menos un 20% y obtiene un score ROUGE-L ≥ 0.7 contra un resumen de referencia.
Un test demuestra que una reescritura que introduce una incoherencia contextual es marcada o rechazada por el sistema.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration) pasan.
Documentación de comandos completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP1-T08-ST1"
- description: "Integrar una paleta de acciones (ej. cmdk) en el editor y registrar los 8 comandos básicos."
- complejidad: 4
- entregable: "La paleta de acciones se abre con un atajo de teclado y muestra los comandos disponibles."
- status: "pendiente"
### id: "R2.WP1-T08-ST2"
- description: "Implementar el endpoint de backend /rewrite que toma texto y un comando (ej. "summarize") y devuelve el texto reescrito."
- complejidad: 4
- entregable: "Colección Postman que prueba el endpoint /rewrite con diferentes comandos y verifica las respuestas."
- status: "pendiente"
### id: "R2.WP1-T08-ST3"
- description: "Crear el test harness con ROUGE-L para validar la calidad de los comandos de reescritura."
- complejidad: 4
- entregable: "Script de test que ejecuta el comando /resume sobre un texto de referencia y falla si ROUGE-L < 0.7."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:17 UTC*
*Validador: task-data-parser.sh v1.0*
