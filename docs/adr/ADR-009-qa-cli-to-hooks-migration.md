# ADR-009: Migración de qa-cli a Git Hooks para Quality Assurance

## Estado
Aceptado

## Contexto
El proyecto actualmente utiliza un sistema de commands basado en `scripts/commands/qa.cjs` ejecutados mediante `yarn run cmd qa-gate` para el control de calidad. Sin embargo, la implementación actual de hooks en `.claude/hooks.json` proporciona una alternativa más eficiente y automatizada que se ejecuta automáticamente en el flujo de desarrollo.

### Situación Actual
- **qa-cli commands**: `yarn run cmd qa-gate|validate-task|security-scan|governance`
- **Dependencias identificadas**: 
  - CLAUDE.md: 8 referencias a qa-cli commands
  - tools/qa-workflow.sh: 2 referencias (`governance`)
  - tools/validate-dod.sh: 2 referencias (`validate-task`, `security-scan`)

### Problemas del Sistema Actual
1. **Ejecución Manual**: Los desarrolladores deben recordar ejecutar `yarn run cmd qa-gate`
2. **Inconsistencia**: No hay garantía de que se ejecuten las validaciones antes del commit
3. **Redundancia**: Duplicación entre hooks y qa-cli commands
4. **Complejidad**: Mantener dos sistemas de validación paralelos

## Decisión
Migrar completamente el workflow de QA de qa-cli commands a Git Hooks como mecanismo primario, eliminando la dependencia de comandos manuales y automatizando el proceso de quality assurance.

### Principios de la Migración
1. **Automatización First**: Los hooks se ejecutan automáticamente en `git commit`
2. **Zero-Config**: No requiere comandos adicionales del desarrollador
3. **Fail-Fast**: Validación inmediata antes del commit
4. **Backward Compatibility**: Migración gradual manteniendo funcionalidad

## Consecuencias

### Positivas
- ✅ **Automatización Completa**: QA automático sin intervención manual
- ✅ **Consistencia Garantizada**: Cada commit pasa por validación
- ✅ **Mejor DX**: Desarrollador no necesita recordar comandos
- ✅ **Integración con Claude**: `.claude/hooks.json` optimizado para workflow con Claude
- ✅ **Rendimiento**: Hooks más rápidos que scripts Node.js
- ✅ **Menos Dependencias**: Eliminar scripts/commands/qa.cjs
- ✅ **100 chars per line**: Implementación de DESIGN_GUIDELINES.md métricas

### Negativas
- ⚠️ **Migración de Documentación**: Actualizar CLAUDE.md y workflows
- ⚠️ **Learning Curve**: Desarrolladores acostumbrados a qa-cli commands
- ⚠️ **Debugging**: Hooks pueden ser menos visibles que comandos explícitos

### Neutras
- ℹ️ **Herramientas tools/**: Scripts actuales siguen funcionando con actualizaciones menores

## Plan de Implementación

### Fase 1: Preparación (CURRENT)
- [x] Análisis completo de dependencias qa-cli
- [x] Identificación de scripts afectados
- [x] Creación de este ADR

### Fase 2: Migración Documental
- [ ] Actualizar CLAUDE.md: Cambiar workflow primario de qa-cli a hooks
- [ ] Actualizar tools/qa-workflow.sh: Eliminar llamadas a `yarn run cmd governance`
- [ ] Actualizar tools/validate-dod.sh: Eliminar llamadas a qa-cli commands
- [ ] Verificar que `.claude/hooks.json` incluye validación de 100 caracteres

### Fase 3: Validación
- [ ] Probar workflow completo con hooks
- [ ] Validar que todas las métricas de calidad se mantienen
- [ ] Verificar que tools/ scripts funcionan correctamente

### Fase 4: Finalización
- [ ] Eliminar scripts/commands/qa.cjs (opcional)
- [ ] Actualizar documentación adicional
- [ ] Comunicar cambio al equipo

## Mappings de Migración

| **Comando qa-cli Anterior** | **Nuevo Mecanismo** | **Trigger** |
|:---|:---|:---|
| `yarn run cmd qa-gate` | `.claude/hooks.json` | `git commit` |
| `yarn run cmd validate-task` | `pre-commit` hooks | Automático |
| `yarn run cmd security-scan` | Security hooks | Pre-commit |
| `yarn run cmd governance` | `post-commit` hooks | Post-commit |
| `yarn run cmd lint` | ESLint hook | Pre-commit |
| `yarn run cmd format` | Prettier hook | Pre-commit |

## Comando de Migración Rápida

Para desarrolladores que necesiten el comando anterior temporalmente:
```bash
# En lugar de: yarn run cmd qa-gate
# Usar: git commit (hooks automáticos)

# Para validación manual (temporal):
npx eslint . && npx prettier --check . && echo "✅ Manual QA passed"
```

## Referencias
- `.claude/hooks.json` - Configuración actual de hooks
- `CLAUDE.md` - Workflow documentation (REQUIERE ACTUALIZACIÓN)  
- `docs/DESIGN_GUIDELINES.md` - Métricas de calidad (100 chars per line)
- `tools/README.md` - Development tools documentation

## Notas de Implementación
- **Preservar Funcionalidad**: Todos los checks de qa-cli deben estar cubiertos por hooks
- **Validación de Líneas**: Implementar restricción de 100 caracteres según DESIGN_GUIDELINES.md
- **Mantenimiento**: Los scripts tools/ se mantienen pero con llamadas actualizadas
- **Rollback Plan**: En caso de problemas, los comandos qa-cli permanecen disponibles hasta confirmación completa

---
*ADR creado el 2025-08-13 como parte de la migración sistemática hacia git hooks automatizado.*