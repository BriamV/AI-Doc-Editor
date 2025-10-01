---
task_id: "T-34"
titulo: "Usability Testing"
estado: "Pendiente"
dependencias: "T-10, T-21"
prioridad: "Crítica"
release_target: "Release 6"
complejidad: 11
descripcion: "Realizar una ronda de pruebas de usabilidad formales con usuarios reales para evaluar la experiencia de usuario del producto y recopilar feedback para mejoras finales."

# Technical Details
detalles_tecnicos: |
  **Metodología:** Pruebas de usuario moderadas.
  **Participantes:** 5 usuarios del perfil objetivo.
  **Métrica:** System Usability Scale (SUS).
  **Guion:** Definir un guion con tareas clave (ej. subir un archivo, generar un borrador, editar una sección, exportar).

# Test Strategy
estrategia_test: |
  Esta tarea es en sí misma una tarea de testing de usabilidad.

# Documentation
documentacion: |
  Plan de pruebas de usabilidad.
  Informe final de usabilidad con los hallazgos, el score SUS y las recomendaciones.

# Acceptance Criteria
criterios_aceptacion: |
  El score SUS promedio de la prueba es ≥ 80.
  Todos los usuarios participantes son capaces de completar el guion de tareas sin bloqueos críticos.
  Los hallazgos están documentados y se han creado propuestas de mejora para ser abordadas en T-40.

# Definition of Done
definicion_hecho: |
  Plan de pruebas aprobado.
  Sesiones de prueba completadas y grabadas.
  Informe de usabilidad finalizado y revisado por el equipo.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R6.WP3-T34-ST1"
    description: "Diseñar el plan de pruebas de usabilidad: reclutar 5 usuarios, definir el guion de tareas y preparar el entorno."
    complejidad: 3
    entregable: "Documento del plan de pruebas aprobado por el Product Owner."
    status: "pendiente"
  - id: "R6.WP3-T34-ST2"
    description: "Ejecutar las sesiones de prueba piloto, grabar las sesiones (con consentimiento) y administrar la encuesta SUS."
    complejidad: 5
    entregable: "Grabaciones de las 5 sesiones y los resultados de las encuestas SUS recopilados."
    status: "pendiente"
  - id: "R6.WP3-T34-ST3"
    description: "Analizar los resultados, calcular el puntaje SUS promedio y redactar un informe con los hallazgos clave y recomendaciones."
    complejidad: 3
    entregable: "Informe de usabilidad finalizado, incluyendo el puntaje SUS y una lista de 3-5 mejoras recomendadas."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:53Z"
  checksum: "93c5c764c0c36fa7ff1026e13904928c06d91ceea1e1192db1581f2863ef8db5"
  version: "1758753472"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-34: Usability Testing

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 6
**Complejidad Total:** 11

## Descripción
Realizar una ronda de pruebas de usabilidad formales con usuarios reales para evaluar la experiencia de usuario del producto y recopilar feedback para mejoras finales.

## Detalles Técnicos
**Metodología:** Pruebas de usuario moderadas.
**Participantes:** 5 usuarios del perfil objetivo.
**Métrica:** System Usability Scale (SUS).
**Guion:** Definir un guion con tareas clave (ej. subir un archivo, generar un borrador, editar una sección, exportar).

## Estrategia de Test
Esta tarea es en sí misma una tarea de testing de usabilidad.

## Documentación Requerida
Plan de pruebas de usabilidad.
Informe final de usabilidad con los hallazgos, el score SUS y las recomendaciones.

## Criterios de Aceptación
El score SUS promedio de la prueba es ≥ 80.
Todos los usuarios participantes son capaces de completar el guion de tareas sin bloqueos críticos.
Los hallazgos están documentados y se han creado propuestas de mejora para ser abordadas en T-40.

## Definición de Hecho (DoD)
Plan de pruebas aprobado.
Sesiones de prueba completadas y grabadas.
Informe de usabilidad finalizado y revisado por el equipo.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R6.WP3-T34-ST1"
- description: "Diseñar el plan de pruebas de usabilidad: reclutar 5 usuarios, definir el guion de tareas y preparar el entorno."
- complejidad: 3
- entregable: "Documento del plan de pruebas aprobado por el Product Owner."
- status: "pendiente"
### id: "R6.WP3-T34-ST2"
- description: "Ejecutar las sesiones de prueba piloto, grabar las sesiones (con consentimiento) y administrar la encuesta SUS."
- complejidad: 5
- entregable: "Grabaciones de las 5 sesiones y los resultados de las encuestas SUS recopilados."
- status: "pendiente"
### id: "R6.WP3-T34-ST3"
- description: "Analizar los resultados, calcular el puntaje SUS promedio y redactar un informe con los hallazgos clave y recomendaciones."
- complejidad: 3
- entregable: "Informe de usabilidad finalizado, incluyendo el puntaje SUS y una lista de 3-5 mejoras recomendadas."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:53 UTC*
*Validador: task-data-parser.sh v1.0*
