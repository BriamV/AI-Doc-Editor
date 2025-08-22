import '@testing-library/jest-dom';

/**
 * Setup for React Testing Library with Zustand store mocking
 */

// Create mock Zustand stores for testing
const createMockStore = (initialState: any) => {
  let state = initialState;
  const listeners = new Set<Function>();

  return {
    getState: () => state,
    setState: (newState: any) => {
      state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: Function) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ...initialState,
  };
};

// Make createMockStore available globally for tests
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
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for scroll-based components
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Apply console filtering if available
if ((global as any).setupConsoleFiltering) {
  (global as any).setupConsoleFiltering();
}

// Setup beforeAll and afterAll for console restoration
beforeAll(() => {
  if ((global as any).setupConsoleFiltering) {
    (global as any).setupConsoleFiltering();
  }
});

afterAll(() => {
  if ((global as any).restoreConsole) {
    (global as any).restoreConsole();
  }
});
