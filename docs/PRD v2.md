# Product Requirements Document

**Proyecto:** Generador de Documentos con IA + RAG
**Versión:** v0.2
**Autor:** BriamV
**Fecha:** 13 jun 2025

---

## 1. Visión y Objetivo

Crear una aplicación **on-prem**, con UI web (**React 18 + TypeScript + Monaco Markdown live preview servida por FastAPI 3.11**) que permita a un editor único:

1. **Generar** documentos mediante IA (OpenAI GPT-4o / GPT-4o-mini, ventana 128 k tokens) usando:
   * Prompts libres o plantillas.
   * Recuperación aumentada con RAG sobre una pequeña base de conocimiento (≤ 15 archivos, ≤ 10 MB c/u).

2. **Editar** el borrador con comandos de IA y edición manual Markdown.

3. **Versionar, auditar y exportar** (Markdown, PDF, DOCX) de forma segura, cumpliendo GDPR / HIPAA / ISO 27001.

> **Éxito =** Tiempo medio de creación ≤ 8 min, cero fugas de datos, adopción ≥ 80 % usuarios activos/mes.

---

## 2. Stakeholders & Roles

| Rol               | Descripción                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Editor**        | Usuario autenticado vía OAuth (Google/Microsoft). Crea, edita y exporta documentos. Gestiona su propia base de conocimiento y plantillas. |
| **Administrador** | Configura límites globales, gestiona usuarios, define tamaño y nº máximo de documentos, gestiona restore window (30 días) y vectores.     |

---

## 3. Alcance

### 3.1 In-scope (MVP)

* Autenticación OAuth 2.0.
* Carga manual de archivos (PDF, DOCX, MD, TXT) con metadatos mínimos.
* Vector store embebido (Chroma o Qdrant) con **OpenAI embeddings**.
* Editor Markdown con vista previa y barra de comandos IA (`/resume`, `/formal`, etc.).
* Generación inicial por prompt + (opcional) selección de base de conocimiento y/o web search¹.
* Historial de versiones con diff y rollback.
* Exportación a MD, PDF, DOCX (plantilla genérica).
* Cifrado en tránsito (TLS) y en reposo (AES-256).
* Auditoría de acciones clave (crear, leer, editar, exportar, borrar).
* Dashboard mínimo de uso y costes de OpenAI (por usuario).
* UI basada en **React 18 + Monaco** con vista previa Markdown y barra de comandos IA (`/resume`, `/formal`, etc.).
* **Planner jerárquico**: end-points `/plan` (outline) y `/draft_section` (stream WebSocket por sección).


¹*Selección de “Web search” visible en la UI, pero deshabilitada (tooltip: “Disponible en futura versión”).*

### 3.2 Out-of-scope (MVP)

* Co-edición simultánea.
* Branding corporativo.
* Integraciones externas (Slack, Zapier).
* Sistema de pagos / planes.

---

## 4. Requisitos Funcionales

### 4.1  Fundamentos utilizados

* **Calidad del requisito**: necesario, correcto, unívoco, completo, singular, factible, verificable y rastreable ([iso.org][1], [standards.ieee.org][2]).
* **Guía de redacción** (INCOSE Guide to Writing Requirements) ([incose.org][3]).
* **Clasificación y baselines** (NASA SE Handbook) ([lws.larc.nasa.gov][5], [lws.larc.nasa.gov][6]).
* **Priorización MoSCoW** (DSDM) ([agilebusiness.org][7], [productplan.com][8]).
* **Estructura IEEE 830 como referencia histórica** ([press.rebus.community][9], [medium.com][10]).

### 4.2  Tabla de Requisitos Funcionales (MVP)

| ID          | Título corto          | Enunciado (“shall”)                                                                                                                                          | Pri | Criterio de aceptación (medible)                                                              | Verif.              |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------------------------------------------------------------------------------- | ------------------- |
| **USR-001** | Inicio de sesión      | El sistema **shall** autenticar al usuario mediante OAuth 2.0 de Google o Microsoft y emitir un JWT con vigencia configurable (por defecto 24 h).            | M   | 1) Inicio de sesión válido entrega JWT. 2) Solicitud con token caducado devuelve HTTP 401.    | Prueba integración  |
| **ADM-001** | Límites de ingesta    | El administrador **shall** poder definir *N* (1–30) documentos y *T* MB (1–200) por archivo en la consola de ajustes.                                        | M   | Cambiar valores ⇒ próxima carga respeta nuevos límites; intento que excede muestra error 400. | Inspección + prueba |
| **KB-001**  | Ingesta RAG           | Al cargar un archivo, el sistema **shall** ① extraer texto completo, ② generar embeddings con OpenAI `text-embedding-3-small`, ③ indexar en Chroma o Qdrant. | M   | Tras la carga, búsqueda de prueba devuelve ≥1 pasaje relevante con score ≥0.75.               | Test funcional      |
| **KB-002**  | Metadatos             | El sistema **shall** registrar *autor, fecha de carga (UTC) y ≥1 etiqueta* por documento y exponerlos vía UI y API REST.                                     | M   | Metadatos visibles en tabla y endpoint `/docs/{id}`.                                          | Inspección          |
| **KB-003**  | Re-ingesta y upsert        | Cuando el usuario sustituya un archivo existente, el sistema **shall** eliminar los embeddings antiguos del vector-store y crear nuevos en la misma operación (“upsert”).   | M   | Re-subir archivo ⇒ embeddings antiguos no se recuperan en búsqueda; nuevos pasajes sí (score ≥ 0.75); (requiere KB-001 implementado).             | Test funcional                      |
| **GEN-001** | Selección de contexto | El editor **shall** poder marcar cualquier combinación de: **(a)** Base de Conocimiento, **(b)** Web search, **(c)** Libre (sin contexto).     | M   | Flags aparecen en formulario; prompt “Base=off” no usa vector store (latencia < 3 s).         | Demostración        |
| **GEN-002** | Borrador inicial      | El sistema **shall** generar el borrador de “Versión 1” a partir de ① prompt libre y/o ② plantilla seleccionada, mostrando progreso en UI.                   | M   | Para un documento de 1 000 palabras se recibe respuesta completa ≤10 min.                     | Prueba rendimiento  |
| **EDT-001** | Editor Markdown       | La UI **shall** ofrecer editor de texto plano con preview Markdown en tiempo real (<200 ms retraso) y atajos (`Ctrl+B`, `Ctrl+I`).                           | M   | Escribir “\*\*bold\*\*” ⇒ vista previa actualiza ≤0.2 s.                                      | Prueba UI           |
| **EDT-002** | Comandos IA           | El editor **shall** aceptar comandos prefijados (`/resume`, `/formal`, `/simplify`) que modifican el bloque de texto seleccionado.                           | M   | `/resume` reduce extensión ≥20 % manteniendo sentido (ROUGE-L ≥0.7).                          | Demo + métrica      |
| **VER-001** | Versionado            | Cada guardado **shall** crear versión incremental con hash SHA-256 y diff línea-a-línea; máximo 500 versiones por documento.                                 | M   | Historial muestra hash único; diff resalta cambios; rollback disponible.                      | Inspec. código      |
| **VER-002** | Rollback              | El sistema **shall** permitir revertir a cualquier versión anterior sin perder el historial, dejando trazabilidad de la acción.                              | M   | Seleccionar v3 ⇒ contenido idéntico a v3, registro en log de auditoría.                       | Prueba              |
| **EXP-001** | Exportación           | El sistema **shall** exportar el documento a **.md, .pdf, .docx** conservando títulos, listas y tablas.                                                      | M   | Dif hash Markdown = vista; PDF abre sin advertencias; DOCX pasa validador OpenXML.            | Prueba archivo      |
| **SEC-001** | Cifrado               | El sistema **shall** cifrar datos en tránsito (TLS 1.2+ únicamente) y en reposo (AES-256, claves rotables cada 90 d).                                        | M   | Escaneo SSLlabs ≥A; script de auditoría verifica disco cifrado LUKS.                          | Auditoría           |
| **SEC-002** | Gestión de API Keys        | El sistema **shall** almacenar las API Keys del usuario cifradas con AES-256 y rotarlas cuando la vigencia supere 90 días.                                                   | M   | 1) Keys se guardan sólo en tabla encriptada. 2) Key con “age > 90 d” provoca aviso de rotación al iniciar sesión. | Auditoría de código + prueba |
| **AUD-001** | Log inmutable         | El sistema **shall** registrar *usuario, acción, timestamp, IP, doc-ID, versión* en un log WORM; retención mínima 1 año.                                     | M   | Entrada aparece ≤5 s; log protegido contra ALTER/DELETE en base de datos.                     | Inspección          |
| **DEL-001** | Borrado y restore     | El editor **shall** poder realizar borrado lógico y restaurar documentos/embeddings ≤30 d posteriores.                                                       | S   | Documento marcado “Deleted”; botón “Restore” disponible dentro de ventana.                    | Prueba              |
| **DEL-002** | Derecho de supresión       | El sistema **shall** ofrecer, bajo solicitud del usuario, la eliminación definitiva e irreversible de documentos y datos personales en ≤30 d (“right to erasure”).           | M   | Solicitud crea ticket; al día 30 los datos desaparecen de BD y backups; registro de cumplimiento en log WORM.     | Revisión de proceso + auditoría      |
| **MET-001** | Dashboard             | El sistema **shall** mostrar en el panel de métricas: Nº documentos/mes, ratio uso de plantillas, tokens OpenAI, tiempo medio generación (TMG).              | S   | Diferencia entre panel y logs brutos ≤5 %.                                                    | Verif. analítica    |
| **MET-002** | Costos OpenAI              | El panel de métricas **shall** mostrar el coste acumulado en USD por día, modelo y documento utilizando la Usage/Cost API de OpenAI.                                         | S   | Diferencia <5 % con dashboard nativo de OpenAI para el mismo API-key.                                             | Verif. analítica     |
| **MON-001** | Health-check API           | El sistema **shall** exponer el endpoint `/healthz` que verifique base de datos, vector-store y OpenAI; devolverá JSON `{status:"ok"}` en <200 ms si todos los checks pasan. | M   | Llamada directa devuelve HTTP 200 y latencia < 0.2 s; fallo en dependencia cambia `"ok"`→ `"degraded"`.           | Prueba monitorización               |
| **RLM-001** | Rate-limiting              | El sistema **shall** limitar a 30 solicitudes de generación/edición por minuto por usuario y devolver HTTP 429 en exceso.                                                    | M   | Disparar 40 peticiones en una ventana de 60 s ⇒ ≤30 aceptadas, resto 429; cabecera `Retry-After: 30`.                                     | Prueba carga            |
| **INF-001** | Backup cifrado y retención | El sistema **shall** realizar copias de seguridad cifradas (AES-256) diarias con retención de 30 d para documentos y vectores.                                               | S   | Restaurar backup del día 15 recupera datos; archivo backup cifrado verificado con `openssl`.                      | Auditoría                         |

Pri = Prioridad (MoSCoW).

> **Nota:** Cada requisito posee atributos implícitos de fuente (usuario/PO), estado y traza hacia objetivos del producto según ISO 29148 §9 ([iso.org][1]).

### 4.3  Buenas prácticas aplicadas

1. **Singularidad**: un actor, una acción, un resultado ([incose.org][3]).
2. **Verificabilidad**: cada criterio puede demostrarse por inspección, prueba o auditoría (NASA V-model) ([lws.larc.nasa.gov][5]).
3. **Prioridad MoSCoW**: ayuda a gestionar alcance en sprints iterativos ([agilebusiness.org][7]).
4. **Trazabilidad bidireccional**: requisitos ↔ casos de prueba ↔ objetivos de negocio ([incose.org][4]).

Con este nivel de especificidad y atributos podrás integrar fácilmente los requisitos en herramientas de ALM y asegurar que cada uno se valida con evidencias objetivas durante el ciclo de vida del sistema.

[1]: https://www.iso.org/obp/ui/en/ "ISO/IEC/IEEE 29148:2018(en), Systems and software engineering"
[2]: https://standards.ieee.org/standard/29148-2018.html "IEEE/ISO/IEC 29148-2018 - IEEE SA"
[3]: https://www.incose.org/docs/default-source/working-groups/requirements-wg/gtwr/incose_rwg_gtwr_v4_040423_final_drafts.pdf "[PDF] Guide to Writing Requirements - incose"
[4]: https://lws.larc.nasa.gov/vfmo/pdf_files/%5BNASA-SP-2016-6105_Rev2_%5Dnasa_systems_engineering_handbook_0.pdf "[PDF] NASA Systems Engineering Handbook"
[5]: https://lws.larc.nasa.gov/pdf_files/12%20NASA_SP-2016-6105%20Rev%202.pdf "[PDF] NASA Systems Engineering Handbook Rev 2 i"
[6]: https://www.agilebusiness.org/dsdm-project-framework/moscow-prioririsation.html "Chapter 10: MoSCoW Prioritisation - DSDM Project Framework ..."
[7]: https://www.productplan.com/glossary/moscow-prioritization/ "What is MoSCoW Prioritization? - ProductPlan"
[8]: https://press.rebus.community/requirementsengineering/back-matter/appendix-d-ieee-830-sample/ "Appendix D: IEEE 830 Sample – Requirements Engineering"
[9]: https://medium.com/%40abdul.rehman_84899/ieee-standard-for-software-requirements-specifications-ieee-830-1998-0395f1da639a "IEEE Standard for Software Requirements Specifications (IEEE 830 ..."
[10]: https://platform.openai.com/account/usage "OpenAI Usage API"

### 4.4 UX / UI — Lineamientos de Diseño

#### 4.4.1 Objetivo de productividad  
Generar un primer borrador que cubra ≈ 80 % del documento final con una única orden (“prompt”) y en menos de 8 min (referencia documento de 10 paginas tamaño de letra del texto 11 pts), mostrando progreso en streaming.  

#### 4.4.2 Modelo de interacción  
- **Editor Markdown + vista previa paralela** (`react-markdown-preview`). 
- **Comandos IA contextuales** (“Paraphrase”, “Trim”, etc.) expuestos como *Monaco Actions* (`editor.addAction`).  
- **Atajos de teclado estándar**, evitando sobre-escribir combinaciones comunes (guías NN/g). 

#### 4.4.3 Navegación de documentos  
Sidebar vertical estilo *GitLab Pajamas*; orden “last modified”, agrupación por proyecto y buscador **Quick Open** (`⌘ + P`).

#### 4.4.4 Accesibilidad y temas  
Modo claro/oscuro automático; navegación 100 % teclado; sin requisitos A11y adicionales declarados.

---

### 4.4.5 Flujos Principales

| Flujo | Descripción | Límite de tiempo |
|-------|-------------|------------------|
| **Plan → Draft** | 1️⃣ /plan (POST) genera un outline jerárquico (H1/H2/H3) usando técnica Outline-Guided Text Generation → 2️⃣ Cada título se transmite a /draft_section (WebSocket) para generar texto en streaming con heading, bullets y global_summary (~600 tokens) → 3️⃣ Al finalizar cada sección, se activa un summary refresh que condensa y actualiza el global_summary (100 tokens) | 95 % ≤ 8 min |
| **Edición asistida** | Selección → Palette → `/rewrite` (acción) | Simples ≤ 2 s · Medias ≤ 2 min · Grandes ≤ 6 min |
| **Exportación** | Click “Export” → cola Celery → Pandoc PDF/DOCX | 95 % ≤ 6 min |

---

### 4.4.6 Componentes UI clave

| Componente | Estado | Nueva tarea |
|------------|--------|-------------|
| **Prompt Bar + barra de progreso** | No existe | Construir sobre React + WS streaming |
| **Outline Pane** | Nuevo | Árbol plegable con chips *Done/Review* |
| **Action Palette** | Parcial (macros) | Integrar 8 comandos IA frecuentes |
| **Comment Tags** | N/A | Decoraciones Monaco + storage SQL |
| **Diff Viewer** | N/A | `monaco.editor.createDiffEditor` para versiones · Undo/Redo multi-snapshot |

---

### 4.4.7 End-points adicionales

| Ruta | Método | Parámetros clave | Descripción |
|------|--------|------------------|-------------|
| `/plan` | POST | `prompt`, `template_id` | Devuelve JSON de headings H1/H2/H3 |
| `/draft_section` | WS | `section_id`, `context_summary` | Streamea 30 t/s ≈ 600 tokens / 20 s |
| `/rewrite` | POST | `text`, `action` | Re-escribe selección según macro |
| `/comment` | CRUD | — | Gestiona anotaciones in-line |
| `/export` | POST | `format=pdf\|docx` | Lanza conversión Pandoc |

---

#### 4.4.8 Gestión de contexto y coherencia

- **Token budget**: cada llamada garantiza *prompt* + contexto + salida ≤ 9 000 tokens, bien dentro de la ventana de contexto de 128 000 tokens que ofrecen tanto **GPT-4o** como **GPT-4o-mini** (input + output).  
- **Planner jerárquico** mantiene `global_summary` (~600 tokens) actualizado tras cada sección siguiendo un modelo extractivo-jerárquico, lo que permite conservar coherencia global sin sobrecargar la ventana de contexto.  
- **Checker de coherencia** (`/revise_global`) aplica un discriminador de cohesión para textos largos, basado en prácticas de generación jerárquica que han demostrado reducir saltos de tema e incoherencias.  

---

#### 4.4.9 Planner por secciones  

Se implementa un _pipeline_ de generación jerárquica:

1. **/plan (POST)** – Devuelve outline H1/H2/H3 a partir del prompt y plantilla seleccionada (técnica Outline-Guided Text Generation).  
2. **/draft_section (WebSocket)** – Genera cada sección en streaming; incluye heading, bullets del plan y `global_summary` (~600 tokens).  
3. **Summary refresh** – Tras cada sección un summariser condensa a 100 tokens y actualiza `global_summary`.  
4. **/revise_global (POST)** – Ejecuta paso de coherencia global para detectar referencias colgantes y cambios de estilo.

Este pipeline garantiza coherencia en documentos largos sin sobrepasar la ventana de 128 k tokens de GPT-4o.

---

### 4.4.10 Métricas de UX (OKRs)

| Métrica | Target |
|---------|--------|
| **SUS (usabilidad)** | ≥ 80 (test piloto, 3 usuarios) |
| **Tiempo “prompt → 80 % draft”** | p95 ≤ 8 min (doc 10 pág.) |
| **Latencia comando Rewrite** | p95 ≤ 2 s (≤ 100 tokens) |
| **Error de coherencia sección/global** | ≤ 1 % (medido por checker) |

> **Referencia**  
> - Para flujos completos de UX, wireframes y tolerancias de rendimiento, ver **UX-FLOW.md**.  
> - Para el análisis detalle-a-detalle de cobertura de requisitos, riesgos técnicos y plan de mitigación, ver **ARCH-GAP-ANALYSIS.md**.

---

## 5. Requisitos No Funcionales

| ID           | Categoría                | Enunciado (“shall”)                                                                                                                                                                                | Pri | Criterio de aceptación (medible)                                     | Verif.           |
| ------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------------------------- | ---------------- |
| **PERF-001** | Rendimiento – Generación | El sistema **shall** completar la operación *generar / editar / exportar* en «≤ 6 min para el P95» de las peticiones, con tamaño de documento ≤ 3 000 palabras. (referir KPI-01)                                | M   | Prueba carga de 100 docs ⇒ 95 % finalizan ≤ 600 s.                   | Bench. JMeter    |
| **PERF-002** | Rendimiento – UI         | El sistema **shall** renderizar la vista previa Markdown en ≤ 200 ms (mediana) tras cada pulsación de tecla.                                                                                       | M   | Registro Lighthouse: p50 ≤ 0.2 s.                                    | Test UI          |
| **PERF-003** | Rendimiento – Ingesta    | El sistema **shall** procesar e indexar un archivo de 10 MB en ≤ 120 s.                                                                                                                            | S   | Cronómetro API `/upload` ⇒ `status=ready` ≤ 120 s.                   | Prueba carga     |
| **PERF-004** | Rendimiento – Búsqueda   | La consulta RAG **shall** devolver el primer pasaje relevante en < 1 s (p95) para base de 15 docs.                                                                                                 | S   | 20 consultas ⇒ 95 % latencia < 1 000 ms.                             | Bench.           |
| **SCA-001**  | Escalabilidad            | El sistema **shall** operar con 10 usuarios concurrentes y 100 docs/día manteniendo PERF-001 … 004; y **shall** escalar horizontalmente a ≥ 3 instancias de vector-store sin downtime planificado. | M   | Prueba carga con HPA ⇒ métricas dentro de SLA, 0 errores 5xx.        | Chaos test       |
| **SEC-003**  | Cifrado integral         | El sistema **shall** usar TLS 1.2+ en tránsito y cifrado AES-256 (LUKS o equivalente) en reposo para BD, backups y embeddings.                                                                     | M   | Escaneo SSLabs ≥ A; verificación de discos cifrados.                 | Auditoría        |
| **SEC-004**  | Gestión de claves        | El sistema **shall** rotar API Keys cifradas cada ≤ 90 d y limitar su visibilidad sólo a procesos autorizados (principio de mínimo privilegio).                                                    | M   | Key > 90 d genera alerta; revisión IAM muestra rol con scope mínimo. | Inspección       |
| **PRI-001**  | Derecho de supresión     | El sistema **shall** eliminar de forma irreversible documentos y PII dentro de ≤ 30 d tras petición (GDPR Art. 17).                                                                                | M   | Ticket “erase” cerrado ≤ 30 d; entrada WORM de cumplimiento.         | Auditoría        |
| **PRI-002**  | Consentimiento explícito | El sistema **shall** requerir aceptación explícita antes de almacenar datos en modelos de terceros; registro del consentimiento en log inmutable.                                                  | M   | Checkbox “Acepto” obligatorio; log registra `consent:true`.          | Test flujo       |
| **AVL-001**  | Disponibilidad           | El sistema **shall** mantener ≥ 99 % de uptime mensual y alcanzar **MTTR ≤ 2 h** para incidentes críticos.                                                                                         | M   | Monitoreo Uptime >= 99 %; incidentes cerrados MTTR ≤ 2 h.            | Análisis SRE     |
| **OBS-001**  | Trazabilidad             | El sistema **shall** instrumentar todas las peticiones con trazas OpenTelemetry y exponer métricas Prometheus; 100 % de spans deben incluir `user_id` y `doc_id`.                                  | M   | Auditoría muestra ≥ 99 % spans completos; panel Grafana activo.      | Inspección       |
| **OBS-002**  | Costos IA                | El sistema **shall** registrar tokens y coste USD por petición y mostrar dashboard diario con desviación ≤ 5 % respecto a la Usage API de OpenAI.                                                  | S   | Comparación 24 h ⇒ Δ ≤ 5 %.                                          | Verif. analítica |
| **STO-001**  | Versionado y espacio     | El sistema **shall** limitar a 500 versiones por documento y a 50 GB totales de almacenamiento persistente; superado este umbral retorna error 507.                                                | M   | Upload que supera cuota ⇒ HTTP 507 “Storage Exceeded”.               | Prueba           |
| **STO-002**  | Copias de seguridad      | El sistema **shall** ejecutar backups cifrados diarios con retención de 30 d y validar un restore semanalmente.                                                                                    | S   | Restore automático lunes 02 h ⇒ éxito; hash coincide.                | Job CI           |

---

## 6. Supuestos y Dependencias

* El usuario aporta su propia **OpenAI API Key**.
* Infraestructura on-prem con Docker-compose o Kubernetes mínimo.
* Acceso outbound a api.openai.com permitido.
* Chroma/Qdrant contenedor con persistencia local cifrada.
* Dispositivo de almacenamiento ≥ 75 GB disponibles para datos de aplicación.

---

## 7. Roadmap Iterativo (actualizado)

| Hito                            | Entregables clave (IDs asociados)                                                                                                                                         | Valor al usuario                   | Plazo |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----- |
| **R0 – Setup**                  | Docker baseline, OAuth login (USR-001), UI skeleton Markdown (EDT-001), health-check API `/healthz` (MON-001)                                                                                                   | Acceso y monitoreo inicial         | +2 sem |
| **R1 – Ingesta & RAG**          | Carga archivos, embeddings, vector search (KB-001/002/003), límites de ingesta (ADM-001)                                                                                                                        | Contexto disponible                | +4 sem |
| **R2 – Planner & Generación**   | End-points **`/plan`** (outline) y **`/draft_section`** (WebSocket); generación paralela por secciones; resumen global incremental; alertas SLA > 10 min (SLA-001)                                                | Borrador 80 % coherente            | +6 sem |
| **R3 – Editor & Export**        | Markdown editor final (EDT-001), Action Palette (EDT-002), Outline Pane, barra de progreso, PDF/DOCX export (EXP-001), rate-limiting (RLM-001)                                                                   | Edición segura y guiada            | +8 sem |
| **R4 – Versionado & Auditoría** | Diff Viewer + rollback (VER-001/002), comment tags, audit log WORM (AUD-001), borrado lógico + restore (DEL-001)                                                                                                 | Trazabilidad completa              | +10 sem |
| **R5 – Seguridad & Compliance** | Cifrado en reposo (SEC-001/003), rotación API Keys (SEC-002/004), derecho supresión (DEL-002, PRI-001), consentimiento (PRI-002)                                                                                 | Cumplimiento normativo             | +12 sem |
| **R6 – Operación & Backup**     | Backup cifrado + restore (INF-001, STO-002), panel métricas + costes (MET-001/002, OBS-001/002), disp. 99 % (AVL-001), escalado HPA (SCA-001)                                                                    | Fiabilidad y visibilidad           | +14 sem |

> *Tiempos orientativos; cada iteración cierra con los criterios de la sección 8. T0 = aprobación v0.1.*

---

## 8. Criterios de Verificación & Validación (actualizado)

| Nivel             | Método                                          | Criterio de aceptación                                                                                   |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Archivo**       | Unit test parser/embeddings                     | 100 % de texto extraído y vectorizado sin error.                                                          |
| **Funcionalidad** | Test API `/plan`, `/draft_section`, `/rewrite`  | HTTP 200; generación sección ≤ 20 s; planner ≤ 1 s.                                                       |
| **Integración**   | E2E plan→draft→edit→export                      | Export coincide con preview (checksum).                                                                  |
| **Interfaz**      | Cypress                                         | Outline visible; progreso en streaming; atajos y preview responsive.                                     |
| **Experiencia**   | Pruebas usuario (5 editores)                    | SUS ≥ 80; generación ≥ 80 % calidad percibida; latencia p95 según sección 7.                              |
| **Coherencia**    | Checker `/revise_global`                        | ≤ 1 % inconsistencias semánticas por sección.                                                             |
| **Seguridad**     | Pentest + SSL scan                              | TLS ≥ 1.3; AES-256 at rest.                                                                               |
| **Borrado**       | Solicitud GDPR “erase”                          | Datos ausentes ≤ 30 d.                                                                                    |
| **Rate-limit**    | Locust 60 req min⁻¹                             | ≥ 10th req devuelve HTTP 429.                                                                             |
| **Backup**        | Restore backup semanal                          | Hash coincide.                                                                                            |
| **Monitorización**| `/healthz` + panel Grafana                      | status:ok < 200 ms.                                                                                       |
| **Disponibilidad**| Informe uptime mensual                          | ≥ 99 %; MTTR ≤ 2 h.                                                                                       |

---

## 9. KPIs & Analítica – Versión Completa (actualizado)

| KPI ID     | Métrica                                    | Definición / Fórmula                                    | Objetivo ➡ Alerta      | Relación |
| ---------- | ------------------------------------------ | ------------------------------------------------------- | ---------------------- | -------- |
| **KPI-01** | **Tiempo medio generación**                | Σ tiempo / nº docs (min)                                | ≤ 6 min ➡ ≥ 8 min      | PERF-001 |
| **KPI-02** | **P95 latencia sección**                   | p95 tiempo `/draft_section` (s)                        | ≤ 20 s ➡ ≥ 30 s        | PERF-002 |
| **KPI-03** | **Coste tokens (tokens/doc)**              | Σ tokens / nº docs                                      | ≤ 20 k ➡ ≥ 30 k        | MET-002 |
| **KPI-04** | **Coste USD/doc**                          | Σ coste USD / nº docs                                  | ≤ 0.12 ➡ ≥ 0.20        | MET-002 |
| **KPI-05** | **Reutilización plantillas**               | docs con template / docs tot × 100                     | ≥ 60 % ➡ ≤ 40 %        | MET-001 |
| **KPI-06** | **Ratio éxito ingesta**                    | uploads OK / uploads Tot × 100                         | ≥ 98 % ➡ ≤ 95 %        | KB-001 |
| **KPI-07** | **Errores 5xx / semana**                   | Conteo respuestas 5xx                                  | ≤ 5 ➡ ≥ 15             | AVL-001 |
| **KPI-08** | **Uptime**                                 | horas up / horas tot × 100                             | ≥ 99 % ➡ ≤ 97 %        | AVL-001 |
| **KPI-09** | **SUS Score**                              | Encuesta semestral                                     | ≥ 80 ➡ ≤ 70            | PERF-002 |
| **KPI-10** | **Restore requests / mes**                 | nº restauraciones                                      | ≤ 5 ➡ ≥ 10             | DEL-001 |
| **KPI-11** | **Derecho supresión cumplimiento**         | GDPR cerradas ≤ 30 d / tot × 100                       | 100 % ➡ < 95 %         | PRI-001 |
| **KPI-12** | **Backups verificados**                    | restores OK / backups × 100                            | 100 % ➡ < 90 %         | STO-002 |
| **KPI-13** | **Utilización almacenamiento**             | GB usados / 50 GB × 100                                | ≤ 80 % ➡ ≥ 90 %        | STO-001 |
| **KPI-14** | **Alertas rate-limit (h⁻¹)**               | nº HTTP 429 última hora                                | ≤ 20 ➡ ≥ 50            | RLM-001 |
| **KPI-15** | **Latencia /healthz (ms)**                 | Media últimos 5 min                                    | ≤ 200 ➡ ≥ 400          | MON-001 |
| **KPI-16** | **Incoherencia global (%)**                | incoherencias / secciones × 100                        | ≤ 1 % ➡ ≥ 3 %          | COH-001 |

---

## 10. Riesgos Principales – Matriz Actualizada

| ID   | Riesgo                                       | Prob. | Impacto | Sev.* | Mitigación                                                     | Contingencia |
| ---- | -------------------------------------------- | ----- | ------- | ----- | -------------------------------------------------------------- | ------------ |
| R-01 | Exceso coste tokens (GPT-4o)                 | M     | H       | **H** | KPI-03/04 + throttling modelo mini ⇄ macro                     | Downgrade modelo |
| R-02 | Fugas de datos sensibles                     | L     | H       | **H** | SEC-001/003 + IAM mínimo + pentest                            | Notify DPO |
| R-03 | Dependencia proveedor LLM                    | M     | M       | **M** | Abstracción LLM + PoC Llama-cpp                                | Fallback self-host |
| R-04 | Índice vectorial se corrompe                 | L     | M       | **M** | Backups diarios Chroma                                         | Re-embeddings |
| R-05 | Indexación lenta en pico                     | M     | M       | **M** | PERF tests + batch ingest                                      | Async queue |
| R-06 | Cota de almacenamiento 50 GB                 | M     | L       | **M** | KPI-13 alerta 80 %                                             | Purga versiones |
| R-07 | Interrupción prolongada (> 2 h)              | L     | H       | **H** | HA deploy + fail-over test                                     | Nodo secundario |
| R-08 | Incumplimiento derecho supresión             | L     | H       | **H** | Automatizar “erase” job                                        | Purga manual |
| R-09 | Abuso / DDOS                                 | L     | M       | **M** | RLM-001 + WAF                                                  | Block IP |
| R-10 | Rotación de API Keys no atendida             | M     | L       | **M** | SEC-004 alertas                                               | Forzar renovación |

*Sev. = Prob. × Impacto (L/M/H).

---

## 11. Temas Abiertos / Futuro

1. Web search RAG (fuente externa).  
2. Co-edición simultánea (CRDT / Yjs).  
3. Branding corporativo y plantillas avanzadas.  
4. Integraciones (Slack, Zapier).  
5. Model-marketplace y planes *paid* por suscripción.

---

## 12. Aprobación

| Stakeholder   | Rol | Firma | Fecha |
| ------------- | --- | ----- | ----- |
| Product Owner | —   |       |       |
| Tech Lead     | —   |       |       |
| Security      | —   |       |       |

---

> **Nota:** Este PRD es la referencia viva; deberá actualizarse en cada iteración si cambian prioridades o alcance.

### Anexo A – Glosario
* **JWT**: JSON Web Token …
* **Pri (MoSCoW)**: M = Must, S = Should …
* **WORM**: Write Once Read Many …
* **SUS**: System Usability Scale …
* **TMG**: Tiempo Medio de Generación
* **P95**: Percentil 95.
* **TMG**: Tiempo Medio de Generación.