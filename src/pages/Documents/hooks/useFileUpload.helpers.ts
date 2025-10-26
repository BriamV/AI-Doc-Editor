/**
 * File Upload Helper Functions
 * T-49-ST2: Extracted helper functions for file upload logic
 */

import { getEnvVar } from '@utils/env';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
];
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.md'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResponse {
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
}

export interface UploadOptions {
  token: string;
  onProgress: (progress: number) => void;
  consentGiven: boolean;
  retryWithNewToken?: (newToken: string) => Promise<UploadResponse>;
}

/**
 * Validate file type and size
 */
export const validateFile = (file: File): string | null => {
  if (
    !ALLOWED_FILE_TYPES.includes(file.type) &&
    !ALLOWED_EXTENSIONS.some(ext => file.name.endsWith(ext))
  ) {
    return `Invalid file type. Only PDF, DOCX, and MD files are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`;
  }
  return null;
};

/**
 * Maps backend error status codes to user-friendly messages
 */
export const getErrorMessage = (status: number, defaultMessage: string): string => {
  switch (status) {
    case 400:
      return 'Invalid file type. Please upload PDF, DOCX, or MD files.';
    case 401:
    case 403:
      return 'Session expired. Please login again.';
    case 413:
      return 'File is too large. Maximum size is 10MB.';
    case 500:
      return 'Upload failed. Please try again.';
    default:
      return defaultMessage;
  }
};

/**
 * Type guard for 401 retry error
 */
export const is401RetryError = (error: unknown): error is { status: number; needsRetry: boolean } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  'needsRetry' in error &&
  (error as { status: number }).status === 401;

/**
 * Parse error response from backend
 */
const parseErrorResponse = async (response: Response): Promise<{ detail: string }> => {
  const errorText = await response.text();
  try {
    return JSON.parse(errorText);
  } catch {
    return { detail: errorText };
  }
};

/**
 * Upload file to backend API
 */
export const uploadToBackend = async (
  file: File,
  options: UploadOptions
): Promise<UploadResponse> => {
  const { token, onProgress, consentGiven, retryWithNewToken } = options;
  const API_BASE_URL = getEnvVar('VITE_API_BASE_URL');
  if (!API_BASE_URL) {
    throw new Error('API base URL not configured');
  }

  // Prepare FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('consent_given', consentGiven.toString());

  // Start progress simulation for better UX
  const progressInterval = setInterval(() => {
    onProgress(90); // Cap at 90% until response
  }, 200);

  try {
    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);

      // Handle 401 with automatic retry if callback provided
      if (response.status === 401 && retryWithNewToken) {
        throw { status: 401, needsRetry: true };
      }

      const errorMsg = getErrorMessage(
        response.status,
        errorData.detail || 'Upload failed. Please try again.'
      );
      throw new Error(errorMsg);
    }

    return await response.json();
  } finally {
    clearInterval(progressInterval);
  }
};

interface UploadWithRetryOptions {
  file: File;
  token: string;
  refreshAccessToken: () => Promise<string | null>;
  setProgress: (value: number | ((prev: number) => number)) => void;
  consentGiven: boolean;
}

/**
 * Upload file with automatic token refresh retry on 401
 */
export const uploadWithRetry = async (options: UploadWithRetryOptions): Promise<UploadResponse> => {
  const { file, token, refreshAccessToken, setProgress, consentGiven } = options;

  const progressHandler = (progress: number) => {
    setProgress(prev => Math.max(prev, progress));
  };

  try {
    return await uploadToBackend(file, {
      token,
      onProgress: progressHandler,
      consentGiven,
    });
  } catch (err: unknown) {
    if (!is401RetryError(err)) throw err;

    console.log('🔄 Token expired, attempting refresh...');
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error('Session expired. Please login again.');

    console.log('✅ Token refreshed, retrying upload...');
    return await uploadToBackend(file, {
      token: newToken,
      onProgress: progressHandler,
      consentGiven,
    });
  }
};
