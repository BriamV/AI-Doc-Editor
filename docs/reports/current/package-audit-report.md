
---

# Informe de auditoría: `package.json`

## 1) Alcance

* Revisión integral de  **scripts** , **dependencias** y **config** relacionada (Electron, Vite, ESLint/TS, testing, seguridad, CI).
* Objetivo:  **estandarizar** ,  **eliminar redundancias** , **subir el listón de calidad** (coverage/seguridad), y  **cerrar incompatibilidades** .
* Fecha: 21/09/2025

---

## 2) Hallazgos críticos (rompen o degradan)

1. **Incompatibilidad Jest 30 ↔ ts-jest 29**
   * Riesgo: errores de compilación/transform, flaky builds.
   * Acción: **retirar `ts-jest`** y optar por:
     * **Vitest** (recomendado, alineado con Vite), o
     * **Jest 30 + @swc/jest** (mantiene ecosistema Jest).
2. **TypeScript 4.9.x insuficiente** con `@typescript-eslint@8` + ESLint 9
   * Riesgo: reglas que no corren, falsos positivos/negativos.
   * Acción: **subir TypeScript a `^5.6.x`** + actualizar `@types/*` y `@types/node`.
3. **Scripts desordenados y duplicados**
   * Riesgo: curva de aprendizaje, errores humanos, pipelines inconsistentes.
   * Acción: **namespaces normalizados** y **alias [DEPRECATED]** con mensaje de transición (30–60 días).

---

## 3) Cambios estructurales en scripts (no-código, criterios)

* **Namespaces canónicos** : `repo`, `fe`, `be`, `e2e`, `sec`, `qa`, `desk`, `docker`, `docs`, `all`.
* **Paridad FE/BE** :
* `fe:quality` y `be:quality` (format:check + lint + complejidad).
* `fe:check` y `be:check` (quality + tests).
* **Gate orquestado** : `qa:gate` agrega FE/BE, E2E y Seguridad.
* **E2E** :
* `e2e:fe` (Playwright) + `e2e:be` (pytest integración) + `e2e:all`.
* Cypress marcado como **deprecated** con redirección.
* **Seguridad** :
* `sec:sast` (Semgrep), `sec:deps:fe` (npm audit), `sec:deps:be` (pip-audit).
* `sec:secrets` (Gitleaks)  **opt-in** .
* `sec:all` como agregador.
* **Docs** : Redocly `docs:api:lint`, `docs:api:bundle`, `docs:api:preview`.
* **Agregadores** : `all:*` para setup/dev/lint/test/security/build/check/clean.
* **Compatibilidad** : alias con mensajes `[DEPRECATED]` (no romper flujos actuales).

> **Criterio de calidad** : ningún script debe solaparse; cada uno tiene objetivo único y se reutiliza vía agregadores.

---

## 4) Testing (decisión a tomar)

* **Opción A – Vitest (recomendada)**
  * Menor complejidad, integración nativa con Vite, ejecución rápida.
  * Requiere añadir `vitest`, `@vitest/coverage-v8`, `jsdom`.
  * Scripts FE `fe:test*` pasan a Vitest sin tocar Testing Library.
* **Opción B – Jest 30 + SWC**
  * Mantiene ecosistema Jest.
  * Requiere **retirar `ts-jest`** e **instalar `@swc/jest`** + `jest.config.mjs` con `transform`.

> **Criterio** : elegir **una** opción y aplicarla en todo el repo para evitar incoherencias en CI y métricas.

---

## 5) Cobertura y umbrales

* **Backend** : `--cov-fail-under=60` ya incluido (ajustable por política del equipo).
* **Frontend** :
* Vitest: configurar `coverage.threshold` en `vitest.config.ts` o usar target `fe:test:coverage:strict`.
* Jest: usar `--coverageThreshold` en script estricto.
* **Criterio** : establecer umbrales mínimos (p.ej., 60% inicial) y subirlos gradualmente.

---

## 6) Seguridad y cumplimiento

* **SAST (Semgrep)** y **auditorías de dependencias** FE/BE activas; **secret scanning** (Gitleaks) disponible.
* Reemplazar `audit:*` legacy por `sec:deps:*` para coherencia.
* **Criterio** : `sec:all` debe ejecutarse en PRs críticos y siempre en `main`/`release`.

---

## 7) Electron / Build

* Mantener `desk:run/pack/make`.
* **Evaluar** si se requiere `publish` en `electron-builder` para soportar **auto-update** con `electron-updater`.
* Iconografía y targets correctos; no se tocan artefactos (AppImage/NSIS).
* **Criterio** : si hay auto-update en producción, documentar `publish` (GitHub/AWS/etc.).

---

## 8) Documentación (API)

* Redocly **lint/bundle/preview** operativos.
* `traceability:*` y `governance` legacy quedan fuera (o migrar a ADRs/plantillas).
* **Criterio** : `docs:api:lint` obligatorio en PRs que cambien contratos.

---

## 9) Gobernanza del repo

* **Licencias** : `repo:licenses` activo.
* **Integridad de dependencias** : `repo:integrity` (`yarn dedupe --check`) para detectar drift.
* **Merge protection** : precheck/validate/hooks vigentes.
* **Criterio** : `all:check` debe incluir gate + licencias + integridad.

---

## 10) Dependencias y Tipos (compatibilidad)

* **Actualizar** :
* `typescript` → `^5.6.x`.
* `@types/node`, `@types/react`, `@types/react-dom` a ramas recientes.
* **Mantener** : `@vitejs/plugin-react-swc` (rápido, alineado con Vite 6).
* **ESLint 9** : considerar migrar a **flat config** (`eslint.config.js`) para futuras reglas TS.
* **Criterio** : evitar combinaciones “grises” (TS 4.9 + ESLint 9 + @typescript-eslint 8).

---

## 11) Resolutions/Parches y riesgos

* Existen **resolutions** (core-js, cacache, make-fetch-happen, glob, etc.) y **patches** a `@electron/get`.
* **Riesgo** : actualizaciones de transitive deps pueden chocar; la política de resolutions debe tener **dueño** y  **revisión trimestral** .
* **Criterio** : documentar por qué se fijó cada resolution/parche y cuándo se re-evalúa.

---

## 12) Engines / Node / PM

* Fijar `engines.node`: `>=18.20.0 || >=20.11.1` (alineado con Electron/Playwright modernos).
* Confirmar `packageManager: "yarn@4.5.1"` y políticas PnP (si se usa).
* **Criterio** : evitar “works on my machine” en CI.

---

## 13) CI/CD (flujo recomendado)

* **Local dev** : `yarn all:setup` → `yarn all:dev`.
* **Pre-PR** : `yarn all:check`.
* **CI** :
* Job principal: `yarn all:check`.
* Job de seguridad (si se separa): `yarn all:security`.
* Playwright en Linux: recordar `npx playwright install --with-deps`.
* **Release Desktop** : `yarn all:build` (FE build + `desk:make`).

---

## 14) Deprecación y transición

* Alias `[DEPRECATED]` activos con mensaje de redirección.
* **Criterio** : retirar alias tras **30–60 días** y bloquear PRs que los usen vía regla de lintern/CI.

---

## 15) Riesgos residuales

* Migración de test runner (Vitest/Jest+SWC) puede requerir pequeños ajustes en mocks/coverage.
* Subida de TS puede revelar tipos latentes (mejor exponerlos ahora).
* Resolutions fijos: riesgo de security drift si no se revisan periódicamente.

---

## 16) Aceptación (Definition of Done)

* PR que:
  1. Integra **UNA** de las dos rutas de testing (Vitest **o** Jest+SWC).
  2. Actualiza TS y `@types/*`.
  3. Sustituye el bloque de **scripts** por la versión estandarizada.
  4. Incluye `scriptsLegend` y fija `engines`.
  5. Hace pasar `yarn all:check` en CI (lint + tests + e2e + sec + licencias + integridad).
  6. Documenta en README el uso de comandos y la política de deprecación.

---

## 17) Checklist operativo

* [ ] Elegir runner: **Vitest** /  **Jest+SWC** .
* [ ] Subir **TypeScript → ^5.6.x** y `@types/*`.
* [ ] Sustituir **scripts** por los namespaces canónicos.
* [ ] Agregar `scriptsLegend`.
* [ ] Ajustar CI: `all:check` + (opcional) `all:security`.
* [ ] Validar Electron (¿auto-update/publish?).
* [ ] Definir umbrales de cobertura objetivo y fecha de incremento.
* [ ] Definir owner de **resolutions** y calendario de revisión.
* [ ] Plan de retirada de alias `[DEPRECATED]` en 30–60 días.

---

## 18) Recomendación de Package.json

> {
>
>   "name": "ai-doc-editor",
>   "private": true,
>   "version": "0.0.0",
>   "type": "module",
>   "homepage": "./",
>   "main": "electron/index.cjs",
>   "author": "BriamV <velasquezbriam@gmail.com>",
>   "description": "Open-source, AI-assisted word processor.",
>   "engines": {
>     "node": ">=18.20.0 || >=20.11.1"
>   },
>   "build": {
>     "appId": "aiDocEditor",
>     "productName": "AI Doc Editor",
>     "artifactName": "${os}-${name}-${version}-${arch}.${ext}",
>     "directories": {
>       "output": "release"
>     },
>     "dmg": {
>       "title": "${productName} ${version}",
>       "icon": "dist/icon-rounded.png"
>     },
>     "mac": {
>       "icon": "dist/icon-rounded.png"
>     },
>     "linux": {
>       "target": [
>         "tar.gz",
>         "AppImage"
>       ],
>       "category": "Chat",
>       "icon": "dist/icon-rounded.png"
>     },
>     "win": {
>       "target": "NSIS",
>       "icon": "dist/icon-rounded.png"
>     }
>   },
>   "scripts": {
>     "help": "node -e \"console.log('Namespaces: fe | be | e2e | sec | qa | repo | desk | docker | docs | all')\"",
>     "repo:install": "yarn install --immutable --check-cache",
>     "repo:clean": "rimraf dist build coverage .cache",
>     "repo:env:info": "node scripts/multiplatform.cjs info",
>     "repo:env:validate": "node scripts/multiplatform.cjs validate",
>     "repo:merge:precheck": "node scripts/merge-protection.cjs pre-merge-check",
>     "repo:merge:validate": "node scripts/merge-protection.cjs validate-merge --source HEAD --target main",
>     "repo:merge:hooks:install": "node scripts/install-merge-hooks.cjs install",
>     "repo:licenses": "license-checker-rseidelsohn --summary --production --development",
>     "repo:integrity": "yarn dedupe --check",
>     "fe:dev": "vite",
>     "fe:build": "vite build",
>     "fe:build:dev": "vite build --mode development",
>     "fe:build:prod": "vite build --mode production",
>     "fe:build:analyze": "vite build --mode analyze",
>     "fe:preview": "vite preview",
>     "fe:lint": "eslint \"src/**/*.{ts,tsx,js,jsx}\" --max-warnings=0",
>     "fe:lint:fix": "eslint \"src/**/*.{ts,tsx,js,jsx}\" --max-warnings=0 --fix",
>     "fe:format": "prettier --write \"{src,scripts}/**/*.{ts,tsx,js,jsx,cjs,mjs,css,scss,md,json,yml,yaml}\"",
>     "fe:format:check": "prettier --check \"{src,scripts}/**/*.{ts,tsx,js,jsx,cjs,mjs,css,scss,md,json,yml,yaml}\"",
>     "fe:typecheck": "tsc --noEmit",
>     "fe:test": "vitest run",
>     "fe:test:watch": "vitest",
>     "fe:test:coverage": "vitest run --coverage",
>     "fe:test:coverage:strict": "vitest run --coverage",
>     "fe:quality": "yarn fe:format:check && yarn fe:lint && yarn fe:typecheck",
>     "fe:check": "yarn fe:quality && yarn fe:test",
>     "be:install": "node scripts/multiplatform.cjs python -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt",
>     "be:bootstrap": "node scripts/multiplatform.cjs bootstrap",
>     "be:dev": "node scripts/multiplatform.cjs dev",
>     "be:format": "node scripts/multiplatform.cjs tool black backend --line-length=100",
>     "be:format:check": "node scripts/multiplatform.cjs tool black --check --diff --line-length=100 backend",
>     "be:lint": "node scripts/multiplatform.cjs tool ruff check backend --output-format=github",
>     "be:lint:fix": "node scripts/multiplatform.cjs tool ruff check backend --fix",
>     "be:complexity": "node scripts/python-cc-gate.cjs",
>     "be:test": "node scripts/multiplatform.cjs tool pytest backend/tests --tb=short --no-header -v",
>     "be:test:watch": "node scripts/multiplatform.cjs tool pytest backend/tests --tb=short --no-header -v -f",
>     "be:test:coverage": "node scripts/multiplatform.cjs tool pytest backend/tests --tb=short --no-header -v --cov=backend --cov-report=term-missing --cov-fail-under=60",
>     "be:test:integration": "node scripts/multiplatform.cjs tool pytest backend/tests/integration --tb=short --no-header -v",
>     "be:test:security": "node scripts/multiplatform.cjs tool pytest backend/tests/security --tb=short --no-header -v",
>     "be:test:t12": "node scripts/multiplatform.cjs tool pytest backend/tests/integration/test_complete_t12_integration.py backend/tests/integration/test_week1_week3_integration.py backend/tests/integration/test_week2_week3_integration.py --tb=short --no-header -v",
>     "be:test:contract": "node scripts/multiplatform.cjs tool schemathesis run api-spec.yaml --checks all",
>     "be:quality": "yarn be:format:check && yarn be:lint && yarn be:complexity",
>     "be:check": "yarn be:quality && yarn be:test",
>     "e2e:fe": "playwright test",
>     "e2e:fe:headed": "playwright test --headed",
>     "e2e:fe:debug": "playwright test --debug",
>     "e2e:fe:ui": "playwright test --ui",
>     "e2e:report": "playwright show-report",
>     "e2e:be": "node scripts/multiplatform.cjs tool pytest backend/tests/integration --tb=short --no-header -v",
>     "e2e:all": "yarn e2e:fe && yarn e2e:be",
>     "e2e:cypress:run": "echo \"[DEPRECATED] Usa Playwright (e2e:fe).\" && cypress run",
>     "e2e:cypress:open": "echo \"[DEPRECATED] Usa Playwright (e2e:fe:ui).\" && cypress open",
>     "sec:sast": "node scripts/multiplatform.cjs tool semgrep scan --config=auto .",
>     "sec:deps:fe": "yarn npm audit --all --recursive",
>     "sec:deps:fe:strict": "yarn npm audit --all --recursive --no-deprecations --severity high",
>     "sec:deps:be": "node scripts/multiplatform.cjs tool pip-audit -r backend/requirements.txt -r backend/requirements-dev.txt",
>     "sec:secrets": "node scripts/multiplatform.cjs tool gitleaks detect --no-banner --redact --verbose",
>     "sec:all": "yarn sec:sast && yarn sec:deps:fe && yarn sec:deps:be",
>     "qa:lint": "yarn fe:lint && yarn be:lint",
>     "qa:test": "yarn fe:test && yarn be:test && yarn be:test:integration",
>     "qa:coverage": "yarn fe:test:coverage && yarn be:test:coverage",
>     "qa:gate": "yarn fe:quality && yarn be:quality && yarn fe:test && yarn be:test && yarn e2e:all && yarn sec:all",
>     "desk:run": "electron .",
>     "desk:pack": "electron-builder",
>     "desk:make": "electron-builder --publish=never",
>     "docker:dev": "docker-compose -f docker-compose.dev.yml up",
>     "docker:prod": "docker-compose -f docker-compose.yml up",
>     "docker:backend": "docker-compose up api",
>     "docker:stop": "docker-compose down",
>     "docker:logs": "docker-compose logs -f",
>     "docs:api:lint": "redocly lint api-spec.yaml",
>     "docs:api:bundle": "redocly bundle api-spec.yaml -o dist/api-bundle.yaml",
>     "docs:api:preview": "redocly preview-docs api-spec.yaml",
>     "all:setup": "yarn repo:install && yarn be:install",
>     "all:dev": "concurrently -c auto \"yarn fe:dev\" \"yarn be:dev\"",
>     "all:lint": "yarn qa:lint",
>     "all:test": "yarn qa:test",
>     "all:security": "yarn sec:all",
>     "all:build": "yarn fe:build && yarn desk:make",
>     "all:check": "yarn qa:gate && yarn repo:licenses && yarn repo:integrity",
>     "all:clean": "yarn repo:clean",
>     "install:frozen": "echo \"[DEPRECATED] Usa: yarn repo:install\" && yarn repo:install",
>     "setup": "echo \"[DEPRECATED] Usa: yarn all:setup\" && yarn all:setup",
>     "dev": "echo \"[DEPRECATED] Usa: yarn all:dev\" && yarn all:dev",
>     "build": "echo \"[DEPRECATED] Usa: yarn fe:build (o fe:build:prod)\" && yarn fe:build",
>     "preview": "echo \"[DEPRECATED] Usa: yarn fe:preview\" && yarn fe:preview",
>     "test": "echo \"[DEPRECATED] Usa: yarn fe:test\" && yarn fe:test",
>     "test:watch": "echo \"[DEPRECATED] Usa: yarn fe:test:watch\" && yarn fe:test:watch",
>     "test:coverage": "echo \"[DEPRECATED] Usa: yarn fe:test:coverage\" && yarn fe:test:coverage",
>     "test:frontend": "echo \"[DEPRECATED] Usa: yarn fe:test\" && yarn fe:test",
>     "test:backend": "echo \"[DEPRECATED] Usa: yarn be:test\" && yarn be:test",
>     "test:backend:watch": "echo \"[DEPRECATED] Usa: yarn be:test:watch\" && yarn be:test:watch",
>     "test:backend:coverage": "echo \"[DEPRECATED] Usa: yarn be:test:coverage\" && yarn be:test:coverage",
>     "test:integration": "echo \"[DEPRECATED] Usa: yarn be:test:integration\" && yarn be:test:integration",
>     "test:security": "echo \"[DEPRECATED] Usa: yarn be:test:security\" && yarn be:test:security",
>     "test:t12": "echo \"[DEPRECATED] Usa: yarn be:test:t12\" && yarn be:test:t12",
>     "test:e2e": "echo \"[DEPRECATED] Usa: yarn e2e:fe\" && yarn e2e:fe",
>     "test:e2e:headed": "echo \"[DEPRECATED] Usa: yarn e2e:fe:headed\" && yarn e2e:fe:headed",
>     "test:e2e:debug": "echo \"[DEPRECATED] Usa: yarn e2e:fe:debug\" && yarn e2e:fe:debug",
>     "test:e2e:ui": "echo \"[DEPRECATED] Usa: yarn e2e:fe:ui\" && yarn e2e:fe:ui",
>     "test:e2e:report": "echo \"[DEPRECATED] Usa: yarn e2e:report\" && yarn e2e:report",
>     "test:playwright": "echo \"[DEPRECATED] Usa: yarn e2e:fe\" && yarn e2e:fe",
>     "test:playwright:headed": "echo \"[DEPRECATED] Usa: yarn e2e:fe:headed\" && yarn e2e:fe:headed",
>     "test:playwright:debug": "echo \"[DEPRECATED] Usa: yarn e2e:fe:debug\" && yarn e2e:fe:debug",
>     "test:playwright:ui": "echo \"[DEPRECATED] Usa: yarn e2e:fe:ui\" && yarn e2e:fe:ui",
>     "test:playwright:report": "echo \"[DEPRECATED] Usa: yarn e2e:report\" && yarn e2e:report",
>     "test:cypress": "echo \"[DEPRECATED] Usa: yarn e2e:cypress:run\" && yarn e2e:cypress:run",
>     "test:cypress:open": "echo \"[DEPRECATED] Usa: yarn e2e:cypress:open\" && yarn e2e:cypress:open",
>     "lint": "echo \"[DEPRECATED] Usa: yarn fe:lint\" && yarn fe:lint",
>     "lint:fix": "echo \"[DEPRECATED] Usa: yarn fe:lint:fix\" && yarn fe:lint:fix",
>     "format": "echo \"[DEPRECATED] Usa: yarn fe:format\" && yarn fe:format",
>     "format:check": "echo \"[DEPRECATED] Usa: yarn fe:format:check\" && yarn fe:format:check",
>     "tsc-check": "echo \"[DEPRECATED] Usa: yarn fe:typecheck\" && yarn fe:typecheck",
>     "merge-safety-full": "echo \"[DEPRECATED] Usa: yarn repo:merge:validate\" && yarn repo:merge:validate",
>     "pre-merge-check": "echo \"[DEPRECATED] Usa: yarn repo:merge:precheck\" && yarn repo:merge:precheck",
>     "install-merge-hooks": "echo \"[DEPRECATED] Usa: yarn repo:merge:hooks:install\" && yarn repo:merge:hooks:install",
>     "qa-gate": "echo \"[DEPRECATED] Usa: yarn qa:gate\" && yarn qa:gate",
>     "security-scan": "echo \"[DEPRECATED] Usa: yarn sec:all o yarn sec:sast\" && yarn sec:all",
>     "security-scan-full": "echo \"[DEPRECATED] Usa: yarn sec:all\" && yarn sec:all",
>     "quality-gate": "echo \"[DEPRECATED] Usa: yarn qa:gate\" && yarn qa:gate",
>     "python:install": "echo \"[DEPRECATED] Usa: yarn be:install\" && yarn be:install",
>     "python:bootstrap": "echo \"[DEPRECATED] Usa: yarn be:bootstrap\" && yarn be:bootstrap",
>     "python:dev": "echo \"[DEPRECATED] Usa: yarn be:dev\" && yarn be:dev",
>     "python-format": "echo \"[DEPRECATED] Usa: yarn be:format\" && yarn be:format",
>     "python-format:check": "echo \"[DEPRECATED] Usa: yarn be:format:check\" && yarn be:format:check",
>     "python-lint": "echo \"[DEPRECATED] Usa: yarn be:lint\" && yarn be:lint",
>     "python-lint:fix": "echo \"[DEPRECATED] Usa: yarn be:lint:fix\" && yarn be:lint:fix",
>     "python-complexity": "echo \"[DEPRECATED] Usa: yarn be:complexity\" && yarn be:complexity",
>     "python-quality": "echo \"[DEPRECATED] Usa: yarn be:quality\" && yarn be:quality",
>     "env-validate": "echo \"[DEPRECATED] Usa: yarn repo:env:validate\" && yarn repo:env:validate",
>     "env-info": "echo \"[DEPRECATED] Usa: yarn repo:env:info\" && yarn repo:env:info",
>     "audit": "echo \"[DEPRECATED] Usa: yarn sec:deps:fe\" && yarn sec:deps:fe",
>     "audit:fix": "echo \"[DEPRECATED] Usa: yarn sec:deps:fe\" && yarn sec:deps:fe",
>     "audit:critical": "echo \"[DEPRECATED] Usa: yarn sec:deps:fe:strict\" && yarn sec:deps:fe:strict",
>     "audit:moderate": "echo \"[DEPRECATED] Usa: yarn sec:deps:fe\" && yarn sec:deps:fe",
>     "electron": "echo \"[DEPRECATED] Usa: yarn desk:run\" && yarn desk:run",
>     "electron:pack": "echo \"[DEPRECATED] Usa: yarn desk:pack\" && yarn desk:pack",
>     "electron:make": "echo \"[DEPRECATED] Usa: yarn desk:make\" && yarn desk:make",
>     "api-spec": "echo \"[DEPRECATED] Usa: yarn docs:api:lint\" && yarn docs:api:lint",
>     "build:analyze": "echo \"[DEPRECATED] Usa: yarn fe:build:analyze\" && yarn fe:build:analyze",
>     "build:dev": "echo \"[DEPRECATED] Usa: yarn fe:build:dev\" && yarn fe:build:dev",
>     "build:env": "echo \"[DEPRECATED] Usa: yarn fe:build:prod\" && yarn fe:build:prod",
>     "build:docs": "echo \"[DEPRECATED] Usa: yarn docs:api:bundle\" && yarn docs:api:bundle",
>     "docker:dev": "echo \"[UNCHANGED] Sigue: yarn docker:dev\" && yarn docker:dev",
>     "docker:prod": "echo \"[UNCHANGED] Sigue: yarn docker:prod\" && yarn docker:prod",
>     "docker:backend": "echo \"[UNCHANGED] Sigue: yarn docker:backend\" && yarn docker:backend",
>     "docker:stop": "echo \"[UNCHANGED] Sigue: yarn docker:stop\" && yarn docker:stop",
>     "docker:logs": "echo \"[UNCHANGED] Sigue: yarn docker:logs\" && yarn docker:logs"
>   },
>   "scriptsLegend": {
>     "namespaces": {
>       "repo:*": "Infra del monorepo",
>       "fe:*": "Frontend (Vite/React/TS)",
>       "be:*": "Backend (Python)",
>       "e2e:*": "End-to-End",
>       "sec:*": "Seguridad",
>       "qa:*": "Quality gates",
>       "desk:*": "Electron",
>       "docker:*": "Docker Compose",
>       "docs:*": "API & docs",
>       "all:*": "Agregadores"
>     },
>     "recommendedFlows": {
>       "localDev": "yarn all:setup -> yarn all:dev",
>       "prePR": "yarn all:check",
>       "ciMain": "yarn all:check",
>       "releaseDesktop": "yarn all:build"
>     },
>     "coverageThresholds": {
>       "frontend": "Configurar en vitest.config.ts si se usa fe:test:coverage:strict",
>       "backend": "be:test:coverage usa --cov-fail-under=60 (ajustable)"
>     },
>     "deprecationPolicy": "Eliminar alias [DEPRECATED] en 30–60 días"
>   },
>   "dependencies": {
>     "@carbon/icons-react": "^11.21.0",
>     "@dqbd/tiktoken": "^1.0.2",
>     "@lexical/react": "^0.11.1",
>     "@react-oauth/google": "^0.9.0",
>     "bootstrap-icons": "^1.10.5",
>     "electron-is-dev": "^2.0.0",
>     "electron-squirrel-startup": "^1.0.0",
>     "electron-updater": "^6.6.8",
>     "exceljs": "^4.4.0",
>     "html2canvas": "^1.4.1",
>     "i18next": "^22.4.11",
>     "i18next-browser-languagedetector": "^7.0.1",
>     "i18next-http-backend": "^2.1.1",
>     "idb-keyval": "^6.2.1",
>     "jspdf": "^3.0.2",
>     "katex": "^0.16.4",
>     "lexical": "^0.11.1",
>     "lodash": "^4.17.21",
>     "match-sorter": "^8.1.0",
>     "papaparse": "^5.4.1",
>     "react": "^18.2.0",
>     "react-dom": "^18.2.0",
>     "react-faq-component": "^1.3.4",
>     "react-i18next": "^12.2.0",
>     "react-markdown": "^8.0.5",
>     "react-router-dom": "^7.9.1",
>     "react-svg": "^16.1.16",
>     "rehype-highlight": "^6.0.0",
>     "rehype-katex": "^6.0.2",
>     "remark-gfm": "^3.0.1",
>     "remark-math": "^5.1.1",
>     "uuid": "^9.0.0",
>     "yjs": "^13.6.6",
>     "zustand": "^4.3.6"
>   },
>   "devDependencies": {
>     "@babel/core": "^7.28.0",
>     "@babel/preset-env": "^7.28.3",
>     "@babel/preset-typescript": "^7.27.1",
>     "@eslint/js": "^9.29.0",
>     "@playwright/test": "^1.55.0",
>     "@redocly/cli": "^1.34.3",
>     "@swc/cli": "^0.7.7",
>     "@swc/core": "^1.4.2",
>     "@tailwindcss/typography": "^0.5.9",
>     "@testing-library/dom": "^10.4.0",
>     "@testing-library/jest-dom": "^6.6.3",
>     "@testing-library/react": "^16.3.0",
>     "@testing-library/user-event": "^14.6.1",
>     "@types/babel__core": "^7",
>     "@types/carbon-components-react": "^7.55.5",
>     "@types/lodash": "^4.14.194",
>     "@types/node": "^20.14.10",
>     "@types/papaparse": "^5.3.7",
>     "@types/react": "^18.3.3",
>     "@types/react-dom": "^18.3.0",
>     "@types/uuid": "^9.0.1",
>     "@typescript-eslint/eslint-plugin": "^8.35.0",
>     "@typescript-eslint/parser": "^8.35.0",
>     "@vitejs/plugin-react-swc": "^3.0.0",
>     "ajv": "^8.17.1",
>     "autoprefixer": "^10.4.13",
>     "babel-plugin-transform-inline-environment-variables": "^0.4.4",
>     "concurrently": "^9.2.1",
>     "electron": "^38.1.0",
>     "electron-builder": "^26.0.12",
>     "electron-builder-squirrel-windows": "^26.0.12",
>     "eslint": "^9.29.0",
>     "eslint-config-prettier": "^10.1.5",
>     "eslint-plugin-prettier": "^5.5.1",
>     "eslint-plugin-react": "^7.37.5",
>     "eslint-plugin-react-hooks": "^5.2.0",
>     "eslint-plugin-react-refresh": "^0.4.20",
>     "eslint-plugin-security": "^3.0.1",
>     "globals": "^16.2.0",
>     "jsdom": "^24.1.0",
>     "license-checker-rseidelsohn": "^4.4.2",
>     "postcss": "^8.4.21",
>     "prettier": "^3.6.1",
>     "prop-types": "^15.8.1",
>     "rimraf": "^5.0.10",
>     "tailwindcss": "^3.2.7",
>     "typescript": "^5.6.3",
>     "vite": "^6.3.5",
>     "vite-plugin-top-level-await": "^1.3.0",
>     "vite-plugin-wasm": "^3.2.2",
>     "vitest": "^2.0.5",
>     "@vitest/coverage-v8": "^2.0.5",
>     "wait-on": "^8.0.5"
>   },
>   "optionalDependencies": {
>     "@swc/core-darwin-arm64": "^1.4.2",
>     "@swc/core-darwin-x64": "^1.4.2",
>     "@swc/core-linux-arm-gnueabihf": "^1.4.2",
>     "@swc/core-linux-arm64-gnu": "^1.4.2",
>     "@swc/core-linux-arm64-musl": "^1.4.2",
>     "@swc/core-linux-x64-gnu": "^1.4.2",
>     "@swc/core-linux-x64-musl": "^1.4.2",
>     "@swc/core-win32-arm64-msvc": "^1.4.2",
>     "@swc/core-win32-ia32-msvc": "^1.4.2",
>     "@swc/core-win32-x64-msvc": "^1.4.2"
>   },
>   "resolutions": {
>     "axios": "^1.8.2",
>     "minimatch": "^7.4.6",
>     "form-data": "^4.0.4",
>     "tmp": "^0.2.4",
>     "@eslint/plugin-kit": "^0.3.4",
>     "@babel/runtime-corejs3": "^7.28.4",
>     "core-js": "^3.39.1",
>     "core-js-pure": "^3.39.1",
>     "make-fetch-happen": "^15.0.1",
>     "cacache": "^20.0.1",
>     "glob": "^11.0.3",
>     "rimraf": "^5.0.10",
>     "@npmcli/move-file": "^3.0.0",
>     "test-exclude": "^7.0.1",
>     "@electron/get@npm:^2.0.0": "patch:@electron/get@npm:2.0.3#./.yarn/patches/@electron-get-npm-2.0.3-d576982a3c.patch",
>     "@electron/get@npm:2.0.3": "patch:@electron/get@npm:2.0.3#./.yarn/patches/@electron-get-npm-2.0.3-d576982a3c.patch",
>     "@electron/get": "patch:@electron/get@npm:2.0.3#./.yarn/patches/@electron-get-npm-2.0.3-d576982a3c.patch"
>   },
>   "packageManager": "yarn@4.5.1"
> }
