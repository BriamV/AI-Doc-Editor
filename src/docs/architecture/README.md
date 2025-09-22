# Frontend Architecture Documentation

This directory contains frontend-specific architectural decisions, design patterns, performance optimization strategies, and architectural decision records (ADRs) for the AI Document Editor React application.

## Frontend Architecture Overview

### Technology Stack Architecture

#### 🏗️ **Core Framework Stack**
- **React 18**: Component-based UI with concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework

#### 🔄 **State Management Architecture**
- **Zustand**: Lightweight state management (8 stores)
- **React Context**: Provider pattern for specific use cases
- **Local Storage**: Encrypted persistence via IndexedDB
- **State Composition**: Cross-store coordination patterns

#### 🎨 **UI/UX Architecture**
- **Component Composition**: Reusable component patterns
- **Design System**: Consistent UI components and tokens
- **Responsive Design**: Mobile-first responsive patterns
- **Accessibility**: WCAG 2.1 AA compliance

#### ⚡ **Performance Architecture**
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Dynamic imports for optimization
- **Memoization**: React.memo, useMemo, useCallback patterns
- **Bundle Optimization**: Tree shaking and dead code elimination

## Architectural Patterns

### 1. Component Architecture Pattern
```
Application Layer
├── App.tsx                 # Application root and routing
├── Layout/                 # Application shell components
│   ├── Header              # Navigation and user controls
│   ├── Sidebar             # Main navigation
│   └── Footer              # Application footer
├── Pages/                  # Route-level components
│   ├── Dashboard           # Main dashboard view
│   ├── Documents           # Document management
│   └── Settings            # User preferences
├── Features/               # Feature-specific components
│   ├── Chat/               # AI chat functionality
│   ├── Editor/             # Document editing
│   └── Auth/               # Authentication flows
└── Shared/                 # Reusable components
    ├── UI/                 # Base UI components
    ├── Forms/              # Form components
    └── Utils/              # Utility components
```

### 2. State Management Pattern
```typescript
// Store Architecture Pattern
interface ApplicationState {
  // Domain-specific stores
  auth: AuthState;           // User authentication
  documents: DocumentState;  // Document management
  chat: ChatState;          // AI conversation
  ui: UIState;              // UI state and preferences

  // Cross-cutting concerns
  audit: AuditState;        // Security and logging
  toast: ToastState;        // Notifications
  config: ConfigState;      // Application configuration
}

// Store Composition Pattern
const useApplicationState = () => {
  const auth = useAuthStore();
  const documents = useDocumentStore();
  const chat = useChatStore();

  return { auth, documents, chat };
};
```

### 3. Data Flow Architecture
```
User Interaction → Component → Custom Hook → Store Action → API Call
                                    ↓
State Update ← Store Mutation ← Response Processing ← API Response
                                    ↓
Component Re-render ← State Subscription ← Store Notification
```

### 4. Error Handling Architecture
```typescript
// Hierarchical Error Handling
Application Level
├── Error Boundaries        # Catch React component errors
├── API Error Handlers     # HTTP and network errors
├── Store Error States     # State management errors
└── Component Validation   # Form and input validation

// Error Recovery Strategy
interface ErrorRecovery {
  retry: () => void;          // Retry failed operation
  fallback: () => void;       # Fallback to safe state
  report: (error: Error) => void; // Error reporting
}
```

## Performance Optimization Strategies

### 1. React Performance Optimizations
```typescript
// Component Memoization
const DocumentList = React.memo(({ documents, onSelect }) => {
  return (
    <div>
      {documents.map(doc => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
});

// Expensive Computation Memoization
const useExpensiveCalculation = (data: any[]) => {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      // Expensive calculation
      return acc + complexCalculation(item);
    }, 0);
  }, [data]);
};

// Callback Stability
const useStableCallback = () => {
  const handleClick = useCallback((id: string) => {
    // Event handler logic
  }, []); // Stable dependency array

  return handleClick;
};
```

### 2. Bundle Optimization
```typescript
// Code Splitting with React.lazy
const DocumentEditor = React.lazy(() => import('./DocumentEditor'));
const ChatInterface = React.lazy(() => import('./ChatInterface'));

// Route-based Splitting
const AppRoutes = () => (
  <Routes>
    <Route path="/editor" element={
      <Suspense fallback={<LoadingSpinner />}>
        <DocumentEditor />
      </Suspense>
    } />
  </Routes>
);

// Dynamic Imports
const loadHeavyLibrary = async () => {
  const { heavyFunction } = await import('./heavy-library');
  return heavyFunction;
};
```

### 3. State Management Optimization
```typescript
// Selective State Subscriptions
const DocumentMetadata = () => {
  // Only subscribe to metadata, not entire document
  const metadata = useDocumentStore(state => ({
    title: state.currentDocument?.title,
    lastModified: state.currentDocument?.lastModified
  }), shallow);

  return <div>{metadata.title}</div>;
};

// Store Partitioning
const useOptimizedDocumentStore = () => {
  return {
    documents: useDocumentStore(state => state.documents),
    operations: useDocumentStore(state => ({
      add: state.addDocument,
      update: state.updateDocument,
      delete: state.deleteDocument
    }))
  };
};
```

## Security Architecture

### 1. Authentication Security
```typescript
// Token Management Security
class SecureTokenManager {
  private static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  }

  private static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static setToken(token: string): void {
    const encrypted = this.encrypt(token);
    localStorage.setItem('auth_token', encrypted);
  }
}

// Route Protection
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { hasAccess } = useRouteProtection(requiredRoles);

  if (!hasAccess) {
    return <UnauthorizedPage />;
  }

  return children;
};
```

### 2. Input Validation and Sanitization
```typescript
// Input Sanitization
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};

// Form Validation
const useFormValidation = (schema: ValidationSchema) => {
  const validate = useCallback((data: any) => {
    try {
      schema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      return { isValid: false, errors: formatErrors(error) };
    }
  }, [schema]);

  return { validate };
};
```

### 3. Content Security Policy
```typescript
// CSP Implementation
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com"
  ].join('; ')
};
```

## Testing Architecture

### 1. Testing Strategy Pyramid
```
E2E Tests (Playwright)
├── Critical User Journeys
├── Authentication Flows
└── Cross-Component Integration

Integration Tests (React Testing Library)
├── Component + Store Integration
├── API Integration
└── Hook Integration

Unit Tests (Jest)
├── Component Logic
├── Utility Functions
└── Store Actions
```

### 2. Component Testing Patterns
```typescript
// Component Testing with RTL
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

test('should handle document creation', async () => {
  renderWithProviders(<DocumentCreator />);

  fireEvent.click(screen.getByRole('button', { name: /create document/i }));

  expect(await screen.findByText('Document created')).toBeInTheDocument();
});
```

### 3. Store Testing Patterns
```typescript
// Store Testing
import { renderHook, act } from '@testing-library/react';

test('should update document correctly', () => {
  const { result } = renderHook(() => useDocumentStore());

  act(() => {
    result.current.addDocument(mockDocument);
  });

  expect(result.current.documents).toContain(mockDocument);

  act(() => {
    result.current.updateDocument(mockDocument.id, { title: 'Updated' });
  });

  expect(result.current.documents[0].title).toBe('Updated');
});
```

## Build and Deployment Architecture

### 1. Build Optimization
```typescript
// Vite Configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          utils: ['lodash', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand']
  }
});
```

### 2. Environment Configuration
```typescript
// Environment-specific Configuration
interface EnvironmentConfig {
  API_BASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  OPENAI_API_KEY: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

const getConfig = (): EnvironmentConfig => {
  return {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    ENVIRONMENT: import.meta.env.MODE as any
  };
};
```

## Accessibility Architecture

### 1. WCAG 2.1 AA Compliance
```typescript
// Accessibility Patterns
const AccessibleButton = ({ children, onClick, ariaLabel, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {children}
    </button>
  );
};

// Screen Reader Support
const useScreenReader = () => {
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, []);

  return { announceToScreenReader };
};
```

### 2. Keyboard Navigation
```typescript
// Keyboard Navigation Patterns
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(items[focusedIndex]);
        break;
    }
  }, [items, focusedIndex, onSelect]);

  return { focusedIndex, handleKeyDown };
};
```

## Cross-References

### Related Documentation
- **Backend Architecture**: [../../backend/docs/](../../backend/docs/) for backend integration
- **Security Strategy**: [../../docs/security/](../../docs/security/) for security architecture
- **Components**: [../components/](../components/) for component implementation
- **State Management**: [../state/](../state/) for state architecture details

### Source Code References
- **Architecture Files**: [/src/](../../../src/)
- **Configuration**: [/vite.config.ts](../../../vite.config.ts)
- **Type Definitions**: [/src/types/](../../../src/types/)

## Architectural Decision Records (ADRs)

### ADR-001: State Management Library Selection
**Decision**: Zustand over Redux Toolkit
**Rationale**: Simpler API, better TypeScript support, smaller bundle size
**Consequences**: Reduced boilerplate, easier testing, learning curve for team

### ADR-002: Build Tool Selection
**Decision**: Vite over Create React App
**Rationale**: Faster development server, better ES modules support, smaller bundle
**Consequences**: Improved DX, faster builds, potential compatibility issues

### ADR-003: CSS Framework Selection
**Decision**: TailwindCSS over Styled Components
**Rationale**: Utility-first approach, consistent design system, smaller runtime
**Consequences**: Faster development, consistent styling, initial learning curve

## Best Practices

### Code Organization
- Feature-based directory structure
- Consistent naming conventions
- Proper TypeScript usage
- Comprehensive documentation

### Performance
- Implement proper memoization
- Use code splitting strategically
- Monitor bundle sizes
- Optimize re-render cycles

### Security
- Validate all inputs
- Implement proper authentication
- Use Content Security Policy
- Regular security audits

### Testing
- Maintain high test coverage
- Test user interactions
- Mock external dependencies
- Automated testing pipeline

Last updated: 2025-09-22