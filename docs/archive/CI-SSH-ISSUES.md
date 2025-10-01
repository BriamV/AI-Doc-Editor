# Solución a problemas de autenticación SSH en CI

Este documento describe la solución implementada para resolver los problemas de autenticación SSH en los workflows de GitHub Actions, específicamente relacionados con dependencias como `electron/node-gyp`.

## Problema

Durante la ejecución de los workflows de CI/CD, se producían errores de autenticación SSH al intentar clonar dependencias desde repositorios Git, principalmente:

```
fatal: Could not read from remote repository.
Please make sure you have the correct access rights and the repository exists.
```

El problema ocurría porque el archivo `yarn.lock` contenía referencias a URLs SSH (`git+ssh://git@github.com/electron/node-gyp.git`) para ciertas dependencias, y GitHub Actions no tiene configurada la autenticación SSH necesaria.

## Solución implementada

La solución se basa en una estrategia robusta para asegurar que todas las dependencias utilicen HTTPS en lugar de SSH:

### 1. Configuración de Git

Se configuró Git globalmente para reescribir todas las URLs SSH a HTTPS:

```bash
git config --global url."https://github.com/".insteadOf "git@github.com:"
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
git config --global url."https://github.com/".insteadOf "git+ssh://git@github.com/"
```

### 2. Variables de entorno críticas

Se establecieron variables de entorno para evitar prompts y forzar el uso de HTTPS:

```bash
GIT_TERMINAL_PROMPT=0
npm_config_registry=https://registry.npmjs.org/
ELECTRON_GET_USE_PROXY=1
ELECTRON_MIRROR=https://github.com/electron/electron/releases/download/
```

### 3. Configuración de .npmrc para CI

Se creó un archivo `.npmrc` específico para CI con configuraciones optimizadas:

```
registry=https://registry.npmjs.org/
@electron:registry=https://registry.npmjs.org/
node-gyp:registry=https://registry.npmjs.org/
strict-ssl=true
```

### 4. Regeneración de yarn.lock

La estrategia no modifica manualmente el archivo `yarn.lock` (práctica incorrecta), sino que lo regenera cuando es necesario:

```bash
# Limpiar el caché para eliminar referencias problemáticas
yarn cache clean

# Regenerar yarn.lock cuando hay cambios
yarn install --network-timeout 600000 --update-checksums
```

## Verificación de la solución

Para verificar que la solución esté aplicada correctamente:

1. Comprobar que no existan referencias SSH en yarn.lock:
   ```bash
   Select-String -Path yarn.lock -Pattern "git\+ssh://"
   ```

2. Verificar que las referencias a electron/node-gyp usen HTTPS:
   ```bash
   Select-String -Path yarn.lock -Pattern "electron/node-gyp"
   # Debe mostrar urls con https:// y no ssh://
   ```

3. Validar que los workflows de CI pasen sin errores de autenticación SSH.

## Configuración local recomendada

Para desarrolladores locales, especialmente si experimentan problemas similares:

1. Configurar Git para usar HTTPS en lugar de SSH:
   ```bash
   git config --global url."https://github.com/".insteadOf "git@github.com:"
   ```

2. Regenerar limpiamente el archivo yarn.lock:
   ```bash
   $env:npm_config_registry="https://registry.npmjs.org/"
   yarn cache clean
   yarn install --registry=https://registry.npmjs.org/
   ```

## Referencias

- [Problema documentado en Yarn](https://github.com/yarnpkg/yarn/issues/5353)
- [Mejores prácticas para manejo de dependencias en CI](https://github.blog/2023-04-19-a-beginners-guide-to-ci-cd-and-automation-on-github/)
