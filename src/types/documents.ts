/**
 * Type definitions for document search functionality
 * T-04: RAG Pipeline - Frontend search UI types
 */

/**
 * Search request payload
 */
export interface DocumentSearchRequest {
  query: string;
  limit?: number;
  collection_name?: string;
}

/**
 * Single search result chunk from RAG query
 */
export interface SearchResultChunk {
  id: string;
  text: string;
  distance: number;
  metadata: {
    document_id: string;
    chunk_index: number;
    source: string;
    [key: string]: unknown;
  };
  document_id: string;
  chunk_index: number;
}

/**
 * Search response from backend
 */
export interface DocumentSearchResponse {
  query: string;
  results_count: number;
  chunks: SearchResultChunk[];
  collection: string;
}

/**
 * Search error response
 */
export interface SearchError {
  detail: string;
  status_code?: number;
}
