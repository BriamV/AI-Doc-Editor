/**
 * Environment variable utilities for Vite and Jest compatibility
 */

/**
 * Get environment variable with Jest/Vite compatibility
 * In Jest: uses process.env (set in jest.setup.ts)
 * In Vite: this should be replaced by direct import.meta.env calls in production code
 */
export const getEnvVar = (key: string): string | undefined => {
  // In test environment, use process.env which is set up in jest.setup.ts
  if (typeof jest !== 'undefined' || process.env.NODE_ENV === 'test') {
    return process.env[key];
  }
  
  // In non-test environment, fallback to process.env
  // Note: In production Vite builds, these calls should be replaced
  // with direct import.meta.env references for optimal tree-shaking
  return process.env[key];
};