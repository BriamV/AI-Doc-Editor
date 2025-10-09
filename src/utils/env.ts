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
    ((typeof globalThis !== 'undefined' && 'vi' in globalThis) || process.env.NODE_ENV === 'test')
  ) {
    // In test environment, use process.env which is set up in jest.setup.ts
    // eslint-disable-next-line security/detect-object-injection
    const value = process.env[key];
    console.log(`[getEnvVar TEST] ${key} = ${value}`);
    return value;
  }

  // In Vite/Browser: use import.meta.env directly (Vite requires static access)
  // This works because Vite performs static analysis and replaces these at build time
  if (typeof window !== 'undefined') {
    try {
      // Direct access to import.meta.env (required for Vite's static analysis)
      // eslint-disable-next-line security/detect-object-injection
      const value = import.meta.env[key];
      console.log(`[getEnvVar VITE] ${key} = ${value}`);
      return value as string | undefined;
    } catch (e) {
      // If import.meta is not available (shouldn't happen in Vite)
      console.log(`[getEnvVar VITE] Failed to access import.meta.env for ${key}:`, e);
    }
  }

  // Fallback to process.env if available (Node.js context)
  if (typeof process !== 'undefined' && process.env) {
    // eslint-disable-next-line security/detect-object-injection
    const value = process.env[key];
    console.log(`[getEnvVar FALLBACK] ${key} = ${value}`);
    return value;
  }

  // Ultimate fallback - return undefined if no environment access
  console.log(`[getEnvVar UNDEFINED] ${key} = undefined (no env access)`);
  return undefined;
};
