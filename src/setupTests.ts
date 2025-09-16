import '@testing-library/jest-dom';

/**
 * Setup for React Testing Library with Zustand store mocking
 */

// Create mock Zustand stores for testing
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

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for component tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for scroll-based components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Apply console filtering if available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((global as any).setupConsoleFiltering) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).setupConsoleFiltering();
}

// Setup beforeAll and afterAll for console restoration
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((global as any).setupConsoleFiltering) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).setupConsoleFiltering();
  }
});

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((global as any).restoreConsole) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).restoreConsole();
  }
});
