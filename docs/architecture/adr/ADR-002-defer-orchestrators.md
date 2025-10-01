# ADR-002: Posponer adopción de orquestadores (LangChain, Haystack)

## Status

Accepted

## Date

2025-06-24

## Context

El proyecto requiere integración con servicios de AI para generación de documentos. Los orquestadores populares como LangChain y Haystack ofrecen abstracciones útiles pero introducen overhead significativo.

### Performance Requirements

- **KPI Targets**: p95 ≤ 20s para generación de documentos, ≤ $0.12 USD/documento
- **Latency Impact**: Orquestadores añaden ~250-600ms de latencia por request
- **Cost Impact**: Dependencies adicionales y overhead computacional

### Current State

- **Frontend-only**: Integración directa con OpenAI desde frontend
- **Planned Backend**: Python/FastAPI backend para R1
- **AI Integration Needs**: Document generation, RAG (planned), prompt management

### Framework Analysis

- **LangChain**: Comprehensive pero heavy, múltiples dependencies
- **Haystack**: Document-focused pero similar overhead concerns
- **Native SDKs**: OpenAI, Anthropic SDKs más ligeros y directos

## Decision

**Posponer adopción de orquestadores hasta R4** y mantener integración directa con AI providers:

### Implementation Strategy

1. **Custom Dispatcher**: Implementar dispatcher propio basado en LiteLLM y SDKs nativos
2. **Direct Integration**: OpenAI SDK, Anthropic SDK para diferentes providers
3. **Minimal Abstraction**: Solo las abstracciones necesarias para multi-provider support
4. **Review Point**: Task T-47 en R4 para evaluar adoption de orquestadores

### Technical Approach

- **Provider Abstraction**: Interface ligera para multiple AI providers
- **LiteLLM Integration**: Para provider switching y rate limiting
- **Custom Prompt Management**: Simple template system sin framework overhead
- **Direct API Calls**: Minimize abstraction layers para máximo performance

## Alternatives Considered

### A. LangChain Adoption

- **Pros**: Comprehensive ecosystem, community support, rich features
- **Cons**: ~400-600ms latency overhead, heavy dependency tree, version volatility
- **Decision**: Rejected - performance impact unacceptable para KPIs

### B. Haystack Framework

- **Pros**: Document-centric design, good RAG support
- **Cons**: ~250-400ms overhead, less provider flexibility
- **Decision**: Rejected - similar performance concerns

### C. Custom Lightweight Framework

- **Pros**: Tailored to requirements, minimal overhead, full control
- **Cons**: Development time, maintenance burden, missing ecosystem features
- **Decision**: **Selected** - optimal for performance requirements

### D. Multi-framework Approach

- **Pros**: Best of both worlds, gradual migration
- **Cons**: Complexity, multiple abstractions, integration challenges
- **Decision**: Rejected - complexity vs benefit analysis

## Consequences

### Positive

- **Performance**: Minimal latency overhead, direct provider communication
- **Cost Efficiency**: Lower resource usage, fewer dependencies
- **Flexibility**: Custom implementation adaptable to specific needs
- **Security**: Reduced attack surface, fewer third-party dependencies
- **KPI Alignment**: Better chance of meeting p95 ≤ 20s requirement

### Negative

- **Development Time**: Custom implementation requires more initial development
- **Maintenance**: Team responsibility for provider integrations
- **Feature Gap**: Missing advanced orchestrator features (agents, complex workflows)
- **Community**: Less community support compared to established frameworks
- **Technical Debt**: Potential need for refactoring when adopting orchestrators later

### Risk Mitigation

- **T-43 Implementation**: Dependency security scanning para mitigar framework-bloat risk (R-11)
- **Provider SDK Updates**: Direct SDK usage gets provider improvements faster
- **Documentation**: Clear patterns for team to follow custom implementations
- **Review Schedule**: Formal re-evaluation at T-47 in R4

## Implementation Details

### Custom Dispatcher Architecture

```python
# Simple provider abstraction
class AIProvider:
    async def generate_text(self, prompt: str, **kwargs) -> str
    async def embed_text(self, text: str) -> List[float]

class OpenAIProvider(AIProvider):
    # Direct OpenAI SDK usage

class AnthropicProvider(AIProvider):
    # Direct Anthropic SDK usage

class AIDispatcher:
    def __init__(self, providers: Dict[str, AIProvider])
    async def route_request(self, provider: str, **kwargs)
```

### Performance Monitoring

- **Latency Tracking**: Request timing for each provider call
- **Cost Tracking**: Token usage and provider costs
- **Error Monitoring**: Provider failures and fallback patterns

### Future Migration Path

- **Interface Stability**: Design current interface to be compatible with future orchestrator adoption
- **Feature Flags**: Easy switching between custom and orchestrator implementations
- **Gradual Migration**: Ability to migrate specific features to orchestrators incrementally

## Related Documents

- [Performance Requirements](../PRD%20v2.md) - KPI specifications
- [T-47 Task](../WORK-PLAN%20v5.md) - Orchestrator re-evaluation point
- [Risk R-11](../PRD%20v2.md) - Framework-bloat risk documentation

## Related Tasks

- T-43: Implementar Escaneo de Dependencias (mitigation for framework-bloat)
- T-47: Gate R4 Orchestrator Decision (formal re-evaluation point)
- Future R1-R3: AI integration tasks with custom dispatcher

## Review Criteria for T-47

The following criteria will trigger re-evaluation of orchestrator adoption:

### Performance Baseline

- **Current Performance**: Custom implementation achieves p95 ≤ 20s consistently
- **Cost Baseline**: Maintaining ≤ $0.12 USD/documento target
- **Complexity Growth**: Custom implementation becoming maintenance burden

### Feature Requirements

- **Advanced Workflows**: Need for complex multi-step AI workflows
- **Agent Patterns**: Requirements for autonomous agent behaviors
- **Community Integrations**: Benefit from orchestrator ecosystem integrations

### Risk Assessment

- **Technical Debt**: Custom implementation maintenance vs orchestrator adoption cost
- **Team Velocity**: Framework adoption impact on development speed
- **Performance Trade-offs**: Acceptable latency increase for feature benefits

## Implementation Status (2025-09-23)

**Current State**: Decision successfully implemented with frontend-only OpenAI integration
- ✅ **Direct Integration**: OpenAI Chat Completions API used directly from frontend
- ✅ **Performance Target**: Sub-second response times achieved for chat completions
- ❌ **Backend AI Services**: Not yet implemented (planned for R1)
- ❌ **RAG Integration**: Deferred as planned, no vector database implementation
- ❌ **Orchestrators**: Successfully avoided - no LangChain or Haystack dependencies

**Architecture Validation**:
- Frontend-only approach validates the performance benefits of avoiding orchestrator overhead
- Direct API integration provides sufficient flexibility for current document generation needs
- T-47 re-evaluation criteria remain relevant for future orchestrator adoption decisions

## Notes

- **Decision Context**: Early project phase prioritizing performance over features
- **Risk R-11 Mitigation**: T-43 dependency scanning addresses framework-bloat concerns
- **Team Alignment**: Agreed durante initial architecture decisions 2025-06-24
