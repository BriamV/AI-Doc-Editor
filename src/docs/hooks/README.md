# Custom React Hooks Documentation

This directory contains documentation for the 18 custom React hooks that encapsulate reusable business logic, state management patterns, and side effects for the AI Document Editor frontend.

## Hooks Architecture Overview

### Hook Categories

#### 🔐 **Authentication & Security**
- **useAuth.ts**: Authentication state and user session management
- **useRouteProtection.ts**: Route-level authorization and access control
- **useComponentProtection.ts**: Component-level security and permissions
- **useRoles.ts**: Role-based access control and permission validation

#### 📄 **Document Management**
- **useAddDocument.ts**: Document creation and initialization
- **useInitialiseNewDocument.ts**: New document setup and configuration
- **useSaveToLocalStorage.ts**: Local document persistence and synchronization
- **useUpdateHistory.ts**: Document version history management
- **useReplaceHistory.ts**: Document history replacement and cleanup

#### 💬 **Chat & AI Integration**
- **useSubmit.ts**: Chat message submission and processing
- **useSubmitPromptAdjust.ts**: Prompt adjustment and optimization
- **useStreamProcessor.ts**: AI response streaming and processing
- **useMessageHistory.ts**: Chat history management and persistence
- **useClearChat.ts**: Chat session cleanup and reset
- **useClearChatPrompt.ts**: Prompt clearing and state reset
- **useTitleGeneration.ts**: AI-powered title generation

#### 🛠️ **UI & Utility**
- **useHideOnOutsideClick.ts**: Outside click detection and modal management
- **useApiValidation.ts**: API response validation and error handling

## Hook Implementation Patterns

### 1. State Management Hook Pattern
```typescript
import { useCallback, useEffect } from 'react';
import { useDocumentStore } from '@/store/document-slice';
import { useToastStore } from '@/store/toast-slice';

export const useAddDocument = () => {
  const { documents, addDocument: addToStore } = useDocumentStore();
  const { showToast } = useToastStore();

  const addDocument = useCallback(async (documentData: DocumentData) => {
    try {
      const newDocument = await createDocument(documentData);
      addToStore(newDocument);
      showToast('Document created successfully', 'success');
      return newDocument;
    } catch (error) {
      showToast('Failed to create document', 'error');
      throw error;
    }
  }, [addToStore, showToast]);

  return {
    documents,
    addDocument,
    documentCount: documents.length
  };
};
```

### 2. Side Effect Hook Pattern
```typescript
import { useEffect, useRef } from 'react';

export const useHideOnOutsideClick = (
  onOutsideClick: () => void,
  enabled: boolean = true
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOutsideClick, enabled]);

  return ref;
};
```

### 3. Business Logic Hook Pattern
```typescript
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-slice';

export const useRouteProtection = (requiredRoles: string[] = []) => {
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const checkAccess = useCallback(() => {
    if (!isAuthenticated) return false;
    if (requiredRoles.length === 0) return true;

    return requiredRoles.some(role => user?.roles?.includes(role));
  }, [isAuthenticated, user, requiredRoles]);

  const hasAccess = checkAccess();

  return {
    hasAccess,
    loading,
    user,
    isAuthenticated,
    checkAccess
  };
};
```

## Hook Documentation

### Authentication Hooks

#### useAuth
**Purpose**: Central authentication state management and operations
**Returns**:
- `user`: Current user object
- `isAuthenticated`: Authentication status
- `login()`: Authenticate user
- `logout()`: Clear session
- `refreshToken()`: Refresh authentication

**Usage**:
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

#### useRouteProtection
**Purpose**: Route-level access control and authorization
**Parameters**:
- `requiredRoles`: Array of required roles for access
**Returns**:
- `hasAccess`: Boolean indicating access permission
- `loading`: Loading state for permission check
- `checkAccess()`: Manual access verification

#### useComponentProtection
**Purpose**: Component-level security and conditional rendering
**Parameters**:
- `permissions`: Required permissions array
- `fallback`: Fallback component for unauthorized access

#### useRoles
**Purpose**: Role-based access control utilities
**Returns**:
- `hasRole()`: Check if user has specific role
- `hasAnyRole()`: Check if user has any of specified roles
- `getAllRoles()`: Get all user roles

### Document Management Hooks

#### useAddDocument
**Purpose**: Document creation with validation and error handling
**Returns**:
- `addDocument()`: Create new document function
- `loading`: Creation loading state
- `error`: Creation error state

#### useInitialiseNewDocument
**Purpose**: New document initialization with templates
**Parameters**:
- `template`: Document template type
**Returns**:
- `initializeDocument()`: Initialize new document
- `availableTemplates`: List of available templates

#### useSaveToLocalStorage
**Purpose**: Local document persistence and synchronization
**Returns**:
- `saveDocument()`: Save document locally
- `loadDocument()`: Load document from storage
- `clearStorage()`: Clear local storage
- `syncStatus`: Synchronization status

#### useUpdateHistory
**Purpose**: Document version history management
**Returns**:
- `addVersion()`: Add new document version
- `getHistory()`: Retrieve version history
- `revertToVersion()`: Revert to specific version

### Chat & AI Hooks

#### useSubmit
**Purpose**: Chat message submission and AI communication
**Returns**:
- `submitMessage()`: Send chat message
- `loading`: Submission loading state
- `response`: AI response data
- `error`: Submission error state

#### useStreamProcessor
**Purpose**: Real-time AI response streaming
**Parameters**:
- `onChunk`: Callback for stream chunks
- `onComplete`: Callback for stream completion
**Returns**:
- `processStream()`: Start stream processing
- `stopStream()`: Stop current stream
- `isStreaming`: Streaming status

#### useMessageHistory
**Purpose**: Chat history management and persistence
**Returns**:
- `messages`: Current message history
- `addMessage()`: Add message to history
- `clearHistory()`: Clear message history
- `exportHistory()`: Export history data

#### useTitleGeneration
**Purpose**: AI-powered document title generation
**Returns**:
- `generateTitle()`: Generate title from content
- `suggestedTitles`: Array of title suggestions
- `loading`: Generation loading state

### Utility Hooks

#### useHideOnOutsideClick
**Purpose**: Detect clicks outside component for modal/dropdown management
**Parameters**:
- `onOutsideClick`: Callback for outside click
- `enabled`: Enable/disable detection
**Returns**:
- `ref`: Ref to attach to target element

#### useApiValidation
**Purpose**: API response validation and error handling
**Parameters**:
- `schema`: Validation schema
- `onError`: Error callback
**Returns**:
- `validateResponse()`: Validate API response
- `isValid`: Validation status
- `errors`: Validation errors

## Hook Composition Patterns

### 1. Hook Chaining
```typescript
const useDocumentWorkflow = (documentId: string) => {
  const { document, loading: docLoading } = useDocument(documentId);
  const { saveDocument, loading: saveLoading } = useSaveToLocalStorage();
  const { generateTitle, loading: titleLoading } = useTitleGeneration();

  const loading = docLoading || saveLoading || titleLoading;

  const saveWithTitle = useCallback(async (content: string) => {
    const title = await generateTitle(content);
    return saveDocument({ ...document, title, content });
  }, [document, generateTitle, saveDocument]);

  return { document, loading, saveWithTitle };
};
```

### 2. Conditional Hook Usage
```typescript
const useConditionalFeatures = (user: User) => {
  const authResult = useAuth();
  const routeProtection = useRouteProtection(['admin']);
  const roles = useRoles();

  // Conditionally use hooks based on user permissions
  if (roles.hasRole('admin')) {
    const adminFeatures = useAdminFeatures();
    return { ...authResult, ...adminFeatures };
  }

  return authResult;
};
```

### 3. Hook Abstraction
```typescript
const useDocumentOperations = () => {
  const add = useAddDocument();
  const save = useSaveToLocalStorage();
  const history = useUpdateHistory();

  return {
    createDocument: add.addDocument,
    saveDocument: save.saveDocument,
    updateHistory: history.addVersion,
    loading: add.loading || save.loading || history.loading
  };
};
```

## Testing Strategies

### Hook Testing with React Testing Library
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAddDocument } from './useAddDocument';

describe('useAddDocument', () => {
  test('should add document successfully', async () => {
    const { result } = renderHook(() => useAddDocument());

    await act(async () => {
      await result.current.addDocument(mockDocumentData);
    });

    expect(result.current.documents).toHaveLength(1);
  });

  test('should handle errors properly', async () => {
    const { result } = renderHook(() => useAddDocument());

    await act(async () => {
      try {
        await result.current.addDocument(invalidDocumentData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
```

### Integration Testing
```typescript
// Test hook integration with components
import { render, fireEvent, screen } from '@testing-library/react';
import { DocumentCreator } from './DocumentCreator';

test('creates document through component', async () => {
  render(<DocumentCreator />);

  fireEvent.click(screen.getByText('Create Document'));

  expect(await screen.findByText('Document created')).toBeInTheDocument();
});
```

## Performance Optimization

### Memoization Patterns
```typescript
export const useOptimizedSubmit = () => {
  const submitMessage = useCallback(async (message: string) => {
    // Expensive operation
    return await processMessage(message);
  }, []); // Stable dependency array

  const memoizedResult = useMemo(() => {
    return computeExpensiveValue();
  }, [dependency]);

  return { submitMessage, memoizedResult };
};
```

### Debounced Hooks
```typescript
export const useDebouncedSave = (document: Document, delay: number = 1000) => {
  const { saveDocument } = useSaveToLocalStorage();

  const debouncedSave = useMemo(
    () => debounce(saveDocument, delay),
    [saveDocument, delay]
  );

  useEffect(() => {
    if (document) {
      debouncedSave(document);
    }
  }, [document, debouncedSave]);
};
```

## Security Considerations

### Hook Security Patterns
```typescript
export const useSecureOperation = (operation: () => Promise<any>) => {
  const { hasPermission } = useRoles();
  const { validateToken } = useAuth();

  const secureExecute = useCallback(async () => {
    // Validate permissions
    if (!hasPermission('execute_operation')) {
      throw new Error('Insufficient permissions');
    }

    // Validate token
    await validateToken();

    // Execute operation
    return await operation();
  }, [hasPermission, validateToken, operation]);

  return { secureExecute };
};
```

## Cross-References

### Related Documentation
- **Components**: [../components/](../components/) for hook usage in components
- **State Management**: [../state/](../state/) for store integration patterns
- **API Layer**: [../api/](../api/) for API integration hooks
- **Testing**: [../testing/](../testing/) for hook testing strategies

### Source Code References
- **Hook Files**: [/src/hooks/](../../../src/hooks/)
- **Hook Tests**: [/src/hooks/**/*.test.ts](../../../src/hooks/)
- **Hook Types**: [/src/types/hooks.ts](../../../src/types/hooks.ts)

## Best Practices

### Hook Design
- Single responsibility principle
- Proper dependency arrays
- Error handling and loading states
- TypeScript for type safety

### Performance
- Use useMemo and useCallback appropriately
- Implement proper cleanup in useEffect
- Avoid unnecessary re-renders
- Consider hook composition carefully

### Testing
- Test both success and error scenarios
- Mock external dependencies
- Test hook composition patterns
- Verify proper cleanup

Last updated: 2025-09-22