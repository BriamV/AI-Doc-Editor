import { getEnvVar } from '../utils/env';

export const officialAPIEndpoint = 'https://api.openai.com/v1/chat/completions';
const customAPIEndpoint = getEnvVar('VITE_CUSTOM_API_ENDPOINT') || '';
export const defaultAPIEndpoint = getEnvVar('VITE_DEFAULT_API_ENDPOINT') || officialAPIEndpoint;

export const availableEndpoints = [officialAPIEndpoint, customAPIEndpoint];
