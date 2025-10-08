/**
 * Documents API client
 * T-49: Document Library UI - Knowledge Base Management
 */

import { getEnvVar } from '@utils/env';

const API_BASE_URL = getEnvVar('VITE_API_BASE_URL') || 'http://localhost:8000/api';

export interface DocumentResponse {
  id: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  title: string | null;
  description: string | null;
  status: 'processing' | 'completed' | 'failed';
  user_id: string;
  user_email: string;
  uploaded_at: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentListParams {
  file_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

class DocumentsAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/documents`;
  }

  /**
   * Get list of user documents with optional filters
   * T-49-ST1: Document listing endpoint integration
   */
  async listDocuments(token: string, params?: DocumentListParams): Promise<DocumentListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.file_type) queryParams.append('file_type', params.file_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseURL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch documents');
    }

    return response.json();
  }

  /**
   * Get a single document by ID
   * T-49-ST1: Document detail endpoint integration
   */
  async getDocument(token: string, documentId: string): Promise<DocumentResponse> {
    const response = await fetch(`${this.baseURL}/${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch document');
    }

    return response.json();
  }
}

export default new DocumentsAPI();
