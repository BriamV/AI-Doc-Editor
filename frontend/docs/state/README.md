# Zustand State Management Documentation

This directory contains documentation for the Zustand-based state management architecture, covering store design, data flow patterns, and state persistence strategies for the AI Document Editor frontend.

## State Architecture Overview

### Store Composition Strategy

The application uses a modular Zustand store architecture with 8 specialized slices, each handling specific domain concerns:

#### 🔐 **Authentication Stores**
- **auth-slice.ts**: Core authentication state and user session
- **cloud-auth-slice.ts**: Cloud service authentication (Google, etc.)

#### 📄 **Document Management**
- **document-slice.ts**: Document state, CRUD operations, and metadata
- **input-slice.ts**: Document input and form state management

#### 💬 **Chat & Communication**
- **prompt-slice.ts**: Chat prompts and AI conversation state
- **toast-slice.ts**: Notification and alert state management

#### 🛠️ **Application State**
- **config-slice.ts**: Application configuration and user preferences
- **audit-slice.ts**: Audit logging and security event tracking

## Zustand Implementation Patterns

### 1. Slice Definition Pattern
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
}

interface DocumentActions {
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setCurrentDocument: (document: Document | null) => void;
}

export const useDocumentStore = create<DocumentState & DocumentActions>()(
  persist(
    (set, get) => ({
      // State
      documents: [],
      currentDocument: null,
      loading: false,
      error: null,

      // Actions
      addDocument: (document) => set((state) => ({
        documents: [...state.documents, document]
      })),
      // Additional actions...
    }),
    {
      name: 'document-storage',
      partialize: (state) => ({ documents: state.documents })
    }
  )
);
```

### 2. State Composition Pattern
```typescript
// Cross-slice state access and coordination
const useDocumentOperations = () => {
  const { addDocument, currentDocument } = useDocumentStore();
  const { showToast } = useToastStore();
  const { logAuditEvent } = useAuditStore();

  const createDocument = useCallback(async (documentData: DocumentData) => {
    try {
      const newDocument = await addDocument(documentData);
      showToast('Document created successfully', 'success');
      logAuditEvent('document_created', { documentId: newDocument.id });
      return newDocument;
    } catch (error) {
      showToast('Failed to create document', 'error');
      throw error;
    }
  }, [addDocument, showToast, logAuditEvent]);

  return { createDocument };
};
```

### 3. Persistence Strategy
```typescript
// IndexedDB encrypted persistence
const persistConfig = {
  name: 'app-storage',
  storage: createJSONStorage(() => ({
    getItem: async (name) => {
      const encrypted = await indexedDB.getItem(name);
      return encrypted ? decrypt(encrypted) : null;
    },
    setItem: async (name, value) => {
      const encrypted = encrypt(value);
      await indexedDB.setItem(name, encrypted);
    },
    removeItem: async (name) => {
      await indexedDB.removeItem(name);
    }
  })),
  partialize: (state) => ({
    // Only persist specific state portions
    documents: state.documents,
    preferences: state.preferences
  })
};
```

## Store Documentation

### Authentication State (auth-slice.ts)
**Purpose**: Manages user authentication, session state, and authorization
**Key State**:
- `user`: Current user profile and permissions
- `isAuthenticated`: Authentication status
- `sessionExpiry`: Session expiration tracking
- `roles`: User role and permission matrix

**Key Actions**:
- `login()`: Authenticate user and establish session
- `logout()`: Clear session and redirect
- `refreshToken()`: Refresh authentication tokens
- `updateProfile()`: Update user profile information

### Document Management (document-slice.ts)
**Purpose**: Handles document lifecycle, metadata, and content management
**Key State**:
- `documents`: Array of user documents
- `currentDocument`: Active document being edited
- `documentHistory`: Document version history
- `sharedDocuments`: Documents shared with user

**Key Actions**:
- `createDocument()`: Create new document
- `saveDocument()`: Persist document changes
- `shareDocument()`: Share document with users
- `deleteDocument()`: Remove document permanently

### Chat State (prompt-slice.ts)
**Purpose**: Manages AI chat conversations and prompt history
**Key State**:
- `conversations`: Active chat conversations
- `currentPrompt`: Current prompt being composed
- `chatHistory`: Historical chat messages
- `aiResponse`: Latest AI response state

**Key Actions**:
- `sendPrompt()`: Send prompt to AI service
- `clearChat()`: Clear conversation history
- `saveConversation()`: Persist chat session
- `loadConversation()`: Restore chat session

### Configuration (config-slice.ts)
**Purpose**: Application settings, user preferences, and configuration
**Key State**:
- `theme`: UI theme preferences
- `language`: Localization settings
- `apiSettings`: API configuration
- `features`: Feature flag management

**Key Actions**:
- `updateTheme()`: Change application theme
- `setLanguage()`: Update localization
- `toggleFeature()`: Enable/disable features
- `resetSettings()`: Restore default configuration

## Data Flow Patterns

### 1. Unidirectional Data Flow
```
User Action → Component → Store Action → State Update → Component Re-render
```

### 2. Cross-Store Communication
```typescript
// Pattern for coordinated store updates
const useCoordinatedUpdate = () => {
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const logAudit = useAuditStore(state => state.logAuditEvent);
  const showToast = useToastStore(state => state.showToast);

  return useCallback((documentId: string, changes: DocumentUpdate) => {
    updateDocument(documentId, changes);
    logAudit('document_updated', { documentId, changes });
    showToast('Document updated successfully');
  }, [updateDocument, logAudit, showToast]);
};
```

### 3. Optimistic Updates
```typescript
// Optimistic update pattern with rollback
const useOptimisticUpdate = () => {
  const { updateDocument, rollbackDocument } = useDocumentStore();

  return useCallback(async (documentId: string, updates: DocumentUpdate) => {
    // Optimistically update UI
    updateDocument(documentId, updates);

    try {
      // Sync with backend
      await api.updateDocument(documentId, updates);
    } catch (error) {
      // Rollback on failure
      rollbackDocument(documentId);
      throw error;
    }
  }, [updateDocument, rollbackDocument]);
};
```

## Performance Optimization

### State Subscription Optimization
```typescript
// Selective state subscription to minimize re-renders
const DocumentList = () => {
  // Only subscribe to documents array, not entire store
  const documents = useDocumentStore(state => state.documents);

  return (
    <div>
      {documents.map(doc => <DocumentItem key={doc.id} document={doc} />)}
    </div>
  );
};
```

### Store Partitioning
```typescript
// Partition large stores for better performance
const useDocumentMetadata = () => {
  return useDocumentStore(state => ({
    documentCount: state.documents.length,
    lastModified: state.lastModified,
    totalSize: state.totalSize
  }), shallow);
};
```

## Testing Strategies

### Store Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useDocumentStore } from './document-slice';

describe('DocumentStore', () => {
  test('should add document correctly', () => {
    const { result } = renderHook(() => useDocumentStore());

    act(() => {
      result.current.addDocument(mockDocument);
    });

    expect(result.current.documents).toContain(mockDocument);
  });
});
```

### Integration Testing
```typescript
// Test store integration with components
import { render, screen } from '@testing-library/react';
import { DocumentList } from './DocumentList';

test('displays documents from store', () => {
  render(<DocumentList />);
  expect(screen.getByText('Test Document')).toBeInTheDocument();
});
```

## Security Considerations

### State Encryption
- Sensitive data encrypted before persistence
- User tokens stored securely with encryption
- PII data handled with privacy-first approach

### Access Control
- Role-based state access patterns
- Permission validation in store actions
- Audit logging for sensitive operations

## Migration and Versioning

### Store Version Management
```typescript
const migrations = {
  1: (persistedState: any) => ({
    ...persistedState,
    // Migration logic for version 1
  }),
  2: (persistedState: any) => ({
    ...persistedState,
    // Migration logic for version 2
  })
};

const persistConfig = {
  name: 'document-storage',
  version: 2,
  migrate: createMigrate(migrations),
  // Other config...
};
```

## Cross-References

### Related Documentation
- **Components**: [../components/](../components/) for component-store integration
- **API Layer**: [../api/](../api/) for backend synchronization
- **Hooks**: [../hooks/](../hooks/) for state management hooks
- **Testing**: [../testing/](../testing/) for store testing strategies

### Source Code References
- **Store Files**: [/src/store/](../../../src/store/)
- **Store Types**: [/src/types/store.ts](../../../src/types/store.ts)
- **Store Tests**: [/src/store/**/*.test.ts](../../../src/store/)

## Best Practices

### Store Design
- Keep stores focused on single domain
- Use TypeScript for type safety
- Implement proper error handling
- Design for testability

### Performance
- Use selective subscriptions
- Implement proper memoization
- Avoid unnecessary state updates
- Monitor store performance

### Security
- Encrypt sensitive persistent data
- Validate all store inputs
- Implement audit logging
- Follow privacy guidelines

Last updated: 2025-09-22