import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import useStore from '@store/store';
import documentsAPI from '@api/documents-api';
import type { DocumentSearchResponse, SearchResultChunk } from '@type/documents';
import SearchResultCard from './SearchResultCard';

/**
 * Document Search Component
 * T-04: RAG Pipeline - Frontend search UI
 *
 * Features:
 * - Semantic search with debouncing (300ms)
 * - Real-time results with relevance scores
 * - Loading and error states
 * - Empty state handling
 * - Minimum 3 characters validation
 * - Enter key support
 */
const DocumentSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const accessToken = useStore(state => state.accessToken);
  const setToastShow = useStore(state => state.setToastShow);
  const setToastMessage = useStore(state => state.setToastMessage);
  const setToastStatus = useStore(state => state.setToastStatus);

  /**
   * Execute search query
   */
  const executeSearch = useCallback(
    async (searchQuery: string) => {
      // Validate minimum length
      if (searchQuery.length < 3) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        return;
      }

      if (!accessToken) {
        setError('Authentication required. Please log in.');
        setToastMessage('Authentication required');
        setToastStatus('error');
        setToastShow(true);
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response: DocumentSearchResponse = await documentsAPI.searchDocuments(
          accessToken,
          {
            query: searchQuery,
            limit: 5,
            collection_name: 'documents',
          }
        );

        setResults(response.chunks);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Search failed';

        // Handle specific error types
        if (errorMessage.includes('API key')) {
          setError('API key not configured. Please add your OpenAI API key in settings.');
          setToastStatus('warning');
        } else if (errorMessage.includes('402')) {
          setError('API key not configured. Please add your OpenAI API key in settings.');
          setToastStatus('warning');
        } else if (errorMessage.includes('500')) {
          setError('Search service unavailable. Please try again later.');
          setToastStatus('error');
        } else {
          setError(errorMessage);
          setToastStatus('error');
        }

        setToastMessage(errorMessage);
        setToastShow(true);
        setResults([]);
      }
    },
    [accessToken, setToastMessage, setToastShow, setToastStatus]
  );

  /**
   * Debounced search (300ms delay)
   */
  const debouncedSearch = useRef(
    debounce((searchQuery: string) => {
      executeSearch(searchQuery);
    }, 300)
  ).current;

  /**
   * Cleanup debounce on unmount
   */
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      debouncedSearch.cancel();
      executeSearch(query);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-4">
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search documents... (min 3 characters)"
            className="w-full px-4 py-3 text-gray-800 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-3">
              <LoadingSpinner />
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Press Enter to search or wait 300ms for auto-search
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="large" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <EmptyState query={query} />
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Search Results ({results.length})
            </h2>
          </div>
          {results.map((chunk, index) => (
            <SearchResultCard key={chunk.id || index} chunk={chunk} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ size = 'small' }: { size?: 'small' | 'large' }) => {
  const sizeClass = size === 'large' ? 'h-8 w-8' : 'h-5 w-5';

  return (
    <div
      className={`${sizeClass} border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyState = ({ query }: { query: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <svg
      className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      No results found
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      {query.length < 3
        ? 'Enter at least 3 characters to search'
        : `No documents found matching "${query}"`}
    </p>
  </div>
);

export default DocumentSearch;
