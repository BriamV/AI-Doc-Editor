# Design and Phase Acceptance Criteria

This document summarizes key design and coding considerations.

## Design and Coding Guidelines

### Arquitectura y Principios

- **Arquitectura Hexagonal**: Núcleo de dominio aislado mediante puertos (interfaces) y adaptadores, permitiendo evolución independiente de infraestructura y facilitando pruebas.
- **Simplicidad y Modularidad**: Componentes con responsabilidades únicas y bien definidas, evitando complejidad innecesaria y dependencias circulares.
- **Separación Frontend/Backend**:
  - Estricta separación entre carpetas `/frontend` y `/backend`
  - Prohibido incluir código frontend en backend y viceversa
  - Comunicación exclusivamente a través de APIs bien definidas
  - Despliegue independiente con CI/CD separados
- **Descomposición en servicios**:
  - **PlanningService** (`/plan`): genera outline H1/H2/H3.
  - **SectionsService** (`/draft_section`, `/revise_global`): drafts y coherencia global.
  - **ExportService** (`/export`): colas Celery + Pandoc.
    Cada servicio debe vivir en su propio módulo/adaptador según la Arquitectura Hexagonal.
- **Streaming WebSockets**:
  - Definir un tamaño de chunk configurable (p.ej. 500 tokens).
  - Gestionar back-pressure y latencia (< 150 ms handshake, 2 KiB/0.2 s) para experiencia fluida.

### Seguridad

- **Almacenamiento Seguro**: Claves API cifradas con Fernet en `CredentialStore`, nunca expuestas en frontend.
- **Validación Estricta**: Formato de credenciales validado mediante expresiones regulares antes del almacenamiento.
- **Protección de Datos**: Cifrado en reposo y TLS para toda comunicación.
- Los mensajes de log se escriben en inglés para uniformidad.

### Estándares de Código

- **Backend (Python)**: PEP 8, type hints obligatorios, docstrings estilo Google con secciones Args/Returns/Raises.
- **Asincronía & WS**: usar `FastAPI` + `uvicorn` async; definir routers separados para WS y HTTP.
- **Inyección de dependencias**: usar `fastapi.Depends` para abstracciones de repositorio y vectores.
- **Trabajos en background**: emplear Celery para summarisation y exportación, documentar en `requirements-dev.txt`.
- **Validación de payload**: schemas Pydantic con límites (p.ej. `max_length`) para controlar token budget (< 9 000 tokens).
- **Frontend (JS/TS)**: JSDoc completo para componentes y hooks, siguiendo patrones de diseño consistentes.
- **Monaco Editor**:

  - Configurar `@monaco-editor/react` con `minimap.enabled=false` y `wordWrap=‘on’`.
  - Usar `editor.addAction` para la Action Palette (rebajas < 8 comandos).
- **Estado & servicios**: separar estado local (draft) de global (plan, summary) usando React Context o Zustand.
- **WebSocket Hook**: encapsular lógica de `/draft_section` en un hook genérico (`useStreaming`).
- **Virtualización**: aplicar `react-window` en preview de > 5 000 líneas para evitar jank.
- **Métricas de Calidad**:

  - Complejidad ciclomática ≤15
  - Longitud máxima: 100 caracteres por línea
  - Sistema semáforo LOC: <212, 213-250, >251
  - Cobertura de pruebas ≥80%

### UI/UX

- **Consistencia Visual**: Componentes estandarizados (cards, botones, formularios) con estilos unificados.
- **Experiencia de Usuario**: Feedback inmediato, flujos intuitivos y accesibilidad WCAG 2.1 AA.
- **Diseño Responsive**: Adaptación a diferentes tamaños de pantalla manteniendo funcionalidad.
- **Prompt Bar & Progress Pane**:
  - Barra fija en la parte superior con input de prompt y botón “Generar”.
  - Sidebar lateral muestra progreso de tokens recibidos / esperados (spinner + %).
- **Split View Markdown/Preview**:
  - Sincronización de scroll; preview con `react-markdown` + `rehype-raw`.
- **Outline Pane**:
  - Árbol desplegable de secciones con chips “Drafting”, “Review”, “Done”.
- **Action Palette**:
  - Invocable con `⌘ + .`; listar acciones IA (Paraphrase, Trim, Simplify…) ≤ 8 ítems.
- **Comment Tags & Diff Viewer**:
  - Decoraciones Monaco para anotaciones; componente `DiffEditor` para rollback.
- **Token Budget**:
  - UI oculta muestra aviso si el prompt + context + output excede 9 000 tokens.

### Proceso de Desarrollo

- **TDD Obligatorio**: Pruebas escritas antes que el código de implementación.
- **Automatización**: Pre-commit hooks para linting, formatting y validación.
- **Revisión de Código**: Obligatoria para cada PR siguiendo criterios documentados.
- **Validación Modular**: Sistema multi-tecnología (TypeScript + Python) con detección automática de contexto:
  ```bash
  yarn run cmd validate-design-guidelines  # Valida métricas definidas aquí
  yarn run cmd validate-task               # Contexto-aware por tarea actual
  yarn run cmd validate-staged             # Pre-commit validation
  yarn run cmd qa-gate                     # Quality gate completo
  ```
- **Documentar API-SPEC**: actualizar `docs/API-SPEC.md` con OpenAPI 3.1 después de cada router nuevo.
- **ADR Obligatorios**: cada decisión de arquitectura (p.ej. elección de Chunks-size, Celery) debe tener un ADR en `docs/adr/`.
- **Pre-commit & CI**:
  - Hooks para `ruff`, `black`, `eslint` y validación de OpenAPI.
  - Pipeline que ejecute pruebas WS de streaming y test E2E de `/plan`→`/draft_section`.

### Principios de Calidad y Buenas Prácticas

- **Clean Code y SOLID**:

  - Responsabilidad única (S): Cada clase/módulo tiene una sola razón para cambiar
  - Abierto/Cerrado (O): Extender sin modificar código existente
  - Sustitución Liskov (L): Las subclases deben poder sustituir a sus clases base
  - Segregación de interfaces (I): Interfaces específicas mejor que una general
  - Inversión de dependencias (D): Depender de abstracciones, no implementaciones
- **Gestión de Cambios**:

  - Evaluación de dependencias e impactos antes de implementar
  - Verificación obligatoria post-cambio con pruebas automatizadas
  - Cambios atómicos que entregan valor tangible y no introducen complejidad innecesaria
  - Integración continua para detectar problemas de acoplamiento tempranamente
- **Estructura y Documentación**:

  - Cada archivo debe aportar valor real y tangible (no código de relleno)
  - Documentación clara y concisa sin elementos redundantes
  - Estructura organizada que facilita la comprensión y el seguimiento
  - Convenciones de nombrado consistentes que revelan intención
- **Optimización**:

  - Priorizar legibilidad y mantenibilidad sobre micro-optimizaciones prematuras
  - Optimizar solo con métricas de rendimiento concretas
  - Documentar decisiones de optimización y sus compromisos
  - Mantener balance entre rendimiento y complejidad del código
