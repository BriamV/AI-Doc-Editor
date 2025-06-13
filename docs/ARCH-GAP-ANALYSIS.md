# Análisis de Arquitectura y Gaps

> *Versión 2025‑06‑13*
> Escenario base: **AI‑Text‑Editor (React 18 + Monaco)** + **FastAPI 3.11** + **Chroma**.

---

## 1. Resumen crítico

La arquitectura ligera elegida (**React 18 + Monaco + FastAPI 3.11 + Chroma**) cubre ≈ 65 % del PRD v0.2 con < 120 dependencias y < 250 MiB de imágenes Docker. Con el *planner jerárquico* —endpoints `/plan`, `/draft_section` y `/revise_global`— la cobertura efectiva supera 80 % y se mantiene coherencia global dentro de la ventana de 128 k tokens de GPT‑4o/mini. Aun así, persisten 11 gaps funcionales y 9 NFR listados a continuación.

---

## 2. Cobertura de requisitos funcionales

| ID PRD      | Descripción                          | Estado base          | Gap / Acción                        | Est. d/h |
| ----------- | ------------------------------------ | -------------------- | ----------------------------------- | -------- |
| USR‑001     | OAuth2 Google/MS + JWT               | Parcial              | Falta refresh-token, roles          | 4 d      |
| GEN‑001     | Prompt libre                         | Parcial solo prompt libre`/draft` MVP      | —                                   | —        |
| GEN‑002     | solo genera a traves de prompt libre | Parcial              | JSON + Jinja templates              | 3 d      |
| PLN‑001     | Planner por secciones                | Nuevo | Ajustar límite chunk (≤ 800 tokens) | 2 d      |
| EDT‑001/002 | Editor MD + comandos IA              | Parcial              | Palette & ROUGE-L tests             | 2 d      |
| VER‑001/002 | Versionado + rollback                | Gap                  | SQLite snapshots + Diff             | 5 d      |
| EXP‑001     | Export MD→PDF/DOCX                   | Gap                  | Celery + Pandoc                     | 3 d      |
| COH‑001     | Coherencia global (`/revise_global`) | Nuevo      | Discriminador BERT                  | 3 d      |
| ...         | ...                                  | ...                  | ...                                 | ...      |

---

## 2.5 Planner-driven pipeline

**2.5.1 Outline stage (`/plan`)**
El endpoint `POST /plan` recibe el prompt y plantilla, y devuelve un outline jerárquico (H1/H2/H3) aplicando técnicas de Outline-Guided Text Generation referencias arXiv y ACL Anthology.

**2.5.2 Section draft (`/draft_section`)**
`/draft_section` utiliza WebSocket para streamear cada sección. El payload incluye:

* Título de sección y bullets clave del outline.
* `global_summary` (\~600 tokens) actualizado tras cada sección.
  Chroma provee chunks de 300–800 tokens para fundamentar respuestas.

**2.5.3 Summary refresh**
Tras finalizar cada sección, un summariser extractivo condensa el texto a \~100 tokens y actualiza `global_summary`.

**2.5.4 Merge & revise (`/revise_global`)**
Se ejecuta un paso de coherencia global con un discriminador de cohesión para detectar incoherencias semánticas o de estilo.

---

## 3. Cobertura NFR & Operación

| NFR / KPI                     | Target  | Estado actual   | Gap / Acción        |
| ----------------------------- | ------- | --------------- | ------------------- |
| PERF‑002 `/draft_section` p95 | ≤ 20 s  | 30 tok/s ≈ 20 s | Medir en producción |
| COH‑001 incoherencia global   | ≤ 1 %   | Checker stub    | Ajustar umbral      |
| SLA‑001 draft completo        | ≤ 8 min | —               | Monitorizar         |
| ...                           | ...     | ...             | ...                 |

---

## 4. Dependencias y riesgos técnicos

| Área      | Dependencia                | Riesgo            | Mitigación                 |
| --------- | -------------------------- | ----------------- | -------------------------- |
| LLM       | GPT‑4o / GPT‑4o-mini       | Coste elevado     | Downgrade a GPT‑4o-mini    |
| Planner   | Outline-Guided prompts     | Riesgo de novedad | POC + fallback single-shot |
| Vector DB | Chroma OSS (0.4 sin shard) | Límite \~50 GB    | Swap a Qdrant cluster      |
| ...       | ...                        | ...               | ...                        |

---

## 5. Gaps priorizados (MoSCoW)

| #   | Gap                                 | Pri | Esfuerzo | Sprint |
| --- | ----------------------------------- | --- | -------- | ------ |
| 1   | Versionado SHA‑256 + rollback       | M   | 5 d      | R4     |
| 2   | Export Pandoc queue                 | M   | 3 d      | R3     |
| 3   | Coherencia checker `/revise_global` | M   | 3 d      | R2     |
| ... | ...                                 | ... | ...      | ...    |

---

## 6. Plan de acción auditado (R0 → R6)

| Sprint | Foco            | Entregables clave                                  |
| ------ | --------------- | -------------------------------------------------- |
| R0     | Seguridad base  | OAuth2 + JWT roles; `/healthz`; OTel basic         |
| R1     | Ingesta         | `/upload`; límites ingesta; metadatos              |
| R2     | Planner inicial | `/plan`; `/draft_section`; `global_summary` update |
| R3     | Editor & Export | Action Palette; Outline Pane; Export queue         |
| R4     | Versionado      | Snapshots; Diff Viewer; WORM log                   |
| R5     | Seguridad adv.  | CredentialStore; TLS off‑load; GDPR erase          |
| R6     | Operación & HA  | Backups cifrados; panel métricas; escalado HPA     |

*Automation CI: ≥ 80 % KPIs + pruebas E2E.*
