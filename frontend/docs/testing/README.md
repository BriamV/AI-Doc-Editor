# Frontend Testing Documentation

This directory contains comprehensive testing strategies, procedures, and best practices for the AI Document Editor frontend, covering unit testing, integration testing, and end-to-end testing approaches.

## Testing Strategy Overview

### Testing Pyramid Architecture

#### 🔬 **Unit Tests (Jest) - Foundation Layer**
- **Component Logic**: Individual component behavior testing
- **Custom Hooks**: Hook functionality and edge cases
- **Utility Functions**: Pure function testing
- **Store Actions**: State management logic validation

#### 🔗 **Integration Tests (React Testing Library) - Middle Layer**
- **Component + Store Integration**: Component-state interaction
- **API Integration**: Frontend-backend communication
- **Hook Composition**: Multiple hook interactions
- **User Workflow Testing**: Multi-component user journeys

#### 🌐 **End-to-End Tests (Playwright) - Top Layer**
- **Critical User Journeys**: Complete application workflows
- **Authentication Flows**: Login, logout, and session management
- **Cross-Browser Testing**: Multi-browser compatibility
- **Performance Testing**: Load time and interaction metrics

## Testing Framework Configuration

### Jest Configuration (Unit Tests)
```typescript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### React Testing Library Setup
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Playwright Configuration (E2E Tests)
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

## Unit Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentCreator } from './DocumentCreator';
import { TestWrapper } from '../../test/TestWrapper';

describe('DocumentCreator', () => {
  const renderComponent = (props = {}) => {
    return render(
      <TestWrapper>
        <DocumentCreator {...props} />
      </TestWrapper>
    );
  };

  test('should render document creation form', () => {
    renderComponent();

    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  test('should handle form submission', async () => {
    const onCreateMock = jest.fn();
    renderComponent({ onCreate: onCreateMock });

    fireEvent.change(screen.getByLabelText(/document title/i), {
      target: { value: 'Test Document' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(onCreateMock).toHaveBeenCalledWith({
      title: 'Test Document',
      content: ''
    });
  });

  test('should display validation errors', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAddDocument } from './useAddDocument';
import { TestWrapper } from '../../test/TestWrapper';

describe('useAddDocument', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper>{children}</TestWrapper>
  );

  test('should add document successfully', async () => {
    const { result } = renderHook(() => useAddDocument(), { wrapper });

    await act(async () => {
      await result.current.addDocument({
        title: 'Test Document',
        content: 'Test content'
      });
    });

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].title).toBe('Test Document');
  });

  test('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useAddDocument(), { wrapper });

    await act(async () => {
      try {
        await result.current.addDocument({
          title: '', // Invalid title
          content: 'Test content'
        });
      } catch (error) {
        expect(error.message).toContain('Title is required');
      }
    });
  });
});
```

### Store Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useDocumentStore } from './document-slice';

describe('DocumentStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useDocumentStore.getState().reset();
  });

  test('should add document to store', () => {
    const { result } = renderHook(() => useDocumentStore());

    act(() => {
      result.current.addDocument({
        id: '1',
        title: 'Test Document',
        content: 'Test content'
      });
    });

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].id).toBe('1');
  });

  test('should update document in store', () => {
    const { result } = renderHook(() => useDocumentStore());

    act(() => {
      result.current.addDocument({
        id: '1',
        title: 'Original Title',
        content: 'Original content'
      });
    });

    act(() => {
      result.current.updateDocument('1', {
        title: 'Updated Title'
      });
    });

    expect(result.current.documents[0].title).toBe('Updated Title');
    expect(result.current.documents[0].content).toBe('Original content');
  });
});
```

## Integration Testing Patterns

### Component + Store Integration
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentList } from './DocumentList';
import { TestWrapper } from '../../test/TestWrapper';
import { useDocumentStore } from '../../store/document-slice';

describe('DocumentList Integration', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset();
  });

  test('should display documents from store', () => {
    const mockDocuments = [
      { id: '1', title: 'Document 1', content: 'Content 1' },
      { id: '2', title: 'Document 2', content: 'Content 2' }
    ];

    // Pre-populate store
    useDocumentStore.getState().setDocuments(mockDocuments);

    render(
      <TestWrapper>
        <DocumentList />
      </TestWrapper>
    );

    expect(screen.getByText('Document 1')).toBeInTheDocument();
    expect(screen.getByText('Document 2')).toBeInTheDocument();
  });

  test('should handle document selection', async () => {
    const mockDocuments = [
      { id: '1', title: 'Document 1', content: 'Content 1' }
    ];

    useDocumentStore.getState().setDocuments(mockDocuments);

    render(
      <TestWrapper>
        <DocumentList />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Document 1'));

    await waitFor(() => {
      expect(useDocumentStore.getState().currentDocument?.id).toBe('1');
    });
  });
});
```

### API Integration Testing
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '../../test/mocks/server';
import { rest } from 'msw';
import { DocumentDashboard } from './DocumentDashboard';
import { TestWrapper } from '../../test/TestWrapper';

describe('DocumentDashboard API Integration', () => {
  test('should fetch and display documents', async () => {
    server.use(
      rest.get('/api/documents', (req, res, ctx) => {
        return res(
          ctx.json([
            { id: '1', title: 'API Document', content: 'API Content' }
          ])
        );
      })
    );

    render(
      <TestWrapper>
        <DocumentDashboard />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('API Document')).toBeInTheDocument();
    });
  });

  test('should handle API errors', async () => {
    server.use(
      rest.get('/api/documents', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <TestWrapper>
        <DocumentDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading documents/i)).toBeInTheDocument();
    });
  });
});
```

## End-to-End Testing Patterns

### Authentication Flow Testing
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should display error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Then logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');
  });
});
```

### Document Management E2E
```typescript
// e2e/documents.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
  });

  test('should create new document', async ({ page }) => {
    await page.goto('/dashboard');

    await page.click('[data-testid="create-document-button"]');
    await page.fill('[data-testid="document-title"]', 'E2E Test Document');
    await page.fill('[data-testid="document-content"]', 'This is test content');
    await page.click('[data-testid="save-document-button"]');

    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      'Document created successfully'
    );

    await expect(page.locator('[data-testid="document-list"]')).toContainText(
      'E2E Test Document'
    );
  });

  test('should edit existing document', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on existing document
    await page.click('[data-testid="document-item"]:first-child');

    // Edit content
    await page.fill('[data-testid="document-content"]', 'Updated content');
    await page.click('[data-testid="save-document-button"]');

    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      'Document updated successfully'
    );
  });
});
```

### Chat Interface E2E
```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
  });

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/chat');

    await page.fill('[data-testid="chat-input"]', 'Hello, AI assistant!');
    await page.click('[data-testid="send-button"]');

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({
      timeout: 10000
    });

    await expect(page.locator('[data-testid="chat-messages"]')).toContainText(
      'Hello, AI assistant!'
    );
  });

  test('should clear chat history', async ({ page }) => {
    await page.goto('/chat');

    // Send a message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Clear chat
    await page.click('[data-testid="clear-chat-button"]');

    await expect(page.locator('[data-testid="chat-messages"]')).toBeEmpty();
  });
});
```

## Test Utilities and Helpers

### Test Wrapper Component
```typescript
// src/test/TestWrapper.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast/ToastProvider';

interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
}) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
```

### Mock Service Worker Setup
```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'mock-token',
        user: { id: 1, email: 'test@example.com' }
      })
    );
  }),

  rest.get('/api/documents', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', title: 'Mock Document', content: 'Mock content' }
      ])
    );
  }),

  rest.post('/api/documents', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '2',
        title: 'New Document',
        content: 'New content'
      })
    );
  })
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Custom Testing Hooks
```typescript
// src/test/hooks/useTestAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '../../store/auth-slice';

export const useTestAuth = (user = null) => {
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    if (user) {
      setUser(user);
    } else {
      clearUser();
    }

    return () => clearUser();
  }, [user, setUser, clearUser]);
};
```

## Performance Testing

### Load Testing with Playwright
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('should load dashboard within acceptable time', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/dashboard');

  await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 seconds max
});

test('should handle large document list efficiently', async ({ page }) => {
  await page.goto('/documents');

  // Measure render time for large list
  const startTime = Date.now();
  await page.locator('[data-testid="document-list"]').waitFor();
  const renderTime = Date.now() - startTime;

  expect(renderTime).toBeLessThan(1000); // 1 second max
});
```

## Testing Best Practices

### Code Coverage Requirements
- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User journeys covered

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Clean up after each test

### Test Data Management
- Use factories for test data creation
- Mock external dependencies
- Reset state between tests
- Use realistic test data

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Cross-References

### Related Documentation
- **Components**: [../components/](../components/) for component testing patterns
- **State Management**: [../state/](../state/) for store testing strategies
- **API Layer**: [../api/](../api/) for API testing approaches
- **Architecture**: [../architecture/](../architecture/) for testing architecture

### Source Code References
- **Test Files**: [/src/**/*.test.ts](../../../src/)
- **E2E Tests**: [/e2e/](../../../e2e/)
- **Test Utilities**: [/src/test/](../../../src/test/)

## Maintenance Guidelines

### Test Maintenance
- Update tests when components change
- Maintain test data factories
- Review and update mock data
- Monitor test performance

### Quality Metrics
- Track test coverage trends
- Monitor test execution time
- Identify flaky tests
- Regular test suite cleanup

Last updated: 2025-09-22