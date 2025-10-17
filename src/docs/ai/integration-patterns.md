# AI Integration Patterns Documentation

**Last Updated:** 2025-10-11 (Issue #29 - API Key Unification)
**Purpose:** Document AI implementation patterns in AI-Doc-Editor

## Architecture Overview

The AI-Doc-Editor implements a **backend-proxied OpenAI integration** using React hooks, TypeScript, and FastAPI. All AI processing is proxied through the backend to ensure secure API key management and proper authentication.

**Key Architecture Components**:

- **Frontend**: React hooks for chat UI and state management
- **Backend Proxy**: FastAPI endpoint (`/api/chat/completions`) for secure OpenAI API calls
- **API Key Management**: Backend-only storage with AES-256 encryption
- **Authentication**: JWT tokens required for all AI operations

## Backend Proxy Architecture (NEW - Issue #29)

### Chat Proxy Endpoint

**Endpoint**: `POST /api/chat/completions`

**Authentication**: JWT Bearer token (required)

**Request**:

```typescript
{
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string; // Default: "gpt-4o-mini"
  temperature?: number; // 0-2, default: 0.7
  stream?: boolean; // Default: false
}
```

**Response**:

- Standard: OpenAI chat completion response
- Streaming: Server-Sent Events (SSE) with delta updates

### API Key Resolution Flow

1. **Extract user ID** from JWT token
2. **Try user's API key** from encrypted credentials table
3. **Fallback to global key** if user hasn't configured their own
4. **Return 402 error** if neither available

### Security Model

- **API Keys**: Never exposed to frontend
- **Encryption**: AES-256 (Fernet) for stored keys
- **Authentication**: JWT required for all operations
- **Storage**: Backend database only (no localStorage)

## Core AI Components

### 1. API Layer (`src/api/api.ts`)

> **DEPRECATED**: Direct OpenAI API calls from frontend have been replaced with backend proxy.
> This section documents the legacy implementation for historical reference.
> See "Backend Proxy Architecture" section above for current implementation.

#### Legacy Implementation (Pre-Issue #29)

#### Primary Functions

```typescript
// Standard chat completion
getChatCompletion(params: {
  endpoint: string;
  messages: MessageInterface[];
  config: ConfigInterface;
  apiKey?: string;
  customHeaders?: Record<string, string>;
})

// Streaming chat completion
getChatCompletionStream(params: {
  endpoint: string;
  messages: MessageInterface[];
  config: ConfigInterface;
  apiKey?: string;
  customHeaders?: Record<string, string>;
})
```

#### Key Features

- **Azure OpenAI Support:** Automatic endpoint detection and path adjustment
- **Authentication:** Bearer token and Azure API key support
- **Error Handling:** Rate limiting, quota, and model availability detection
- **Streaming:** Server-sent events for real-time responses

#### Azure Integration Pattern

```typescript
if (isAzureEndpoint(endpoint) && apiKey) {
  headers['api-key'] = apiKey;
  const gpt3forAzure = 'gpt-35-turbo';
  const model = config.model === 'gpt-3.5-turbo' ? gpt3forAzure : config.model;
  const apiVersion = '2023-03-15-preview';
  const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;
}
```

### 2. Stream Processing (`src/hooks/useStreamProcessor.ts`)

#### Stream Handler Architecture

```typescript
const processStream = async (
  stream: ReadableStream,
  onContentUpdate: (content: string) => void
): Promise<void> => {
  const reader = stream.getReader();
  let reading = true;
  let partial = '';

  while (reading && useStore.getState().generating) {
    const { done, value } = await reader.read();
    const result = parseEventSource(partial + new TextDecoder().decode(value));
    // Process streaming delta content
  }
};
```

#### Stream Features

- **Real-time Processing:** Immediate content updates
- **Cancellation Support:** User can stop generation
- **Error Recovery:** Handles network interruptions
- **Memory Management:** Proper stream cleanup

### 3. API Validation (`src/hooks/useApiValidation.ts`)

#### Validation Pattern

```typescript
const validateApiKey = (): void => {
  if (!apiKey || apiKey.length === 0) {
    if (apiEndpoint === officialAPIEndpoint) {
      throw new Error(t('noApiKeyWarning') as string);
    }
  }
};

const getValidatedStream = async (
  messages: MessageInterface[],
  config: ConfigInterface
): Promise<ReadableStream | null> => {
  validateApiKey();
  return await getChatCompletionStream({
    endpoint: useStore.getState().apiEndpoint,
    messages,
    config,
    apiKey,
  });
};
```

#### Security Features

- **API Key Validation:** Required for official OpenAI endpoint
- **Endpoint Flexibility:** Support for custom endpoints
- **Error Localization:** Multi-language error messages

### 4. Message Management (`src/hooks/useSubmit.ts`)

#### Submission Flow

```typescript
const handleSubmit = async () => {
  // 1. Validate chat state
  // 2. Build message with assistant placeholder
  // 3. Update UI immediately
  // 4. Process streaming response
  // 5. Update token usage and generate title
};
```

#### State Management Pattern

- **Immutable Updates:** No direct state mutation
- **Optimistic UI:** Immediate placeholder creation
- **Error Recovery:** Rollback on API failures
- **Token Tracking:** Usage monitoring (infrastructure present)

## Data Flow Architecture

```
User Input → Chat Interface
     ↓
Message Validation (useSubmit)
     ↓
JWT Authentication Check
     ↓
Backend Chat Proxy (/api/chat/completions)
     ↓
Backend: User API Key Resolution
     ↓
Backend: OpenAI API Call
     ↓
Stream Processing (SSE from backend)
     ↓
Real-time UI Updates (Zustand Store)
     ↓
Token Counting & Title Generation
```

## Configuration Management

### Model Configuration (`src/types/document.ts`)

```typescript
export interface ConfigInterface {
  model: string;
  max_completion_tokens: number;
  temperature: number;
  presence_penalty: number;
  top_p: number;
  frequency_penalty: number;
}

export type ModelOptions =
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-4'
  | 'gpt-4-32k'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-4.5-preview'
  | 'o1'
  | 'o3-mini'
  | string;
```

### Authentication Configuration (`src/constants/auth.ts`)

```typescript
// @deprecated - No longer used. All API calls go through backend proxy.
// These constants are kept for backwards compatibility only.
export const officialAPIEndpoint = 'https://api.openai.com/v1/chat/completions';
const customAPIEndpoint = getEnvVar('VITE_CUSTOM_API_ENDPOINT') || '';
export const defaultAPIEndpoint = getEnvVar('VITE_DEFAULT_API_ENDPOINT') || officialAPIEndpoint;

// NEW: Backend proxy endpoint (current implementation)
export const CHAT_PROXY_ENDPOINT = '/api/chat/completions';
```

## Error Handling Patterns

### API Error Categories

1. **Authentication Errors:** Missing or invalid API keys
2. **Rate Limiting:** 429 status codes with retry logic
3. **Quota Errors:** Insufficient_quota detection
4. **Model Errors:** Model not found or not accessible
5. **Network Errors:** Connection timeouts and failures

### Error Processing Flow

```typescript
if (response.status === 404 || response.status === 405) {
  const text = await response.text();
  if (text.includes('model_not_found')) {
    throw new Error(text + 'Please ensure that you have access to this model.');
  } else {
    throw new Error('Invalid API endpoint!');
  }
}

if (response.status === 429 || !response.ok) {
  const text = await response.text();
  let error = text;
  if (text.includes('insufficient_quota')) {
    error += 'Insufficient quota.';
  } else if (response.status === 429) {
    error += '\nRate limited!';
  }
  throw new Error(error);
}
```

## State Management Integration

### Zustand Store Integration

- **API Keys:** Encrypted storage in browser
- **Chat History:** Message persistence and management
- **Configuration:** Model and parameter storage
- **UI State:** Loading, error, and generation states

### Store Structure (Relevant AI Parts)

```typescript
interface AIState {
  apiKey: string;
  apiEndpoint: string;
  generating: boolean;
  error: string | null;
  currentChatIndex: number;
  chats: DocumentInterface[];
  defaultChatConfig: ConfigInterface;
}
```

## Title Generation Feature

### Auto-Title Generation (`src/hooks/useTitleGeneration.ts`)

```typescript
const generateAndSetTitle = async (config: ConfigInterface) => {
  // Generate title from chat context
  const data = await getChatCompletion({
    endpoint: apiEndpoint,
    messages: titlePromptMessages,
    config: titleConfig,
    apiKey,
  });

  // Update chat title automatically
  updateChatTitle(generatedTitle);
};
```

## Performance Considerations

### Optimization Patterns

1. **Stream Processing:** Real-time updates without blocking UI
2. **Cancellation:** User can stop expensive operations
3. **Debouncing:** Input validation and API calls
4. **Memory Management:** Proper stream and resource cleanup

### Token Management (Infrastructure)

- **tiktoken Integration:** `@dqbd/tiktoken` dependency
- **Cost Calculation:** Infrastructure for usage tracking
- **Display Component:** `TokenCount.tsx` (currently disabled)

## Security Implementation

### Current Security Measures (Post-Issue #29)

1. **Backend API Key Storage**: AES-256 Fernet encryption in database
2. **JWT Authentication**: Required for all AI operations
3. **Backend Proxy Pattern**: API keys never exposed to frontend
4. **Input Validation**: Message content validation in backend
5. **Request Sanitization**: Safe API parameter handling in proxy
6. **Error Filtering**: No sensitive data in frontend error messages
7. **Audit Logging**: All AI operations logged with WORM compliance

### Security Improvements from Migration

**Resolved Issues**:

- ✅ API keys no longer stored in browser
- ✅ Centralized rate limiting possible
- ✅ Usage monitoring implemented
- ✅ Audit logging for AI operations
- ✅ No frontend API key exposure

**Previous Limitations (Pre-Issue #29)**:

- ❌ Frontend-only: API keys stored in browser
- ❌ No rate limiting: Client-side only rate control
- ❌ No usage monitoring: No centralized usage tracking
- ❌ No audit logging: No AI operation audit trail

## Integration Points

### Frontend Integration

- **Chat UI:** Direct integration with React components
- **Document Editor:** AI-generated content insertion
- **Settings:** API configuration management
- **History:** Chat persistence and retrieval

### Backend Integration (NEW - Issue #29)

- **Server-Side AI Proxy**: All OpenAI calls proxied through FastAPI
- **Database API Key Storage**: Encrypted user credentials in PostgreSQL
- **Enterprise Features**: Centralized key management and usage tracking
- **Advanced Security**: Server-side key management with HSM readiness
- **RAG Pipeline**: Backend-integrated embeddings and vector storage

## Dependencies

### AI-Related Dependencies

```json
{
  "@dqbd/tiktoken": "^1.0.2" // Token counting (only AI dependency)
}
```

### Notable Absence

- No `openai` package
- No `langchain` libraries
- No vector database clients
- No embedding model integrations

## Conclusion

The AI implementation has evolved from a **frontend-only solution** to a **secure backend-proxied architecture** with proper key management, authentication, and audit logging.

**Current Architecture Strengths**:

- ✅ Clean hook-based frontend architecture
- ✅ Secure backend proxy for all OpenAI calls
- ✅ Proper stream processing with SSE
- ✅ Backend API key management with encryption
- ✅ JWT authentication enforcement
- ✅ Azure OpenAI support maintained
- ✅ Good error handling across stack
- ✅ RAG pipeline integration
- ✅ Audit logging compliance

**Migration Complete** (Issue #29):

- ✅ Backend chat proxy implemented
- ✅ Frontend migrated to backend storage
- ✅ localStorage fallback removed
- ✅ Custom endpoint configuration removed
- ✅ Authentication enforcement added

**Next Steps** (R2-R3):

- Advanced AI workflows (LangChain integration)
- Knowledge base expansion
- Enhanced RAG capabilities
- System key rotation (Phase 2)
- HSM integration evaluation (Phase 3)
