# Desglose Detallado y Enriquecido de Tareas (WBS Nivel 4)

Esta sección proporciona el desglose completo, auditable y enriquecido de cada Tarea (GTI) en Subtareas (ST) atómicas. Cada tarea se presenta como una ficha de trabajo completa, seguida de su descomposición en subtareas, asegurando la máxima claridad y trazabilidad.

---

### **Tarea T-01: Baseline & CI/CD**

- **ID de Tarea:** T-01

- **Título:** Baseline & CI/CD
- **Estado:** Completado 83% (Pydantic v2 diferido a R1 por ADR-004)
- **Dependencias:** Ninguna
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Establecer la infraestructura de código, el entorno de desarrollo local y el pipeline de Integración Continua (CI) que servirá como base para todo el proyecto. Esta tarea es fundamental para garantizar la calidad, consistencia y automatización desde el primer día. **El alcance incluye la migración del backend a Pydantic v2 y el freeze de dependencias de producción para aprovechar sus mejoras de rendimiento.**
- **Detalles Técnicos:**
  - **Stack:** Docker, Docker Compose, Makefile, GitHub Actions.
  - **Librerías Clave:** Migración a Pydantic v2.
  - **Linters:** ruff, black (Python), eslint (TypeScript/JS).
  - **Análisis de Calidad:** radon (complejidad ciclomática), SonarJS o similar.
  - **Gobernanza:** CODEOWNERS, plantillas de PR y ADR.
- **Estrategia de Test:**
  - **Unit Tests:** El pipeline debe ejecutar los tests unitarios de backend y frontend. Cobertura inicial > 80%.
  - **Integration Tests:** El pipeline debe ser capaz de construir las imágenes de Docker y ejecutar un test de humo.
  - **Performance Tests:** Un benchmark debe validar la mejora de rendimiento tras la migración a Pydantic v2.
- **Documentación:**
  - Crear CONTRIBUTING.md con instrucciones de setup.
  - Crear la primera entrada en /docs/adr/000-initial-architecture-decision.md.
- **Criterios de Aceptación:**
  - El pipeline se ejecuta y pasa (verde) en el commit inicial del monorepo.
  - El fichero ADR-000 está registrado y versionado.
  - El job qa-gate integra análisis estático (radon, SonarJS) y falla si se superan umbrales críticos de complejidad.
  - El pipeline valida que los títulos de los Pull Requests sigan la convención feat(T-XX): ....
  - La migración a Pydantic v2 está completada y un benchmark demuestra una mejora de rendimiento significativa.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests del pipeline inicial pasan.
  - Documentación (CONTRIBUTING.md, ADR-000) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                                              | Complejidad Estimada | Entregable Verificable                                                                                                                 |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| R0.WP1-T01-ST1                   | Configurar estructura de monorepo, `docker-compose.yml` para servicios base (backend, frontend, db) y `Makefile` con comandos comunes (up, down, test). | 3                    | `make up` levanta el entorno local. Repositorio inicializado con la estructura de directorios definida.                                |
| R0.WP1-T01-ST2                   | Crear pipeline de CI en GitHub Actions que instala dependencias, ejecuta linters (ruff, eslint) y tests unitarios en cada PR.                           | 3                    | PR a `main` dispara el pipeline y este pasa o falla según la calidad del código. Logs de CI disponibles.                               |
| R0.WP1-T01-ST3                   | Implementar el job `qa-gate` con análisis de complejidad (radon), linter de títulos de PR, `CODEOWNERS` y plantilla de ADR.                             | 4                    | Un PR con un título no convencional o código que excede el umbral de complejidad es bloqueado por el pipeline. Fichero ADR-000 existe. |
| R0.WP1-T01-ST4                   | Migrar los modelos de datos del backend a Pydantic v2 y realizar un benchmark para validar la mejora de rendimiento.                                    | 2                    | Pull Request con la migración completada. Reporte de benchmark que muestra la mejora de rendimiento.                                   |

---

### **Tarea T-02: OAuth 2.0 + JWT Roles**

- **ID de Tarea:** T-02
- **Título:** OAuth 2.0 + JWT Roles
- **Estado:** 🚧 Desarrollo Completado - Listo para QA
- **Dependencias:** T-01
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Implementar el sistema de autenticación y autorización. Los usuarios se autenticarán mediante proveedores externos (Google/Microsoft) usando OAuth 2.0, y el sistema gestionará su acceso a través de roles (editor, admin) embebidos en JSON Web Tokens (JWT).
- **Detalles Técnicos:**
  - **Protocolos:** OAuth 2.0 (Authorization Code Flow), JWT (RS256).
  - **Backend:** Python (FastAPI), python-jose para JWT.
  - **Endpoints:** /auth/login, /auth/callback, /auth/refresh, /users/me.
- **Estrategia de Test:**
  - **Unit Tests:** Cubrir la lógica de creación y validación de JWT.
  - **Integration Tests:** Flujo completo de login, obtención de token y acceso a un endpoint protegido.
  - **Security Tests:** Verificar la expiración de tokens, validación de firma, y que un rol editor no puede acceder a endpoints de admin.
- **Documentación:**
  - Actualizar la especificación OpenAPI con los nuevos endpoints de autenticación.
- **Criterios de Aceptación:**
  - Un usuario puede completar el flujo de login con Google/MS.
  - El sistema devuelve un JWT válido con el rol correcto tras el login.
  - Un endpoint protegido devuelve 401/403 si el token es inválido, ha expirado o no tiene el rol requerido.
  - El endpoint /auth/refresh funciona correctamente.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration, security) pasan.
  - Documentación de API completada.
  - Integración con el sistema de usuarios verificada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                                                                     |                      |                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                                          | Complejidad Estimada | Entregable Verificable                                                                                                 |
| R0.WP2-T02-ST1                   | Implementar el flujo de autenticación OAuth 2.0 (servidor) para Google y Microsoft, incluyendo callbacks y creación/actualización de usuario en DB. | 5                    | Test de integración que completa el flujo OAuth y verifica la existencia del usuario en la DB con los datos correctos. |
| R0.WP2-T02-ST2                   | Implementar la generación de JWT (access y refresh tokens) con roles (editor, admin) y el endpoint /auth/refresh.                                   | 4                    | Colección Postman que demuestra que el login devuelve tokens y que /auth/refresh emite un nuevo access token válido.   |

---

### **Tarea T-03: Límites de Ingesta & Rate**

- **ID de Tarea:** T-03
- **Título:** Límites de Ingesta & Rate
- **Estado:** Pendiente
- **Dependencias:** T-44
- **Prioridad:** Alta
- **Release Target:** Release 1
- **Descripción:** Implementar mecanismos de control para prevenir el abuso y garantizar la estabilidad del sistema. Esto incluye limitar la cantidad de datos que un usuario puede ingestar y la frecuencia de las peticiones a los endpoints más costosos. **Nota de Dependencia Crítica:** Esta tarea depende del servicio "Config Store" (T-44) para leer y persistir los límites. La API de T-44 debe ser diseñada teniendo en cuenta este requisito.
- **Detalles Técnicos:**
  - **Rate Limiting:** Middleware en FastAPI usando un backend de Redis para el conteo.
  - **Límites de Ingesta:** Lógica de negocio en el servicio de subida que consulta los límites configurados por el administrador.
  - **Configuración:** Modelo en la DB para almacenar los límites (Nº docs, MB totales).
- **Estrategia de Test:**
  - **Performance Tests:** Test de carga (JMeter/Locust) para verificar que el rate limiter responde con HTTP 429 cuando se supera el umbral.
  - **Integration Tests:** Test que intenta subir un archivo que excede la cuota y verifica que se recibe un HTTP 400.
- **Documentación:**
  - Documentar los códigos de error 429 y 400 en la especificación de la API.
- **Criterios de Aceptación:**
  - Una carga de N+1 documentos o un tamaño superior al límite en MB resulta en una respuesta HTTP 400.
  - Realizar 40 peticiones por minuto a los endpoints rate-limitados resulta en respuestas HTTP 429.
  - Los límites son configurables mediante la API del Config Store (T-44) y se persisten en la base de datos. La UI para su gestión por un administrador se completará en T-37.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, performance) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 11)**

|                                  |                                                                                                                                                |                      |                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                                     | Complejidad Estimada | Entregable Verificable                                                                                  |
| R1.WP1-T03-ST1                   | Implementar middleware de rate-limiting (con Redis) para los endpoints críticos (/upload, /rewrite, /plan, /draft_section).                    | 4                    | Test de carga que supera 30 req/min al endpoint /plan recibe respuestas HTTP 429.                       |
| R1.WP1-T03-ST2                   | Desarrollar la lógica de backend para validar los límites de ingesta (Nº de documentos, tamaño total en MB) contra la configuración del admin. | 4                    | Test unitario que simula una carga que excede el límite de MB y recibe un error de validación HTTP 400. |
| R1.WP1-T03-ST3                   | Crear la sección "Límites de Uso" en el panel de admin (usando el esqueleto de T-44) para configurar estos valores y persistirlos en la DB.    | 3                    | Test Cypress donde un admin guarda nuevos límites y se verifica que se persisten en la DB.              |

---

### **Tarea T-04: File Ingesta RAG + Perf**

- **ID de Tarea:** T-04
- **Título:** File Ingesta RAG + Perf
- **Estado:** Pendiente
- **Dependencias:** T-12, T-41
- **Prioridad:** Crítica
- **Release Target:** Release 1
- **Descripción:** Desarrollar el pipeline completo de ingesta de documentos para el sistema RAG. Esto implica recibir archivos, extraer su contenido, generar embeddings vectoriales y almacenarlos en una base de datos vectorial para su posterior recuperación. El rendimiento es un factor clave.
- **Detalles Técnicos:**
  - **Endpoint:** REST API POST /upload (multipart/form-data).
  - **Extracción:** Librerías como pypdf, python-docx.
  - **Embeddings:** Modelo text-embedding-3-small de OpenAI.
  - **Vector Store:** ChromaDB.
  - **Benchmarking:** JMeter/Locust.

- **Estrategia de Test:**
  - **Unit Tests:** Para los módulos de extracción de texto y chunking.
  - **Integration Tests:** Flujo completo desde la subida de un archivo hasta la verificación de su existencia en ChromaDB. Test de regresión para la lógica de upsert.
  - **Performance Tests:** Medir la tasa de ingesta (MB/h) y la latencia de búsqueda p95.
- **Documentación:**
  - Actualizar OpenAPI para el endpoint /upload.
  - ADR sobre la elección de ChromaDB y la estrategia de chunking.
  - **Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**
- **Criterios de Aceptación:**
  - Una suite de JMeter evidencia que se cumplen los objetivos de rendimiento (PERF-003, PERF-004).
  - Un test de regresión verifica que un upsert de un documento existente actualiza los vectores y los antiguos no son recuperables.
  - Los metadatos del documento (nombre, tipo) son visibles en la UI después de la carga.
  - **Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**

- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration, performance) pasan.
  - Documentación (API, ADR) completada.
  - **Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 18)**

|                                  |                                                                                                    |                      |                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                         | Complejidad Estimada | Entregable Verificable                                                                                        |
| R1.WP1-T04-ST1                   | Implementar endpoint REST /upload con validación de archivos (MIME type, tamaño) y metadatos.      | 4                    | Colección Postman que prueba subidas válidas (200 OK) e inválidas (400 Bad Request).                          |
| R1.WP1-T04-ST2                   | Desarrollar el módulo de extracción de texto para PDF, DOCX y MD, incluyendo el chunking de texto. | 5                    | Tests unitarios que procesan ficheros de ejemplo y devuelven el texto extraído y chunked correctamente.       |
| R1.WP1-T04-ST3                   | Integrar cliente OpenAI para generar embeddings (text-embedding-3-small).                          | 2                    | Test de integración que invoca al cliente OpenAI y verifica que se reciben los vectores.                      |
| R1.WP1-T04-ST4                   | Implementar lógica de upsert en ChromaDB para indexar y actualizar vectores y metadatos.           | 3                    | Test de integración que sube un documento, genera embeddings y verifica que los vectores existen en ChromaDB. |
| R1.WP1-T04-ST5                   | Crear script de benchmark (JMeter/Locust) para medir rendimiento de ingesta (PERF-003).            | 2                    | Reporte de JMeter/Locust que muestra las métricas de rendimiento de ingesta.                                  |
| R1.WP1-T04-ST6                   | Crear script de benchmark para medir latencia de búsqueda vectorial (PERF-004).                    | 2                    | Reporte de JMeter/Locust que muestra las métricas de latencia de búsqueda.                                    |

---

### **Tarea T-05: Planner Service (/plan)**

- **ID de Tarea:** T-05
- **Título:** Planner Service (/plan)
- **Estado:** Pendiente
- **Dependencias:** T-01, T-41
- **Prioridad:** Crítica
- **Release Target:** Release 1
- **Descripción:** Crear el servicio de backend que, a partir de un prompt inicial, genera un esquema estructurado (outline) del documento. Este servicio es el primer paso en el pipeline de generación de contenido y debe ser rápido y fiable.
- **Detalles Técnicos:**
  - **Arquitectura:** Hexagonal (Ports & Adapters) para aislar la lógica de negocio.
  - **Protocolo:** HTTP POST a /plan.
  - **Payload:** JSON con el prompt del usuario.
  - **Respuesta:** JSON con el outline estructurado (H1, H2, H3).
  - **IA:** LLM para la generación del outline.
- **Estrategia de Test:**
  - **Unit Tests:** Probar la lógica de validación de la respuesta del LLM y el modo fallback.
  - **Integration Tests:** Llamada al endpoint /plan y verificación de la estructura del JSON de respuesta.
- **Documentación:**
  - Actualizar OpenAPI para el endpoint /plan.
  - Diagrama de flujo del proceso de generación del plan.
- **Criterios de Aceptación:**
  - La petición al endpoint /plan devuelve una respuesta en ≤ 1 segundo.
  - La respuesta es un JSON válido que contiene una estructura de headings H1-H3.
  - El servicio incluye una lógica de fallback a un modo 'single-shot' si el outline generado no cumple un umbral de calidad.
  - Un test E2E demuestra la generación de un borrador inicial según el flujo documentado.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration) pasan.
  - Documentación (API, diagrama) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 14)**

|                                  |                                                                                                                               |                      |                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                    | Complejidad Estimada | Entregable Verificable                                                                                                               |
| R1.WP2-T05-ST1                   | Diseñar la arquitectura del servicio (Hexagonal) y definir el contrato de la API para /plan en OpenAPI.                       | 3                    | Documento OpenAPI actualizado y un ADR que justifica la elección de la arquitectura.                                                 |
| R1.WP2-T05-ST2                   | Implementar la lógica de "Outline-Guided Thought Generation" que interactúa con el LLM para generar el esquema del documento. | 6                    | Test unitario que, dado un prompt, invoca al LLM y valida que la respuesta es un JSON con la estructura de outline esperada (H1-H3). |
| R1.WP2-T05-ST3                   | Implementar la lógica de fallback a modo 'single-shot' y el test E2E que valida el flujo completo.                            | 5                    | Test E2E que simula una respuesta de outline de baja calidad y verifica que el sistema cambia al modo fallback.                      |

---

### **Tarea T-06: Sections WS**

- **ID de Tarea:** T-06
- **Título:** Sections WS
- **Estado:** Pendiente
- **Dependencias:** T-05, T-41
- **Prioridad:** Alta
- **Release Target:** Release 1
- **Descripción:** Implementar el servicio de WebSocket que genera el contenido de cada sección del documento de forma progresiva (streaming). Esto proporciona al usuario una retroalimentación visual inmediata y mejora la experiencia de usuario.
- **Detalles Técnicos:**
  - **Protocolo:** WebSocket.
  - **Flujo:** El cliente se conecta, el servidor toma el plan de T-05 y comienza a generar y emitir el contenido de cada sección.
  - **Mensajes:** section_start, section_chunk, section_end, summary_update.
  - **Nota sobre Rendimiento:** La métrica de rendimiento de renderizado de la UI (PERF-002) es propiedad de la tarea T-07 y no se mide aquí.

- **Estrategia de Test:**
  - **Integration Tests:** Simular un cliente WebSocket que se conecta, recibe el stream de una sección completa y verifica que el contenido es coherente. Medir la latencia del handshake y del stream.
- **Documentación:**
  - Documentar el protocolo de mensajes del WebSocket.
- **Criterios de Aceptación:**
  - La generación de una sección de 600 tokens se completa en ≤ 20 segundos (p95).
  - El handshake de la conexión WebSocket se completa en ≤ 150 ms.
  - El global_summary se actualiza en ≤ 500 ms (p95) tras la finalización de cada sección.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests de integración pasan.
  - Documentación del protocolo WS completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 14)**

|                                  |                                                                                                                         |                      |                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                              | Complejidad Estimada | Entregable Verificable                                                                                                  |
| R1.WP2-T06-ST1                   | Implementar el servidor WebSocket, incluyendo el handshake de conexión y la autenticación del usuario.                  | 5                    | Test de integración que establece una conexión WS autenticada y verifica que el handshake se completa en < 150 ms.      |
| R1.WP2-T06-ST2                   | Desarrollar la lógica de streaming de secciones, que toma el outline de T-05 y genera el contenido sección por sección. | 6                    | Test que invoca el flujo de generación y verifica que el servidor WS emite eventos de section_chunk y section_complete. |
| R1.WP2-T06-ST3                   | Implementar la generación y refresco del global_summary después de cada sección completada.                             | 3                    | Test que verifica que tras un evento section_complete, se emite un evento summary_update con el resumen actualizado.    |

---

### **Tarea T-07: Editor UI Core + Split View**

- **ID de Tarea:** T-07
- **Título:** Editor UI Core + Split View
- **Estado:** Pendiente
- **Dependencias:** T-06
- **Prioridad:** Alta
- **Release Target:** Release 2
- **Descripción:** Construir la interfaz de usuario principal para la edición de documentos. Esta interfaz debe ser una vista dividida (split-view) que muestre el outline del documento, el contenido principal y una barra de prompts interactiva. Esta tarea consolida y asume la propiedad de la métrica de rendimiento PERF-002 (< 200 ms render), medida a través de Lighthouse.
- **Detalles Técnicos:**
  - **Framework:** React 18.
  - **Editor:** Monaco Editor.
  - **Estado:** Zustand o Redux Toolkit para la gestión del estado del documento.
  - **Componentes:** SplitView, OutlinePane, EditorPane, PromptBar.
- **Estrategia de Test:**
  - **Unit Tests:** Para los componentes de UI y la lógica de estado.
  - **E2E Tests (Cypress):** Probar la interacción del usuario, como el drag-and-drop de secciones en el outline.
  - **Performance Tests:** Medir el tiempo de renderizado inicial con Lighthouse (PERF-002).
- **Documentación:**
  - Storybook para los componentes de la UI del editor.
- **Criterios de Aceptación:**
  - El tiempo de renderizado inicial de la vista del editor es < 200 ms (p95) según Lighthouse.
  - El reordenamiento de secciones mediante drag-and-drop en el Outline Pane persiste en el estado de la aplicación.
  - La ETA en la Prompt Bar muestra un progreso con una precisión de ±5%.
  - El editor Monaco está configurado según las directrices de DESIGN_GUIDELINES.md.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, E2E, performance) pasan.
  - Documentación en Storybook completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 14)**

|                                  |                                                                                                                     |                      |                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                          | Complejidad Estimada | Entregable Verificable                                                                                                          |
| R2.WP1-T07-ST1                   | Implementar el layout de Split View con React, integrando el editor Monaco y un panel de outline.                   | 5                    | Componente React renderiza la vista dividida. El editor Monaco está configurado según DESIGN_GUIDELINES.md.                     |
| R2.WP1-T07-ST2                   | Desarrollar el componente "Prompt Bar" con cálculo y visualización de ETA dinámica, conectándose al stream de T-06. | 4                    | La barra de progreso se actualiza durante la generación de contenido y la ETA es visible.                                       |
| R2.WP1-T07-ST3                   | Implementar el "Outline Pane" con funcionalidad de drag-and-drop para reordenar secciones.                          | 5                    | Test Cypress que arrastra un heading en el panel de outline y verifica que el orden se actualiza en el estado de la aplicación. |

---

### **Tarea T-08: Action Palette + IA Cmds**

- **ID de Tarea:** T-08
- **Título:** Action Palette + IA Cmds
- **Estado:** Pendiente
- **Dependencias:** T-07, T-41
- **Prioridad:** Alta
- **Release Target:** Release 2
- **Descripción:** Dotar al editor de una paleta de acciones (similar a VS Code) que permita al usuario invocar comandos de IA para reescribir, resumir, expandir o modificar el texto seleccionado.
- **Detalles Técnicos:**
  - **UI:** Librería como cmdk para la paleta de acciones.
  - **Backend:** Endpoint POST /rewrite que recibe texto, un comando y contexto.
  - **IA:** Prompts específicos para cada comando de reescritura.
  - **QA:** Test harness para validar la calidad de la salida de los comandos (ROUGE-L).
- **Estrategia de Test:**
  - **Unit Tests (Jest):** Probar los comandos de reescritura con textos "golden" para verificar la calidad semántica (ROUGE-L).
  - **Integration Tests:** Probar el flujo completo desde la paleta de acciones hasta la actualización del texto en el editor.
- **Documentación:**
  - Documentar los comandos de IA disponibles y su funcionamiento.
- **Criterios de Aceptación:**
  - El comando /resume reduce el texto en al menos un 20% y obtiene un score ROUGE-L ≥ 0.7 contra un resumen de referencia.
  - Un test demuestra que una reescritura que introduce una incoherencia contextual es marcada o rechazada por el sistema.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration) pasan.
  - Documentación de comandos completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

|                                  |                                                                                                                          |                      |                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                               | Complejidad Estimada | Entregable Verificable                                                                               |
| R2.WP1-T08-ST1                   | Integrar una paleta de acciones (ej. cmdk) en el editor y registrar los 8 comandos básicos.                              | 4                    | La paleta de acciones se abre con un atajo de teclado y muestra los comandos disponibles.            |
| R2.WP1-T08-ST2                   | Implementar el endpoint de backend /rewrite que toma texto y un comando (ej. "summarize") y devuelve el texto reescrito. | 4                    | Colección Postman que prueba el endpoint /rewrite con diferentes comandos y verifica las respuestas. |
| R2.WP1-T08-ST3                   | Crear el test harness con ROUGE-L para validar la calidad de los comandos de reescritura.                                | 4                    | Script de test que ejecuta el comando /resume sobre un texto de referencia y falla si ROUGE-L < 0.7. |

---

### **Tarea T-09: Versioning & Diff**

- **ID de Tarea:** T-09
- **Título:** Versioning & Diff
- **Estado:** Pendiente
- **Dependencias:** T-07, T-13
- **Prioridad:** Alta
- **Release Target:** Release 4
- **Descripción:** Implementar un sistema de versionado automático para cada documento. El sistema guardará un snapshot cada vez que el usuario guarde, permitiendo ver las diferencias entre versiones y revertir a una versión anterior.
- **Detalles Técnicos:**
  - **Backend:** Almacenar snapshots del documento en una tabla separada, vinculada al documento principal. Usar SHA-256 para identificar cambios.
  - **Frontend:** Usar el componente DiffEditor de Monaco para visualizar las diferencias.
  - **Límite:** Implementar un límite de 500 versiones por documento para controlar el almacenamiento.
- **Estrategia de Test:**
  - **Unit Tests:** Para la lógica de creación de snapshots y el cálculo de hashes.
  - **E2E Tests (Cypress):** Probar el flujo completo: guardar varias veces, abrir el visor de versiones, seleccionar una versión, ver el diff y revertir a ella.
- **Documentación:**
  - Documentar cómo funciona el sistema de versionado.
- **Criterios de Aceptación:**
  - La acción de revertir a una versión vN restaura el contenido correctamente sin perder el historial de versiones posterior.
  - Cada guardado de un documento se registra como un evento en el log de auditoría de T-13.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, E2E) pasan.
  - Documentación completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

|                                  |                                                                                                                                                |                      |                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                                     | Complejidad Estimada | Entregable Verificable                                                                                                          |
| R4.WP1-T09-ST1                   | Modificar el modelo de datos para almacenar snapshots de documentos (contenido + SHA-256) y registrar el evento en el log de auditoría (T-13). | 4                    | Test que guarda un documento y verifica que se crea un nuevo registro de versión en la DB y una entrada en el log de auditoría. |
| R4.WP1-T09-ST2                   | Implementar el componente de UI DiffEditor (de Monaco) que muestra las diferencias entre la versión actual y una seleccionada.                 | 5                    | Componente React que, dados dos textos, renderiza una vista de diferencias.                                                     |
| R4.WP1-T09-ST3                   | Implementar la funcionalidad de "Rollback" en la UI y el endpoint de backend correspondiente que restaura una versión anterior.                | 3                    | Test Cypress que selecciona una versión antigua, hace clic en "Rollback" y verifica que el contenido del editor se actualiza.   |

---

### **Tarea T-10: Export Service**

- **ID de Tarea:** T-10
- **Título:** Export Service
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Media
- **Release Target:** Release 4
- **Descripción:** Crear un servicio asíncrono que permita a los usuarios exportar sus documentos (que están en formato Markdown) a formatos comunes como PDF y DOCX.
- **Detalles Técnicos:**
  - **Asincronía:** Celery con un broker (Redis o RabbitMQ).
  - **Conversión:** Librería Pandoc.
  - **UI:** Botón de exportación y notificaciones "toast" para informar al usuario del progreso.
- **Estrategia de Test:**
  - **Integration Tests:** Una tarea de Celery que toma un string Markdown y verifica que los archivos PDF y DOCX generados son válidos.
  - **E2E Tests (Cypress):** Probar el flujo desde el clic en "Exportar" hasta la descarga del archivo.
- **Documentación:**
  - ADR sobre la elección de Celery y Pandoc.
- **Criterios de Aceptación:**
  - El archivo PDF generado se abre en visores estándar sin advertencias de formato.
  - El archivo DOCX generado pasa la validación del validador de OpenXML.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, E2E) pasan.
  - Documentación (ADR) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 10)**

|                                  |                                                                                                       |                      |                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                            | Complejidad Estimada | Entregable Verificable                                                                                                  |
| R4.WP1-T10-ST1                   | Configurar Celery y un broker (ej. Redis/RabbitMQ) para gestionar tareas asíncronas de exportación.   | 4                    | Tarea de prueba "hello world" se ejecuta correctamente a través de Celery.                                              |
| R4.WP1-T10-ST2                   | Implementar la tarea de Celery que utiliza Pandoc para convertir el contenido Markdown a PDF y DOCX.  | 4                    | La tarea toma un string Markdown y genera un fichero PDF y DOCX válidos.                                                |
| R4.WP1-T10-ST3                   | Integrar la funcionalidad en la UI con un botón de "Exportar" y un toast de notificación de progreso. | 2                    | Test Cypress que hace clic en "Exportar", verifica que se muestra el toast y que el archivo se descarga al completarse. |

---

### **Tarea T-11: Coherence Checker**

- **ID de Tarea:** T-11
- **Título:** Coherence Checker
- **Estado:** Pendiente
- **Dependencias:** T-06
- **Prioridad:** Alta
- **Release Target:** Release 2
- **Descripción:** Desarrollar un servicio que pueda analizar el texto completo de un documento y proporcionar una puntuación de coherencia. Esto ayuda a los editores a identificar inconsistencias lógicas o estilísticas introducidas durante la generación o edición.
- **Detalles Técnicos:**
  - **IA:** Modelo de lenguaje pre-entrenado (tipo BERT) para la clasificación de coherencia o "Next Sentence Prediction".
  - **Backend:** Endpoint POST /revise_global.
  - **Investigación:** Requiere una fase de I+D para seleccionar y ajustar el modelo más adecuado.
- **Estrategia de Test:**
  - **Unit Tests:** Crear un dataset de prueba con pares de textos (coherentes e incoherentes) y verificar que el modelo los clasifica correctamente.
- **Documentación:**
  - ADR documentando la investigación, la elección del modelo y los resultados de la validación.
- **Criterios de Aceptación:**
  - El clasificador de coherencia alcanza una tasa de error ≤ 1% en el dataset de prueba curado.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests unitarios con el dataset de prueba pasan.
  - Documentación (ADR) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 15)**

|                                  |                                                                                                             |                      |                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                  | Complejidad Estimada | Entregable Verificable                                                                                                   |
| R2.WP2-T11-ST1                   | Investigar y seleccionar un modelo pre-entrenado (BERT-based) para la evaluación de cohesión textual.       | 4                    | ADR documentando la elección del modelo, sus pros y contras, y cómo integrarlo.                                          |
| R2.WP2-T11-ST2                   | Implementar el endpoint /revise_global que toma el contenido del documento y devuelve un score de cohesión. | 6                    | Colección Postman que envía un texto coherente (score alto) y uno incoherente (score bajo) y verifica los resultados.    |
| R2.WP2-T11-ST3                   | Crear un dataset de prueba con ejemplos de textos coherentes e incoherentes para validar el checker.        | 5                    | Test de integración que ejecuta el checker contra el dataset y verifica que la precisión es la esperada (≤ 1% de error). |

---

### **Tarea T-12: Credential Store & Crypto**

- **ID de Tarea:** T-12
- **Título:** Credential Store & Crypto
- **Estado:** Pendiente
- **Dependencias:** T-13
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Implementar las medidas criptográficas fundamentales para proteger los datos de la aplicación, tanto en reposo (at-rest) como en tránsito (in-transit), y establecer un proceso para la rotación automática de credenciales.
- **Detalles Técnicos:**
  - **Cifrado en Reposo:** AES-256 para datos sensibles en la DB (ej. claves de API de usuario).
  - **Cifrado en Tránsito:** Forzar TLS 1.3 en todas las comunicaciones.
  - **Rotación de Claves:** Cron job que identifica y fuerza la rotación de claves de API de usuario con más de 90 días.
- **Estrategia de Test:**
  - **Unit Tests:** Para las funciones de cifrado y descifrado.
  - **Integration Tests:** Probar el cron job de rotación de claves.
  - **Security Tests:** Realizar un pentest básico para verificar la configuración de TLS y que los datos sensibles no se almacenan en texto plano.
- **Documentación:**
  - ADR sobre la estrategia de gestión de secretos.
- **Criterios de Aceptación:**
  - Una simulación de una clave de 91 días de antigüedad dispara la rotación automática y genera una entrada en el log WORM en ≤ 5 minutos.
  - La clave antigua queda invalidada después de la rotación.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration, security) pasan.
  - Documentación (ADR) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 14)**

|                                  |                                                                                                         |                      |                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                              | Complejidad Estimada | Entregable Verificable                                                                                                      |
| R0.WP3-T12-ST1                   | Implementar la encriptación AES-256 para los datos sensibles en reposo (at-rest) en la base de datos.   | 5                    | Test unitario que encripta un dato, lo guarda, lo recupera y lo desencripta, verificando que el valor original se mantiene. |
| R0.WP3-T12-ST2                   | Configurar el servidor web para forzar TLS 1.3 en todas las comunicaciones (in-transit).                | 3                    | Reporte de una herramienta como SSL Labs que confirma que el servidor usa TLS 1.3 y tiene una configuración segura.         |
| R0.WP3-T12-ST3                   | Crear el cron job diario que identifica claves API de usuario con más de 90 días de antigüedad.         | 3                    | Script que, al ejecutarse, imprime una lista de las claves que necesitan rotación.                                          |
| R0.WP3-T12-ST4                   | Implementar la lógica de rotación automática de claves y el registro del evento en el log de auditoría. | 3                    | Test que simula una clave de 91 días y verifica que se genera una nueva clave y se registra el evento en el log WORM.       |

---

### **Tarea T-13: Audit Log WORM & Viewer**

- **ID de Tarea:** T-13
- **Título:** Audit Log WORM & Viewer
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Crear un sistema de registro de auditoría inmutable (WORM - Write Once, Read Many) para todas las acciones críticas del sistema. También se debe proporcionar una interfaz para que los administradores puedan visualizar y filtrar estos logs.
- **Detalles Técnicos:**
  - **Backend:** Tabla en la base de datos con permisos de INSERT y SELECT únicamente para el usuario de la aplicación.
  - **Frontend:** Interfaz de visualización para administradores con filtros por usuario, tipo de acción y rango de fechas.
- **Estrategia de Test:**
  - **Integration Tests:** Realizar una acción crítica (ej. login, guardar documento) y verificar que se crea la entrada correcta en el log de auditoría.
  - **Security Tests:** Intentar modificar o eliminar un registro del log y verificar que la operación falla.
  - **E2E Tests (Cypress):** Probar la interfaz del visor de logs, incluyendo la paginación y los filtros.
- **Criterios de Aceptación:**
  - Una entrada en el log WORM aparece en ≤ 5 segundos tras la acción correspondiente.
  - La UI del visor de logs permite filtrar por usuario, tipo de acción y rango de fechas, con paginación funcional.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, security, E2E) pasan.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 11)**

|                                  |                                                                                                                               |                      |                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                    | Complejidad Estimada | Entregable Verificable                                                                                                          |
| R0.WP3-T13-ST1                   | Diseñar y crear la tabla de base de datos para el log de auditoría con una política de append-only a nivel de permisos de DB. | 4                    | Script de migración de la base de datos. Un test que intenta un UPDATE o DELETE en la tabla falla debido a los permisos.        |
| R0.WP3-T13-ST2                   | Implementar el servicio de logging que escribe eventos en la tabla de auditoría.                                              | 4                    | Test de integración que realiza una acción (ej. guardar documento) y verifica que se crea la entrada correspondiente en el log. |
| R0.WP3-T13-ST3                   | Desarrollar la UI del visor de logs para administradores, incluyendo filtros por usuario, acción y fecha.                     | 3                    | Test Cypress donde un admin filtra el log y verifica que los resultados son correctos.                                          |

---

### **Tarea T-14: Observability & Dashboards + KPIs**

- **ID de Tarea:** T-14
- **Título:** Observability & Dashboards + KPIs
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Alta
- **Release Target:** Release 5
- **Descripción:** Implementar una solución de observabilidad completa para monitorizar la salud, el rendimiento y el uso del sistema. Esto incluye la recolección de trazas, métricas y logs, y su visualización en dashboards.
- **Detalles Técnicos:**
  - **Estándar:** OpenTelemetry (OTel) para la instrumentación.
  - **Stack:** Prometheus para métricas, Grafana para dashboards, y un colector OTel (como Jaeger o Grafana Tempo) para trazas.
  - **KPIs:** TMG, ratio de éxito de ingesta, reutilización de plantillas, etc.
- **Estrategia de Test:**
  - **Integration Tests:** Verificar que las métricas y trazas personalizadas se exportan y son visibles en Grafana/Jaeger.
- **Documentación:**
  - Documentar las métricas personalizadas que se exponen.
  - Exportar la configuración de los dashboards de Grafana como JSON.
- **Criterios de Aceptación:**
  - El 99% de los spans de una transacción están instrumentados y son visibles en el sistema de trazas.
  - Un panel de Grafana muestra los KPIs clave (TMG, doc_count/month, etc.) con un lag de datos < 60 segundos.
  - Se han configurado alertas para los umbrales de cada KPI.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests de integración pasan.
  - Documentación y dashboards exportados completados.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 13)**

|                                  |                                                                                                              |                      |                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                   | Complejidad Estimada | Entregable Verificable                                                                                        |
| R5.WP1-T14-ST1                   | Instrumentar el código de backend y frontend con OpenTelemetry (OTel) para generar trazas y métricas.        | 5                    | Trazas de una petición E2E (frontend -> backend -> DB) son visibles en un colector OTel (ej. Jaeger).         |
| R5.WP1-T14-ST2                   | Configurar Prometheus para recolectar métricas y Grafana para la visualización.                              | 4                    | Una métrica custom (ej. documents_created_total) es visible y se actualiza en un dashboard de Grafana.        |
| R5.WP1-T14-ST3                   | Crear los dashboards de Grafana con los KPIs definidos (TMG, ratio de éxito, etc.) y configurar las alertas. | 4                    | Screenshots de los dashboards de Grafana mostrando los KPIs. Una regla de alerta configurada para el KPI TMG. |

---

### **Tarea T-15: Backup & Storage Ops**

- **ID de Tarea:** T-15
- **Título:** Backup & Storage Ops
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Crítica
- **Release Target:** Release 5
- **Descripción:** Establecer y automatizar las operaciones de respaldo y restauración para garantizar la durabilidad de los datos y la resiliencia del sistema. Incluye la gestión de políticas de retención y alertas de almacenamiento.
- **Detalles Técnicos:**
  - **Scripts:** Scripts de shell/Python para pg_dump (o similar) y backup del vector-store.
  - **Almacenamiento:** Solución de almacenamiento de objetos compatible con S3 para los backups.
  - **Cifrado:** GPG o similar para cifrar los archivos de backup.
  - **Automatización:** Cron jobs o jobs de CI/CD programados.
- **Estrategia de Test:**
  - **Integration Tests:** El job de CI/CD restore --verify (T-29) es el principal test de integración para esta tarea.
  - **E2E Tests:** Simular un escenario de desastre y medir el tiempo de recuperación manual usando los scripts.
- **Documentación:**
  - Documento de runbook para el proceso de backup y restauración manual.
- **Criterios de Aceptación:**
  - Un job de CI/CD semanal ejecuta restore --verify y comprueba el hash del backup restaurado contra el original.
  - Una alerta se dispara cuando el uso del almacenamiento de backups supera el 80% de la cuota.
  - Los backups con más de 30 días de antigüedad son purgados automáticamente por un script de retención.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - El job de restore --verify pasa consistentemente.
  - Documentación (runbook) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 10)**

|                                  |                                                                                                                   |                      |                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                        | Complejidad Estimada | Entregable Verificable                                                                                    |
| R5.WP2-T15-ST1                   | Crear y programar el script de backup diario encriptado de la base de datos y el vector-store.                    | 4                    | Job de CI/CD que se ejecuta diariamente y produce un fichero de backup encriptado en un storage seguro.   |
| R5.WP2-T15-ST2                   | Desarrollar el script de restauración que toma un backup y restaura el estado del sistema en un entorno temporal. | 4                    | El script restaura una base de datos en un entorno de staging y un test de sanidad pasa correctamente.    |
| R5.WP2-T15-ST3                   | Implementar la política de retención de 30 días y la alerta de cuota al 80%.                                      | 2                    | Script que purga backups con más de 30 días. Una alerta se dispara cuando el uso del disco supera el 80%. |

---

### **Tarea T-16: Deployment & Scaling (PoC)**

- **ID de Tarea:** T-16
- **Título:** Deployment & Scaling (PoC)
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Alta
- **Release Target:** Release 6
- **Descripción:** Realizar una Prueba de Concepto (PoC) para validar la estrategia de despliegue y escalado de la aplicación en un entorno orquestado como Kubernetes. El objetivo es demostrar la capacidad de auto-escalado y la viabilidad del sharding del vector-store.
- **Detalles Técnicos:**
  - **Orquestación:** Kubernetes (Minikube o similar para el PoC).
  - **Manifiestos:** YAML para Deployments, Services, HPA (Horizontal Pod Autoscaler).
  - **Vector Store Sharding:** PoC con Qdrant o Chroma en modo clúster.
  - **Test de Carga:** Locust para generar carga y disparar el auto-escalado.
- **Estrategia de Test:**
  - **Performance Tests:** Ejecutar el test de carga y observar las métricas de HPA y el número de pods.
  - **Chaos Tests:** Simular la caída de un pod de la aplicación y medir el tiempo de recuperación (MTTR).
- **Documentación:**
  - ADR con los resultados del PoC, incluyendo métricas de rendimiento y lecciones aprendidas.
- **Criterios de Aceptación:**
  - Un test de carga con 10 usuarios y 100 documentos dispara el escalado de la aplicación a ≥ 3 réplicas.
  - El PoC demuestra la distribución de datos y consultas a través de ≥ 2 shards del vector-store.
  - El tiempo medio de recuperación (MTTR) ante el fallo de un pod de la aplicación es ≤ 2 horas (en el PoC).
- **Definición de Hecho (DoD):**
  - Código (manifiestos, scripts) revisado y aprobado.
  - Todos los tests (performance, chaos) del PoC completados y sus resultados documentados.
  - Documentación (ADR) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

|                                  |                                                                                                                                       |                      |                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                            | Complejidad Estimada | Entregable Verificable                                                                                                       |
| R4.WP3-T16-ST1                   | Crear manifiestos de Kubernetes (Deployment, Service, HPA) para los servicios de aplicación.                                          | 4                    | kubectl apply -f . despliega la aplicación en un clúster de k8s. El HPA está configurado para escalar basado en CPU/memoria. |
| R4.WP3-T16-ST2                   | Realizar un PoC de sharding para el vector-store (Qdrant/Chroma), documentando la configuración y el método de distribución.          | 5                    | Documento ADR y un script que demuestra que las consultas se distribuyen entre al menos dos shards del vector-store.         |
| R4.WP3-T16-ST3                   | Ejecutar un test de carga (Locust) que demuestre que el HPA escala las réplicas de la aplicación cuando se supera el umbral de carga. | 3                    | Métricas de Grafana/Prometheus que muestran el aumento del número de pods durante el test de carga.                          |

---

### **Tarea T-17: API-SPEC & ADR Governance**

- **ID de Tarea:** T-17
- **Título:** API-SPEC & ADR Governance
- **Estado:** Completado
- **Dependencias:** T-01
- **Prioridad:** Alta
- **Release Target:** Release 0
- **Descripción:** Establecer un proceso de gobernanza automatizado para la documentación de la arquitectura y la API. Esto asegura que la documentación se mantenga actualizada, sea consistente y trazable a lo largo del proyecto. **El alcance incluye la creación de una plantilla estándar para "Actas de Certificación" de tareas críticas.**
- **Detalles Técnicos:**
  - **API Spec:** OpenAPI 3.1.
  - **Linting:** spectral para validar la especificación OpenAPI.
  - **Trazabilidad:** Script que parsea los requisitos y el plan de trabajo para generar una matriz de trazabilidad.
  - **Automatización:** Job de CI en GitHub Actions.
- **Estrategia de Test:**
  - **Integration Tests:** El propio job de CI actúa como test. Un PR con una OpenAPI inválida o una matriz de trazabilidad desactualizada debe hacer fallar el pipeline.
- **Documentación:**
  - La tarea consiste en automatizar la generación y validación de la propia documentación.
- **Criterios de Aceptación:**
  - El linter spectral se ejecuta en CI y no reporta errores en la especificación OpenAPI.
  - La matriz de trazabilidad (docs/traceability.xlsx) se genera y versiona en cada commit a main.
  - El índice de ADRs está actualizado.
- **Definición de Hecho (DoD):**
  - Código (scripts, config CI) revisado y aprobado.
  - El job de CI de gobernanza pasa correctamente.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 8)**

|                                  |                                                                                                                                |                      |                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                     | Complejidad Estimada | Entregable Verificable                                                                                           |
| R0.WP1-T17-ST1                   | Integrar spectral en el pipeline de CI para validar el fichero OpenAPI 3.1 en cada commit.                                     | 2                    | El pipeline de CI falla si se introduce un cambio no válido en la especificación OpenAPI.                        |
| R0.WP1-T17-ST2                   | Crear el script que genera la matriz de trazabilidad (traceability.xlsx) y añadirlo como artefacto de CI.                      | 3                    | El pipeline de CI genera y adjunta el fichero traceability.xlsx en cada ejecución.                               |
| R0.WP1-T17-ST3                   | Escribir los ADRs iniciales para decisiones clave (ej. elección de Celery, estrategia de chunking).                            | 1                    | Ficheros ADR correspondientes existen en el directorio /docs/adr.                                                |
| R0.WP1-T17-ST4                   | Crear ADR para el Modelo de Gestión de API Keys de Usuario (relacionado a T-41), y la plantilla para "Actas de Certificación". | 2                    | Fichero ADR-XXX-api-key-management-model.md y la plantilla de Acta de Certificación existen y están versionados. |

---

### **Tarea T-18: Context Flags & Template Selection**

- **ID de Tarea:** T-18
- **Título:** Context Flags & Template Selection
- **Estado:** Pendiente
- **Dependencias:** T-32
- **Prioridad:** Alta
- **Release Target:** Release 3
- **Descripción:** Implementar controles en la UI que permitan al usuario seleccionar el contexto para la generación de IA (usar base de conocimiento, búsqueda web o libre) y elegir una plantilla de prompt predefinida.
- **Detalles Técnicos:**
  - **UI:** Componentes Toggle y Dropdown en React.
  - **Backend:** Endpoint PATCH /context para persistir la selección del usuario por documento.
  - **Lógica:** El servicio de generación debe leer esta configuración y ajustar su comportamiento (ej. no realizar búsqueda RAG si el contexto es "Libre").
- **Estrategia de Test:**
  - **Unit Tests:** Probar la lógica del backend que ajusta el comportamiento de generación según el contexto.
  - **E2E Tests (Cypress):** Probar que cambiar el toggle o seleccionar una plantilla en la UI se refleja en la siguiente generación de contenido.
- **Documentación:**
  - Actualizar la documentación de la API para el endpoint /context.
- **Criterios de Aceptación:**
  - Cambiar el toggle de contexto en la UI aplica el contexto y excluye la búsqueda RAG en ≤ 3 segundos (p95).
  - El dropdown muestra y aplica la plantilla seleccionada de T-32.
  - El toggle "Web search" está presente pero deshabilitado, y al pasar el cursor sobre él muestra el tooltip: "Disponible en futura versión".
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, E2E) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 11)**

|                                  |                                                                                                                        |                      |                                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                             | Complejidad Estimada | Entregable Verificable                                                                                                                                     |
| R3.WP2-T18-ST1                   | Implementar el componente de UI con el toggle de contextos (KB, Web, Libre) y el dropdown de plantillas.               | 4                    | Componente React renderiza los controles. El toggle "Web search" está deshabilitado con el tooltip correcto.                                               |
| R3.WP2-T18-ST2                   | Implementar el endpoint API /context (PATCH) que actualiza las preferencias del usuario para un documento.             | 3                    | Colección Postman que actualiza el contexto y la plantilla de un documento.                                                                                |
| R3.WP2-T18-ST3                   | Conectar la UI al backend y añadir tests que verifiquen que la selección de contexto/plantilla afecta a la generación. | 4                    | Test Cypress que selecciona "Libre" y verifica que no se hace una búsqueda RAG. Otro test que selecciona una plantilla y verifica que se usa en el prompt. |

---

### **Tarea T-19: Comment Tags & /comment CRUD**

- **ID de Tarea:** T-19
- **Título:** Comment Tags & /comment CRUD
- **Estado:** Pendiente
- **Dependencias:** T-07
- **Prioridad:** Media
- **Release Target:** Release 3
- **Descripción:** Implementar una funcionalidad de comentarios en el editor. Los usuarios podrán añadir comentarios tipo "tag" (ej. TODO, NOTE) en líneas específicas del texto, que serán visibles como decoraciones y estarán enlazados con el panel de outline.
- **Detalles Técnicos:**
  - **Backend:** API REST para el CRUD de comentarios (/comment).
  - **Frontend:** Usar las decoraciones de Monaco Editor para mostrar los tags en el gutter o en el propio texto.
  - **Estado:** Sincronizar los comentarios entre el editor y un posible panel de comentarios.
- **Estrategia de Test:**
  - **Unit Tests (Jest):** Cobertura > 90% para la lógica de estado de los comentarios en el frontend.
  - **Integration Tests:** Probar el CRUD de la API de comentarios.
  - **E2E Tests (Cypress):** Probar el flujo completo de añadir un comentario desde la UI y verificar que persiste.
- **Documentación:**
  - Actualizar OpenAPI para los endpoints de /comment.
- **Criterios de Aceptación:**
  - Crear o eliminar un tag se refleja en la UI en < 150 ms.
  - Los tests de Jest para la lógica de comentarios tienen una cobertura > 90%.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration, E2E) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 10)**

|                                  |                                                                                                    |                      |                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                         | Complejidad Estimada | Entregable Verificable                                                                                    |
| R3.WP1-T19-ST1                   | Implementar los endpoints REST para el CRUD de comentarios (/comment).                             | 4                    | Colección Postman que prueba la creación, listado y eliminación de comentarios asociados a un documento.  |
| R3.WP1-T19-ST2                   | Integrar las decoraciones de Monaco Editor para visualizar los tags (TODO, NOTE) en el texto.      | 3                    | Al añadir un comentario con un tag, una decoración visual aparece en la línea correspondiente del editor. |
| R3.WP1-T19-ST3                   | Conectar la UI al backend y asegurar que los comentarios se pueden crear/eliminar desde el editor. | 3                    | Test Cypress que añade un comentario a través de la UI y verifica que persiste tras recargar la página.   |

---

### **Tarea T-20: Bench E2E Performance**

- **ID de Tarea:** T-20
- **Título:** Bench E2E Performance
- **Estado:** Pendiente
- **Dependencias:** T-08, T-10
- **Prioridad:** Alta
- **Release Target:** Release 6
- **Descripción:** Crear y ejecutar una suite de benchmarks de rendimiento End-to-End (E2E) que simule el ciclo de vida completo de un documento bajo una carga de usuarios realista.
- **Detalles Técnicos:**
  - **Herramientas:** JMeter para la ingesta masiva, Locust para la simulación de usuarios interactivos.
  - **Escenario:** 1. Ingesta de 100 documentos. 2. 10 usuarios concurrentes realizan acciones de generación, edición y exportación sobre esos documentos.
- **Estrategia de Test:**
  - Esta tarea es en sí misma una tarea de testing.
- **Documentación:**
  - Documentar los scripts de benchmark y cómo ejecutarlos.
  - Generar un reporte final de rendimiento con los resultados.
- **Criterios de Aceptación:**
  - El p95 del tiempo total para el flujo (generación + edición + exportación) es ≤ 6 minutos.
  - El p95 del tiempo para completar un borrador (draft_complete_p95) es ≤ 8 minutos.
  - Las pruebas están automatizadas y se ejecutan en un job de CI.
- **Definición de Hecho (DoD):**
  - Scripts de benchmark revisados y aprobados.
  - Reportes de JMeter y Locust generados y analizados.
  - El job de CI está configurado.
  - **Acta de Certificación del Ciclo de KPI de Rendimiento (según plantilla de T-17) firmada por el Tech Lead.**
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

|                                  |                                                                                                                                 |                      |                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                      | Complejidad Estimada | Entregable Verificable                                                                                                           |
| R6.WP3-T20-ST1                   | Desarrollar el script de JMeter que simula el flujo de ingesta masiva de 100 documentos.                                        | 4                    | Reporte de JMeter mostrando los tiempos de subida de los 100 documentos.                                                         |
| R6.WP3-T20-ST2                   | Desarrollar el script de Locust que simula a 10 usuarios concurrentes realizando acciones de generación, edición y exportación. | 5                    | Reporte de Locust mostrando las métricas de latencia p95 para las acciones bajo carga.                                           |
| R6.WP3-T20-ST3                   | Integrar la ejecución de estos scripts en un job de CI (manual o nocturno) que falle si se degradan las métricas clave.         | 3                    | Configuración del job de CI. Un log de ejecución que muestra un resultado "pass" o "fail" basado en los umbrales de rendimiento. |

---

### **Tarea T-21: Navigation & Accessibility**

- **ID de Tarea:** T-21
- **Título:** Navigation & Accessibility
- **Estado:** Pendiente
- **Dependencias:** T-07
- **Prioridad:** Alta
- **Release Target:** Release 3
- **Descripción:** Mejorar la navegación global de la aplicación y asegurar que cumple con altos estándares de accesibilidad (A11y).
- **Detalles Técnicos:**
  - **UI:** Sidebar con pestañas, paleta "Quick Open" (⌘+P), virtual scrolling para listas largas.
  - **Accesibilidad:** Cumplimiento de WCAG 2.1 AA. Navegación completa por teclado, contraste de colores, atributos ARIA.
  - **Herramientas:** Lighthouse y Pa11y para la auditoría de accesibilidad.
- **Estrategia de Test:**
  - **E2E Tests (Cypress):** Probar la navegación, el drag-and-drop de proyectos y el Quick Open.
  - **Accessibility Tests:** Integrar Pa11y en el pipeline de CI para detectar regresiones de accesibilidad.
- **Documentación:**
  - Documentar las decisiones de accesibilidad en un ADR.
- **Criterios de Aceptación:**
  - La puntuación de Accesibilidad en Lighthouse es ≥ 90.
  - La paleta Quick Open (⌘+P) se abre en < 150 ms (p95).
  - El scroll en una lista virtualizada de 10,000 líneas no presenta "jank" (FPS > 50).
  - El reordenamiento de proyectos mediante drag-and-drop persiste el orden.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (E2E, accessibility) pasan.
  - Reportes de Lighthouse y Pa11y analizados y los problemas críticos resueltos.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

|                                  |                                                                                                                     |                      |                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                          | Complejidad Estimada | Entregable Verificable                                                                                                              |
| R3.WP1-T21-ST1                   | Implementar el componente Sidebar con pestañas y la funcionalidad de reordenamiento de proyectos con drag-and-drop. | 5                    | Test Cypress que arrastra un proyecto a una nueva posición en la lista y verifica que el orden se persiste tras recargar la página. |
| R3.WP1-T21-ST2                   | Implementar la paleta "Quick Open" (⌘+P) y el virtual-scroll para listas largas.                                    | 4                    | Test Cypress que presiona ⌘+P, busca un documento y navega a él. El scroll en una lista de 1000 items es fluido.                    |
| R3.WP1-T21-ST3                   | Realizar una auditoría de accesibilidad (A11y) con Lighthouse/Pa11y y corregir los problemas de mayor prioridad.    | 3                    | Reporte de Lighthouse con una puntuación de Accesibilidad ≥ 90.                                                                     |

---

### **Tarea T-22: Delete & Restore (Logical)**

- **ID de Tarea:** T-22
- **Título:** Delete & Restore (Logical)
- **Estado:** Pendiente
- **Dependencias:** T-37
- **Prioridad:** Alta
- **Release Target:** Release 4
- **Descripción:** Implementar la funcionalidad de borrado lógico (mover a la papelera) y restauración de documentos. Los documentos borrados lógicamente deben ser recuperables durante un período de tiempo configurable.
- **Detalles Técnicos:**
  - **Backend:** Usar un campo deleted_at (soft delete) en el modelo del documento. Endpoints DELETE /docs/{id} y POST /docs/{id}/restore.
  - **Frontend:** Mover los documentos borrados a una vista de "Papelera" desde donde se pueden restaurar.
- **Estrategia de Test:**
  - **Integration Tests:** Probar los endpoints de borrado y restauración.
  - **E2E Tests (Cypress):** Probar el flujo completo desde la UI: borrar un documento, ir a la papelera y restaurarlo.
- **Documentación:**
  - Actualizar OpenAPI para los nuevos endpoints.
- **Criterios de Aceptación:**
  - La llamada a DELETE /docs/{id} marca el documento como "deleted" en la base de datos.
  - La llamada a /docs/{id}/restore recupera el documento si se realiza dentro del período de retención.
  - Después del período de retención, el documento es un candidato para la purga por el job de T-36.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, E2E) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                                             |                      |                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                  | Complejidad Estimada | Entregable Verificable                                                                                    |
| R4.WP1-T22-ST1                   | Añadir el campo deleted_at al modelo de datos del documento y modificar las consultas para excluir los documentos borrados. | 3                    | Test que verifica que un documento con deleted_at no aparece en la lista principal de documentos.         |
| R4.WP1-T22-ST2                   | Implementar los endpoints de backend /docs/{id} (DELETE) y /docs/{id}/restore.                                              | 3                    | Colección Postman que borra lógicamente un documento y luego lo restaura, verificando el estado en la DB. |
| R4.WP1-T22-ST3                   | Implementar los botones correspondientes en la UI y la vista de "Papelera".                                                 | 3                    | Test Cypress que mueve un documento a la papelera y luego lo restaura desde allí.                         |

---

### **Tarea T-23: Health-check API**

- **ID de Tarea:** T-23
- **Título:** Health-check API
- **Estado:** Completado
- **Dependencias:** T-01
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Exponer un endpoint de health-check que verifique el estado de la aplicación y sus dependencias críticas (base de datos, vector-store, API de OpenAI).
- **Detalles Técnicos:**
  - **Endpoint:** GET /healthz.
  - **Respuesta:** JSON con un estado general (ok o degraded) y el estado de cada dependencia.
- **Estrategia de Test:**
  - **Integration Tests:** Probar el endpoint en diferentes escenarios (todo funcionando, una dependencia caída) y verificar la respuesta.
- **Documentación:**
  - Actualizar OpenAPI para el endpoint /healthz.
- **Criterios de Aceptación:**
  - El endpoint responde con HTTP 200 y un p95 de latencia < 200 ms.
  - El endpoint retorna un estado degraded si alguna de sus dependencias clave falla.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests de integración pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 5)**

|                                  |                                                                                             |                      |                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                  | Complejidad Estimada | Entregable Verificable                                                                                         |
| R0.WP1-T23-ST1                   | Implementar el endpoint /healthz que devuelve un estado básico "ok".                        | 2                    | Endpoint /healthz responde con HTTP 200 y {"status": "ok"}.                                                    |
| R0.WP1-T23-ST2                   | Añadir las verificaciones de conectividad a la base de datos, vector-store y API de OpenAI. | 3                    | Test de integración que simula una caída de la DB y verifica que /healthz responde con {"status": "degraded"}. |

---

### **Tarea T-24: Consentimiento Explícito**

- **ID de Tarea:** T-24
- **Título:** Consentimiento Explícito
- **Estado:** Pendiente
- **Dependencias:** T-04
- **Prioridad:** Crítica
- **Release Target:** Release 1
- **Descripción:** Implementar un mecanismo de consentimiento explícito del usuario antes de enviar sus datos a servicios de IA externos. El consentimiento debe ser registrado de forma inmutable.
- **Detalles Técnicos:**
  - **UI:** Checkbox en la interfaz de subida de archivos.
  - **Backend:** Registrar el evento de consentimiento en el log de auditoría de T-13. La lógica de negocio debe impedir la llamada a la IA si no hay consentimiento.
- **Estrategia de Test:**
  - **E2E Tests (Cypress):** Probar que el botón de "Upload" está deshabilitado hasta que se marca el checkbox. Probar que si no se da el consentimiento, las funcionalidades de IA no se ejecutan.
- **Documentación:**
  - Documentar el flujo de consentimiento.
- **Criterios de Aceptación:**
  - Sin marcar el checkbox, los botones "Upload" y "Generate context" están deshabilitados.
  - El acto de dar consentimiento se registra en el log de auditoría inmutable.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests E2E pasan.
  - El flujo ha sido revisado y aprobado desde una perspectiva de compliance.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 7)**

|                                  |                                                                                                               |                      |                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                    | Complejidad Estimada | Entregable Verificable                                                                                     |
| R1.WP1-T24-ST1                   | Añadir el checkbox de consentimiento en la UI de subida de archivos.                                          | 2                    | El checkbox es visible en la UI y el botón de "Upload" está deshabilitado por defecto.                     |
| R1.WP1-T24-ST2                   | Implementar la lógica de frontend para habilitar/deshabilitar los botones según el estado del checkbox.       | 2                    | Test Cypress que verifica que el botón "Upload" se habilita al marcar el checkbox.                         |
| R1.WP1-T24-ST3                   | Implementar la lógica de backend para registrar el consentimiento en el log de auditoría al subir un archivo. | 3                    | Al subir un archivo, se crea una entrada en el log de auditoría registrando el consentimiento del usuario. |

---

### **Tarea T-25: Dashboard Costes & Costo por Documento**

- **ID de Tarea:** T-25
- **Título:** Dashboard Costes & Costo por Documento
- **Estado:** Pendiente
- **Dependencias:** T-14
- **Prioridad:** Alta
- **Release Target:** Release 5
- **Descripción:** Extender la solución de observabilidad para incluir la monitorización de costes. El objetivo es calcular y visualizar el coste de la API de IA por documento, por día y por modelo, y alertar sobre desviaciones.
- **Detalles Técnicos:**
  - **Backend:** Registrar el consumo de tokens por cada llamada a la IA, asociándolo a un documento.
  - **Cálculo:** Un servicio o script que traduce el consumo de tokens a coste en USD, usando los precios de la API de OpenAI.
  - **Visualización:** Añadir nuevos paneles al dashboard de Grafana de T-14.
- **Estrategia de Test:**
  - **Unit Tests:** Para la lógica de cálculo de costes.
  - **Integration Tests:** Verificar que las métricas de coste se exportan correctamente a Prometheus.
- **Documentación:**
  - Documentar cómo se calculan las métricas de coste.
- **Criterios de Aceptación:**
  - La métrica de coste por documento (USD/doc) se calcula y tiene una desviación < 5% en comparación con la Usage API de OpenAI.
  - El dashboard muestra el total de tokens por documento, el coste por día/modelo y el coste por documento.
  - Se han configurado alertas para el coste por documento y para desviaciones > 5%.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration) pasan.
  - El dashboard de costes está funcional y validado.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 12)**

|                                  |                                                                                                                                 |                      |                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                      | Complejidad Estimada | Entregable Verificable                                                                                   |
| R5.WP1-T25-ST1                   | Instrumentar el código para registrar el número de tokens utilizados por cada llamada a la API de IA, asociándolo al documento. | 5                    | Tras generar un documento, la DB contiene un registro del total de tokens consumidos para ese documento. |
| R5.WP1-T25-ST2                   | Crear el servicio o script que calcula el coste en USD basado en los tokens y el modelo utilizado.                              | 4                    | Test unitario que, dado un número de tokens y un modelo, calcula el coste en USD correctamente.          |
| R5.WP1-T25-ST3                   | Añadir las nuevas métricas y alertas de coste al dashboard de Grafana.                                                          | 3                    | Screenshot del dashboard de Grafana mostrando el coste por documento y el coste diario.                  |

---

### **Tarea T-26: Storage Quota**

- **ID de Tarea:** T-26
- **Título:** Storage Quota
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Media
- **Release Target:** Release 5
- **Descripción:** Implementar una cuota de almacenamiento global para prevenir el uso excesivo de disco. Si se supera la cuota, el sistema debe rechazar nuevas subidas de archivos.
- **Detalles Técnicos:**
  - **Backend:** Un servicio que monitoriza el uso total del almacenamiento (base de datos + vector-store + archivos).
  - **Validación:** El endpoint de subida debe verificar el uso actual antes de aceptar un nuevo archivo.
  - **UI:** Mostrar una alerta en el panel de settings cuando se acerca al límite.
- **Estrategia de Test:**
  - **Integration Tests:** Probar que una subida que superaría la cuota es rechazada con un HTTP 507 (Insufficient Storage).
  - **E2E Tests (Cypress):** Verificar que la alerta en la UI se muestra correctamente.
- **Documentación:**
  - Documentar el código de error 507 en la API.
- **Criterios de Aceptación:**
  - Una subida de archivo que haría que el almacenamiento total superara los 50 GB es rechazada con un HTTP 507.
  - Una alerta es visible en el panel de Settings cuando el uso supera el 90% de la cuota.

- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, E2E) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 7)**

|                                  |                                                                                                                    |                      |                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                         | Complejidad Estimada | Entregable Verificable                                                                                                                |
| R5.WP2-T26-ST1                   | Implementar un servicio que monitorice el uso total de almacenamiento y lo exponga como una métrica de Prometheus. | 3                    | Endpoint de métricas que expone el uso actual del almacenamiento.                                                                     |
| R5.WP2-T26-ST2                   | Añadir la validación en el endpoint de subida para rechazar peticiones si se supera la cuota de 50 GB.             | 2                    | Test de integración que intenta subir un archivo superando la cuota y recibe un HTTP 507.                                             |
| R5.WP2-T26-ST3                   | Añadir una alerta visual en el panel de settings de la UI cuando se acerca al límite.                              | 2                    | Test Cypress que verifica que la alerta es visible en el panel de Settings cuando el uso de almacenamiento supera el 90% de la cuota. |

---

### **Tarea T-27: Uptime Monitoring**

- **ID de Tarea:** T-27
- **Título:** Uptime Monitoring
- **Estado:** Pendiente
- **Dependencias:** T-14
- **Prioridad:** Alta
- **Release Target:** Release 6
- **Descripción:** Configurar un sistema de monitorización externo para medir el uptime del servicio y alertar en caso de caída, cumpliendo con los SLAs de disponibilidad.
- **Detalles Técnicos:**
  - **Herramientas:** Sonda de Prometheus (Blackbox Exporter) para verificar el endpoint /healthz de T-23.
  - **Visualización:** Dashboard en Grafana para el uptime.
  - **Alertas:** Alertmanager para enviar notificaciones.
- **Estrategia de Test:**
  - **Integration Tests:** Simular una caída del servicio y verificar que se recibe una alerta en el canal configurado (ej. Slack, email).
- **Documentación:**
  - Documentar el dashboard de uptime y las reglas de alerta.
- **Criterios de Aceptación:**
  - Un informe mensual de Grafana muestra un uptime ≥ 99%.
  - Una incidencia que causa una caída del servicio es reportada (MTTR) en ≤ 2 horas.
- **Definición de Hecho (DoD):**
  - Configuración revisada y aprobada.
  - El test de alerta funciona correctamente.
  - El dashboard de uptime está funcional.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 7)**

|                                  |                                                                                                                         |                      |                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                              | Complejidad Estimada | Entregable Verificable                                                                            |
| R6.WP1-T27-ST1                   | Configurar una sonda de Prometheus (ej. Blackbox Exporter) para verificar la disponibilidad del endpoint /healthz.      | 3                    | Métrica probe_success es visible en Prometheus.                                                   |
| R6.WP1-T27-ST2                   | Crear un dashboard en Grafana para visualizar el uptime histórico y el estado actual.                                   | 2                    | Screenshot del dashboard de uptime.                                                               |
| R6.WP1-T27-ST3                   | Configurar alertas en Alertmanager para notificar (ej. por Slack/email) si el servicio está caído por más de X minutos. | 2                    | Regla de alerta configurada. Test que simula una caída y verifica que se recibe una notificación. |

---

### **Tarea T-28: Token Budget Guard**

- **ID de Tarea:** T-28
- **Título:** Token Budget Guard
- **Estado:** Pendiente
- **Dependencias:** T-07
- **Prioridad:** Alta
- **Release Target:** Release 3
- **Descripción:** Implementar una salvaguarda para evitar enviar peticiones a la API de IA que excedan el límite de tokens del modelo. Esto previene errores y costes inesperados.
- **Detalles Técnicos:**
  - **Frontend:** Librería de tokenización (ej. tiktoken) para contar los tokens en el cliente y mostrar una advertencia visual.
  - **Backend:** Validar el tamaño del prompt en el servidor antes de enviarlo a la API de IA.
- **Estrategia de Test:**
  - **E2E Tests (Cypress):** Probar que la advertencia en la UI aparece al 90% del límite.
  - **Integration Tests:** Probar que el backend rechaza una petición que supera el límite con un HTTP 413 (Payload Too Large).
- **Documentación:**
  - Documentar el código de error 413 en la API.
- **Criterios de Aceptación:**
  - Al alcanzar el 90% del presupuesto de tokens (8,100 tokens), se despliega una advertencia visual en la UI.
  - Un intento de enviar una petición que exceda los 9,000 tokens es rechazado con un HTTP 413 y un mensaje claro.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (E2E, integration) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                                   |                      |                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                        | Complejidad Estimada | Entregable Verificable                                                                                                       |
| R3.WP2-T28-ST1                   | Implementar la lógica en el frontend para contar los tokens del contexto y mostrar una advertencia visual al 90%. | 4                    | Test Cypress que añade texto hasta superar el 90% del límite y verifica que aparece la advertencia.                          |
| R3.WP2-T28-ST2                   | Implementar la validación en el backend para rechazar peticiones que superen el límite de 9000 tokens.            | 3                    | Test de API que envía una petición con más de 9000 tokens y recibe un HTTP 413.                                              |
| R3.WP2-T28-ST3                   | Asegurar que el mensaje de error es claro y se muestra correctamente en la UI.                                    | 2                    | Test Cypress que intenta enviar una petición demasiado grande y verifica que se muestra un mensaje de error útil al usuario. |

---

### **Tarea T-29: Restore-Verifier**

- **ID de Tarea:** T-29
- **Título:** Restore-Verifier
- **Estado:** Pendiente
- **Dependencias:** T-15
- **Prioridad:** Alta
- **Release Target:** Release 6
- **Descripción:** Crear un job automatizado que verifique periódicamente la integridad y la viabilidad de los backups. Este proceso simula una restauración y valida los datos para garantizar que los backups son fiables.
- **Detalles Técnicos:**
  - **Automatización:** Job de CI/CD (ej. GitHub Actions) programado para ejecutarse semanalmente.
  - **Script:** Script restore --verify que utiliza el script de restauración de T-15 en un entorno temporal y aislado.
  - **Validación:** Comparación de checksums (hashes) de los datos clave (ej. una selección de registros de la DB) antes del backup y después de la restauración.
- **Estrategia de Test:**
  - Esta tarea es en sí misma un test automatizado de la tarea T-15.
- **Documentación:**
  - Documentar el proceso de verificación en el runbook de operaciones de T-15.
- **Criterios de Aceptación:**
  - El job se ejecuta semanalmente de forma programada.
  - El hash de los datos restaurados se compara con el hash de los datos originales; una divergencia dispara una alerta crítica (email/Slack) al equipo de operaciones.
- **Definición de Hecho (DoD):**
  - Código (script, config CI) revisado y aprobado.
  - El job de CI se ejecuta correctamente y es capaz de detectar una divergencia en un escenario de prueba.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 7)**

|                                  |                                                                                                                               |                      |                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                    | Complejidad Estimada | Entregable Verificable                                                                                        |
| R6.WP1-T29-ST1                   | Desarrollar la lógica del script restore --verify que orquesta la restauración en un entorno temporal.                        | 4                    | El script se ejecuta sin errores en un entorno de CI, restaurando el último backup disponible.                |
| R6.WP1-T29-ST2                   | Implementar la lógica de validación de checksum del contenido restaurado contra una fuente de verdad (hashes pre-calculados). | 3                    | El script compara los hashes y devuelve un código de salida 0 si coinciden, y 1 si no, disparando una alerta. |

---

### **Tarea T-30: Rewrite-Latency Test**

- **ID de Tarea:** T-30
- **Título:** Rewrite-Latency Test
- **Estado:** Pendiente
- **Dependencias:** T-08
- **Prioridad:** Alta
- **Release Target:** Release 6
- **Descripción:** Crear un test de rendimiento específico para el endpoint /rewrite, ya que es una de las interacciones de IA más frecuentes y su latencia impacta directamente en la experiencia de usuario.
- **Detalles Técnicos:**
  - **Herramientas:** JMeter o Locust.
  - **Escenario:** Simular 50 usuarios concurrentes que envían peticiones al endpoint /rewrite con un payload de 100 tokens.
- **Estrategia de Test:**
  - Esta tarea es en sí misma una tarea de testing de rendimiento.
- **Documentación:**
  - Incluir este test en la documentación de benchmarks del proyecto.
- **Criterios de Aceptación:**
  - La latencia p95 del endpoint /rewrite es ≤ 2 segundos bajo una carga de 50 usuarios concurrentes.
- **Definición de Hecho (DoD):**
  - Script de test revisado y aprobado.
  - El reporte de JMeter/Locust se ha generado y confirma que se cumple el criterio de aceptación.
  - El test está integrado en el pipeline de CI de rendimiento.
  - **Acta de Certificación del Ciclo de KPI de Rendimiento (según plantilla de T-17) firmada por el Tech Lead.**
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 8)**

|                                  |                                                                                                |                      |                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                     | Complejidad Estimada | Entregable Verificable                                                    |
| R6.WP3-T30-ST1                   | Desarrollar el script de Locust/JMeter para el endpoint /rewrite con un payload de 100 tokens. | 4                    | El script envía peticiones al endpoint /rewrite con el payload definido.  |
| R6.WP3-T30-ST2                   | Configurar el escenario de prueba para simular 50 usuarios concurrentes y ejecutar el test.    | 2                    | Configuración del test de carga.                                          |
| R6.WP3-T30-ST3                   | Integrar el test en CI y generar un reporte que mida la latencia p95.                          | 2                    | Reporte de Locust/JMeter que muestra que la latencia p95 es ≤ 2 segundos. |

---

### **Tarea T-31: Pause/Abort Flow**

- **ID de Tarea:** T-31
- **Título:** Pause/Abort Flow
- **Estado:** Pendiente
- **Dependencias:** T-07
- **Prioridad:** Media
- **Release Target:** Release 2
- **Descripción:** Dar al usuario el control sobre el proceso de generación de contenido, permitiéndole pausar, reanudar o cancelar por completo una generación en curso.
- **Detalles Técnicos:**
  - **Backend:** Endpoints POST /pause y POST /resume. La lógica debe manejar el estado de la tarea de generación (ej. en Celery).
  - **Frontend:** Botón "Pause" en la Prompt Bar que, al ser presionado, muestra un modal con las opciones "Continuar" y "Cancelar".
- **Estrategia de Test:**
  - **Integration Tests:** Probar los endpoints de la API para pausar y reanudar.
  - **E2E Tests (Cypress):** Probar el flujo completo desde la UI: iniciar generación, pausar, ver el modal, y probar las opciones de continuar y cancelar.
- **Documentación:**
  - Actualizar OpenAPI para los nuevos endpoints.
- **Criterios de Aceptación:**
  - Una petición a POST /pause tiene una latencia p95 ≤ 150 ms.
  - El modal de confirmación aparece en la UI en ≤ 200 ms tras hacer clic en "Pause".
  - La opción "Continuar" reanuda el flujo de generación, y "Cancelar" lo detiene permanentemente.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, E2E) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 10)**

|                                  |                                                                                                                     |                      |                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                          | Complejidad Estimada | Entregable Verificable                                                                                |
| R2.WP1-T31-ST1                   | Implementar los endpoints de API /pause y /resume en el backend para controlar el estado de la tarea de generación. | 4                    | Colección Postman que prueba los endpoints y verifica que el estado de la tarea de generación cambia. |
| R2.WP1-T31-ST2                   | Añadir el botón "Pause" en la Prompt Bar de la UI.                                                                  | 3                    | El botón es visible durante la generación de contenido.                                               |
| R2.WP1-T31-ST3                   | Implementar el modal de confirmación con las opciones "Continuar" y "Cancelar" y su lógica correspondiente.         | 3                    | Test Cypress que pausa la generación, hace clic en "Cancelar" y verifica que el flujo se detiene.     |

---

### **Tarea T-32: Template Management**

- **ID de Tarea:** T-32
- **Título:** Template Management
- **Estado:** Pendiente
- **Dependencias:** T-01
- **Prioridad:** Alta
- **Release Target:** Release 3
- **Descripción:** Crear una interfaz de gestión completa (CRUD) para las plantillas de prompts. Los usuarios administradores podrán crear, listar, editar y eliminar plantillas que luego estarán disponibles para todos los usuarios.
- **Detalles Técnicos:**
  - **Backend:** API REST (/templates) para el CRUD de plantillas, con persistencia en la base de datos.
  - **Frontend:** Interfaz en la sección de "Settings" del panel de administración.
  - **DB:** Tabla templates con migraciones gestionadas por Alembic o similar.
- **Estrategia de Test:**
  - **Integration Tests:** Cobertura completa de la API /templates.
  - **E2E Tests (Cypress):** Probar el flujo CRUD completo desde la UI del panel de administración.
- **Documentación:**
  - Actualizar OpenAPI para los endpoints de /templates.
- **Criterios de Aceptación:**
  - El CRUD de plantillas opera con éxito (respuestas 2xx) y los cambios se reflejan en la base de datos.
  - El dropdown de selección de plantillas de T-18 lista las plantillas creadas aquí.
  - La API valida los inputs (ej. nombre de plantilla no vacío) y retorna errores 4xx claros.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, E2E) pasan.
  - Documentación de API y scripts de migración completados.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                            |                      |                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                 | Complejidad Estimada | Entregable Verificable                                                                   |
| R3.WP2-T32-ST1                   | Implementar los endpoints REST para el CRUD de plantillas (/templates) y las migraciones de DB.            | 4                    | Colección Postman que prueba el CRUD completo de plantillas. Script de migración existe. |
| R3.WP2-T32-ST2                   | Desarrollar la UI en la sección de "Settings" (usando el esqueleto de T-44) para gestionar las plantillas. | 5                    | Test Cypress donde un usuario crea, edita y elimina una plantilla a través de la UI.     |

---

### **Tarea T-33: Draft-Quality Test**

- **ID de Tarea:** T-33
- **Título:** Draft-Quality Test
- **Estado:** Pendiente
- **Dependencias:** T-06
- **Prioridad:** Alta
- **Release Target:** Release 2
- **Descripción:** Crear un test harness automatizado para evaluar la calidad semántica y la cobertura del borrador inicial generado por el sistema, comparándolo contra un dataset de referencia.
- **Detalles Técnicos:**
  - **Métrica:** ROUGE-L para medir la similitud semántica.
  - **Dataset:** Un conjunto de 10 documentos de referencia con sus borradores "golden" esperados.
  - **Automatización:** Integrar el test en el pipeline de CI para detectar regresiones de calidad.
- **Estrategia de Test:**
  - Esta tarea es en sí misma una tarea de testing de calidad.
- **Documentación:**
  - Documentar el dataset y el proceso de evaluación.
- **Criterios de Aceptación:**
  - El score ROUGE-L es ≥ 0.8 en el borrador inicial (p95) en comparación con el dataset de referencia.
  - La latencia para generar un borrador completo es ≤ 8 minutos (p95).
  - El job de CI falla si el score ROUGE-L es < 0.8 o la latencia es > 8 minutos.
- **Definición de Hecho (DoD):**
  - Código (test harness, dataset) revisado y aprobado.
  - El job de CI está configurado y pasa con la implementación actual.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 13)**

|                                  |                                                                                                                   |                      |                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                        | Complejidad Estimada | Entregable Verificable                                                                |
| R2.WP2-T33-ST1                   | Crear un dataset de referencia con 10 documentos fuente y sus borradores "golden" esperados.                      | 4                    | El dataset existe en el repositorio en un formato estructurado (ej. JSON).            |
| R2.WP2-T33-ST2                   | Desarrollar el test harness que genera borradores para el dataset y calcula el score ROUGE-L contra los "golden". | 6                    | El script se ejecuta y produce un reporte con los scores ROUGE-L para cada documento. |
| R2.WP2-T33-ST3                   | Integrar el test en el pipeline de CI para que falle si el score o la latencia no cumplen los umbrales.           | 3                    | El job de CI falla si el ROUGE-L p95 es < 0.8 o la latencia p95 es > 8 min.           |

---

### **Tarea T-34: Usability Testing**

- **ID de Tarea:** T-34
- **Título:** Usability Testing
- **Estado:** Pendiente
- **Dependencias:** T-10, T-21
- **Prioridad:** Crítica
- **Release Target:** Release 6
- **Descripción:** Realizar una ronda de pruebas de usabilidad formales con usuarios reales para evaluar la experiencia de usuario del producto y recopilar feedback para mejoras finales.
- **Detalles Técnicos:**
  - **Metodología:** Pruebas de usuario moderadas.
  - **Participantes:** 5 usuarios del perfil objetivo.
  - **Métrica:** System Usability Scale (SUS).
  - **Guion:** Definir un guion con tareas clave (ej. subir un archivo, generar un borrador, editar una sección, exportar).
- **Estrategia de Test:**
  - Esta tarea es en sí misma una tarea de testing de usabilidad.
- **Documentación:**
  - Plan de pruebas de usabilidad.
  - Informe final de usabilidad con los hallazgos, el score SUS y las recomendaciones.
- **Criterios de Aceptación:**
  - El score SUS promedio de la prueba es ≥ 80.
  - Todos los usuarios participantes son capaces de completar el guion de tareas sin bloqueos críticos.
  - Los hallazgos están documentados y se han creado propuestas de mejora para ser abordadas en T-40.
- **Definición de Hecho (DoD):**
  - Plan de pruebas aprobado.
  - Sesiones de prueba completadas y grabadas.
  - Informe de usabilidad finalizado y revisado por el equipo.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 11)**

|                                  |                                                                                                                            |                      |                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                 | Complejidad Estimada | Entregable Verificable                                                                               |
| R6.WP3-T34-ST1                   | Diseñar el plan de pruebas de usabilidad: reclutar 5 usuarios, definir el guion de tareas y preparar el entorno.           | 3                    | Documento del plan de pruebas aprobado por el Product Owner.                                         |
| R6.WP3-T34-ST2                   | Ejecutar las sesiones de prueba piloto, grabar las sesiones (con consentimiento) y administrar la encuesta SUS.            | 5                    | Grabaciones de las 5 sesiones y los resultados de las encuestas SUS recopilados.                     |
| R6.WP3-T34-ST3                   | Analizar los resultados, calcular el puntaje SUS promedio y redactar un informe con los hallazgos clave y recomendaciones. | 3                    | Informe de usabilidad finalizado, incluyendo el puntaje SUS y una lista de 3-5 mejoras recomendadas. |

---

### **Tarea T-35: GDPR Erasure on Demand**

- **ID de Tarea:** T-35
- **Título:** GDPR Erasure on Demand
- **Estado:** Pendiente
- **Dependencias:** T-13, T-22
- **Prioridad:** Crítica
- **Release Target:** Release 5
- **Descripción:** Implementar la funcionalidad que permite a un usuario solicitar el borrado definitivo de un documento, en cumplimiento con el "derecho al olvido" del GDPR.
- **Detalles Técnicos:**
  - **Backend:** Endpoint DELETE /docs/{id}/erase que marca un documento para purga inmediata.
  - **Frontend:** Botón "Borrar definitivamente" en la UI (ej. en la papelera) con un modal de confirmación muy claro sobre la irreversibilidad de la acción.
  - **Auditoría:** La solicitud de borrado debe registrarse en el log WORM de T-13.
- **Estrategia de Test:**
  - **Integration Tests:** Probar el endpoint /erase.
  - **E2E Tests:** Probar el ciclo completo: borrar lógicamente (T-22), ir a la papelera, borrar definitivamente y verificar que el documento ya no es accesible.
- **Documentación:**
  - Actualizar OpenAPI para el nuevo endpoint.
- **Criterios de Aceptación:**
  - Una llamada a DELETE /docs/{id}/erase devuelve un HTTP 204 tras la confirmación del usuario.
  - Se crea una entrada en el Audit Log WORM con el usuario, doc-ID y timestamp en ≤ 5 segundos.
  - El documento se marca para ser purgado por el job de T-36.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (integration, E2E) pasan.
  - El flujo ha sido validado desde una perspectiva de compliance.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 10)**

|                                  |                                                                                          |                      |                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                               | Complejidad Estimada | Entregable Verificable                                                                                |
| R5.WP2-T35-ST1                   | Implementar el endpoint DELETE /docs/{id}/erase que marca un documento para purga.       | 4                    | Colección Postman que prueba el endpoint y verifica que el documento se marca correctamente en la DB. |
| R5.WP2-T35-ST2                   | Añadir el botón "Borrar definitivamente" en la UI y el flujo de confirmación.            | 3                    | Test Cypress que borra un documento permanentemente y verifica que desaparece de la UI.               |
| R5.WP2-T35-ST3                   | Asegurar que la acción de borrado se registra correctamente en el log WORM de auditoría. | 3                    | Test que borra un documento y verifica que se crea la entrada correspondiente en el log de auditoría. |

---

### **Tarea T-36: GDPR Erase Purge Job**

- **ID de Tarea:** T-36
- **Título:** GDPR Erase Purge Job
- **Estado:** Pendiente
- **Dependencias:** T-35, T-15
- **Prioridad:** Crítica
- **Release Target:** Release 6
- **Descripción:** Crear un job automatizado que purga de forma irreversible los datos de los documentos que han sido marcados para borrado definitivo (T-35) o cuyo período de retención en la papelera (T-22) ha expirado. **Nota de Riesgo Crítico:** Esta tarea es de alto impacto y requiere una validación exhaustiva. **Nota de Gestión de Riesgo:** La implementación y revisión de esta tarea debe ser asignada a personal senior. El plan de pruebas para la purga de backups (ST3) debe ser aprobado explícitamente por el Tech Lead.
- **Detalles Técnicos:**
  - **Automatización:** Cron job diario.
  - **Lógica:** El job debe eliminar los datos del documento de todas las ubicaciones: base de datos principal, tabla de versiones, vector-store, almacenamiento de archivos y backups.
- **Estrategia de Test:**
  - **E2E Tests:** Probar el ciclo de vida completo del borrado: crear doc -> borrar lógicamente -> esperar/forzar expiración -> ejecutar job de purga -> verificar que los datos han sido eliminados de todos los sistemas.
- **Documentación:**
  - Documentar el proceso de purga y las ubicaciones de datos que afecta.
- **Criterios de Aceptación:**
  - El cron job diario se ejecuta sin errores.
  - Los datos de las solicitudes de borrado con más de 30 días (o marcados para borrado inmediato) son purgados de forma irrevocable.
  - Un test E2E valida el ciclo de vida completo del borrado.
- **Definición de Hecho (DoD):**
  - Código (job) revisado y aprobado.
  - El test E2E del ciclo de vida del borrado pasa.
  - El proceso ha sido validado desde una perspectiva de compliance.
  - **Acta de Certificación del Ciclo de Borrado (según plantilla de T-17) firmada por el Tech Lead.**
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 17)**

|                                  |                                                                                                                                                                                                                                                                                       |                      |                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                                                                                                                                                                            | Complejidad Estimada | Entregable Verificable                                                                                                       |
| R6.WP1-T36-ST1                   | Implementar el cron job diario (purge_erase_requests) que identifica los documentos a purgar.                                                                                                                                                                                         | 4                    | El job se ejecuta y genera una lista de los IDs de documentos a eliminar.                                                    |
| R6.WP1-T36-ST2                   | Implementar la lógica de purga de sistemas en vivo (Base de Datos, Vector-Store, Almacenamiento de Archivos).                                                                                                                                                                         | 4                    | Test de integración que verifica que, tras ejecutar la purga, los datos del documento ya no existen en los sistemas en vivo. |
| R6.WP1-T36-ST3                   | (Alto Riesgo) Diseñar e implementar script de purga de datos específicos de los backups encriptados. **Nota de Riesgo:** Esta es la subtarea de mayor riesgo del proyecto. Su implementación debe ser extremadamente cuidadosa y su plan de pruebas, riguroso y formalmente aprobado. | 6                    | Test que valida que un documento purgado no puede ser restaurado desde un backup posterior a la purga.                       | l   |
| R6.WP1-T36-ST4                   | Validar el ciclo de vida de borrado E2E (T-22 -> T-35 -> T-36) en un entorno de pruebas.                                                                                                                                                                                              | 3                    | Reporte de test E2E que confirma que el ciclo completo de borrado funciona como se espera.                                   |

---

### **Tarea T-37: Admin Panel: Add User & System Mgmt Features**

- **ID de Tarea:** T-37
- **Título:** Admin Panel: Add User & System Mgmt Features
- **Estado:** Pendiente
- **Dependencias:** T-02, T-44, T-04
- **Prioridad:** Alta
- **Release Target:** Release 4
- **Descripción:** Extender el panel de administración existente (T-44) para permitir a los usuarios con rol admin gestionar usuarios y configuraciones clave del sistema.
- **Detalles Técnicos:**
  - **UI:** Nueva sección en la aplicación, visible solo para administradores.
  - **Funcionalidades:**
    1. CRUD de usuarios.
    2. Ver estado del vector-store y disparar re-indexación.
    3. Configurar la ventana de retención para el borrado lógico.
    4. Seleccionar el modelo de IA por defecto para la generación.
- **Estrategia de Test:**
  - **E2E Tests (Cypress):** Probar cada una de las funcionalidades del panel de administración desde la perspectiva de un usuario admin.
- **Documentación:**
  - Documentar las capacidades del panel de administración.
- **Criterios de Aceptación:**
  - El CRUD de usuarios se refleja inmediatamente en el sistema (ej. un usuario desactivado no puede iniciar sesión).
  - El panel muestra el estado del vector-store y el botón de re-indexación dispara la tarea correspondiente.
  - El sistema respeta la ventana de restauración y el modelo de IA configurados en el panel.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests E2E del panel de administración pasan.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 14)**

|                                  |                                                                                                                          |                      |                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                               | Complejidad Estimada | Entregable Verificable                                                                                       |
| R4.WP2-T37-ST1                   | Implementar la UI y los endpoints API para el CRUD de usuarios (Crear, Leer, Actualizar rol, Desactivar).                | 5                    | Test Cypress donde un admin crea un nuevo usuario, cambia su rol y lo desactiva, verificando los cambios.    |
| R4.WP2-T37-ST2                   | Implementar la sección del panel para ver el estado del vector-store y un botón para disparar una re-indexación.         | 4                    | El panel muestra "Healthy". Un clic en "Re-index" dispara una tarea asíncrona y la UI muestra "Indexing...". |
| R4.WP2-T37-ST3                   | Implementar los controles en la UI para configurar la ventana de restauración y seleccionar el modelo de IA por defecto. | 5                    | Test que cambia la ventana de restauración y el modelo de IA, y verifica que la configuración se aplica.     |

---

### **Tarea T-38: Implementar Sharding de Vector-Store en Producción**

- **ID de Tarea:** T-38
- **Título:** Implementar Sharding de Vector-Store en Producción
- **Estado:** Pendiente
- **Dependencias:** T-16
- **Prioridad:** Crítica
- **Release Target:** Release 6
- **Descripción:** Mover el PoC de sharding del vector-store de T-16 a una solución lista para producción. Esto implica robustecer la configuración, asegurar la persistencia, el failover y la monitorización.
- **Detalles Técnicos:**
  - **Configuración:** Manifiestos de Kubernetes/Docker Compose para un clúster de vector-store productivo (ej. Qdrant con replicación).
  - **Failover:** Configurar y probar el mecanismo de failover automático del vector-store.
  - **Monitorización:** Integrar las métricas del clúster de vector-store en el dashboard de observabilidad de T-14.
- **Estrategia de Test:**
  - **Chaos Tests:** Realizar un test de caos específico para el clúster de vector-store, eliminando nodos y verificando la recuperación sin pérdida de datos.
  - **Load Tests:** Ejecutar un test de carga para demostrar el escalado horizontal del vector-store.
- **Documentación:**
  - Actualizar el ADR de T-16 con la arquitectura de producción final.
- **Criterios de Aceptación:**
  - Un test de carga demuestra el escalado horizontal del vector-store sin intervención manual.
  - El failover de un nodo del vector-store se completa con un MTTR ≤ 15 minutos y sin pérdida de datos.
  - Un panel de observabilidad muestra el estado de salud y la distribución de datos de cada shard.
- **Definición de Hecho (DoD):**
  - Código (manifiestos) revisado y aprobado.
  - Los reportes de los tests de caos y carga están completados y analizados.
  - El dashboard de monitorización está funcional.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 14)**

|                                  |                                                                                                                |                      |                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                     | Complejidad Estimada | Entregable Verificable                                                                                     |
| R6.WP2-T38-ST1                   | Adaptar la configuración del PoC de T-16 para un entorno de producción, incluyendo persistencia y replicación. | 5                    | Manifiestos de Kubernetes/Docker Compose para desplegar el clúster de vector-store en modo productivo.     |
| R6.WP2-T38-ST2                   | Implementar y probar el mecanismo de failover automático.                                                      | 5                    | Reporte de un test de caos donde se elimina un nodo del vector-store y el sistema se recupera en < 15 min. |
| R6.WP2-T38-ST3                   | Añadir monitorización del estado de los shards al dashboard de observabilidad.                                 | 4                    | Panel de Grafana que muestra la distribución de datos y el estado de salud de cada shard.                  |

---

### **Tarea T-39: Implementar Pin/Favoritos en Sidebar**

- **ID de Tarea:** T-39
- **Título:** Implementar Pin/Favoritos en Sidebar
- **Estado:** Pendiente
- **Dependencias:** T-21
- **Prioridad:** Media
- **Release Target:** Release 3
- **Descripción:** Añadir una funcionalidad que permita a los usuarios marcar documentos como "favoritos" o "anclados" (pin), para que aparezcan en una sección dedicada en la parte superior de la barra de navegación lateral.
- **Detalles Técnicos:**
  - **Backend:** Endpoint para marcar/desmarcar un documento como favorito.
  - **DB:** Tabla de unión user_favorite_documents.
  - **Frontend:** Icono de "pin" en cada item de la lista de documentos y una nueva sección "Favoritos" en la sidebar.
- **Estrategia de Test:**
  - **E2E Tests (Cypress):** Probar el flujo completo: hacer clic en el icono de pin, verificar que el documento se mueve a la sección de favoritos y que el estado persiste tras recargar la página.
- **Documentación:**
  - Actualizar OpenAPI para el nuevo endpoint.
- **Criterios de Aceptación:**
  - Al hacer clic en el icono 'pin', el documento se mueve a la sección 'Favoritos' y el estado persiste entre sesiones.
  - La sección 'Favoritos' es la primera en la lista de navegación de la sidebar.

- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests E2E pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 7)**

|                                  |                                                                                              |                      |                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                   | Complejidad Estimada | Entregable Verificable                                                                                  |
| R3.WP1-T39-ST1                   | Modificar el modelo de datos para almacenar el estado de "favorito" por usuario y documento. | 2                    | Script de migración de la base de datos.                                                                |
| R3.WP1-T39-ST2                   | Implementar el endpoint de API para marcar/desmarcar un documento como favorito.             | 2                    | Colección Postman que prueba el endpoint.                                                               |
| R3.WP1-T39-ST3                   | Implementar el icono de "pin" en la UI y la sección de "Favoritos" en la sidebar.            | 3                    | Test Cypress que marca un documento como favorito y verifica que aparece en la sección correspondiente. |

---

### **Tarea T-40: Implementación de Mejoras de Usabilidad Post-Piloto**

- **ID de Tarea:** T-40
- **Título:** Implementación de Mejoras de Usabilidad Post-Piloto
- **Estado:** Pendiente
- **Dependencias:** T-34
- **Prioridad:** Alta
- **Release Target:** Release 6
- **Descripción:** Abordar los hallazgos más críticos del informe de pruebas de usabilidad de T-34. Esta tarea consiste en implementar las 2-3 mejoras de mayor impacto para pulir el producto antes del lanzamiento final.
- **Detalles Técnicos:**
  - Dependerá de los hallazgos del informe de T-34. Podría implicar cambios en la UI, flujos de trabajo o redacción de textos.
- **Estrategia de Test:**
  - **Regression Tests (Cypress o manual):** Verificar que las mejoras implementadas funcionan como se espera y no introducen nuevas regresiones.
- **Documentación:**
  - Actualizar el informe de usabilidad de T-34 para marcar los hallazgos abordados como "resueltos".
- **Criterios de Aceptación:**
  - Los Pull Requests para las mejoras priorizadas son aprobados y fusionados.
  - Un test de regresión confirma que las mejoras funcionan y no introducen errores.
  - El informe de usabilidad de T-34 se actualiza para reflejar que los hallazgos han sido resueltos.
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests de regresión pasan.
  - El informe de usabilidad está actualizado.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                        |                      |                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                             | Complejidad Estimada | Entregable Verificable                                                         |
| R6.WP3-T40-ST1                   | Priorizar los 2-3 hallazgos de mayor impacto del informe de T-34 con el Product Owner. | 1                    | Lista de mejoras priorizadas y aprobadas.                                      |
| R6.WP3-T40-ST2                   | Implementar la primera mejora de usabilidad priorizada.                                | 4                    | Pull Request con la implementación de la primera mejora, aprobado y fusionado. |
| R6.WP3-T40-ST3                   | Implementar la segunda/tercera mejora de usabilidad priorizada.                        | 4                    | Pull Request con la implementación de la segunda mejora, aprobado y fusionado. |

---

### **Tarea T-41: User API Key Management**

- **ID de Tarea:** T-41
- **Título:** User API Key Management
- **Estado:** 🚧 Desarrollo Completado - Listo para QA
- **Dependencias:** T-02, T-12
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Permitir a los usuarios gestionar su propia clave de API de OpenAI. La clave será almacenada de forma segura y utilizada por el backend para realizar llamadas a la API de OpenAI en nombre del usuario.
- **Detalles Técnicos:**
  - **Endpoint:** POST /user/credentials.
  - **Seguridad:** La clave se guarda cifrada utilizando el Credential Store de T-12. Nunca se devuelve en ninguna respuesta de la API.
  - **UI:** Sección en el perfil de usuario para introducir/actualizar la clave.
- **Estrategia de Test:**
  - **Unit Tests:** Verificar que la clave se cifra correctamente.
  - **Integration Tests:** Probar el endpoint /user/credentials. Verificar que una llamada a un servicio de IA falla con 402 si no hay clave, y funciona si hay una clave válida.
  - **Security Tests:** Asegurar que la clave no se puede recuperar a través de ninguna API.
- **Documentación:**
  - Actualizar OpenAPI para el endpoint /user/credentials.
- **Criterios de Aceptación:**
  - El endpoint rechaza claves inválidas (formato incorrecto) con un error 400.
  - Una clave válida se guarda cifrada y no se expone en ninguna respuesta de la API.
  - Las llamadas a los servicios de OpenAI sin una clave configurada devuelven un error HTTP 402 (Payment Required).
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration, security) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                   |                      |                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                        | Complejidad Estimada | Entregable Verificable                                                                           |
| R0.WP2-T41-ST1                   | Implementar el endpoint POST /user/credentials que valida y guarda la clave de API del usuario.   | 4                    | Colección Postman que prueba el endpoint con una clave válida (guarda) y una inválida (rechaza). |
| R0.WP2-T41-ST2                   | Utilizar el Credential Store de T-12 para encriptar la clave antes de guardarla en la DB.         | 2                    | Test que verifica que la clave en la base de datos está encriptada.                              |
| R0.WP2-T41-ST3                   | Implementar la UI en el perfil de usuario para que pueda introducir y actualizar su clave de API. | 3                    | Test Cypress donde un usuario guarda su clave de API a través de la UI.                          |

---

### **Tarea T-42: Risk Matrix Review (Process Task)**

- **ID de Tarea:** T-42
- **Título:** Risk Matrix Review (Process Task)
- **Estado:** Recurrente
- **Dependencias:** Fin de cada hito (R0-R6)
- **Prioridad:** Media
- **Release Target:** N/A (Proceso)
- **Descripción:** Tarea de proceso recurrente para revisar y actualizar formalmente la matriz de riesgos del proyecto al final de cada release. Esto asegura una gestión de riesgos proactiva y continua.
- **Detalles Técnicos:**
  - **Herramientas:** Git, sistema de gestión de proyectos (Jira, GitHub Issues).
  - **Artefacto:** PRD v2.md, sección 10.
- **Estrategia de Test:** N/A (Tarea de proceso).
- **Documentación:**
  - El historial de commits del fichero PRD v2.md sirve como log de las revisiones.
- **Criterios de Aceptación:**
  - La matriz de riesgos en PRD v2.md es actualizada y se realiza un commit al final de cada release.
  - Las nuevas mitigaciones identificadas se registran como nuevas tareas en el backlog del proyecto.
- **Definición de Hecho (DoD):**
  - Reunión de revisión completada.
  - Documento PRD actualizado y commiteado.
  - Nuevas tareas de mitigación creadas.

#### **Desglose en Subtareas (Complejidad Total: 5)**

|                                  |                                                                                                          |                      |                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                               | Complejidad Estimada | Entregable Verificable                                                                     |
| R<X>.POST-T42-ST1                | Convocar y facilitar la sesión de revisión de la matriz de riesgos con el Product Owner y el Tech Lead.  | 2                    | Minuta de la reunión con los puntos discutidos y decisiones tomadas.                       |
| R<X>.POST-T42-ST2                | Actualizar el fichero PRD v2.md con los cambios en la matriz de riesgos y realizar el commit.            | 2                    | Commit en el repositorio con el mensaje "docs(prd): Update risk matrix after R<X> review". |
| R<X>.POST-T42-ST3                | Crear/actualizar tareas en el backlog del proyecto para las nuevas acciones de mitigación identificadas. | 1                    | Enlaces a las nuevas tareas creadas en el sistema de gestión de proyectos.                 |

---

### **Tarea T-43: Implementar Escaneo de Dependencias**

- **ID de Tarea:** T-43
- **Título:** Implementar Escaneo de Dependencias
- **Estado:** Completado
- **Dependencias:** T-01
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Integrar herramientas de Análisis de Composición de Software (SCA) en el pipeline de CI para detectar y prevenir automáticamente vulnerabilidades conocidas (CVEs) y conflictos de licencia en las dependencias de código abierto del proyecto.
- **Detalles Técnicos:**
  - **Herramientas:** pip-audit, yarn audit, Dependabot, Snyk (o similar).
  - **Integración:** Job en el pipeline qa-gate de GitHub Actions.
  - **Política:** Definir umbrales de severidad (ej. CRITICAL, HIGH) que bloqueen el build.
- **Estrategia de Test:**
  - **Integration Tests:** Introducir una dependencia con una vulnerabilidad conocida en una rama de prueba y verificar que el pipeline falla.
- **Documentación:**
  - Documentar la política de gestión de vulnerabilidades en CONTRIBUTING.md.
- **Criterios de Aceptación:**
  - El pipeline de CI integra escaneos de vulnerabilidades y licencias.
  - El job qa-gate falla si se detecta una vulnerabilidad de severidad CRITICAL o HIGH.
  - Un reporte de licencias es generado como artefacto de CI.
- **Definición de Hecho (DoD):**
  - Código (configuración de CI) revisado y aprobado.
  - El pipeline es capaz de detectar y bloquear una vulnerabilidad de prueba.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                                       |                      |                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                            | Complejidad Estimada | Entregable Verificable                                                             |
| R0.WP1-T43-ST1                   | Integrar herramientas de escaneo de vulnerabilidades (ej. pip-audit, yarn audit) en el pipeline de CI.                 | 4                    | El pipeline de CI ejecuta los escaneos y reporta las vulnerabilidades encontradas. |
| R0.WP1-T43-ST2                   | Establecer y aplicar una política de gestión de vulnerabilidades que falle el build para severidades CRITICAL o HIGH. | 3                    | Un PR con una dependencia vulnerable es bloqueado por el pipeline.                 |
| R0.WP1-T43-ST3                   | Implementar un escaneo de licencias de dependencias para generar un reporte de compatibilidad.                        | 2                    | El pipeline de CI genera un artefacto con el reporte de licencias.                 |

---

### **Tarea T-44: Admin Panel Skeleton & Config Store**

- **ID de Tarea:** T-44
- **Título:** Admin Panel Skeleton & Config Store
- **Estado:** 🚧 Desarrollo Completado - Listo para QA
- **Dependencias:** T-02
- **Prioridad:** Crítica
- **Release Target:** Release 0
- **Descripción:** Crear la estructura fundamental para todas las futuras funcionalidades de administración. Esto incluye el layout de UI base para la sección "Settings" y un servicio de configuración genérico en el backend para persistir ajustes del sistema.
- **Detalles Técnicos:**
  - **UI:** Componente React para el layout de la sección /settings, accesible solo para roles de admin.
  - **Backend:** API REST (GET /config, POST /config) para gestionar una tabla de configuración de tipo clave-valor.
  - **DB:** Modelo y migración para la tabla system_configurations.
- **Estrategia de Test:**
  - **E2E Tests (Cypress):** Verificar que la ruta /settings es accesible para un admin y denegada para un editor.
  - **Integration Tests:** Probar el CRUD de la API de configuración.
- **Documentación:**
  - Actualizar OpenAPI para los endpoints /config.
- **Criterios de Aceptación:**
  - La ruta /settings es accesible para roles de admin y muestra un layout vacío.
  - La API /config permite leer y escribir configuraciones clave-valor.
  - La UI del panel es un esqueleto listo para ser poblado por tareas dependientes (T-03, T-32, T-37).
- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (E2E, integration) pasan.
  - Documentación de API completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

|                                  |                                                                                                           |                      |                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                | Complejidad Estimada | Entregable Verificable                                                                      |
| ✅ R0.WP2-T44-ST1 | Implementar el modelo de datos y la API REST para el servicio de configuración clave-valor.               | 4                    | Colección Postman que prueba el CRUD de la API /config.                                     |
| R0.WP2-T44-ST2                   | Crear el componente de UI base para el panel de "Settings" y proteger la ruta /settings por rol de admin. | 5                    | Test Cypress donde un admin accede a /settings y un editor recibe un error 403/redirección. |

---

### **Tarea T-45: Guardrails Integration**

- **ID de Tarea:** T-45

- **Título:** Guardrails Integration

- **Estado:** Pendiente

- **Dependencias:** T-11

- **Prioridad:** Alta

- **Release Target:** Release 2

- **Descripción:** Implementar un sistema de "guardrails" para asegurar que las salidas de los modelos de lenguaje (LLM) se adhieran a un formato estructurado predefinido (ej. JSON, XML). Esto es crucial para la fiabilidad de los servicios que consumen estas salidas, como el Planner Service (T-05).

- **Detalles Técnicos:**
  - **Librería:** Guardrails AI o similar.

  - **Validación:** Definición de esquemas de validación (Pydantic models o similar) para las respuestas del LLM.

  - **Integración:** Envolver las llamadas al LLM en el cliente de IA para aplicar la validación.

- **Estrategia de Test:**
  - **Unit Tests:** Probar el validador con salidas de LLM válidas e inválidas. Cobertura > 90%.

  - **Integration Tests:** Integrar en el pipeline de CI un test que falle si una respuesta del LLM no cumple con el esquema.

- **Documentación:**
  - ADR sobre la elección de la librería de guardrails.
  - Documentar los esquemas de validación en el código.

- **Criterios de Aceptación:**
  - El sistema rechaza o corrige automáticamente las salidas del LLM que no se ajustan al esquema definido.
  - La cobertura de tests para la lógica de validación es ≥ 90%.
  - El pipeline de CI falla si se detecta una regresión en la validación de formato.

- **Definición de Hecho (DoD):**
  - Código revisado y aprobado.
  - Todos los tests (unit, integration) pasan.
  - Documentación (ADR) completada.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 9)**

| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                                                | Complejidad Estimada | Entregable Verificable                                                                                                                            |
| :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| R2.WP3-T45-ST1                   | Investigar y seleccionar una librería de guardrails. Definir los esquemas de validación para las salidas clave (ej. outline del Planner). | 3                    | ADR documentando la elección. Esquemas de validación definidos como modelos Pydantic.                                                             |
| R2.WP3-T45-ST2                   | Integrar la librería de guardrails en el cliente de IA para validar las respuestas del LLM en tiempo de ejecución.                        | 4                    | Test de integración que provoca una respuesta mal formada del LLM (mock) y verifica que el sistema la maneja correctamente (rechaza o reintenta). |
| R2.WP3-T45-ST3                   | Crear tests unitarios para la lógica de validación y asegurar una cobertura > 90%.                                                        | 2                    | Reporte de cobertura de tests que muestra ≥ 90% para los módulos de validación.                                                                   |

---

### **Tarea T-46: DeepEval Benchmarks**

- **ID de Tarea:** T-46

- **Título:** DeepEval Benchmarks

- **Estado:** Pendiente

- **Dependencias:** T-11

- **Prioridad:** Alta

- **Release Target:** Release 2

- **Descripción:** Implementar una suite de benchmarks automatizada utilizando un framework avanzado como DeepEval o RAGAS para evaluar de forma continua la calidad de las respuestas del sistema RAG. Se medirán métricas como la coherencia semántica, la factualidad y la relevancia de las respuestas.

- **Detalles Técnicos:**
  - **Framework:** DeepEval o RAGAS.

  - **Métricas:** Answer Relevancy, Faithfulness, Contextual Precision.

  - **Integración:** Job en el pipeline de CI que se ejecuta contra un dataset de evaluación.

- **Estrategia de Test:**
  - Esta tarea es en sí misma una tarea de testing de calidad.

- **Documentación:**
  - Documentar el dataset de evaluación y el proceso de ejecución de los benchmarks.

- **Criterios de Aceptación:**
  - El pipeline de CI integra la suite de benchmarks de DeepEval/RAGAS.
  - El pipeline falla si alguna de las métricas de calidad clave (ej. Faithfulness) cae por debajo de un umbral predefinido (ej. 0.85).
  - Se genera un reporte HTML con los resultados de los benchmarks como artefacto de CI.

- **Definición de Hecho (DoD):**
  - Código (scripts de benchmark, dataset) revisado y aprobado.
  - El job de CI está configurado y es capaz de detectar una regresión de calidad.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 11)**

| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                               | Complejidad Estimada | Entregable Verificable                                                            |
| :------------------------------- | :------------------------------------------------------------------------------------------------------- | :------------------- | :-------------------------------------------------------------------------------- |
| R2.WP3-T46-ST1                   | Crear un dataset de evaluación curado con pares de pregunta-respuesta y contextos de referencia.         | 4                    | Dataset de evaluación en formato JSON o similar, versionado en el repositorio.    |
| R2.WP3-T46-ST2                   | Desarrollar el script de benchmark que utiliza DeepEval/RAGAS para evaluar el sistema contra el dataset. | 5                    | El script se ejecuta localmente y produce un reporte con las métricas de calidad. |
| R2.WP3-T46-ST3                   | Integrar la ejecución del script en el pipeline de CI y configurar los umbrales de fallo.                | 2                    | El pipeline de CI genera el reporte como artefacto y falla si se viola un umbral. |

---

### **Tarea T-47: Gate R4 Orchestrator Decision**

- **ID de Tarea:** T-47

- **Título:** Gate R4 Orchestrator Decision

- **Estado:** Pendiente

- **Dependencias:** T-42 (Revisión de Riesgos de R4)

- **Prioridad:** Alta

- **Release Target:** Release 4

- **Descripción:** Tarea de proceso que formaliza la decisión de "go/no-go" sobre la adopción de un orquestador (como Kubernetes) para las releases futuras. Esta decisión se basará en la revisión de los KPIs de rendimiento, estabilidad y coste recopilados hasta el final de la Release 4, así como en los resultados del PoC de T-16.

- **Detalles Técnicos:**
  - **Proceso:** Tarea de gestión, no de desarrollo.
  - **Entregable:** Un Architecture Decision Record (ADR) que documenta la decisión y su justificación.

- **Estrategia de Test:** N/A (Tarea de proceso).

- **Documentación:** El entregable principal es el ADR.

- **Criterios de Aceptación:**
  - Se ha realizado una reunión formal de revisión de KPIs con el Product Owner y el Tech Lead.
  - Se ha publicado el ADR-003 con la decisión "go/no-go" y su justificación detallada.

- **Definición de Hecho (DoD):**
  - Minuta de la reunión de revisión completada.
  - ADR-003 publicado y aprobado.
  - Todas las subtareas verificadas como completas.

#### **Desglose en Subtareas (Complejidad Total: 3)**

_Nota: La complejidad total de 3 representa el overhead de gestión y coordinación, y no se desglosa en las subtareas de ejecución que tienen complejidad 0._

| ID del Elemento de Trabajo (WII) | Descripción de la Subtarea                                                                                  | Complejidad Estimada | Entregable Verificable                                                    |
| :------------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------------- | :------------------------------------------------------------------------ |
| R4.WP2-T47-ST1                   | Convocar y facilitar la reunión de revisión de KPIs y resultados del PoC (T-16) con los stakeholders clave. | 0                    | Minuta de la reunión con los datos analizados y la decisión preliminar.   |
| R4.WP2-T47-ST2                   | Redactar y proponer el ADR-003 documentando la decisión final y la justificación basada en los datos.       | 0                    | Borrador del ADR-003 enviado para revisión.                               |
| R4.WP2-T47-ST3                   | Publicar la versión final del ADR-003 una vez aprobado.                                                     | 0                    | ADR-003 fusionado en la rama principal y registrado en el índice de ADRs. |
