import { getEnvVar } from '../utils/env';

/**
 * @deprecated - No longer used. All API calls go through backend proxy at /api/chat/completions
 * These constants are kept for backward compatibility but are not actively used in the UI.
 */
export const officialAPIEndpoint = 'https://api.openai.com/v1/chat/completions';

/**
 * @deprecated - No longer used. All API calls go through backend proxy at /api/chat/completions
 */
const customAPIEndpoint = getEnvVar('VITE_CUSTOM_API_ENDPOINT') || '';

/**
 * @deprecated - No longer used. All API calls go through backend proxy at /api/chat/completions
 */
export const defaultAPIEndpoint = getEnvVar('VITE_DEFAULT_API_ENDPOINT') || officialAPIEndpoint;

/**
 * @deprecated - No longer used. All API calls go through backend proxy at /api/chat/completions
 */
export const availableEndpoints = [officialAPIEndpoint, customAPIEndpoint];
