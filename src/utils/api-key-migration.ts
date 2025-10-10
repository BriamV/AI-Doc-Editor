/**
 * API Key Migration Utility
 * Migrates API keys from localStorage to backend storage
 * This runs once when a user logs in for the first time
 */

import { credentialsAPI } from '@api/credentials-api';
import useStore from '@store/store';

const MIGRATION_FLAG = 'api_key_migrated_to_backend';

/**
 * Check if API key migration has already been completed
 */
export const isMigrationCompleted = (): boolean => {
  return localStorage.getItem(MIGRATION_FLAG) === 'true';
};

/**
 * Mark migration as completed
 */
const markMigrationCompleted = (): void => {
  localStorage.setItem(MIGRATION_FLAG, 'true');
};

/**
 * Migrate API key from localStorage to backend storage
 * Should be called once after user authentication
 *
 * @param token - JWT access token
 * @returns Promise<boolean> - true if migration was successful or not needed, false if failed
 */
export const migrateApiKeyToBackend = async (token: string): Promise<boolean> => {
  // Check if already migrated
  if (isMigrationCompleted()) {
    console.log('API key migration already completed, skipping...');
    return true;
  }

  try {
    // Get API key from store (which reads from localStorage)
    const apiKey = useStore.getState().apiKey;

    // If no API key exists locally, just mark as migrated
    if (!apiKey || apiKey.length === 0) {
      console.log('No local API key found, marking migration as complete');
      markMigrationCompleted();
      return true;
    }

    // Check if backend already has an API key
    const status = await credentialsAPI.getApiKeyStatus(token);

    if (status.has_api_key) {
      console.log('Backend already has API key, marking migration as complete');
      markMigrationCompleted();
      return true;
    }

    // Validate API key format before migrating
    if (!apiKey.startsWith('sk-')) {
      console.warn('Local API key has invalid format, skipping migration');
      markMigrationCompleted();
      return true;
    }

    // Migrate the API key to backend
    console.log('Migrating API key to backend storage...');
    await credentialsAPI.saveApiKey(token, apiKey);
    console.log('API key successfully migrated to backend');

    // Mark migration as completed
    markMigrationCompleted();

    return true;
  } catch (error) {
    console.error('Failed to migrate API key to backend:', error);
    // Don't mark as complete if migration failed, allow retry on next login
    return false;
  }
};

/**
 * Reset migration flag (useful for testing or if migration needs to be re-run)
 */
export const resetMigrationFlag = (): void => {
  localStorage.removeItem(MIGRATION_FLAG);
};
