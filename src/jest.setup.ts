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

// Mock window.location for tests with proper structure
if (typeof window !== 'undefined') {
  delete (window as any).location;
  (window as any).location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };
}

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Setup console filtering (will be applied in setupTests.ts)
const setupConsoleFiltering = () => {
  // Suppress specific warnings/errors in tests
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') ||
        message.includes('Warning: componentWillMount') ||
        message.includes('act(...) is not supported') ||
        message.includes('Not implemented: navigation'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('componentWillReceiveProps') ||
       message.includes('ts-jest[ts-jest-transformer]'))
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
(global as any).setupConsoleFiltering = setupConsoleFiltering;
(global as any).restoreConsole = restoreConsole;

// Mock IndexedDB for browser storage tests
if (typeof global !== 'undefined') {
  const mockIDB = {
    open: jest.fn().mockReturnValue(Promise.resolve({})),
    deleteDatabase: jest.fn().mockReturnValue(Promise.resolve()),
  };

  (global as any).indexedDB = mockIDB;
  (global as any).IDBDatabase = jest.fn();
  (global as any).IDBObjectStore = jest.fn();
  (global as any).IDBRequest = jest.fn();
  (global as any).IDBKeyRange = {
    bound: jest.fn(),
    only: jest.fn(),
    lowerBound: jest.fn(),
    upperBound: jest.fn(),
  };
}

// Export to make this file a module for TypeScript
export {};