---
task_id: "T-49"
titulo: "Document Library UI - Knowledge Base Management"
estado: "Planificado"
dependencias: "T-04"
prioridad: "Alta"
release_target: "Release 1 (Post-T-04)"
complejidad: 8
descripcion: "Implementar interfaz de usuario para visualizar la biblioteca de documentos subidos al sistema RAG, cumpliendo el criterio de aceptación T-04.3 'Metadatos correctos visibles en la UI post-carga'. Esta tarea es emergent work Class B detectado durante la implementación de T-04."

# Technical Details
detalles_tecnicos: |
  **Frontend:** React 18 + TypeScript + Zustand + shadcn/ui components.
  **Páginas:** DocumentLibrary.tsx (lista de documentos con metadatos).
  **Componentes:** UploadForm.tsx (drag & drop upload), DocumentCard.tsx (tarjeta de metadatos).
  **API Integration:** POST /api/upload (existente), GET /api/documents (nuevo endpoint backend).
  **Validación:** MIME type (PDF/DOCX/MD), tamaño ≤50MB, progress feedback.

# Test Strategy
estrategia_test: |
  **Unit Tests (Vitest):** document-slice.test.ts, UploadForm.test.tsx, DocumentCard.test.tsx.
  **E2E Tests (Playwright):** document-library.spec.ts (flujo completo upload → visualización).
  **Acceptance Tests:** Criterio T-04.3 - metadatos visibles post-carga (screenshot + test E2E).
  **Performance:** Lighthouse audit (Performance ≥90, Accessibility ≥90).

# Documentation
documentacion: |
  Actualizar OpenAPI para GET /api/documents.
  README frontend: src/pages/README.md (Document Library usage).
  Actualizar ACTA-CERT-T04-20251001.md (criterio de aceptación #3 cumplido).

# Acceptance Criteria
criterios_aceptacion: |
  Metadatos visibles en UI post-carga (original_filename, file_type, file_size_bytes, status, uploaded_at).
  Upload form funcional con drag & drop, validación frontend y progress bar.
  Estados de procesamiento visibles (processing: amarillo, completed: verde, failed: rojo).
  Lighthouse: Performance ≥90, Accessibility ≥90.
  Unit tests ≥85% coverage, E2E tests 100% critical paths.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado (2+ revisores).
  Todos los tests (unit, E2E) pasan.
  Backend GET /api/documents implementado (2h).
  Documentación (OpenAPI, README) completada.
  ACTA-CERT-T04 actualizada (criterio #3 cumplido).
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP1-T49-ST1"
    description: "Crear página Document Library con lista de documentos, filtros básicos (tipo, fecha) y paginación."
    complejidad: 3
    entregable: "Página React que renderiza lista de documentos con metadatos (filename, tipo, tamaño, fecha, estado)."
    status: "pendiente"
  - id: "R1.WP1-T49-ST2"
    description: "Implementar componente Upload Form con drag & drop, validación frontend y progress bar."
    complejidad: 3
    entregable: "Componente funcional que permite upload de archivos con feedback visual y validación."
    status: "pendiente"
  - id: "R1.WP1-T49-ST3"
    description: "Crear componente Document Card para visualización de metadatos individuales con badges de estado."
    complejidad: 2
    entregable: "Componente de tarjeta que muestra metadatos con estados visuales diferenciados."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "Emergent Work - T-04 Gap Analysis"
  extraction_date: "2025-10-07T23:59:00Z"
  checksum: "emergent_work_class_b"
  version: "1"
  migration_phase: "Emergent-R1"
  validator: "manual-tech-lead"
---

# Task T-49: Document Library UI - Knowledge Base Management

## Estado Actual
**Estado:** Planificado (Emergent Work - Class B)
**Prioridad:** Alta (Completa criterio de aceptación T-04)
**Release Target:** Release 1 (Inmediatamente post-T-04)
**Complejidad Total:** 8 puntos

## Descripción
Implementar interfaz de usuario para visualizar la biblioteca de documentos subidos al sistema RAG, cumpliendo el criterio de aceptación T-04.3 'Metadatos correctos visibles en la UI post-carga'. Esta tarea es emergent work Class B detectado durante la implementación de T-04.

## Detalles Técnicos
**Frontend:** React 18 + TypeScript + Zustand + shadcn/ui components.
**Páginas:** DocumentLibrary.tsx (lista de documentos con metadatos).
**Componentes:** UploadForm.tsx (drag & drop upload), DocumentCard.tsx (tarjeta de metadatos).
**API Integration:** POST /api/upload (existente), GET /api/documents (nuevo endpoint backend).
**Validación:** MIME type (PDF/DOCX/MD), tamaño ≤50MB, progress feedback.

## Estrategia de Test
**Unit Tests (Vitest):** document-slice.test.ts, UploadForm.test.tsx, DocumentCard.test.tsx.
**E2E Tests (Playwright):** document-library.spec.ts (flujo completo upload → visualización).
**Acceptance Tests:** Criterio T-04.3 - metadatos visibles post-carga (screenshot + test E2E).
**Performance:** Lighthouse audit (Performance ≥90, Accessibility ≥90).

## Documentación Requerida
Actualizar OpenAPI para GET /api/documents.
README frontend: src/pages/README.md (Document Library usage).
Actualizar ACTA-CERT-T04-20251001.md (criterio de aceptación #3 cumplido).

## Criterios de Aceptación
Metadatos visibles en UI post-carga (original_filename, file_type, file_size_bytes, status, uploaded_at).
Upload form funcional con drag & drop, validación frontend y progress bar.
Estados de procesamiento visibles (processing: amarillo, completed: verde, failed: rojo).
Lighthouse: Performance ≥90, Accessibility ≥90.
Unit tests ≥85% coverage, E2E tests 100% critical paths.

## Definición de Hecho (DoD)
Código revisado y aprobado (2+ revisores).
Todos los tests (unit, E2E) pasan.
Backend GET /api/documents implementado (2h).
Documentación (OpenAPI, README) completada.
ACTA-CERT-T04 actualizada (criterio #3 cumplido).
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R1.WP1-T49-ST1"
- description: "Crear página Document Library con lista de documentos, filtros básicos (tipo, fecha) y paginación."
- complejidad: 3
- entregable: "Página React que renderiza lista de documentos con metadatos (filename, tipo, tamaño, fecha, estado)."
- status: "pendiente"
### id: "R1.WP1-T49-ST2"
- description: "Implementar componente Upload Form con drag & drop, validación frontend y progress bar."
- complejidad: 3
- entregable: "Componente funcional que permite upload de archivos con feedback visual y validación."
- status: "pendiente"
### id: "R1.WP1-T49-ST3"
- description: "Crear componente Document Card para visualización de metadatos individuales con badges de estado."
- complejidad: 2
- entregable: "Componente de tarjeta que muestra metadatos con estados visuales diferenciados."
- status: "pendiente"

---
*Emergent Work detectado durante T-04 implementation*
*Fecha de creación: 2025-10-07*
*Clasificación: Class B - Quality Enhancement*
