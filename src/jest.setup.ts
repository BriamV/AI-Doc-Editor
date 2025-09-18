/**
 * Jest setup file - handles Vite import.meta.env and global mocks
 */

// Mock import.meta.env for Jest compatibility with Vite
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

// Set up process.env for Jest to match Vite environment variables
process.env.VITE_BACKEND_URL = 'http://localhost:8000';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.VITE_ENVIRONMENT = 'test';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
process.env.MODE = 'test';

// Define import.meta globally for Jest - more robust approach
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
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response)
  );
}

// Mock window.location for tests - keep it simple to avoid JSDOM issues
// The navigation error will be suppressed by console filtering below

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Setup console filtering (will be applied in setupTests.ts)
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

// Export setup functions for use in setupTests.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).setupConsoleFiltering = setupConsoleFiltering;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).restoreConsole = restoreConsole;

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
    open: jest.fn().mockReturnValue(Promise.resolve({})),
    deleteDatabase: jest.fn().mockReturnValue(Promise.resolve()),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).indexedDB = mockIDB;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBDatabase = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBObjectStore = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBRequest = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IDBKeyRange = {
    bound: jest.fn(),
    only: jest.fn(),
    lowerBound: jest.fn(),
    upperBound: jest.fn(),
  };
}

// Export to make this file a module for TypeScript
export {};
