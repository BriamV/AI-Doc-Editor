# Informe de evolución del comando **/task-dev**
*(de la versión inicial a la versión actual con Planner → Specialist → QA)*

## 1) Resumen ejecutivo

El comando **/task-dev** evolucionó desde un enfoque “indicativo” (mensajes que sugerían a qué sub-agente acudir) hacia un **orquestador determinístico** que:

* Recolecta contexto de forma controlada mediante `allowed-tools` y líneas `!bash`.
* **Exige** la validación previa de un sub-agente **planner** (Validator–Adapter) antes de cualquier edición.
* Establece **guardrails** operativos (cap de archivos, confirmaciones sensibles, dependencias).
* Cierra con **QA verificable** (`dev-verify` / `dev-complete`) y una salida de estado clara.

El resultado es un flujo más predecible, auditable y seguro para tareas con impacto en seguridad, rendimiento y contratos de API/UI.
---
## 2) Objetivo funcional (sin cambios de intención)

* **Intención constante:** orquestar trabajo en torno a un identificador de tarea (`T-XX`) y asignar a sub-agentes adecuados.
* **Mejora central:** incorporar una etapa **previa** de planificación/validación acoplada al estado real del repositorio.
---
## 3) Cambios clave por área

### 3.1 Modelo de ejecución

* **Inicial:** bloque `bash` incrustado como si se ejecutara literalmente; uso de `ARGUMENTS[0]`/`[1]`; heurística por palabras clave; salidas con `echo`.
* **Actual:** **Slash command canónico** con:

  * `allowed-tools` explícitos (p. ej., `Bash(git …)`, `Bash(bash tools/*)`).
  * Contexto recolectado vía `!` (salida inyectada al prompt).
  * `model` definido.
  * Referencias opcionales a archivos de especificación (`@docs/tasks.md`).

### 3.2 Resolución de argumentos y contexto

* **Inicial:** lectura posicional de `ARGUMENTS` y detección de `T-XX` desde la rama.
* **Actual:** pauta clara para parsear `$ARGUMENTS` (incluyendo `complete`) y fallback a patrón `T-\d+` desde la rama; visibilidad de branch, diff y commits recientes mediante `!git`.

### 3.3 Delegación y gating

* **Inicial:** mensajes orientativos (“Use the frontend-developer…”) sin garantía de invocación real.
* **Actual:** **gating obligatorio por planner**:

  * Invocación del sub-agente **planner** que emite checklist 5–7 pasos y **`planner_status`** JSON.
  * **Bloqueo** si `status != OK` (faltan dependencias, confirmaciones o excede cap).

### 3.4 Control de riesgos

* **Inicial:** sin límites cuantificables ni confirmaciones duras.
* **Actual:**

  * **`file_change_cap`** (por defecto 10) y lista de archivos esperados.
  * **Confirmaciones** obligatorias para áreas sensibles (configs/secrets/migrations).
  * Validación de dependencias (p. ej., T-44 antes de T-03).
  * Categorías con validadores específicos (security, rate-limiting, RAG, WS, UI, versioning).

### 3.5 QA y criterios de salida

* **Inicial:** `dev-complete` al final como acción opcional.
* **Actual:**

  * **`dev-verify`** siempre tras la implementación (tests, lint, archivos ≤ cap).
  * **`dev-complete`** en modo cierre con resumen de diffs y confirmación de DoD.
  * Impresión final con `TASK_ID`, `ACTION`, categoría, checklist del planner, especialistas usados y resultado de QA.

### 3.6 Observabilidad y auditabilidad

* **Inicial:** trazas por `echo`.
* **Actual:** salida estructurada (incluye `planner_status`), que permite integrar **hooks** o chequeos adicionales sin depender de interpretación humana.
---
## 4) Comparativa estructurada

| Aspecto               | Versión inicial                             | Versión actual                                              |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Semántica de CSC      | Scriptado implícito; `bash` in-line asumido | **Slash command canónico** con `allowed-tools` y `!bash`    |
| Obtención de contexto | Mínima (branch, tarea en 10 líneas)         | **Contexto completo**: branch, diff, log y header de tarea  |
| Delegación            | Mensajes sugeridos                          | **Planner obligatorio** + delegación según categoría        |
| Validación previa     | No presente                                 | **Checklist 5–7 pasos** + `planner_status` JSON             |
| Control de riesgo     | Heurístico por keywords                     | **Cap de archivos**, confirmaciones sensibles, dependencias |
| QA                    | Llamado a `dev-complete`                    | **`dev-verify` → `dev-complete`** con criterios explícitos  |
| Archivo de spec       | No referenciado                             | **Opcional `@docs/tasks.md`** para anclar la fuente         |
| Resultado final       | Mensajes informativos                       | **Resumen estructurado** para auditoría y hooks             |
---
## 5) Flujo operativo resultante

1. **Contexto**: el CSC reúne branch, diff, log y, si existe, el header de la tarea / spec.
2. **Resolución de `TASK_ID`** desde `$ARGUMENTS` o rama.
3. **Planner**: genera checklist, mapea rutas reales, aplica cap y valida dependencias; emite `planner_status`.
4. **Gating**: ejecución detenida si `status != OK`.
5. **Delegación**: especialistas adecuados (frontend/backend/security) según categoría; commits atómicos con prefijo `${TASK_ID}`.
6. **QA**: `dev-verify` obligatorio; `dev-complete` en cierre + resumen de diffs.
7. **Salida**: reporte final con datos de orquestación y verificación.
---
## 6) Beneficios técnicos concretos

* **Reducción de deriva** entre especificación y estado real del repo (rutas y contratos verificables).
* **Riesgo acotado** mediante límites cuantitativos y confirmaciones explícitas.
* **Menos re-trabajo** al detectar dependencias y brechas **antes** de editar.
* **Trazabilidad** adecuada para auditoría (planner → especialistas → QA).
---
## 7) Aspectos a vigilar (riesgos remanentes)

* **Disponibilidad del planner**: requiere el archivo `.claude/agents/planner.md` y sus herramientas (`Read/Grep/Glob/Bash`; `Todo*` si se usan).
* **Consistencia del spec**: cuando no exista `@docs/tasks.md`, el header inyectado debe ser suficiente para el planner.
* **Parseo de `$ARGUMENTS`**: conviene mantener pruebas de regresión sobre formatos comunes (“T-25”, “T-25 complete”).
* **Cap dinámico**: tareas amplias pueden requerir elevar el `file_change_cap` con una política clara de aprobación.
---
## 8) Checklist de adopción

1. Publicar `.claude/agents/planner.md` (versión Validator–Adapter).
2. Asegurar `allowed-tools` mínimos en el CSC y rutas reales de scripts (`tools/*`).
3. (Opcional) Referenciar `@docs/Sub Tareas v2.md` o documento equivalente.
4. Definir política de **categorías** donde el planner es **obligatorio** vs **opcional**.
5. Añadir pruebas de humo:

   * Caso con dependencia faltante (esperar `status=FAIL`).
   * Caso con >cap de archivos (requiere elevar cap).
   * Caso con `ACTION=complete` y QA en verde (esperar reporte final correcto).
---
## 9) Conclusión técnica

La versión actual consolida a **/task-dev** como un controlador de orquestación **predecible y seguro**, gracias a la validación previa del planner, límites operativos explícitos y una fase de QA estructurada. El diseño resultante está mejor alineado con prácticas de automatización, control de cambios y auditoría en equipos que trabajan con sub-agentes especializados.

--
## Propuesta Nueva de task-dev

# /task-dev — Sub-Agent Delegation (Planner → Specialist → QA)

---
description: Route task to the right sub-agent(s), enforce a short plan validated by the planner, and finish with QA/DoD checks.
argument-hint: "[task-id] [action]"
allowed-tools: Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(bash tools/*)
model: claude-3-7-sonnet-latest
---

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Staged/Unstaged diff summary: !`git diff --name-status HEAD`
- Recent commits: !`git log --oneline -8`
- Task header (if available): !`bash tools/task-navigator.sh $ARGUMENTS 2>/dev/null | head -80 || true`
- (Optional) Project spec: @docs/tasks.md  <!-- reemplaza con tu ruta real si existe -->

## Your job (main agent)
You orchestrate sub-agents. MUST use the **planner** first.

**Parse arguments**:
- `$ARGUMENTS` may look like: `"T-25 complete"` / `"T-25"` / empty. If empty, infer `T-\d+` from the branch above.
- `TASK_ID` := resolved; `ACTION` := `"complete"` iff the word `complete` appears.

**Run the planner**:
- Invoke the `planner` subagent to produce the 5–7 step checklist and the final ```planner_status``` JSON.
- If `status != OK`, STOP and print the blocking reasons (missing deps, confirmations, or cap raise).

**Classify & delegate**:
- Category := `planner_status.category` (or infer as fallback).
- Single-scope → 1 specialist (`frontend-developer` | `backend-architect` | `security-auditor`).
- Mixed → sequence specialists; each must list files-before-edit and keep atomic commits `${TASK_ID}: …`.

**Execute QA**:
- Run `bash tools/qa-workflow.sh ${TASK_ID} dev-verify` (tests pass, lint clean, changed files ≤ `file_change_cap`).
- If `ACTION="complete"` → `bash tools/qa-workflow.sh ${TASK_ID} dev-complete` + summarize diffs & confirm DoD.

**Safety rails**:
- Do **not** modify configs/secrets/migrations unless `planner_status.requires_confirmations` is satisfied.
- If expected changes > `file_change_cap`, ask to raise the cap before editing.

> Print at the end: `TASK_ID`, `ACTION`, category, planner checklist, specialists used, QA outcome.

--

**Nota:**

El comando **/task-dev** es un ejemplo de cómo se puede implementar un controlador de orquestación **predecible y seguro** para tareas con impacto en seguridad, rendimiento y contratos de API/UI. El diseño resultante está mejor alineado con prácticas de automatización, control de cambios y auditoría en equipos que trabajan con sub-agentes especializados.
