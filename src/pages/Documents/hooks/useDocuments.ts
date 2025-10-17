/**
 * Documents state management hook
 * T-49-ST1: Document listing state and API integration
 */

import { useState, useEffect, useCallback } from 'react';
import documentsAPI, { DocumentResponse, DocumentListParams } from '@api/documents-api';

interface UseDocumentsState {
  documents: DocumentResponse[];
  total: number;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  filters: {
    fileType?: string;
    status?: string;
  };
}

const buildApiParams = (
  currentPage: number,
  pageSize: number,
  filters: { fileType?: string; status?: string }
): DocumentListParams => ({
  limit: pageSize,
  offset: (currentPage - 1) * pageSize,
  ...filters,
});

// eslint-disable-next-line max-lines-per-function
export const useDocuments = (token: string | null) => {
  const [state, setState] = useState<UseDocumentsState>({
    documents: [],
    total: 0,
    isLoading: false,
    error: null,
    currentPage: 1,
    pageSize: 20,
    filters: {},
  });

  const fetchDocuments = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = buildApiParams(state.currentPage, state.pageSize, state.filters);
      const response = await documentsAPI.listDocuments(token, params);

      setState(prev => ({
        ...prev,
        documents: response.documents,
        total: response.total,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch documents',
        isLoading: false,
      }));
    }
  }, [token, state.currentPage, state.pageSize, state.filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    ...state,
    setPage: useCallback((page: number) => setState(prev => ({ ...prev, currentPage: page })), []),
    setPageSize: useCallback(
      (size: number) => setState(prev => ({ ...prev, pageSize: size, currentPage: 1 })),
      []
    ),
    setFilters: useCallback(
      (filters: { fileType?: string; status?: string }) =>
        setState(prev => ({ ...prev, filters, currentPage: 1 })),
      []
    ),
    clearError: useCallback(() => setState(prev => ({ ...prev, error: null })), []),
    refresh: fetchDocuments,
  };
};
