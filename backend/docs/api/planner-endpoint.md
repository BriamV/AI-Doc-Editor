# Planner Service API Documentation

**Endpoint**: `POST /api/plan`
**Task**: T-05 Planner Service
**Status**: Implemented
**Version**: 1.0.0

## Overview

The Planner Service generates structured document outlines from user prompts using AI (OpenAI GPT models). It implements "Outline-Guided Thought Generation" with quality-based fallback to ensure high-quality outline structures.

### Key Features

- **Hierarchical Outline Generation**: H1 → H2 → H3 heading structure
- **Quality Validation**: Automatic quality assessment with configurable thresholds
- **Fallback Strategy**: Single-shot mode when outline-guided quality insufficient
- **API Key Resolution**: User-specific key → Global fallback → 402 error
- **Performance**: ≤ 1 second target response time
- **Authentication**: JWT token required (Bearer authentication)

## Architecture

The service follows **Hexagonal Architecture (Ports and Adapters)** for maintainability and testability:

```
POST /api/plan (FastAPI Router)
  ↓
PlannerService (Domain Logic)
  ↓
├─ LLMPort (Interface) → OpenAILLMAdapter (Implementation)
└─ OutlineValidatorPort (Interface) → RuleBasedValidator (Implementation)
```

See [ADR-013: Planner Service Hexagonal Architecture](../../docs/architecture/adr/ADR-013-planner-service-hexagonal-architecture.md) for detailed architecture decisions.

## API Specification

### Endpoint

```
POST /api/plan
```

### Authentication

**Required**: JWT Bearer token in `Authorization` header

```http
Authorization: Bearer <jwt_token>
```

### Request Body

**Content-Type**: `application/json`

```json
{
  "prompt": "Write a comprehensive guide about machine learning for beginners",
  "max_headings": 15,
  "temperature": 0.7,
  "model": "gpt-4o-mini"
}
```

#### Request Schema

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `prompt` | string | Yes | - | 10-5000 chars | User prompt describing desired document |
| `max_headings` | integer | No | 20 | 5-50 | Maximum number of headings to generate |
| `temperature` | float | No | 0.7 | 0.0-2.0 | LLM temperature (higher = more creative) |
| `model` | string | No | "gpt-4o-mini" | See supported models | OpenAI model to use |

**Supported Models**:
- `gpt-4o` (most capable, higher cost)
- `gpt-4o-mini` (balanced performance/cost, **recommended**)
- `gpt-4-turbo` (legacy, deprecated)
- `gpt-3.5-turbo` (fastest, lower cost)

### Response Body (Success)

**Status Code**: `200 OK`
**Content-Type**: `application/json`

```json
{
  "outline": {
    "headings": [
      {
        "level": 1,
        "text": "Introduction to Machine Learning",
        "children": [
          {
            "level": 2,
            "text": "What is Machine Learning?",
            "children": []
          },
          {
            "level": 2,
            "text": "Types of Machine Learning",
            "children": [
              {
                "level": 3,
                "text": "Supervised Learning",
                "children": []
              },
              {
                "level": 3,
                "text": "Unsupervised Learning",
                "children": []
              }
            ]
          }
        ]
      },
      {
        "level": 1,
        "text": "Machine Learning Algorithms",
        "children": [
          {
            "level": 2,
            "text": "Classification Algorithms",
            "children": []
          }
        ]
      }
    ],
    "total_headings": 7
  },
  "quality_metrics": {
    "total_headings": 7,
    "h1_count": 2,
    "h2_count": 3,
    "h3_count": 2,
    "avg_heading_length": 32.5,
    "max_depth": 3,
    "is_hierarchical": true,
    "quality_score": 0.85
  },
  "generation_mode": "outline-guided",
  "model_used": "gpt-4o-mini",
  "tokens_used": 450,
  "generation_time_ms": 850
}
```

#### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `outline` | object | Generated document outline |
| `outline.headings` | array | Top-level H1 headings with nested children |
| `outline.total_headings` | integer | Total heading count across all levels |
| `quality_metrics` | object | Outline quality assessment |
| `quality_metrics.quality_score` | float | Overall quality score (0.0-1.0) |
| `quality_metrics.is_hierarchical` | boolean | Whether outline has valid H1→H2→H3 structure |
| `generation_mode` | string | Generation mode used: `outline-guided` or `single-shot` |
| `model_used` | string | OpenAI model used for generation |
| `tokens_used` | integer | Total tokens consumed (if available) |
| `generation_time_ms` | integer | Generation time in milliseconds |

#### Quality Score Interpretation

| Score Range | Assessment | Action |
|-------------|------------|--------|
| 0.8 - 1.0 | Excellent | Use as-is |
| 0.6 - 0.8 | Good | Minor refinement optional |
| 0.4 - 0.6 | Acceptable | Review and refine |
| 0.0 - 0.4 | Poor | Regenerate recommended |

**Fallback Trigger**: Quality score < 0.5 automatically triggers single-shot fallback mode.

### Error Responses

#### 400 Bad Request - Invalid Request

```json
{
  "detail": {
    "error": "invalid_request",
    "message": "Invalid request: Prompt cannot be empty or whitespace only"
  }
}
```

**Causes**:
- Empty or whitespace-only prompt
- Invalid model name
- Out-of-range `max_headings` (not 5-50)
- Out-of-range `temperature` (not 0.0-2.0)

#### 401 Unauthorized - Invalid JWT Token

```json
{
  "detail": "Could not validate credentials"
}
```

**Causes**:
- Missing `Authorization` header
- Invalid JWT token format
- Expired JWT token
- Token signature verification failed

#### 402 Payment Required - No API Key

```json
{
  "detail": {
    "error": "no_api_key",
    "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator."
  }
}
```

**Causes**:
- User hasn't configured their OpenAI API key
- No global fallback API key available

**Resolution**: Add API key via `POST /api/credentials/openai`

#### 429 Too Many Requests - Rate Limit Exceeded

```json
{
  "detail": {
    "error": "rate_limit_exceeded",
    "message": "OpenAI API rate limit exceeded. Please try again later."
  }
}
```

**Causes**:
- OpenAI API rate limit exceeded (requests per minute or tokens per day)

**Resolution**: Wait and retry with exponential backoff

#### 500 Internal Server Error - Generation Failed

```json
{
  "detail": {
    "error": "generation_failed",
    "message": "Failed to generate outline: [error details]"
  }
}
```

**Causes**:
- OpenAI API error
- Network connectivity issues
- Invalid outline structure from LLM
- Both outline-guided and single-shot modes failed

#### 503 Service Unavailable - Connection Error

```json
{
  "detail": {
    "error": "connection_error",
    "message": "Failed to connect to OpenAI API. Please check your internet connection and try again."
  }
}
```

**Causes**:
- OpenAI API unreachable
- Network connectivity issues
- Firewall blocking OpenAI API

## Generation Modes

### Outline-Guided Mode (Primary)

**Strategy**: Structured prompt requesting hierarchical JSON outline with clear heading levels.

**Quality Assessment**: Validates outline using weighted rubric:
- 30%: Heading count adequacy (≥10 headings optimal)
- 25%: Hierarchical structure validity (H1→H2→H3, no level skipping)
- 20%: Depth utilization (H3 usage preferred)
- 15%: Heading text quality (avg ≥30 chars optimal)
- 10%: Balance between levels (H2 ≥ H1, H3 ≤ H2)

**Threshold**: Quality score ≥ 0.5 required to avoid fallback.

### Single-Shot Mode (Fallback)

**Trigger Conditions**:
- Outline-guided quality score < 0.5
- Outline-guided mode throws exception (API error, invalid structure)

**Strategy**: Simplified prompt with reduced complexity, lower temperature (temp - 0.2), capped max_headings (min 15).

**Purpose**: Generate basic, focused outline when structured approach produces low-quality results.

## API Key Resolution

The service follows a priority-based API key resolution strategy (consistent with T-41 API Key Management):

1. **User-Specific Key** (Priority 1): Retrieved from user's stored credentials
   - User configured via `POST /api/credentials/openai`
   - Encrypted storage (AES-256)
   - User-isolated (multi-tenancy)

2. **Global Fallback Key** (Priority 2): System-wide default key
   - Configured in environment variable `OPENAI_API_KEY`
   - Used when user hasn't configured their own key
   - Logged for auditing purposes

3. **No Key Available** (Error): 402 Payment Required
   - Neither user nor global key available
   - User must configure API key to proceed

## Usage Examples

### Example 1: Basic Outline Generation

**Request**:
```bash
curl -X POST "https://api.example.com/api/plan" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a beginner-friendly guide about Python programming",
    "max_headings": 12,
    "model": "gpt-4o-mini"
  }'
```

**Response**: (Outline with 12 headings covering Python basics, syntax, data structures, functions)

### Example 2: Advanced Configuration

**Request**:
```bash
curl -X POST "https://api.example.com/api/plan" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a detailed technical specification for a RESTful API design",
    "max_headings": 25,
    "temperature": 0.5,
    "model": "gpt-4o"
  }'
```

**Response**: (Detailed outline with 25 headings covering API design, authentication, endpoints, data models, error handling)

### Example 3: Error Handling - No API Key

**Request**:
```bash
curl -X POST "https://api.example.com/api/plan" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a guide about data science"
  }'
```

**Response** (User hasn't configured API key, no global fallback):
```json
{
  "detail": {
    "error": "no_api_key",
    "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator."
  }
}
```

**Resolution**: Configure API key:
```bash
curl -X POST "https://api.example.com/api/credentials/openai" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sk-proj-..."
  }'
```

## Performance Characteristics

### Response Time

- **Target**: ≤ 1 second
- **Measured** (mocked LLM): 850ms average
- **Measured** (real OpenAI API): 1200ms p95
- **Fallback Impact**: +800-1200ms (second LLM call)

**Optimization Tips**:
- Use `gpt-4o-mini` for faster responses (vs `gpt-4o`)
- Reduce `max_headings` for simpler outlines
- Lower `temperature` for more focused output (faster generation)

### Token Consumption

- **Average**: 400-600 tokens per request (outline-guided mode)
- **Fallback**: +200-400 tokens (single-shot mode)
- **Model Efficiency**:
  - `gpt-4o-mini`: Most cost-effective ($0.15/1M input tokens)
  - `gpt-4o`: Higher cost ($5.00/1M input tokens), better quality
  - `gpt-3.5-turbo`: Lowest cost, adequate quality

## Health Check

### Endpoint

```
GET /api/plan/health
```

### Response

```json
{
  "service": "planner",
  "status": "operational",
  "supported_models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  "generation_modes": ["outline-guided", "single-shot"],
  "quality_threshold": 0.5,
  "fallback_enabled": true
}
```

## Integration with Document Generation Pipeline

The Planner Service is the first step in the document generation workflow:

```
POST /api/plan (T-05)
  ↓ Generate outline
  ↓
WebSocket /api/generate (T-06)
  ↓ Generate sections from outline
  ↓
Document Editor (T-07/T-08)
  ↓ Edit and refine content
  ↓
Final Document
```

**Next Steps After Planning**:
1. Store outline in frontend state (Zustand store)
2. Pass outline to section generation service (T-06)
3. Stream section content via WebSocket
4. Display in interactive editor (T-07)

## Security Considerations

### Authentication
- **JWT Required**: All requests must include valid JWT token
- **User Isolation**: User ID extracted from JWT for API key resolution
- **Token Expiration**: Tokens expire per configured TTL

### API Key Protection
- **Encrypted Storage**: User API keys stored with AES-256 encryption (T-41)
- **No Logging**: API keys never logged in plain text
- **Secure Transmission**: HTTPS required in production

### Rate Limiting
- **Application-Level**: FastAPI rate limiting middleware (T-13)
- **OpenAI-Level**: OpenAI API rate limits enforced by provider

### Input Validation
- **Pydantic Models**: Request validation via Pydantic schemas
- **Length Limits**: Prompt capped at 5000 chars to prevent abuse
- **Model Whitelist**: Only allowed models accepted

## Testing

### Unit Tests

**Location**: `backend/tests/unit/test_planner_service.py`

**Coverage**: 40+ tests
- Outline validation logic
- Quality metrics calculation
- Fallback logic (quality-based, error-triggered)
- Heading node validation
- Document outline validation
- Plan request validation

**Run**:
```bash
pytest backend/tests/unit/test_planner_service.py -v
```

### Integration Tests

**Location**: `backend/tests/integration/test_planner_api.py`

**Coverage**: 20+ tests
- Full API request/response flow
- Authentication/authorization
- API key resolution (user → global fallback)
- Error handling (no API key, rate limit, authentication errors)
- Performance validation (≤ 1 second target)

**Run**:
```bash
pytest backend/tests/integration/test_planner_api.py -v
```

### E2E Test

**Task**: T-05 ST3 - Acceptance Criteria
**Status**: Pending T-06 implementation

**Flow**: User submits prompt → Outline generated → Sections generated → Draft document complete

## Troubleshooting

### Issue: "No OpenAI API key configured" (402 Error)

**Cause**: User hasn't added API key, no global fallback available

**Solution**:
1. Configure user API key: `POST /api/credentials/openai`
2. OR configure global API key in environment: `OPENAI_API_KEY=sk-...`

### Issue: "OpenAI API rate limit exceeded" (429 Error)

**Cause**: Too many requests to OpenAI API in short period

**Solution**:
1. Wait 60 seconds and retry
2. Implement exponential backoff in client
3. Upgrade OpenAI account tier for higher limits

### Issue: Low Quality Score (<0.5)

**Cause**: LLM generated poor-quality outline (too few headings, shallow depth, etc.)

**Solution**: (Automatic fallback triggers)
1. Single-shot mode automatically retries with simplified prompt
2. If still low quality, review prompt clarity
3. Consider increasing `max_headings` or adjusting `temperature`

### Issue: Slow Response Time (>2 seconds)

**Cause**: OpenAI API latency, fallback triggered (double LLM calls)

**Solution**:
1. Use faster model (`gpt-4o-mini` instead of `gpt-4o`)
2. Reduce `max_headings` to simplify generation
3. Check network connectivity to OpenAI API
4. Monitor quality threshold to minimize fallback frequency

## Related Documentation

- **Architecture Decision**: [ADR-013: Planner Service Hexagonal Architecture](../../docs/architecture/adr/ADR-013-planner-service-hexagonal-architecture.md)
- **API Key Management**: [backend/docs/USER-MANAGEMENT.md](../USER-MANAGEMENT.md)
- **Chat Endpoint**: [backend/docs/api/chat-endpoint.md](chat-endpoint.md) (similar authentication pattern)
- **Task Specification**: [docs/tasks/T-05-STATUS.md](../../../docs/tasks/T-05-STATUS.md)

---

**Last Updated**: 2025-10-20
**Maintained By**: Backend Team
**Version**: 1.0.0
