Q1: ¿Que son los custom slash commands?

R1: Los custom slash commands son comandos personalizados que te permiten definir prompts frecuentemente utilizados como archivos Markdown que Claude Code puede ejecutar[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). Estos comandos se organizan por alcance (específicos del proyecto o personales) y soportan espacios de nombres a través de estructuras de directorios[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands).

## Características principales

Los custom slash commands funcionan con la sintaxis `/<command-name> [arguments]`[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands) y ofrecen varias funcionalidades:

### Ubicaciones de archivos

* **Comandos del proyecto** : `.claude/commands/` - Disponibles solo en el proyecto actual[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* **Comandos personales** : `~/.claude/commands/` - Disponibles en todos tus proyectos[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### Argumentos dinámicos

Puedes pasar valores dinámicos a los comandos usando marcadores de posición para argumentos[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

* **Todos los argumentos con `$ARGUMENTS`** : Captura todos los argumentos pasados al comando[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* **Argumentos individuales con `$1`, `$2`, etc.** : Accede a argumentos específicos individualmente[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### Organización con espacios de nombres

Los comandos se pueden organizar en subdirectorios para mejor estructura[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). Los subdirectorios se usan para organización y aparecen en la descripción del comando, pero no afectan el nombre del comando en sí[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands).

## Ejemplos de uso

Para crear un comando personalizado del proyecto[(2)](https://docs.claude.com/en/docs/claude-code/common-workflows#create-custom-slash-commands):

```
mkdir -p .claude/commands
echo "Analyze the performance of this code and suggest three specific optimizations:" > .claude/commands/optimize.md
```

[(2)](https://docs.claude.com/en/docs/claude-code/common-workflows#create-custom-slash-commands)

Luego puedes usar tu comando personalizado en Claude Code[(2)](https://docs.claude.com/en/docs/claude-code/common-workflows#create-custom-slash-commands):

```
> /optimize
```

[(2)](https://docs.claude.com/en/docs/claude-code/common-workflows#create-custom-slash-commands)

Para comandos con argumentos, puedes crear un archivo con el marcador `$ARGUMENTS`[(2)](https://docs.claude.com/en/docs/claude-code/common-workflows#create-custom-slash-commands):

```
echo 'Find and fix issue #$ARGUMENTS. Follow these steps: 1. Understand the issue described in the ticket 2. Locate the relevant code in our codebase 3. Implement a solution that addresses the root cause 4. Add appropriate tests 5. Prepare a concise PR description' > .claude/commands/fix-issue.md
```

[(2)](https://docs.claude.com/en/docs/claude-code/common-workflows#create-custom-slash-commands)

Los custom slash commands son especialmente útiles para flujos de trabajo repetitivos como bucles de depuración, análisis de logs, y otras tareas de desarrollo[(3)](https://www.anthropic.com/engineering/claude-code-best-practices)[(4)](https://www.anthropic.com/engineering/claude-code-best-practices).

Sources:

1. https://docs.claude.com/en/docs/claude-code/slash-commands
2. https://docs.claude.com/en/docs/claude-code/common-workflows
3. https://www.anthropic.com/engineering/claude-code-best-practices

---

Q2: ¿existe una forma adecuada de redacción para los custom slash commands?

R2: Sí, existe una forma adecuada de redacción para los custom slash commands que incluye tanto la estructura del archivo como mejores prácticas para su contenido.

## Estructura del archivo

Los custom slash commands se definen como archivos Markdown donde[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

* El nombre del archivo (sin la extensión `.md`) se convierte en el nombre del comando[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* El contenido del archivo define qué hace el comando[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* El frontmatter YAML opcional proporciona configuración[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

## Frontmatter para configuración

Los archivos de comandos soportan frontmatter para especificar metadatos sobre el comando[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

| Frontmatter       | Propósito                                      | Por defecto                      |
| ----------------- | ----------------------------------------------- | -------------------------------- |
| `allowed-tools` | Lista de herramientas que el comando puede usar | Hereda de la conversación       |
| `argument-hint` | Los argumentos esperados para el comando slash  | Ninguno                          |
| `description`   | Descripción breve del comando                  | Usa la primera línea del prompt |
| `model`         | Cadena de modelo específica                    | Hereda de la conversación       |

## Ejemplos de redacción adecuada

### Comando básico

Para crear un comando de revisión de seguridad[(2)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands):

```
---
allowed-tools: Read, Grep, Glob
description: Run security vulnerability scan
model: claude-3-5-sonnet-20241022
---

Analyze the codebase for security vulnerabilities including:
- SQL injection risks
- XSS vulnerabilities
- Exposed credentials
- Insecure configurations
```

[(2)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands)

### Comando con argumentos

Para un comando que arregla issues de GitHub[(3)](https://www.anthropic.com/engineering/claude-code-best-practices):

```
Please analyze and fix the GitHub issue: $ARGUMENTS.
Follow these steps:
1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR
Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
```

[(3)](https://www.anthropic.com/engineering/claude-code-best-practices)

### Comando con ejecución de bash

Para un comando de commit de git[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Based on the above changes, create a single git commit.
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

## Mejores prácticas de redacción

### 1. Instrucciones claras y específicas

Los comandos deben proporcionar instrucciones paso a paso claras para que Claude sepa exactamente qué hacer[(3)](https://www.anthropic.com/engineering/claude-code-best-practices).

### 2. Uso de argumentos

* Usa `$ARGUMENTS` para capturar todos los argumentos[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* Usa `$1`, `$2`, etc. para argumentos específicos individuales[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* Incluye `argument-hint` en el frontmatter para mostrar qué argumentos se esperan[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### 3. Referencias a archivos

Incluye contenido de archivos usando el prefijo `@`[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```
# Reference a specific file
Review the implementation in @src/utils/helpers.js

# Reference multiple files
Compare @src/old-version.js with @src/new-version.js
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### 4. Modo de pensamiento extendido

Los comandos slash pueden activar el pensamiento extendido incluyendo palabras clave de pensamiento extendido[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands).

### 5. Herramientas permitidas

Especifica las herramientas que el comando puede usar en el frontmatter usando `allowed-tools`[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). Esto es especialmente importante para comandos que necesitan ejecutar bash o acceder a archivos específicos.

La redacción adecuada asegura que los comandos sean predecibles, reutilizables y fáciles de mantener para tu equipo[(3)](https://www.anthropic.com/engineering/claude-code-best-practices).

Sources:

1. https://docs.claude.com/en/docs/claude-code/slash-commands
2. https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands
3. https://www.anthropic.com/engineering/claude-code-best-practices

---

Q3: ¿que no pueden hacer los Custom slash commands (csc)?, que evitar hacer, para no caer en alucinaciones o cosas similares, y delimitar correctamente las capacidades de csc, y fuentes que se actualicen con el tiempo para estar enterado de las actualizaciones o mejoras que pueda recibir los csc

R3: Based on the documentation, here are the key limitations and issues to be aware of with custom slash commands:

## Limitaciones actuales de los CSC

### 1. Problemas de comportamiento impredecible

Los custom slash commands pueden comportarse de manera impredecible comparado con simplemente pegar un prompt formateado[(1)](https://github.com/anthropics/claude-code/issues/1048). Los usuarios han reportado que Claude ignora el comando y comienza a implementar la solicitud en lugar de seguir las instrucciones del comando[(1)](https://github.com/anthropics/claude-code/issues/1048).

### 2. Problemas con permisos de Bash

Los custom slash commands que ejecutan scripts de bash no pueden solicitar permisos del usuario correctamente[(2)](https://github.com/anthropics/claude-code/issues/3662). Específicamente:

* Los comandos que usan la sintaxis `!` para ejecutar comandos shell necesitan permisos de Bash[(2)](https://github.com/anthropics/claude-code/issues/3662)
* El prompt de permisos no aparece cuando un custom slash command es lo primero que necesita acceso a Bash en una sesión[(2)](https://github.com/anthropics/claude-code/issues/3662)
* Debes agregar `allowed-tools: Bash` en el frontmatter para comandos que ejecuten scripts[(2)](https://github.com/anthropics/claude-code/issues/3662)

### 3. Limitaciones de herramientas

Los custom slash commands están limitados por las herramientas especificadas en el frontmatter `allowed-tools`[(3)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands). Si omites este campo, el comando hereda todas las herramientas disponibles, pero si lo especificas, el comando solo puede usar las herramientas listadas[(3)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands).

### 4. No están expuestos como herramientas para subagentes

Actualmente, los custom slash commands no están disponibles como herramientas que los subagentes puedan usar[(4)](https://github.com/anthropics/claude-code/issues/5624). Esto significa que debes duplicar la lógica en los archivos de definición de subagentes, creando problemas de mantenimiento[(4)](https://github.com/anthropics/claude-code/issues/5624).

## Qué evitar para prevenir problemas

### 1. Evitar comandos sin frontmatter adecuado

Siempre especifica el frontmatter necesario, especialmente:

```markdown
---
allowed-tools: Bash
description: Check Claude Code phone notification status
---
```

[(2)](https://github.com/anthropics/claude-code/issues/3662)

### 2. No confiar únicamente en CSC para tareas críticas

Dado los problemas de comportamiento impredecible reportados[(1)](https://github.com/anthropics/claude-code/issues/1048), considera tener alternativas como prompts formateados tradicionales para tareas críticas.

### 3. Evitar comandos complejos sin pruebas

Los custom slash commands pueden fallar silenciosamente o no ejecutarse correctamente[(2)](https://github.com/anthropics/claude-code/issues/3662), por lo que es importante probar comandos complejos antes de depender de ellos.

## Diferencias con funcionalidades relacionadas

### CSC vs. CLAUDE.md vs. --append-system-prompt

Los output styles "apagan" completamente las partes del prompt del sistema por defecto de Claude Code específicas para ingeniería de software[(5)](https://docs.claude.com/en/docs/claude-code/output-styles#comparisons-to-related-features). Ni CLAUDE.md ni `--append-system-prompt` editan el prompt del sistema por defecto de Claude Code[(5)](https://docs.claude.com/en/docs/claude-code/output-styles#comparisons-to-related-features).

### CSC vs. Agentes

Los output styles afectan directamente el bucle del agente principal y solo afectan el prompt del sistema[(5)](https://docs.claude.com/en/docs/claude-code/output-styles#comparisons-to-related-features). Los agentes se invocan para manejar tareas específicas y pueden incluir configuraciones adicionales como el modelo a usar y las herramientas disponibles[(5)](https://docs.claude.com/en/docs/claude-code/output-styles#comparisons-to-related-features).

### CSC vs. Custom Slash Commands

Los output styles se pueden pensar como "prompts del sistema almacenados" y los custom slash commands como "prompts almacenados"[(5)](https://docs.claude.com/en/docs/claude-code/output-styles#comparisons-to-related-features).

## Fuentes para actualizaciones

Para mantenerte actualizado sobre mejoras y cambios en los CSC, puedes consultar:

1. **Documentación oficial de Claude Code** : [docs.claude.com](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)[(6)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
2. **Repositorio de GitHub de Claude Code** : Para issues y actualizaciones sobre bugs conocidos como los mencionados[(1)](https://github.com/anthropics/claude-code/issues/1048)[(2)](https://github.com/anthropics/claude-code/issues/3662)[(4)](https://github.com/anthropics/claude-code/issues/5624)
3. **Guías relacionadas en la documentación** :

* [Identity and Access Management](https://docs.claude.com/en/docs/claude-code/iam)[(6)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* [Interactive mode](https://docs.claude.com/en/docs/claude-code/interactive-mode)[(6)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* [CLI reference](https://docs.claude.com/en/docs/claude-code/cli-reference)[(6)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* [Settings](https://docs.claude.com/en/docs/claude-code/settings)[(6)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* [Memory management](https://docs.claude.com/en/docs/claude-code/memory)[(6)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

La documentación oficial es la fuente más confiable para obtener información actualizada sobre las capacidades y limitaciones de los custom slash commands.

---

Q4: ¿se puede monitorear si los CSC se estan ejecutando correctamente? o si es que hay un fallo, etc.

R4: Sí, existen varias formas de monitorear y diagnosticar problemas con los custom slash commands:

## Herramientas de monitoreo disponibles

### 1. Comando `/status`

El comando `/status` proporciona observabilidad sobre cualquier configuración de autenticación, proxy y URL aplicada[(1)](https://docs.claude.com/en/docs/claude-code/third-party-integrations#choosing-the-right-deployment-configuration). Esta es la herramienta principal para verificar el estado del sistema y detectar problemas de configuración.

### 2. Logs de depuración

Para obtener información detallada sobre las solicitudes, puedes habilitar logs de depuración configurando la variable de entorno[(1)](https://docs.claude.com/en/docs/claude-code/third-party-integrations#choosing-the-right-deployment-configuration):

```
export ANTHROPIC_LOG=debug
```

[(1)](https://docs.claude.com/en/docs/claude-code/third-party-integrations#choosing-the-right-deployment-configuration)

Esto registrará las solicitudes y te ayudará a identificar problemas en la ejecución de comandos.

### 3. Comando `/doctor`

El comando `/doctor` verifica la salud de tu instalación de Claude Code[(2)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). Este comando puede detectar problemas de configuración que podrían estar afectando el funcionamiento de los custom slash commands.

## Indicadores de problemas comunes

### 1. Comandos no reconocidos

Si los custom slash commands no aparecen en el autocompletado o no se ejecutan, esto puede indicar[(3)](https://github.com/anthropics/claude-code/issues/3662)[(4)](https://github.com/anthropics/claude-code/issues/2288):

* Problemas de ubicación de archivos (usar `~/.config/claude/commands` en lugar de `~/.claude/commands`)
* Problemas con la instalación de `ripgrep` (Claude Code depende de `rg` para encontrar comandos personalizados)

### 2. Errores de permisos

Los comandos que ejecutan bash pueden mostrar errores específicos como[(3)](https://github.com/anthropics/claude-code/issues/3662):

```
Error: Bash command permission check failed for pattern "!`~/.claude/bin/claude-phone-on`": Claude requested permissions to use Bash, but you haven't granted it yet.
```

[(3)](https://github.com/anthropics/claude-code/issues/3662)

### 3. Comportamiento impredecible

Los custom slash commands pueden[(3)](https://github.com/anthropics/claude-code/issues/3662):

* Mostrar "comando is running..." pero no producir salida
* Ignorar el comando y comenzar a buscar en el código base
* Generar respuestas no relacionadas con el comando

## Estrategias de diagnóstico

### 1. Verificación de configuración

Usa el comando `/permissions` para verificar y configurar permisos específicos[(3)](https://github.com/anthropics/claude-code/issues/3662):

```
Bash(~/.claude/bin/claude-phone-on)
```

[(3)](https://github.com/anthropics/claude-code/issues/3662)

### 2. Prueba de comandos básicos

Antes de ejecutar custom slash commands complejos, ejecuta comandos bash básicos como `ls` para establecer permisos[(3)](https://github.com/anthropics/claude-code/issues/3662).

### 3. Verificación de ubicación de archivos

Asegúrate de que los archivos estén en la ubicación correcta. Los usuarios han reportado que mover los comandos a `~/.config/claude/commands` resuelve problemas de detección[(4)](https://github.com/anthropics/claude-code/issues/2288).

### 4. Verificación de ripgrep

Si tienes `ripgrep` instalado de manera no estándar, puede causar problemas. Una solución es configurar[(4)](https://github.com/anthropics/claude-code/issues/2288):

```
"USE_BUILTIN_RIPGREP": 1
```

en `~/.claude/settings.json`.

## Limitaciones del monitoreo actual

### 1. Falta de logs específicos para CSC

La documentación no menciona logs específicos para el monitoreo de custom slash commands, lo que hace difícil diagnosticar problemas específicos.

### 2. Errores silenciosos

Los custom slash commands pueden fallar silenciosamente sin proporcionar retroalimentación clara sobre qué salió mal[(3)](https://github.com/anthropics/claude-code/issues/3662).

### 3. Problemas de prompt de permisos

Los comandos que necesitan permisos de bash pueden no mostrar el prompt de permisos correctamente, dejándote sin una forma clara de otorgar los permisos necesarios[(3)](https://github.com/anthropics/claude-code/issues/3662).

## Recomendaciones para monitoreo

1. **Usa `/status` regularmente** para verificar la configuración del sistema
2. **Habilita logs de depuración** cuando diagnostiques problemas
3. **Prueba comandos simples primero** antes de ejecutar comandos complejos
4. **Verifica permisos** usando `/permissions` cuando trabajas con comandos que ejecutan bash
5. **Mantente al día** con los issues reportados en el repositorio de GitHub para problemas conocidos

El monitoreo efectivo de los CSC requiere una combinación de estas herramientas y una comprensión de las limitaciones actuales del sistema.

---

Q5: ¿cuáles son las mejores prácticas para los CSC?

R5: Basándome en la documentación oficial y las mejores prácticas reportadas, aquí están las mejores prácticas para los custom slash commands (CSC):

## Estructura y organización

### 1. Organización de archivos

Organiza los comandos en subdirectorios para mejor estructura[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```
.claude/commands/
├── frontend/
│   ├── component.md      # Creates /component (project:frontend)
│   └── style-check.md     # Creates /style-check (project:frontend)
├── backend/
│   ├── api-test.md        # Creates /api-test (project:backend)
│   └── db-migrate.md      # Creates /db-migrate (project:backend)
└── review.md              # Creates /review (project)
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### 2. Uso de frontmatter adecuado

Siempre incluye frontmatter para especificar metadatos[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```markdown
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [message]
description: Create a git commit
model: claude-3-5-haiku-20241022
---

Create a git commit with message: $ARGUMENTS
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

## Mejores prácticas de contenido

### 3. Instrucciones claras y específicas

Los comandos deben proporcionar instrucciones paso a paso claras[(2)](https://www.anthropic.com/engineering/claude-code-best-practices). Por ejemplo:

```markdown
Please analyze and fix the GitHub issue: $ARGUMENTS.
Follow these steps:
1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR
Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
```

[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)

### 4. Uso efectivo de argumentos

Utiliza argumentos de manera estratégica[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

* **Para todos los argumentos** : Usa `$ARGUMENTS` para capturar todos los argumentos pasados[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* **Para argumentos específicos** : Usa `$1`, `$2`, etc. para acceder a argumentos individuales[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

Ejemplo con argumentos posicionales[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```markdown
---
argument-hint: [pr-number] [priority] [assignee]
description: Review pull request
---

Review PR #$1 with priority $2 and assign to $3.
Focus on security, performance, and code style.
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### 5. Referencias a archivos

Incluye contenido de archivos usando el prefijo `@`[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```markdown
# Reference a specific file
Review the implementation in @src/utils/helpers.js

# Reference multiple files
Compare @src/old-version.js with @src/new-version.js
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

## Comandos con ejecución de bash

### 6. Configuración correcta de herramientas

Para comandos que ejecutan bash, especifica las herramientas permitidas[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```markdown
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

## Context

- Current status: !`git status`
- Current diff: !`git diff HEAD`

## Task

Create a git commit with appropriate message based on the changes.
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### 7. Ejecución de comandos bash

Ejecuta comandos bash antes de que el comando slash se ejecute usando el prefijo `!`[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). La salida se incluye en el contexto del comando[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands).

## Ejemplos prácticos

### 8. Comando de revisión de código

Crea comandos para flujos de trabajo repetitivos[(3)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands):

```markdown
---
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
description: Comprehensive code review
---

## Changed Files

!`git diff --name-only HEAD~1`

## Detailed Changes
!`git diff HEAD~1`

## Review Checklist

Review the above changes for:
1. Code quality and readability
2. Security vulnerabilities
3. Performance implications
4. Test coverage
5. Documentation completeness

Provide specific, actionable feedback organized by priority.
```

[(3)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands)

### 9. Comando de pruebas

Para ejecutor de pruebas con patrones[(3)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands):

```markdown
---
allowed-tools: Bash, Read, Edit
argument-hint: [test-pattern]
description: Run tests with optional pattern
---

Run tests matching pattern: $ARGUMENTS

1. Detect the test framework (Jest, pytest, etc.)
2. Run tests with the provided pattern
3. If tests fail, analyze and fix them
4. Re-run to verify fixes
```

[(3)](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#creating-custom-slash-commands)

## Mejores prácticas de gestión

### 10. Comandos del equipo vs. personales

* **Comandos del proyecto** (`.claude/commands/`): Para comandos compartidos con el equipo[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)
* **Comandos personales** (`~/.claude/commands/`): Para comandos de uso personal[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

### 11. Documentación en CLAUDE.md

Documenta comandos frecuentemente utilizados en `CLAUDE.md`[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

```markdown
## Custom Commands

- `/optimize` - Analyze code performance and suggest optimizations
- `/fix-issue [number]` - Automatically fix GitHub issues
- `/security-review` - Run security vulnerability scan
```

[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)

### 12. Uso del marcador especial `$ARGUMENTS`

Para flujos de trabajo repetitivos, usa `$ARGUMENTS` para pasar parámetros[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

```markdown
Please analyze and fix the GitHub issue: $ARGUMENTS.
```

[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)

## Consejos adicionales

### 13. Modo de pensamiento extendido

Los comandos slash pueden activar el pensamiento extendido incluyendo palabras clave específicas[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). Esto proporciona tiempo de computación adicional para evaluaciones más profundas.

### 14. Verificación y control de versiones

* Incluye cambios de `CLAUDE.md` en commits para que los miembros del equipo se beneficien[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)
* Verifica los comandos en git para hacerlos disponibles para el resto del equipo[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)

### 15. Prueba antes de implementar

Dado los problemas reportados de comportamiento impredecible[(4)](https://github.com/anthropics/claude-code/issues/1048), siempre prueba los comandos antes de depender de ellos en flujos de trabajo críticos.

Estas mejores prácticas te ayudarán a crear custom slash commands más efectivos, mantenibles y confiables para tu equipo de desarrollo.

---

Q6: ¿Como funciona el modo de pensamiento extendido?

R6: El modo de pensamiento extendido (extended thinking) es una funcionalidad que permite a Claude procesar problemas complejos paso a paso, mejorando significativamente su rendimiento en tareas difíciles[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips). Esta capacidad le da a Claude la flexibilidad de elegir aplicar más o menos esfuerzo cognitivo dependiendo de la tarea[(2)](https://www.anthropic.com/research/visible-extended-thinking).

## Cómo funciona técnicamente

### Proceso de generación de contenido

Cuando el pensamiento extendido está activado, Claude crea bloques de contenido `thinking` donde genera su razonamiento interno[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking). La respuesta de la API incluye bloques `thinking` seguidos de bloques `text`[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking).

Aquí está el formato de respuesta por defecto[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking):

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...",
      "signature": "WaUjzkypQ2mUEVM36O2TxuC06KN8xyfbJwyem2dw3URve/op91XWHOEBLLqIOMfFG/UvLEczmEsUjavL...."
    },
    {
      "type": "text",
      "text": "Based on my analysis..."
    }
  ]
}
```

[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking)

### Modelos compatibles

El pensamiento extendido está disponible en los siguientes modelos[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking):

* Claude Opus 4.1 (`claude-opus-4-1-20250805`)
* Claude Opus 4 (`claude-opus-4-20250514`)
* Claude Sonnet 4 (`claude-sonnet-4-20250514`)
* Claude Sonnet 3.7 (`claude-3-7-sonnet-20250219`)

## Configuración y uso

### Presupuesto de tokens de pensamiento

Los tokens de pensamiento tienen un presupuesto mínimo de 1024 tokens[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips). Se recomienda comenzar con el presupuesto mínimo e incrementar gradualmente según las necesidades y complejidad de la tarea[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips).

Para cargas de trabajo donde el presupuesto óptimo está por encima de 32K tokens, se recomienda usar procesamiento por lotes para evitar problemas de red[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips).

### Rendimiento por idioma

El pensamiento extendido funciona mejor en inglés, aunque las salidas finales pueden estar en cualquier idioma que Claude soporte[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips).

### Alternativas para presupuestos menores

Si necesitas pensamiento por debajo del presupuesto mínimo, se recomienda usar el modo estándar con prompting tradicional de cadena de pensamiento usando etiquetas XML como `<thinking>`[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips).

## Técnicas de prompting efectivas

### 1. Instrucciones generales primero

Claude frecuentemente funciona mejor con instrucciones de alto nivel para pensar profundamente sobre una tarea, en lugar de guías prescriptivas paso a paso[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips).

En lugar de esto:

```
Think through this math problem step by step: 
1. First, identify the variables
2. Then, set up the equation
3. Next, solve for x
...
```

Considera esto:

```
Please think about this math problem thoroughly and in great detail. 
Consider multiple approaches and show your complete reasoning.
Try different methods if your first approach doesn't work.
```

[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips)

### 2. Prompting multishot

El prompting multishot funciona bien con pensamiento extendido[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips). Puedes incluir ejemplos usando etiquetas XML como `<thinking>` para indicar patrones de pensamiento extendido[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips):

```
I'm going to show you how to solve a math problem, then I want you to solve a similar one.

Problem 1: What is 15% of 80?

<thinking>
To find 15% of 80:
1. Convert 15% to a decimal: 15% = 0.15
2. Multiply: 0.15 × 80 = 12
</thinking>

The answer is 12.

Now solve this one:
Problem 2: What is 35% of 240?
```

[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips)

### 3. Palabras clave para activar pensamiento

En Claude Code, puedes usar palabras clave específicas para activar diferentes niveles de presupuesto de pensamiento[(4)](https://www.anthropic.com/engineering/claude-code-best-practices):

* "think" < "think hard" < "think harder" < "ultrathink"

Cada nivel asigna progresivamente más presupuesto de pensamiento para que Claude lo use[(4)](https://www.anthropic.com/engineering/claude-code-best-practices).

## Beneficios del pensamiento extendido

### Escalado de rendimiento

El rendimiento de Claude mejora logarítmicamente con el número de "tokens de pensamiento" que se le permite muestrear[(2)](https://www.anthropic.com/research/visible-extended-thinking). Por ejemplo, en el examen de matemáticas AIME 2024, la precisión aumenta según los tokens de pensamiento permitidos[(2)](https://www.anthropic.com/research/visible-extended-thinking).

### Capacidades agenticas mejoradas

Claude 3.7 Sonnet se beneficia del "escalado de acción" - una capacidad mejorada que le permite llamar funciones iterativamente, responder a cambios ambientales y continuar hasta completar una tarea abierta[(2)](https://www.anthropic.com/research/visible-extended-thinking).

### Mejora en seguimiento de instrucciones

Claude muestra un seguimiento de instrucciones significativamente mejorado cuando el pensamiento extendido está habilitado[(1)](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips). El modelo típicamente:

1. Razona sobre las instrucciones dentro del bloque de pensamiento extendido
2. Ejecuta esas instrucciones en la respuesta

## Escalado paralelo de cómputo en tiempo de prueba

Los investigadores también han experimentado con escalado de cómputo paralelo, muestreando múltiples procesos de pensamiento independientes y seleccionando el mejor[(2)](https://www.anthropic.com/research/visible-extended-thinking). Esto se puede hacer mediante:

* Votación por mayoría o consenso
* Uso de otro modelo de lenguaje para verificar el trabajo
* Funciones de puntuación aprendidas

En la evaluación GPQA, usando el equivalente de 256 muestras independientes, un modelo de puntuación aprendido y un presupuesto máximo de pensamiento de 64k tokens, Claude 3.7 Sonnet logró una puntuación de 84.8%[(2)](https://www.anthropic.com/research/visible-extended-thinking).

## Transparencia del proceso de pensamiento

### Beneficios de la visibilidad

El proceso de pensamiento visible ofrece varios beneficios[(2)](https://www.anthropic.com/research/visible-extended-thinking):

* **Confianza** : Observar cómo piensa Claude facilita entender y verificar sus respuestas
* **Alineación** : Ayuda a identificar comportamientos preocupantes como el engaño
* **Interés** : Es fascinante observar el proceso de razonamiento de Claude

### Limitaciones y consideraciones

El proceso de pensamiento visible también tiene desventajas[(2)](https://www.anthropic.com/research/visible-extended-thinking):

* El pensamiento revelado es más desapegado y menos personal que las salidas por defecto de Claude
* Problemas de "fidelidad" - no sabemos con certeza si lo que está en el proceso de pensamiento representa verdaderamente lo que ocurre en la mente del modelo
* Preocupaciones de seguridad - actores maliciosos podrían usar el proceso de pensamiento visible para desarrollar mejores estrategias de jailbreak

El pensamiento extendido representa un avance significativo en las capacidades de razonamiento de Claude, permitiendo un rendimiento superior en tareas complejas mientras proporciona transparencia en su proceso de toma de decisiones.

---

Q7: ¿como se vincula con los csc con el pensamiento extendido?

R7: Excelente pregunta. Los custom slash commands (CSC) se vinculan con el modo de pensamiento extendido de varias maneras específicas:

## Activación automática en CSC

### 1. Palabras clave para activar pensamiento

Los custom slash commands pueden activar el pensamiento extendido incluyendo palabras clave específicas de pensamiento extendido[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands). Estas palabras clave están mapeadas directamente a niveles crecientes de presupuesto de pensamiento en el sistema[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

* "think" < "think hard" < "think harder" < "ultrathink"

Cada nivel asigna progresivamente más presupuesto de pensamiento para que Claude lo use[(2)](https://www.anthropic.com/engineering/claude-code-best-practices).

### 2. Integración en el contenido del comando

Puedes incluir estas palabras clave directamente en el contenido de tu custom slash command para que automáticamente active el pensamiento extendido cuando se ejecute[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands):

```markdown
---
description: Complex architectural analysis
---

Think deeply about the best approach for implementing OAuth2 in our codebase.
Consider multiple approaches, security implications, and implementation complexity.
```

[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)

## Casos de uso recomendados

### 3. Flujo de trabajo "Explore, plan, code, commit"

En las mejores prácticas se recomienda usar pensamiento extendido específicamente en la fase de planificación[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

1. **Explorar** : Ask Claude to read relevant files, providing general pointers
2. **Planificar** :  **Ask Claude to make a plan for how to approach a specific problem** . Se recomienda usar la palabra "think" para activar el modo de pensamiento extendido, que le da a Claude tiempo de computación adicional para evaluar alternativas más profundamente[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)
3. **Implementar** : Ask Claude to implement its solution in code
4. **Commit** : Ask Claude to commit the result and create a pull request[(2)](https://www.anthropic.com/engineering/claude-code-best-practices)

### 4. Ejemplo práctico en CSC

Puedes crear un custom slash command específico para planificación que active pensamiento extendido[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

```markdown
---
description: Plan complex refactoring with extended thinking
---

Think hard about refactoring our authentication system to use OAuth2.
Create a detailed migration plan considering:
- Current implementation analysis
- Security implications  
- Backward compatibility
- Database migration requirements
- Testing strategy
```

## Configuración específica para CSC

### 5. Frontmatter para pensamiento extendido

Aunque la documentación no especifica un campo específico de frontmatter para pensamiento extendido en CSC, puedes controlarlo a través del contenido del comando usando las palabras clave mencionadas[(1)](https://docs.claude.com/en/docs/claude-code/slash-commands#custom-slash-commands)[(2)](https://www.anthropic.com/engineering/claude-code-best-practices).

### 6. Uso en comandos de análisis

Los CSC son especialmente efectivos para tareas complejas que se benefician del pensamiento extendido[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

```markdown
---
description: Deep code analysis with thinking
---

Think thoroughly about the architecture patterns used in this codebase.
Analyze the main components, their interactions, and suggest improvements.
Consider scalability, maintainability, and performance implications.
```

## Beneficios específicos en CSC

### 7. Mejor toma de decisiones

Cuando los CSC incluyen palabras clave de pensamiento, Claude puede[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

* Evaluar múltiples alternativas más profundamente
* Considerar implicaciones a largo plazo
* Proporcionar análisis más detallados antes de la implementación

### 8. Contexto preservado

El pensamiento extendido en CSC ayuda a mantener el contexto de decisiones complejas, especialmente útil para[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

* Planificación de refactorizaciones complejas
* Análisis de arquitectura
* Resolución de problemas técnicos complejos

## Limitaciones y consideraciones

### 9. Tiempo de ejecución

Los comandos con pensamiento extendido pueden tomar más tiempo en ejecutarse, especialmente con presupuestos de pensamiento más altos[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking#extended-thinking-with-prompt-caching). Considera usar la duración de caché de 1 hora para mantener hits de caché a través de sesiones de pensamiento más largas[(3)](https://docs.claude.com/en/docs/build-with-claude/extended-thinking#extended-thinking-with-prompt-caching).

### 10. Uso estratégico

No todos los CSC necesitan pensamiento extendido. Úsalo estratégicamente para[(2)](https://www.anthropic.com/engineering/claude-code-best-practices):

* Tareas de planificación compleja
* Análisis arquitectónico
* Resolución de problemas difíciles
* Evaluación de múltiples alternativas

## Ejemplo completo de CSC con pensamiento extendido

```markdown
---
description: Comprehensive security analysis with extended thinking
argument-hint: [component-name]
---

Think deeply and thoroughly about the security implications of the $ARGUMENTS component.

Analyze:
1. Current security measures
2. Potential vulnerabilities
3. Attack vectors
4. Mitigation strategies
5. Implementation recommendations

Consider both immediate and long-term security implications.
```

Esta integración hace que los CSC sean especialmente poderosos para tareas complejas que requieren análisis profundo y planificación cuidadosa, aprovechando las capacidades mejoradas de razonamiento que proporciona el pensamiento extendido.

---

Q8:

R8:

---

Q9:

R9:
