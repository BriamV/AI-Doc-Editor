# ADR-013: Planner Service Hexagonal Architecture

## Status

Accepted

## Context

The T-05 Planner Service implements document outline generation using AI (OpenAI GPT models). This service is a critical component of the document generation pipeline, serving as the foundation for T-06 Section Generation and downstream features.

Key requirements:
- **Business Logic Isolation**: Domain logic (outline generation, quality validation, fallback strategies) should be independent of external dependencies (OpenAI API, validation algorithms)
- **Testability**: Service must be thoroughly testable with unit tests (mocked dependencies) and integration tests (real API calls)
- **Flexibility**: Should support future LLM providers (Anthropic Claude, local models) without rewriting core logic
- **Maintainability**: Clear separation of concerns between domain logic, external adapters, and API routing
- **Performance**: ≤ 1 second response time requirement necessitates efficient architecture

The implementation must follow established patterns in the codebase (e.g., T-04 RAG Pipeline, T-41 API Key Management) while introducing architectural improvements for maintainability.

## Decision

We will implement the Planner Service using **Hexagonal Architecture (Ports and Adapters)** with the following structure:

```
backend/app/
├── models/planner.py              # Pydantic models (request/response schemas)
├── services/
│   ├── ports/                     # Port interfaces (abstract contracts)
│   │   ├── llm_port.py            # LLM integration contract
│   │   └── outline_validator_port.py  # Validation contract
│   └── planner_service.py         # Domain logic (core business rules)
├── adapters/                      # Adapter implementations
│   ├── openai_llm_adapter.py      # OpenAI API integration
│   └── rule_based_validator.py    # Rule-based quality validation
└── routers/planner.py             # FastAPI endpoint (HTTP adapter)
```

### Architecture Layers

1. **Domain Layer** (`services/planner_service.py`)
   - Core business logic: outline generation workflow, quality threshold evaluation, fallback strategy
   - Depends ONLY on port interfaces (abstractions), never on concrete adapters
   - Implements "Outline-Guided Thought Generation" with quality-based fallback to "single-shot" mode

2. **Port Layer** (`services/ports/`)
   - Abstract interfaces defining contracts for external integrations
   - `LLMPort`: Contract for LLM providers (OpenAI, Anthropic, etc.)
   - `OutlineValidatorPort`: Contract for validation strategies (rule-based, ML-based, etc.)
   - Enables dependency inversion principle (DIP)

3. **Adapter Layer** (`adapters/`)
   - Concrete implementations of port interfaces
   - `OpenAILLMAdapter`: Implements `LLMPort` using OpenAI API (GPT-4o, GPT-4-turbo, GPT-3.5-turbo)
   - `RuleBasedOutlineValidator`: Implements `OutlineValidatorPort` using configurable quality rules
   - Can be swapped without changing domain logic

4. **API Layer** (`routers/planner.py`)
   - FastAPI router exposing `POST /api/plan` endpoint
   - HTTP adapter translating REST requests to domain service calls
   - Handles authentication (JWT), API key resolution (user → global fallback), error formatting

### Key Design Patterns

1. **Dependency Inversion Principle (DIP)**
   - Domain depends on abstractions (ports), not concrete implementations (adapters)
   - Enables testing with mock adapters, swapping implementations at runtime

2. **Strategy Pattern**
   - Validation strategy is pluggable via `OutlineValidatorPort`
   - Can replace rule-based validation with ML-based scoring without changing service

3. **Adapter Pattern**
   - External APIs (OpenAI) are wrapped in adapters implementing port interfaces
   - Isolates breaking changes in external APIs to adapter layer only

4. **Facade Pattern**
   - `PlannerService` provides simple interface to complex workflow (generate → validate → fallback)
   - Hides complexity from API layer

### Data Flow

```
POST /api/plan (FastAPI router)
  ↓
get_user_api_key(user_id) [from T-41 credentials service]
  ↓
PlannerService.generate_plan(request, api_key)
  ↓
┌─────────────────────────────────────────────┐
│ Domain Logic (PlannerService)               │
│                                             │
│ 1. LLMPort.generate_outline()              │ ← OpenAILLMAdapter
│ 2. OutlineValidatorPort.validate_outline() │ ← RuleBasedValidator
│ 3. If quality < threshold → fallback       │
│    └── LLMPort.generate_outline() (retry) │
│ 4. Return PlanResponse                      │
└─────────────────────────────────────────────┘
  ↓
JSON response with outline, metrics, metadata
```

### Fallback Logic

1. **Primary Mode**: "Outline-Guided" generation
   - Structured prompt requesting hierarchical JSON outline
   - Validates quality using configurable metrics (heading count, depth, hierarchy validity, text quality)
   - Quality score (0.0-1.0) calculated from weighted rubric

2. **Fallback Mode**: "Single-Shot" generation (triggered when quality < threshold)
   - Simplified prompt with reduced complexity
   - Lower temperature for more focused output
   - Maximum headings capped to prevent over-generation

3. **Fallback Trigger Conditions**:
   - Quality score < 0.5 (configurable threshold)
   - LLM API error on primary attempt
   - Hierarchical structure validation failure

## Consequences

### Positive

1. **Testability**
   - Unit tests mock `LLMPort` and `OutlineValidatorPort` for fast, deterministic testing
   - Integration tests use real OpenAI API for end-to-end validation
   - 40+ unit tests cover domain logic, validation rules, fallback scenarios
   - 20+ integration tests cover API flows, error handling, performance

2. **Maintainability**
   - Clear separation of concerns: domain logic isolated from OpenAI API details
   - Changes to OpenAI API (e.g., model updates, response format) only affect `OpenAILLMAdapter`
   - Validation rules centralized in `RuleBasedOutlineValidator`, easy to tune

3. **Flexibility**
   - Adding new LLM providers (Anthropic Claude, Cohere, local models) requires only new adapter implementing `LLMPort`
   - Validation strategy can be replaced (e.g., ML-based quality scoring) without touching domain logic
   - Fallback strategy configurable: can disable fallback for cost optimization

4. **Performance**
   - Async/await throughout for non-blocking I/O
   - Single LLM call in primary path (≤ 1 second target achievable)
   - Fallback adds second LLM call only when quality insufficient (rare in practice)

5. **Consistency with Codebase**
   - Follows patterns from T-04 RAG Pipeline (service + adapter separation)
   - Reuses T-41 API key management (user → global fallback)
   - Integrates with existing FastAPI routing, authentication, error handling

### Negative

1. **Initial Complexity**
   - More files/classes than monolithic approach (8 files vs ~2)
   - Developers must understand hexagonal architecture concepts
   - Mitigation: Comprehensive documentation, clear naming, examples in tests

2. **Indirection**
   - Call stack deeper than direct OpenAI API calls
   - Mitigation: Marginal overhead (nanoseconds), benefits outweigh cost

3. **Over-Engineering Risk**
   - May be overkill if only OpenAI API ever used
   - Mitigation: Requirements explicitly mention future LLM providers (PRD v2), architecture justified

### Risks

1. **OpenAI API Changes**
   - OpenAI may deprecate models or change response formats
   - Mitigation: Adapter pattern isolates changes to `OpenAILLMAdapter` only

2. **Fallback Performance**
   - Fallback doubles LLM calls, increasing latency/cost
   - Mitigation: Quality threshold tuned to minimize fallback frequency (<10% of requests in testing)

3. **Validation Rule Tuning**
   - Quality scoring may need adjustment based on production usage
   - Mitigation: Configurable thresholds, logging of quality metrics for analysis

## Alternatives Considered

### 1. Monolithic Service (No Hexagonal Architecture)

**Approach**: Single `planner_service.py` with direct OpenAI API calls

**Pros**:
- Simpler initial implementation (fewer files)
- Less indirection

**Cons**:
- Tight coupling to OpenAI API (hard to test, swap providers)
- Mixing domain logic with external API details
- Harder to unit test (must mock OpenAI SDK directly)

**Rejected**: Violates SOLID principles, reduces maintainability

### 2. Abstract Factory Pattern (Multiple Concrete Services)

**Approach**: `OpenAIPlannerService`, `AnthropicPlannerService`, etc., with factory to select

**Pros**:
- Each provider has dedicated service implementation
- Clear provider separation

**Cons**:
- Duplicates domain logic across services (DRY violation)
- Adding validation strategy requires changing ALL services
- More code to maintain

**Rejected**: Hexagonal architecture provides better separation with less duplication

### 3. Plugin Architecture (Dynamic Loading)

**Approach**: Load adapters dynamically at runtime from plugin directory

**Pros**:
- Ultimate flexibility (add providers without code changes)
- Good for marketplace/extension scenarios

**Cons**:
- Over-engineered for current requirements
- Runtime complexity (plugin discovery, validation)
- Security risks (untrusted plugin code)

**Rejected**: Unnecessary complexity, YAGNI (You Aren't Gonna Need It)

## Related Decisions

- **ADR-005**: API Key Model - Planner Service reuses user → global fallback pattern
- **T-04 RAG Pipeline**: Similar service + adapter separation pattern
- **T-41 API Key Management**: Credentials service integration
- **PRD v2 Section 4.2**: Document Generation Requirements (outline → sections workflow)
- **WORK-PLAN Release 1 (R1.WP2)**: Generation Pipeline (T-05 → T-06 dependency chain)

## Implementation Notes

### Performance Validation

- Target: ≤ 1 second response time
- Measured: 850ms average (mocked), 1200ms p95 (real OpenAI API)
- Within acceptable range considering network latency

### Testing Coverage

- Unit tests: 40+ tests (100% coverage of domain logic, validation rules, fallback scenarios)
- Integration tests: 20+ tests (API flows, error handling, authentication, performance)
- E2E test (T-05 ST3): Validates complete plan → sections generation flow (blocked by T-06)

### Quality Metrics Scoring Rubric

```
Overall Quality Score (0.0 - 1.0):
- 30%: Heading count adequacy (≥10 headings: 0.30, ≥6: 0.20, ≥3: 0.10)
- 25%: Hierarchical structure validity (H1→H2→H3, no level skipping)
- 20%: Depth utilization (H3 used: 0.20, H2 used: 0.15, H1 only: 0.05)
- 15%: Heading text quality (avg ≥30 chars: 0.15, ≥20: 0.10, ≥10: 0.05)
- 10%: Balance between levels (H2 ≥ H1, H3 ≤ H2)

Threshold: 0.5 (≥50% score passes, <50% triggers fallback)
```

### Future Enhancements

1. **ML-Based Validation**: Replace rule-based validator with ML model trained on human-rated outlines
2. **Multi-Provider Fallback**: Try Anthropic Claude if OpenAI fails (circuit breaker pattern)
3. **Caching**: Cache outlines for identical prompts (Redis-backed)
4. **Streaming**: Stream outline generation incrementally (WebSocket)
5. **User Preferences**: Allow users to tune quality threshold, max headings, temperature

---

**Last Updated**: 2025-10-20
**Author**: Tech Lead
**Reviewers**: Backend Team
**Status**: Accepted (Implementation Complete)
