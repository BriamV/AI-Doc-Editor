/**
 * Environment variable utilities for Vite and Jest compatibility
 */

/**
 * Get environment variable with Jest/Vite/Browser compatibility
 * In Jest: uses process.env (set in jest.setup.ts)
 * In Vite/Browser: uses import.meta.env for proper browser compatibility
 * In E2E/Cypress: provides fallback handling for browser context
 */
export const getEnvVar = (key: string): string | undefined => {
  // Check if running in browser context (E2E tests, production)
  if (typeof window !== 'undefined') {
    // Browser context - use import.meta.env
    // eslint-disable-next-line security/detect-object-injection
    return (import.meta.env as Record<string, string | undefined>)[key];
  }

  // Check if process is available (Node.js context - Jest tests)
  if (typeof process !== 'undefined') {
    // In test environment, use process.env which is set up in jest.setup.ts
    if (typeof jest !== 'undefined' || process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line security/detect-object-injection
      return process.env[key];
    }

    // In non-test Node.js environment, fallback to process.env
    // eslint-disable-next-line security/detect-object-injection
    return process.env[key];
  }

  // Ultimate fallback - return undefined if no environment access
  return undefined;
};
