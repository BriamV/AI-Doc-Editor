/**
 * Credentials API client
 * T-41: User API key management with backend storage
 */

import { getEnvVar } from '@utils/env';

const API_BASE_URL = getEnvVar('VITE_API_BASE_URL') || 'http://localhost:8000/api';

export interface ApiKeyStatus {
  has_api_key: boolean;
  key_preview?: string;
}

export interface SaveApiKeyRequest {
  openai_api_key: string;
}

export interface SaveApiKeyResponse {
  has_api_key: boolean;
  key_preview: string;
  message: string;
}

class CredentialsAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/user/credentials`;
  }

  /**
   * Get API key status
   * Returns whether user has configured an API key and a preview if available
   */
  async getApiKeyStatus(token: string): Promise<ApiKeyStatus> {
    const response = await fetch(this.baseURL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 402) {
      // No API key configured
      return { has_api_key: false };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch API key status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Save or update OpenAI API key
   * Key is encrypted on the backend before storage
   */
  async saveApiKey(token: string, apiKey: string): Promise<SaveApiKeyResponse> {
    if (!apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format. Key must start with "sk-"');
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ openai_api_key: apiKey }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save API key');
    }

    return response.json();
  }

  /**
   * Delete API key
   * Removes the stored API key from backend
   */
  async deleteApiKey(token: string): Promise<void> {
    const response = await fetch(this.baseURL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete API key');
    }
  }
}

export const credentialsAPI = new CredentialsAPI();
