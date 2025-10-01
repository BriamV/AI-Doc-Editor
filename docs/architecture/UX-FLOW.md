# UX‑FLOW – Documento de Diseño de Experiencia

## 1. Objetivos de UX

\* **Productividad 80 %** ‑ El sistema debe generar un primer borrador que cubra \~80 % del contenido final en ≤ 8 min tras un único *prompt*.
\* **Fluidez de edición** ‑ Permitir edición Markdown con vista previa paralela en tiempo real (< 200 ms) y comandos de re‑escritura contextual.
\* **Control y transparencia** ‑ Mostrar progreso de generación (tokens/s, ETA), permitir pausar/abortar y re‑enfocar el draft sin perder coherencia.
\* **Navegabilidad** ‑ Acceso rápido a documentos recientes, agrupación por proyecto, búsqueda _Quick Open_ y referencias a una _Knowledge Base_ por proyecto.
\* **Accesibilidad mínima** ‑ Modo claro/oscuro automático y navegación 100 % teclado; no se declaran requisitos A11y adicionales.

---

## 2. Flujos de Usuario

### 2.1 Generación inicial (primer borrador)

1. **Prompt Bar** en la parte superior del editor.
2. Al pulsar *Enter*, aparece una **Progress Sidebar** con spinner y ETA basada en tokens recibidos/esperados.
3. El backend envía chunks vía **WebSocket**; el editor renderiza texto en streaming.
4. El usuario puede **Pausar** → se abre un modal para redireccionar o cancelar.

### 2.2 Edición asistida

- Selección de texto ⟶ `⌘ + .` abre la **Action Palette** con comandos: _Paraphrase, Trim, Academic Style, Simplify…_.
- La acción dispara `/rewrite` con `{text, action}`; la respuesta reemplaza la selección.
- Se registra en **Undo Stack** y en el log de versiones.

### 2.3 Navegación y organización

- **Sidebar** con pestañas _Recent, Projects, Search_.
- Drag‑and‑drop para re‑ordenar proyectos y documentos.
- `⌘ + P` → _Quick Open_ (últimos 20 docs); `⌘ + Shift + O` → outline del documento.

---

## 3. Componentes UI

| Componente                     | Biblioteca / Patrón                      | Complejidad |
| ------------------------------ | ---------------------------------------- | ----------- |
| **Prompt Bar + Progress Pane** | React custom + CSS Grid + WebSocket      | Media       |
| **Markdown / Preview Split**   | `react‑markdown`, `rehype-raw`, Flexbox  | Baja        |
| **Action Palette**             | `monaco.editor.addAction`, guías NN/g    | Baja        |
| **Navigation Sidebar**         | Patrón _single vertical nav_ (GitLab DS) | Media       |
| **Diff Viewer**                | `monaco.editor.createDiffEditor`         | Media       |
| **Comment Tags**               | Monaco decorations + `remark` plugins    | Alta        |
| **Export Queue UI**            | Toast + barra progreso (Celery/Pandoc)   | Baja        |

---

## 4. Performance & Tolerancias

| Métrica                       | Objetivo                                       |
| ----------------------------- | ---------------------------------------------- |
| Handshake WebSocket           | < 150 ms                                       |
| Chunk size                    | 2 KiB cada 0.2 s (≈ 30 tok/s)                  |
| Render preview                | < 200 ms frame; virtual‑scroll en docs 10 pág. |
| Edición simple                | ≤ 2 s                                          |
| Edición mediana (≤ 2 000 tok) | ≤ 2 min                                        |
| Edición grande (> 2 000 tok)  | ≤ 6 min                                        |
| Primera generación 10 pág.    | p95 ≤ 8 min                                    |

---

## 5. Riesgos UX & Mitigaciones

| Riesgo                                  | Impacto | Mitigación                                                  |
| --------------------------------------- | ------- | ----------------------------------------------------------- |
| Sobrecarga de comandos IA               | Media   | Limitar a 7 ± 2; mover extra a menú _More…_                 |
| Latencia > 8 min primer draft           | Alta    | Mostrar ETA dinámica; sugerir _Simplify prompt_             |
| Incoherencias tras _rewrite_            | Alta    | Checker semántico post‑rewrite; resumen sección vs contexto |
| Navegación confusa con muchos proyectos | Media   | Filtros + pin favoritos; orden *last modified*              |

---

## 6. UX Roadmap por Sprints

| Sprint   | Objetivos clave                                                        |
| -------- | ---------------------------------------------------------------------- |
| **UI‑1** | Implementar Split View + Sidebar; conectar WebSocket `/draft_section`. |
| **UI‑2** | Action Palette + atajos; persistencia Undo/Redo.                       |
| **UI‑3** | Comentarios inline + Diff Viewer; coherencia automática.               |
| **UI‑4** | Export Queue + panel _Document Stats_ (palabras, versiones).           |

**Métrica de éxito global:** SUS ≥ 80 y tiempo de tarea “crear borrador + re‑escribir 2 párrafos” ≤ 10 min.
