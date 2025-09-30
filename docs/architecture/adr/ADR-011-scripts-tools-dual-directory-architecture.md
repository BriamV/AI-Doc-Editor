# ADR-011: Arquitectura de Directorios Duales scripts/ y tools/

## Status

Proposed

## Context

Durante la fase de modernización del ecosistema de calidad del proyecto, se identificó la necesidad de evaluar la arquitectura de directorios duales `scripts/` y `tools/` para optimizar la organización, mantenimiento y rendimiento de las herramientas de automatización.

### Análisis de Situación Actual

El proyecto mantiene dos directorios principales para automatización:

- **scripts/**: 5 archivos esenciales (.cjs) - 6.4KB total
  - Herramientas de infraestructura multiplatforma
  - Hooks de protección de merge
  - Runners de desarrollo y validación
  - Ejecución optimizada (54% mejora de rendimiento: 152s → 70s)

- **tools/**: 8 archivos bash - 51.6KB total
  - Gestión de tareas y navegación de proyecto
  - Dashboard de progreso y validación DoD
  - Workflows específicos del ciclo de desarrollo
  - Análisis de contexto y extracción de subtareas

### Problema Identificado

La coexistencia de ambos directorios genera incertidumbre sobre:
1. Responsabilidades y alcances específicos de cada directorio
2. Duplicación potencial de funcionalidades
3. Optimización de la arquitectura de automatización
4. Mantenimiento a largo plazo y evolución del sistema

### Hallazgos del Análisis

- **Overlap funcional**: < 10% de superposición real entre directorios
- **Especialización técnica**: Cada directorio resuelve dominios distintos
- **Rendimiento**: Optimización del 54% ya lograda en scripts/
- **Dependencias**: Arquitecturas tecnológicas complementarias (.cjs vs .sh)

## Decision

**Estrategia 3: Mantener separación con alcances claramente definidos**

Se decide mantener la arquitectura dual `scripts/` y `tools/` con responsabilidades especializadas y complementarias:

### Definición de Alcances

**scripts/**: Infraestructura de Calidad y Automatización
- Herramientas multiplatforma (.cjs) para CI/CD
- Hooks de protección y validación de merges
- Runners de desarrollo y testing
- Integración con ecosystem de 40+ herramientas de calidad
- Optimización de rendimiento y compatibilidad Windows/Linux/WSL

**tools/**: Gestión de Proyecto y Workflows
- Scripts bash para navegación y gestión de tareas
- Dashboard de progreso y métricas de proyecto
- Validación de Definition of Done (DoD)
- Análisis de contexto y planning de desarrollo
- Workflows específicos del ciclo de vida del proyecto

### Principios de Organización

1. **Separación por Dominio**: Infraestructura vs. Gestión de Proyecto
2. **Especialización Tecnológica**: .cjs multiplatforma vs. bash/shell
3. **Optimización Preservada**: Mantener mejoras de rendimiento logradas
4. **Evolución Independiente**: Cada directorio evoluciona según su dominio

## Consequences

### Beneficios

**Mantenimiento y Claridad**
- ✅ Responsabilidades claramente definidas y documentadas
- ✅ Reducción de confusión sobre ubicación de herramientas
- ✅ Evolución independiente según dominios específicos
- ✅ Preservación de optimizaciones de rendimiento (54% mejora)

**Desarrollo y Productividad**
- ✅ Especialización técnica permite optimizaciones específicas
- ✅ Menor overhead cognitivo para desarrolladores
- ✅ Workflows claramente mapeados a directorios específicos
- ✅ Mantenimiento simplificado por separación de concerns

**Arquitectura y Escalabilidad**
- ✅ Flexibilidad para evolución independiente
- ✅ Compatibilidad preservada con ecosystem existente
- ✅ Base sólida para futuras extensiones

### Riesgos y Mitigaciones

**Riesgo: Duplicación Futura**
- **Mitigación**: Guidelines claras de ubicación y revisión en PRs
- **Monitoreo**: Validación periódica de overlap funcional

**Riesgo: Complejidad de Navegación**
- **Mitigación**: Documentación actualizada en CLAUDE.md
- **Herramientas**: Commands /health-check y /context-analyze para navegación

**Riesgo: Inconsistencia de Patrones**
- **Mitigación**: Templates y estándares específicos por directorio
- **Validación**: Integración en quality gates existentes

## Alternatives Considered

### Estrategia 1: Migración Completa a scripts/ (.cjs)
**Pros**: Unificación tecnológica, optimización universal
**Contras**:
- Pérdida de especialización bash para gestión de proyecto
- Complejidad innecesaria para scripts simples
- Costo de migración: 40-60 horas
- Riesgo de regresión en workflows estables

### Estrategia 2: Migración Completa a tools/ (.sh)
**Pros**: Simplicidad tecnológica, consistencia bash
**Contras**:
- Pérdida de optimizaciones multiplatforma (.cjs)
- Regresión en rendimiento (54% de mejora perdida)
- Incompatibilidad con Windows nativo
- Costo de migración: 60-80 horas

### Análisis Comparativo

| Criterio | Estrategia 1 | Estrategia 2 | **Estrategia 3** |
|----------|--------------|--------------|-------------------|
| Costo Migración | 40-60h | 60-80h | **0h** |
| Rendimiento | Optimizado | Regresión -54% | **Preservado +54%** |
| Multiplatforma | Mantenido | Perdido | **Mantenido** |
| Especialización | Perdida | Perdida | **Preservada** |
| Riesgo Regresión | Alto | Muy Alto | **Bajo** |

## Related Decisions

- **ADR-006**: Dependency Security Scanning - Sistema de seguridad integrado con scripts/
- **ADR-008**: Multi-Stack Quality Pipeline - Ecosystem de 40+ herramientas en scripts/
- **PRD-R0.WP3**: Seguridad y Auditoría - Workflows de validación en tools/
- **WORK-PLAN T-09**: Task Management Workflow - Herramientas de gestión en tools/

### Implementación

**Fase 1: Documentación y Guidelines (Inmediato)**
- Actualización de CLAUDE.md con alcances definidos
- Guidelines de ubicación para nuevas herramientas
- Templates específicos por directorio

**Fase 2: Validación y Monitoreo (1-2 semanas)**
- Implementación de validadores de overlap
- Integración en quality gates
- Métricas de uso y efectividad

**Fase 3: Optimización Incremental (1-2 meses)**
- Mejoras específicas por dominio
- Refinamiento de workflows
- Optimizaciones de rendimiento adicionales

**Fase 4: Evolución Continua (Ongoing)**
- Revisión periódica de arquitectura
- Adaptación a nuevos requirements
- Mantenimiento de separación de concerns

---

**Decisión Técnica**: La arquitectura dual scripts/tools demuestra valor estratégico con < 10% overlap, especialización clara y optimizaciones preservadas. La migración representa riesgo innecesario sin beneficio proporcional.

**Próximos Pasos**: Implementar guidelines de ubicación y validadores de compliance para mantener la separación de concerns a largo plazo.