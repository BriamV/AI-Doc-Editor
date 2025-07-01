# 🚀 ACTIVE DEVELOPMENT - T-02: OAuth 2.0 + JWT Roles

**Generated:** $(date '+%Y-%m-%d %H:%M')  
**Task ID:** T-02 | **Priority:** Crítica | **Release:** R0 | **Dependencies:** T-01  
**Current Status:** En progreso - Iniciando desarrollo OAuth JWT

---

## 📋 TASK OVERVIEW

### **Objective**
Implementar el sistema de autenticación y autorización. Los usuarios se autenticarán mediante proveedores externos (Google/Microsoft) usando OAuth 2.0, y el sistema gestionará su acceso a través de roles (editor, admin) embebidos en JSON Web Tokens (JWT).

### **Technical Stack**
- **Protocolos:** OAuth 2.0 (Authorization Code Flow), JWT (RS256)
- **Backend:** Python (FastAPI), python-jose para JWT
- **Endpoints:** /auth/login, /auth/callback, /auth/refresh, /users/me

### **Files to Modify**
```
backend/app/routers/auth.py     # OAuth endpoints
backend/app/services/auth.py    # Authentication logic
backend/app/models/auth.py      # User models
backend/requirements.txt        # Dependencies (python-jose, etc.)
```

📋 DEVELOPMENT SUBTASKS:
========================
| Status | WII | Description | Complexity | Deliverable |
|--------|-----|-------------|------------|-------------|
| ⏳ | R0.WP2-T02-ST1                   | Implementar el flujo de autenticación OAuth 2.0 (servidor) para Google y Microsoft, incluyendo callbacks y creación/actualización de usuario en DB. | 5                    | Test de integración que completa el flujo OAuth y verifica la existencia del usuario en la DB con los datos correctos. |
| ⏳ | R0.WP2-T02-ST2                   | Implementar la generación de JWT (access y refresh tokens) con roles (editor, admin) y el endpoint /auth/refresh.                                   | 4                    | Colección Postman que demuestra que el login devuelve tokens y que /auth/refresh emite un nuevo access token válido.   |

🎯 DEVELOPMENT CHECKLIST:
=========================
[ ] **R0.WP2-T02-ST1** (5 pts): Implementar el flujo de autenticación OAuth 2.0 (servidor) para Google y Microsoft, incluyendo callbacks y creación/actualización de usuario en DB.
    📦 Deliverable: Test de integración que completa el flujo OAuth y verifica la existencia del usuario en la DB con los datos correctos.

[ ] **R0.WP2-T02-ST2** (4 pts): Implementar la generación de JWT (access y refresh tokens) con roles (editor, admin) y el endpoint /auth/refresh.
    📦 Deliverable: Colección Postman que demuestra que el login devuelve tokens y que /auth/refresh emite un nuevo access token válido.

---

## 🎯 ACCEPTANCE CRITERIA

### ✅ **Functional Requirements**
- [ ] Un usuario puede completar el flujo de login con Google/MS
- [ ] El sistema devuelve un JWT válido con el rol correcto tras el login  
- [ ] Un endpoint protegido devuelve 401/403 si el token es inválido
- [ ] El endpoint /auth/refresh funciona correctamente

### 🧪 **Testing Requirements**
- [ ] **Unit Tests:** Lógica de creación y validación de JWT
- [ ] **Integration Tests:** Flujo completo de login y acceso protegido
- [ ] **Security Tests:** Expiración de tokens y validación de roles

### 📖 **Documentation Requirements**
- [ ] Actualizar especificación OpenAPI con endpoints de autenticación

---

## 🛠️ DEVELOPMENT WORKFLOW (Enhanced with QA)

### **Phase 1: Development**
```bash
# Start development
./tools/status-updater.sh T-02 "En progreso - ST1: OAuth 2.0 Implementation"

# Create feature branch
git checkout -b feature/T-02-oauth-implementation

# Complete subtasks
./tools/mark-subtask-complete.sh T-02 R0.WP2-T02-ST1
./tools/mark-subtask-complete.sh T-02 R0.WP2-T02-ST2

# Mark development complete (ready for QA)
./tools/qa-workflow.sh T-02 dev-complete
```

### **Phase 2: QA & Validation**
```bash
# Start QA phase
./tools/qa-workflow.sh T-02 start-qa

# Validate Definition of Done
./tools/validate-dod.sh T-02

# If validation passes:
./tools/qa-workflow.sh T-02 qa-passed

# If validation fails:
./tools/qa-workflow.sh T-02 qa-failed "Specific reason"
```

### **Phase 3: Final Completion**
```bash
# Only when all DoD criteria are satisfied:
./tools/qa-workflow.sh T-02 mark-complete

# Update traceability
yarn run cmd governance --format=all
```

---

## 🔍 IMPLEMENTATION DETAILS

### **ST1: OAuth 2.0 Implementation Details**
```python
# Expected files structure:
backend/app/routers/auth.py:
  - POST /auth/login -> Redirect to OAuth provider
  - GET /auth/callback -> Handle OAuth callback
  
backend/app/services/auth.py:
  - OAuth provider configurations
  - User creation/update logic
  - Token exchange logic
```

### **ST2: JWT Implementation Details**  
```python
# Expected JWT structure:
{
  "sub": "user_id",
  "email": "user@example.com", 
  "role": "editor|admin",
  "exp": timestamp,
  "iat": timestamp
}
```

---

## 💡 QUICK COMMANDS (Updated)

```bash
# Navigation & Planning
./tools/task-navigator.sh T-02                    # View task details
./tools/progress-dashboard.sh                     # Check overall progress
./tools/extract-subtasks.sh T-02                  # Extract development subtasks

# Development Progress
./tools/status-updater.sh T-02 "Your message"     # Update status
./tools/mark-subtask-complete.sh T-02 <SUBTASK>   # Mark subtask done

# QA Workflow (NEW)
./tools/qa-workflow.sh T-02 dev-complete          # Mark development complete
./tools/validate-dod.sh T-02                      # Validate Definition of Done
./tools/qa-workflow.sh T-02 qa-passed             # Mark QA passed
./tools/qa-workflow.sh T-02 mark-complete         # Final completion (DoD satisfied)

# Quality Validation
yarn run cmd validate-backend                     # Validate backend code
yarn run cmd qa-gate                             # Run quality checks
yarn run cmd test                                 # Run tests
yarn run cmd security-scan                       # Security validation
```

---

**Progress:** 0/2 subtasks completed | **Next:** Configure OAuth providers  
**Generated by:** AI-Doc-Editor Tools | **File:** current-work.md
