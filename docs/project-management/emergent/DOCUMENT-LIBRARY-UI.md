# Emergent Work: Document Library UI for RAG Knowledge Base

## Classification

**Class**: B - High Priority (Quality Enhancement - Completes T-04)
**Status**: 🟡 Approved - Post-T-04 Merge Execution
**Discovery Date**: October 7, 2025
**Planned Execution**: Immediate post-T-04 merge (October 2025)
**Related Task**: T-49 Document Library UI
**Tracking**: docs/tasks/T-49-STATUS.md

## Executive Summary

During T-04 (File Ingesta RAG + Perf) certification, a critical gap was identified: **WORK-PLAN v5 Acceptance Criterion #3** ("Metadatos correctos visibles en la UI después de la carga") is **not implemented**.

**Current State**:
- ✅ Backend API returns complete metadata (POST /api/upload response)
- ❌ Frontend UI does not display metadata visually

**Decision**: Create T-49 as emergent work to implement Document Library UI, completing T-04 acceptance criteria and enabling user validation of RAG ingestion.

## Business Value Quantification

### Quality Impact
| Metric | Before T-49 | After T-49 | Improvement |
|--------|-------------|------------|-------------|
| T-04 Acceptance Criteria Met | 2/3 (66.7%) | 3/3 (100%) | **+33.3%** |
| User Visibility of RAG Ingestion | 0% (blind) | 100% (full transparency) | **+100%** |
| Manual Validation Capability | Impossible | Enabled | **Qualitative** |
| User Feedback Loop | None | Real-time | **Qualitative** |

### ROI Calculation
**Investment**: 2-3 days development + testing (estimated $3,200 at $100/hour for 32h)
**Return**:
- **Completes T-04 officially** (unblocks R1 certification)
- **Enables early user testing** of RAG pipeline (2-3 weeks earlier)
- **Provides visual feedback** for processing status (UX improvement)
- **Reduces support burden** (users can self-diagnose upload issues)

**Estimated Value**: $6,000-9,000 from:
- Accelerated user testing and feedback ($4K)
- Reduced support/debugging time ($3K)
- Improved UX satisfaction ($2K)

**ROI**: 188-281% return on investment

### Risk Mitigation
- **Current Risk**: T-04 incomplete without criterion #3, cannot certify officially
- **Mitigation**: T-49 implements missing UI, completes all acceptance criteria
- **Impact**: No risk - all upstream dependencies (T-04 backend) completed

## Discovery Context

### Initial Assessment (T-04 Certification - October 7, 2025)

During ACTA-CERT-T04 creation, the following was documented:

**WORK-PLAN v5 Line 264 - T-04 Acceptance Criteria:**
```
3. Metadatos correctos visibles en la UI después de la carga.
```

**T-04-STATUS.md Line 35 - Acceptance Criteria:**
```
Los metadatos del documento (nombre, tipo) son visibles en la UI después de la carga.
```

**Gap Identified**:
- Backend implementation: ✅ Complete (DocumentResponse includes all metadata)
- Frontend implementation: ❌ Missing (no UI to display metadata)
- Test evidence: ❌ "test Cypress UI" not implemented

### Analysis of Existing Tasks

**Review of WORK-PLAN v5** (47 tasks analyzed):
- ❌ **No dedicated "Document Library UI" task** in releases R1-R6
- **T-07** (Editor UI Core): Focuses on document **editing**, not library
- **T-21** (Navigation): Sidebar Recent/Projects/Search, not knowledge base
- **T-37** (Admin Panel): User/system management, not document library

**Conclusion**: The UI gap is a **genuine emergent work** item, not covered by planned tasks.

## Gap Analysis Detail

### What Backend Provides (Already Implemented)

```typescript
// POST /api/upload response (backend/app/routers/upload.py:114-116)
interface DocumentResponse {
  id: string;                   // Document UUID
  original_filename: string;    // "ISO-9001-2015.pdf"
  file_type: string;            // "pdf", "docx", "md"
  mime_type: string;            // "application/pdf"
  file_size_bytes: number;      // 5242880 (5MB)
  title: string | null;         // Optional user-provided title
  description: string | null;   // Optional description
  status: string;               // "processing" | "completed" | "failed"
  user_id: string;              // User UUID (from JWT)
  user_email: string;           // "user@example.com"
  uploaded_at: string;          // "2025-10-07T23:45:00Z" (ISO 8601)
}
```

**API Integration Tests**: ✅ 90/90 passing (backend verified)
**Metadata Accuracy**: ✅ 100% (all fields correctly populated)

### What Frontend Lacks (Gap)

**Missing Components**:
1. **Document Library Page**: No page to list uploaded documents
2. **Upload Form UI**: No visual upload interface (only API)
3. **Metadata Display**: No cards/tables showing document info
4. **Status Indicators**: No visual feedback for processing state

**User Impact**:
- Users cannot see what documents they've uploaded
- No visual confirmation of successful upload
- Cannot verify processing status (processing/completed/failed)
- Cannot validate metadata correctness manually

## Technical Architecture

### Proposed Solution: T-49 Implementation

**Frontend Stack**:
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand (existing store pattern)
- **UI Components**: shadcn/ui (existing design system)
- **API Client**: Fetch API (existing pattern)

**New Components**:
```
src/
├── pages/
│   └── DocumentLibrary.tsx        # Main library page (ST1)
├── components/
│   ├── Upload/
│   │   ├── UploadForm.tsx         # Upload interface (ST2)
│   │   └── FileDropzone.tsx       # Drag & drop zone
│   └── Documents/
│       ├── DocumentCard.tsx       # Metadata card (ST3)
│       └── StatusBadge.tsx        # Status indicator
├── store/
│   └── document-slice.ts          # Zustand store
└── api/
    └── documents.ts               # API client
```

**Backend Addition** (Minimal):
```python
# backend/app/routers/documents.py (NEW - 2 hours)
@router.get("/documents")
async def list_documents(
    limit: int = 20,
    offset: int = 0,
    file_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> DocumentListResponse:
    """List user's uploaded documents with pagination and filters."""
    # Implementation: trivial query using existing Document model
```

### Scope Boundaries

**In Scope** ✅:
- Document list/grid view with metadata
- Upload form with drag & drop
- Filters: file type, date, status
- Pagination (10-20 items per page)
- Status badges (visual indicators)
- Basic actions: view details, delete

**Out of Scope** ❌ (Separate Tasks):
- **Document Preview/Viewer** → T-07 (Editor UI Core)
- **Search/Query RAG Interface** → Future RAG search task
- **Vector Store Admin UI** → T-37 (Admin Panel)
- **Batch Operations** → Advanced feature (not critical)
- **Document Versioning UI** → T-09 (Versioning & Diff)

## Detailed Breakdown

### ST1: Document Library Page (3 points)

**Implementation**:
```typescript
// src/pages/DocumentLibrary.tsx
export const DocumentLibrary = () => {
  const { documents, fetchDocuments, filters } = useDocumentStore();

  return (
    <div>
      <PageHeader title="Knowledge Base Documents" />
      <Filters onFilterChange={setFilters} />
      <DocumentGrid documents={documents} />
      <Pagination total={documents.length} />
    </div>
  );
};
```

**Features**:
- Table/grid toggle view
- Columns: Filename, Type, Size, Uploaded, Status
- Filters: File type dropdown, date picker, status filter
- Pagination: 20 items per page default
- Loading states, empty states

**Tests**:
- Unit: `document-slice.test.ts` (Zustand store)
- E2E: `document-library.spec.ts` (Playwright)

**Estimated Time**: 8-12 hours

---

### ST2: Upload Form Component (3 points)

**Implementation**:
```typescript
// src/components/Upload/UploadForm.tsx
export const UploadForm = () => {
  const { upload, uploadProgress } = useUpload();

  return (
    <FileDropzone
      onDrop={handleUpload}
      accept={['.pdf', '.docx', '.md']}
      maxSize={50 * 1024 * 1024} // 50MB
    >
      {uploadProgress && <ProgressBar value={uploadProgress} />}
      {error && <ErrorMessage error={error} />}
    </FileDropzone>
  );
};
```

**Features**:
- Drag & drop zone (react-dropzone)
- File picker fallback
- Validation: MIME type, size ≤50MB
- Progress bar during upload
- Success/error notifications
- Multiple file support (queue)

**Tests**:
- Unit: `UploadForm.test.tsx`
- Integration: `upload-flow.test.ts`

**Estimated Time**: 8-12 hours

---

### ST3: Document Card Component (2 points)

**Implementation**:
```typescript
// src/components/Documents/DocumentCard.tsx
export const DocumentCard = ({ document }: Props) => {
  return (
    <Card>
      <CardHeader>
        <FileIcon type={document.file_type} />
        <h3>{document.original_filename}</h3>
        <StatusBadge status={document.status} />
      </CardHeader>
      <CardContent>
        <MetadataList>
          <MetadataItem label="Type" value={document.file_type} />
          <MetadataItem label="Size" value={formatBytes(document.file_size_bytes)} />
          <MetadataItem label="Uploaded" value={formatDate(document.uploaded_at)} />
        </MetadataList>
      </CardContent>
      <CardActions>
        <Button onClick={viewDetails}>Details</Button>
        <Button variant="destructive" onClick={deleteDocument}>Delete</Button>
      </CardActions>
    </Card>
  );
};
```

**Features**:
- Card layout (shadcn/ui Card)
- Status badges: Processing (yellow), Completed (green), Failed (red)
- Metadata display: All DocumentResponse fields
- Actions: View details modal, Delete confirmation
- Responsive design (mobile/desktop)

**Tests**:
- Unit: `DocumentCard.test.tsx`
- Visual: Chromatic snapshots

**Estimated Time**: 4-6 hours

---

### Backend Endpoint: GET /api/documents (Trivial)

**Implementation**:
```python
# backend/app/routers/documents.py
from app.models.document import Document
from sqlalchemy.orm import Session

@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    file_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)

    if file_type:
        query = query.filter(Document.file_type == file_type)
    if status:
        query = query.filter(Document.status == status)

    total = query.count()
    documents = query.offset(offset).limit(limit).all()

    return DocumentListResponse(documents=documents, total=total)
```

**Estimated Time**: 2 hours (trivial - uses existing Document model)

## KPIs and Metrics

### Functional KPIs (T-04.3 Compliance)

| KPI ID | Description | Target | Measurement | Evidence |
|--------|-------------|--------|-------------|----------|
| **AC-UI-01** | Metadatos visibles post-carga | 100% de campos mostrados | Manual verification | Screenshot + E2E test |
| **AC-UI-02** | Estado de procesamiento visible | Estados reflejados en ≤3s | Integration test | Test assertion |
| **AC-UI-03** | Upload funcional desde UI | ≥95% success rate | E2E test suite | Playwright report |
| **AC-UI-04** | Filtros funcionan correctamente | 100% filtros operativos | Unit tests | Vitest coverage |

### Performance Metrics (UX)

| Metric | Target | Baseline | Measurement Method |
|--------|--------|----------|-------------------|
| **Time to Interactive** | ≤2s | N/A | Lighthouse audit |
| **Upload Feedback Latency** | ≤500ms | N/A | User interaction test |
| **List Render (100 docs)** | ≤1s | N/A | Performance profiling |
| **Filter Application** | ≤300ms | N/A | React DevTools profiler |

### Quality Metrics (Testing)

| Metric | Target | Status | Validation Tool |
|--------|--------|--------|-----------------|
| **Unit Test Coverage** | ≥85% | Pending | Vitest coverage report |
| **E2E Test Coverage** | 100% critical paths | Pending | Playwright report |
| **Accessibility Score** | ≥90 | Pending | Lighthouse/Pa11y |
| **Code Review Approvals** | 2+ reviewers | Pending | GitHub PR |

## Effort Estimation Detail

### Development Breakdown

| Phase | Task | Hours | Cumulative | Risk |
|-------|------|-------|------------|------|
| **Backend** | GET /api/documents endpoint | 2h | 2h | Trivial |
| **Backend** | OpenAPI spec update | 0.5h | 2.5h | Trivial |
| **Frontend ST1** | Document Library page setup | 4h | 6.5h | Low |
| **Frontend ST1** | Zustand store (document-slice) | 2h | 8.5h | Low |
| **Frontend ST1** | Filters & pagination | 2-4h | 10.5-12.5h | Low |
| **Frontend ST2** | Upload form base component | 4h | 14.5-16.5h | Low |
| **Frontend ST2** | Drag & drop integration | 2h | 16.5-18.5h | Medium |
| **Frontend ST2** | Progress bar & error handling | 2-4h | 18.5-22.5h | Low |
| **Frontend ST3** | Document card component | 3h | 21.5-25.5h | Low |
| **Frontend ST3** | Status badges & actions | 1-2h | 22.5-27.5h | Low |
| **Testing** | Unit tests (Vitest) | 2-3h | 24.5-30.5h | Low |
| **Testing** | E2E tests (Playwright) | 2-3h | 26.5-33.5h | Low |
| **Documentation** | OpenAPI, README, ACTA update | 1-2h | 27.5-35.5h | Trivial |
| **Code Review** | Review iterations | 2-4h | 29.5-39.5h | Low |
| **Total** | | **30-40h (2.5-3 días)** | | **Low** |

### Contingency Planning

**Best Case** (30h): All components work first time, no design iterations needed
**Expected Case** (35h): Minor UI/UX adjustments, one round of code review feedback
**Worst Case** (40h): Unexpected shadcn/ui integration issues, multiple review rounds

**Buffer**: +10% contingency = **33-44h total** (realistically 3-4 días)

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **UI/UX design not finalized** | Medium | Medium | Use existing shadcn/ui components, minimal custom CSS | Frontend Dev |
| **GET /documents endpoint delays** | Low | High | Implement endpoint first (2h), trivial implementation | Backend Dev |
| **Drag & drop library issues** | Low | Medium | Use proven react-dropzone library (widely used) | Frontend Dev |
| **Testing overhead exceeds estimate** | Medium | Low | Prioritize critical path, defer edge cases to backlog | QA Lead |
| **Code review blocks merge** | Low | Medium | Align with team on standards before starting | Tech Lead |

### Process Risks

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **T-04 not merged yet** | Low | High | Wait for T-04 merge before starting T-49 | Tech Lead |
| **Competing priorities** | Medium | Medium | Secure approval and resource allocation upfront | Product Owner |
| **Scope creep (out-of-scope features)** | High | Medium | Strict adherence to defined scope, defer extras | Tech Lead |

## Dependencies and Blockers

### Upstream Dependencies (Must Complete First)

| Dependency | Status | Blocker? | Mitigation |
|------------|--------|----------|------------|
| **T-04 ST1-ST6** | ✅ Completed | No | Already done |
| **T-04 merge to develop** | 🟡 In progress | **YES** | Wait for merge approval |
| **Backend Document model** | ✅ Exists | No | Already implemented (T-04) |
| **shadcn/ui components** | ✅ Available | No | Already in project |

### Downstream Impact (This Task Blocks)

| Blocked Item | Impact | Timeline |
|--------------|--------|----------|
| **T-04 Official Certification** | Cannot certify T-04 without criterion #3 | Immediate |
| **User Acceptance Testing** | UAT requires UI for manual validation | Post-T-49 |
| **R1 Completion** | R1 cannot close without T-04 complete | +2-3 days |

## Testing Strategy Detail

### Unit Tests (Vitest)

**Target Coverage**: ≥85%

```typescript
// src/store/__tests__/document-slice.test.ts
describe('Document Slice Store', () => {
  test('fetches documents successfully');
  test('handles upload progress updates');
  test('applies filters correctly');
  test('updates document status on backend change');
  test('handles pagination state');
});

// src/components/Upload/__tests__/UploadForm.test.tsx
describe('UploadForm Component', () => {
  test('validates file type (rejects .exe)');
  test('validates file size (rejects >50MB)');
  test('shows progress bar during upload');
  test('handles upload errors gracefully');
  test('supports multiple file uploads');
});

// src/components/Documents/__tests__/DocumentCard.test.tsx
describe('DocumentCard Component', () => {
  test('renders metadata correctly');
  test('shows correct status badge color');
  test('handles delete confirmation');
  test('responsive layout (mobile/desktop)');
});
```

### E2E Tests (Playwright)

**Target**: 100% critical paths

```typescript
// e2e/document-library.spec.ts
test.describe('Document Library', () => {
  test('displays uploaded documents with metadata', async ({ page }) => {
    // Given: User has uploaded 3 documents
    // When: Navigate to /documents
    // Then: See all 3 documents with correct metadata
  });

  test('uploads new document successfully', async ({ page }) => {
    // Given: User on /documents page
    // When: Drag & drop PDF file
    // Then: See upload progress → success → document appears in list
  });

  test('filters documents by type', async ({ page }) => {
    // Given: Mixed document types (PDF, DOCX, MD)
    // When: Select "PDF" filter
    // Then: Only PDF documents shown
  });

  test('shows processing status for active uploads', async ({ page }) => {
    // Given: Large file being uploaded
    // When: Upload in progress
    // Then: See yellow "processing" badge → green "completed" after done
  });
});
```

### Acceptance Tests (T-04.3 Criterion)

**Format**: Gherkin (BDD)

```gherkin
Feature: Metadatos visibles post-carga (T-04.3)

  Background:
    Given el usuario está autenticado
    And tiene permisos de editor

  Scenario: Usuario sube PDF y ve metadatos completos
    When sube un PDF de 5MB llamado "ISO-9001.pdf"
    Then la UI muestra en ≤3 segundos:
      | Campo            | Valor Esperado       |
      | Filename         | ISO-9001.pdf         |
      | Type             | PDF                  |
      | Size             | 5.0 MB               |
      | Status           | completed            |
      | Uploaded         | 2025-10-07 23:45     |
    And el badge de estado es verde
    And puede hacer clic en "Details" para ver metadatos completos

  Scenario: Usuario ve estado de procesamiento en tiempo real
    Given un documento de 20MB en proceso de upload
    When la extracción de texto está en progreso
    Then el badge de estado es amarillo "processing"
    And muestra progreso en porcentaje
    When la extracción completa exitosamente
    Then el badge cambia a verde "completed"
    And el tiempo total es ≤ 120s (PERF-003)
```

## Success Criteria and Definition of Done

### Functional Criteria ✅

- [ ] Document Library page renderiza correctamente
- [ ] Upload form funcional con drag & drop
- [ ] Metadatos visibles post-carga (T-04.3) ✅ **CRITICAL**
- [ ] Estados de procesamiento visibles (processing/completed/failed)
- [ ] Filtros funcionan (tipo, fecha, estado)
- [ ] Paginación funciona correctamente
- [ ] Backend GET /api/documents implementado

### Technical Criteria ✅

- [ ] Unit tests ≥85% coverage
- [ ] E2E tests 100% critical paths
- [ ] Lighthouse: Performance ≥90, Accessibility ≥90
- [ ] Code review aprobado (2+ revisores)
- [ ] No errores ESLint/TypeScript
- [ ] Responsive design (móvil/tablet/desktop)

### Documentation Criteria ✅

- [ ] OpenAPI actualizado (GET /api/documents)
- [ ] README frontend actualizado (nueva página)
- [ ] ACTA-CERT-T04 actualizada (criterio #3 cumplido)
- [ ] T-49-STATUS.md completo

### Deployment Criteria ✅

- [ ] Merge a develop sin conflictos
- [ ] CI/CD pipeline verde (todos los tests pasan)
- [ ] No regresiones en funcionalidad existente
- [ ] Validación manual por Product Owner

## Next Steps and Timeline

### Phase 1: Approval and Planning (1 día)
- [ ] **Day 0**: Revisar y aprobar propuesta T-49 (Tech Lead + Product Owner)
- [ ] **Day 0**: Crear issue GitHub con template de tarea
- [ ] **Day 0**: Asignar desarrollador frontend + backend
- [ ] **Day 0**: Crear branch `feature/T-49-document-library-ui`

### Phase 2: Backend Foundation (0.5 día)
- [ ] **Day 1 AM**: Implementar GET /api/documents endpoint (2h)
- [ ] **Day 1 AM**: Actualizar OpenAPI spec (30min)
- [ ] **Day 1 AM**: Tests de integración backend (1h)

### Phase 3: Frontend Development (2 días)
- [ ] **Day 1 PM**: ST1 - Document Library page base (4h)
- [ ] **Day 2 AM**: ST1 - Filtros y paginación (4h)
- [ ] **Day 2 PM**: ST2 - Upload form con drag & drop (4h)
- [ ] **Day 3 AM**: ST2 - Progress bar y error handling (4h)
- [ ] **Day 3 PM**: ST3 - Document cards y status badges (4h)

### Phase 4: Testing and QA (0.5 día)
- [ ] **Day 4 AM**: Unit tests (Vitest) (2h)
- [ ] **Day 4 AM**: E2E tests (Playwright) (2h)
- [ ] **Day 4 PM**: Lighthouse audit y ajustes (1h)

### Phase 5: Review and Merge (0.5 día)
- [ ] **Day 4 PM**: Code review y ajustes (2h)
- [ ] **Day 5 AM**: Merge a develop
- [ ] **Day 5 AM**: Actualizar ACTA-CERT-T04 (criterio #3)
- [ ] **Day 5 PM**: Certificar T-04 como 100% completo

**Total Timeline**: 3-4 días hábiles

## Post-Implementation Actions

### Immediate (Week 1)
- [ ] User Acceptance Testing con 3-5 usuarios
- [ ] Monitorear métricas de uso (uploads, visualizaciones)
- [ ] Recopilar feedback inicial de usuarios

### Short-term (Week 2-3)
- [ ] Iterar en UX basado en feedback
- [ ] Optimizar performance si necesario
- [ ] Documentar aprendizajes y mejores prácticas

### Long-term (Month 1+)
- [ ] Considerar features avanzadas (batch operations, search)
- [ ] Integrar con T-07 (Editor UI) para preview
- [ ] Evaluar métricas de adopción y satisfacción

## References and Related Documents

### Primary Documents
- **Task Specification**: [docs/tasks/T-49-STATUS.md](../tasks/T-49-STATUS.md)
- **Parent Task**: [docs/tasks/T-04-STATUS.md](../tasks/T-04-STATUS.md)
- **Work Plan**: [docs/project-management/WORK-PLAN-v5.md](../WORK-PLAN-v5.md) (Line 264)

### Related Documentation
- **T-04 Certification**: [docs/certifications/ACTA-CERT-T04-20251001.md](../../certifications/ACTA-CERT-T04-20251001.md)
- **Project Status**: [docs/project-management/status/PROJECT-STATUS.md](../status/PROJECT-STATUS.md)
- **OpenAPI Spec**: [docs/api-spec/openapi.yml](../../api-spec/openapi.yml)

### Emergent Work Context
- **Documentation Improvements**: [DOCUMENTATION-IMPROVEMENTS.md](DOCUMENTATION-IMPROVEMENTS.md)
- **Docling Integration**: [DOCLING-INTEGRATION.md](DOCLING-INTEGRATION.md)

### Architecture Decisions
- **ADR-013**: Docling Integration Strategy (related RAG context)
- **ADR-014**: ChromaDB Vector Database (T-04 backend foundation)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Author**: Tech Lead
**Status**: 🟡 Approved - Awaiting T-04 Merge
**Classification**: Class B - High Priority (Quality Enhancement)
