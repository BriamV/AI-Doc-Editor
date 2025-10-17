# Chat Proxy Endpoint

## Overview

The chat proxy endpoint provides a secure backend proxy for OpenAI chat completions. It implements unified API key management, allowing users to store their own OpenAI API keys or fall back to a global key.

**GitHub Issue**: [#29 - Backend chat proxy endpoint](https://github.com/BriamV/AI-Doc-Editor/issues/29)

## Architecture

```
Frontend → Backend Proxy → OpenAI API
           (User/Global Key)
```

### Benefits

1. **Secure Key Management**: API keys never exposed to frontend
2. **Unified System**: Same key used for chat and RAG pipeline
3. **Flexible Configuration**: User-specific or global fallback keys
4. **Error Handling**: Consistent error responses and logging
5. **Streaming Support**: Full SSE (Server-Sent Events) streaming

## Endpoints

### POST `/api/chat/completions`

Create a chat completion using OpenAI's API.

#### Authentication

**Required**: JWT Bearer token in Authorization header

```
Authorization: Bearer <jwt-token>
```

#### API Key Priority

1. **User's API Key** - Retrieved from credentials system (T-41)
2. **Global API Key** - Fallback from `settings.OPENAI_API_KEY`
3. **No Key** - Returns HTTP 402 error

#### Request Body

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

**Parameters:**

- `messages` (required): Array of message objects with `role` and `content`
- `model` (optional): OpenAI model name (default: "gpt-4o-mini")
- `temperature` (optional): Sampling temperature 0.0-2.0 (default: 0.7)
- `max_tokens` (optional): Maximum tokens to generate
- `stream` (optional): Enable streaming response (default: false)
- `top_p` (optional): Nucleus sampling 0.0-1.0 (default: 1.0)
- `frequency_penalty` (optional): -2.0 to 2.0 (default: 0.0)
- `presence_penalty` (optional): -2.0 to 2.0 (default: 0.0)

#### Response (Non-Streaming)

**Status Code**: 200 OK

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  }
}
```

#### Response (Streaming)

**Status Code**: 200 OK
**Content-Type**: text/event-stream

```
data: {"id":"chatcmpl-abc123","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-abc123","choices":[{"delta":{"content":"!"}}]}

data: [DONE]
```

**Headers:**
- `Cache-Control: no-cache`
- `Connection: keep-alive`
- `X-Accel-Buffering: no` (disable proxy buffering)

#### Error Responses

##### 400 Bad Request

Invalid request format or validation error.

```json
{
  "detail": [
    {
      "loc": ["body", "messages"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

##### 401 Unauthorized

Invalid or expired JWT token.

```json
{
  "detail": "Invalid or expired token"
}
```

##### 402 Payment Required

No API key configured (user or global).

```json
{
  "detail": {
    "error": "no_api_key",
    "message": "No OpenAI API key configured. Please add your API key in user settings or contact administrator."
  }
}
```

##### 429 Too Many Requests

OpenAI rate limit exceeded.

```json
{
  "detail": {
    "error": "rate_limit_exceeded",
    "message": "OpenAI API rate limit exceeded. Please try again later."
  }
}
```

##### 500 Internal Server Error

OpenAI API error or unexpected server error.

```json
{
  "detail": {
    "error": "api_error",
    "message": "OpenAI API error: ..."
  }
}
```

### GET `/api/chat/health`

Health check endpoint for chat service.

#### Response

**Status Code**: 200 OK

```json
{
  "service": "chat",
  "status": "operational",
  "supported_models": [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo"
  ],
  "streaming_supported": true
}
```

## Implementation Details

### API Key Resolution

```python
def get_openai_client(user_id: str) -> OpenAI:
    # 1. Try user's API key
    try:
        api_key = get_user_openai_key(user_id)
        logger.info("Using user-specific API key")
        return OpenAI(api_key=api_key)
    except HTTPException:
        pass

    # 2. Fallback to global key
    api_key = settings.OPENAI_API_KEY
    if api_key:
        logger.info("Using global API key")
        return OpenAI(api_key=api_key)

    # 3. No key available
    raise HTTPException(status_code=402, detail="No API key configured")
```

### Streaming Implementation

Uses async generator to stream OpenAI responses as Server-Sent Events:

```python
async def stream_openai_response(
    client: OpenAI,
    request: ChatRequest,
    user_id: str
) -> AsyncGenerator[str, None]:
    stream = client.chat.completions.create(
        model=request.model,
        messages=[msg.model_dump() for msg in request.messages],
        stream=True,
        ...
    )

    for chunk in stream:
        yield f"data: {json.dumps(chunk.model_dump())}\n\n"

    yield "data: [DONE]\n\n"
```

### Error Handling

All errors are caught and returned with appropriate HTTP status codes:

- **Authentication errors** → 401
- **Rate limits** → 429
- **Connection errors** → 503
- **API errors** → 500
- **No API key** → 402

Errors are logged with user ID for audit trail without exposing API keys.

## Security Considerations

1. **API Key Storage**: Keys stored encrypted using Fernet (T-41)
2. **No Key Exposure**: Keys never sent to frontend
3. **JWT Authentication**: All requests require valid JWT token
4. **Audit Logging**: All requests logged with user ID (not API key)
5. **Error Sanitization**: OpenAI errors sanitized before returning
6. **Rate Limiting**: Inherits from global rate limiting middleware

## Integration

### Frontend Usage

```typescript
// Using the chat proxy endpoint
const response = await fetch('/api/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    model: 'gpt-4o-mini',
    stream: true
  })
});

// Handle streaming
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.substring(6);
      if (data === '[DONE]') break;

      const parsed = JSON.parse(data);
      console.log(parsed.choices[0].delta.content);
    }
  }
}
```

### Backend Integration

The chat endpoint integrates with:

1. **Credentials System** (`app.routers.credentials`)
   - `get_user_openai_key(user_id)` - Retrieve user's API key

2. **Authentication System** (`app.routers.upload`)
   - `get_current_user_id()` - Extract user ID from JWT

3. **Configuration** (`app.core.config`)
   - `settings.OPENAI_API_KEY` - Global fallback key

## Testing

### Unit Tests

See `backend/tests/test_chat_router.py`:

- Test user API key retrieval
- Test global key fallback
- Test no key error handling
- Test streaming vs non-streaming
- Test error propagation (auth, rate limit, connection)
- Test request validation

### Manual Testing

```bash
# Test non-streaming
curl -X POST http://localhost:8000/api/chat/completions \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "model": "gpt-4o-mini",
    "stream": false
  }'

# Test streaming
curl -X POST http://localhost:8000/api/chat/completions \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "model": "gpt-4o-mini",
    "stream": true
  }'
```

## Related Documentation

- [T-41: User API Key Management](../../routers/credentials.py)
- [T-04: Document Upload & RAG Processing](../../routers/upload.py)
- [GitHub Issue #29](https://github.com/BriamV/AI-Doc-Editor/issues/29)
- [GitHub Issue #28: RAG Pipeline](https://github.com/BriamV/AI-Doc-Editor/issues/28)

## Future Enhancements

1. **Token Usage Tracking**: Track per-user token consumption
2. **Model Restrictions**: Limit certain users to specific models
3. **Cost Limits**: Enforce spending limits per user
4. **Caching**: Cache frequent responses to reduce API calls
5. **Custom Models**: Support fine-tuned models
6. **Function Calling**: Add support for OpenAI function calling
