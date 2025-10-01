/**
 * Vitest setup file - handles Vite import.meta.env and global mocks
 * Migrated from Jest setup for Vitest compatibility
 */

import '@testing-library/jest-dom';

// Mock import.meta.env for Vitest compatibility
const mockImportMeta = {
  env: {
    MODE: 'test',
    DEV: true,
    PROD: false,
    BASE_URL: '/',
    VITE_BACKEND_URL: 'http://localhost:8000',
    VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
    VITE_ENVIRONMENT: 'test',
    VITE_OPENAI_API_KEY: 'test-openai-key',
  },
};

// Set up process.env for Vitest to match Vite environment variables
process.env.VITE_BACKEND_URL = 'http://localhost:8000';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.VITE_ENVIRONMENT = 'test';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
process.env.MODE = 'test';

// Define import.meta globally for Vitest - more robust approach
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: mockImportMeta,
  },
  writable: true,
  configurable: true,
});

// Also set on global for broader compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).import = {
  meta: mockImportMeta,
};

// Mock fetch globally if not available
if (!global.fetch) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response)
  );
}

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for component tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for scroll-based components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Create mock Zustand stores for testing (migrated from Jest setup)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockStore = (initialState: any) => {
  let state = initialState;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const listeners = new Set<Function>();

  return {
    getState: () => state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setState: (newState: any) => {
      state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
      listeners.forEach(listener => listener());
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    subscribe: (listener: Function) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ...initialState,
  };
};

// Make createMockStore available globally for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).createMockStore = createMockStore;

// Mock TextEncoder/TextDecoder for Node.js compatibility
if (typeof global !== 'undefined') {
  if (!global.TextEncoder) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }
}

// Mock IndexedDB for browser storage tests
if (typeof global !== 'undefined') {
  const mockIDB = {
    open: vi.fn().mockReturnValue(Promise.resolve({})),
    deleteDatabase: vi.fn().mockReturnValue(Promise.resolve()),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).indexedDB = mockIDB;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBDatabase = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBObjectStore = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBRequest = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBKeyRange = {
    bound: vi.fn(),
    only: vi.fn(),
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
  };
}

// Console filtering for test noise reduction (Vitest-compatible)
const originalError = console.error;
const originalWarn = console.warn;

// Setup console filtering for test environment
const setupConsoleFiltering = () => {
  // Suppress specific warnings/errors in tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') ||
        message.includes('Warning: componentWillMount') ||
        message.includes('act(...) is not supported') ||
        message.includes('Not implemented: navigation') ||
        message.includes('Warning: An update to') ||
        message.includes('was not wrapped in act') ||
        message.includes('validateDOMNesting'))
    ) {
      return;
    }
    // Also suppress Error objects with navigation type
    if (
      args[0] instanceof Error &&
      args[0].message &&
      args[0].message.includes('Not implemented: navigation')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('componentWillReceiveProps') ||
        message.includes('ts-jest[ts-jest-transformer]') ||
        message.includes('ts-jest[config]') ||
        message.includes('Define `ts-jest` config under `globals` is deprecated'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
};

const restoreConsole = () => {
  console.error = originalError;
  console.warn = originalWarn;
};

// Apply console filtering immediately
setupConsoleFiltering();

// Setup beforeAll and afterAll for console restoration
beforeAll(() => {
  setupConsoleFiltering();
});

afterAll(() => {
  restoreConsole();
});

// Export to make this file a module for TypeScript
export {};
