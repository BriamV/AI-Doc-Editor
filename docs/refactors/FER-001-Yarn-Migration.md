# REF-001: Unificación de Dependencias y Remediación de Vulnerabilidad

- **Fecha:** 2025-06-27
- **Estado:** Completado
- **Autor(es):** USER, Cascade

## 1. Contexto y Problema

El proyecto presentaba dos problemas críticos interrelacionados:

1.  **Vulnerabilidad de Seguridad:** Se detectó una vulnerabilidad de Cross-site Scripting (XSS) de severidad moderada en el paquete `quill` (< 1.3.7), una sub-dependencia de `react-quill`.
2.  **Gestión de Paquetes Inconsistente:** El proyecto utilizaba una mezcla de `npm` y `yarn` como gestores de paquetes. Esto resultaba en flujos de trabajo inconsistentes, el riesgo de conflictos entre [package-lock.json](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/node_modules/minipass-sized/package-lock.json:0:0-0:0) y `yarn.lock`, y dificultaba la aplicación de soluciones de seguridad de manera determinista.

## 2. Decisión y Estrategia de Solución

Se tomó la decisión de abordar ambos problemas de manera integral para asegurar una solución robusta y mantenible a largo plazo:

1.  **Estandarizar en un Único Gestor de Paquetes:** Se eligió **Yarn** como el único gestor de paquetes oficial para todo el proyecto.
2.  **Forzar Resolución de Dependencia:** Utilizar la funcionalidad `resolutions` de Yarn en [package.json](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/package.json:0:0-0:0) para forzar la instalación de una versión segura de `quill` (`2.0.2`), resolviendo la vulnerabilidad en su origen.
3.  **Auditoría y Refactorización Global:** Realizar una auditoría completa de todo el proyecto para identificar y reemplazar todos los comandos y configuraciones de `npm` con sus equivalentes de `yarn`.

## 3. Alcance del Trabajo y Cambios Implementados

El trabajo se ejecutó de manera meticulosa a través de todo el ecosistema del proyecto:

-   **[package.json](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/package.json:0:0-0:0):**
    -   Se eliminaron scripts y dependencias relacionadas con `npm` (ej. `npm-force-resolutions`).
    -   Se añadió el bloque `resolutions` para forzar `quill@2.0.2`.
    -   Se actualizó `react-quill` a una versión estable compatible con React 18.
    -   Se eliminó el archivo [package-lock.json](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/node_modules/minipass-sized/package-lock.json:0:0-0:0) para prevenir conflictos.

-   **Pipeline de CI/CD ([.github/workflows/ci.yml](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/.github/workflows/ci.yml:0:0-0:0)):**
    -   Se cambió la configuración de caché de `npm` a `yarn`.
    -   Se reemplazó `npm ci` por `yarn install --frozen-lockfile` para instalaciones deterministas.
    -   Se actualizaron todos los scripts (`npm run...`) y auditorías (`npm audit`) a sus equivalentes en `yarn`.

-   **Entornos Docker ([Dockerfile](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/Dockerfile:0:0-0:0) y [Dockerfile.dev](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/Dockerfile.dev:0:0-0:0)):**
    -   Se actualizaron todas las instrucciones de instalación de dependencias para usar `yarn`, asegurando la coherencia en los entornos de contenedor.

-   **Documentación Principal ([README.md](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/README.md:0:0-0:0), [Makefile](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/Makefile:0:0-0:0), [CLAUDE.md](cci:7://file:///d:/DELL_/Documents/GitHub/AI-Doc-Editor/CLAUDE.md:0:0-0:0)):**
    -   Se actualizaron todas las guías de instalación, comandos de desarrollo y scripts de automatización para reflejar el uso exclusivo de `yarn`.

-   **Documentación Extendida (Directorio `docs/`):**
    -   Se realizó una búsqueda global y se reemplazaron las referencias a `npm` en todos los Registros de Decisiones de Arquitectura (ADRs), guías de construcción, informes de estado y planes de trabajo.

## 4. Resultado Final

-   **Vulnerabilidad Resuelta:** La vulnerabilidad de XSS en `quill` ha sido **completamente remediada**. El comando `yarn audit` ahora se ejecuta sin advertencias de seguridad críticas.
-   **Consistencia y Mantenibilidad:** El proyecto está **100% estandarizado en Yarn**. Esto elimina la ambigüedad, simplifica el flujo de trabajo para los desarrolladores y reduce la deuda técnica.
-   **Robustez del Ecosistema:** Todo el ecosistema del proyecto, desde el desarrollo local hasta la integración continua y los entornos Docker, opera de manera coherente bajo un único y predecible sistema de gestión de dependencias.
