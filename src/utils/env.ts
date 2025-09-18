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
  // Check if running in test environment first (Jest)
  if (
    typeof process !== 'undefined' &&
    (typeof jest !== 'undefined' || process.env.NODE_ENV === 'test')
  ) {
    // In test environment, use process.env which is set up in jest.setup.ts
    // eslint-disable-next-line security/detect-object-injection
    return process.env[key];
  }

  // Check if running in browser context and try to access import.meta dynamically
  if (typeof window !== 'undefined') {
    try {
      // Use dynamic access to avoid Jest parsing issues with import.meta
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const importMeta = (globalThis as any).import?.meta || (window as any).import?.meta;
      if (importMeta && importMeta.env) {
        // eslint-disable-next-line security/detect-object-injection
        return importMeta.env[key];
      }
    } catch {
      // If import.meta is not available, fall through to process.env
    }
  }

  // Fallback to process.env if available (Node.js context)
  if (typeof process !== 'undefined' && process.env) {
    // eslint-disable-next-line security/detect-object-injection
    return process.env[key];
  }

  // Ultimate fallback - return undefined if no environment access
  return undefined;
};
