import React from 'react';
import type { SearchResultChunk } from '@type/documents';

/**
 * Search Result Card Component
 * T-04: RAG Pipeline - Display individual search result
 *
 * Features:
 * - Document excerpt with highlighting
 * - Relevance score with color-coded badge
 * - Source file information
 * - Chunk position indicator
 * - View document button
 */
interface SearchResultCardProps {
  chunk: SearchResultChunk;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ chunk }) => {
  /**
   * Calculate relevance percentage from distance
   * Distance is 0 (exact match) to 2 (completely different)
   * Convert to percentage: (1 - distance) * 100
   */
  const calculateRelevance = (distance: number): number => {
    // Clamp distance to [0, 2] range
    const clampedDistance = Math.max(0, Math.min(2, distance));
    // Convert to percentage (0-100)
    return Math.max(0, Math.min(100, (1 - clampedDistance) * 100));
  };

  const relevance = calculateRelevance(chunk.distance);
  const sourceName = chunk.metadata.source || 'Unknown source';

  /**
   * Get relevance badge color based on score
   */
  const getRelevanceBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (score >= 60)
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  };

  /**
   * Get relevance label
   */
  const getRelevanceLabel = (score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  /**
   * Truncate text if too long
   */
  const truncateText = (text: string, maxLength: number = 300): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  /**
   * Handle view document click
   */
  const handleViewDocument = () => {
    // TODO: Implement navigation to document detail page
    // This would typically use React Router or similar
    console.log('View document:', chunk.document_id);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
      {/* Header: Source and Relevance */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {sourceName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Chunk {chunk.chunk_index + 1}
          </p>
        </div>
        <div className="ml-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRelevanceBadgeColor(relevance)}`}
          >
            {getRelevanceLabel(relevance)} ({relevance.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Content: Document Excerpt */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {truncateText(chunk.text)}
        </p>
      </div>

      {/* Footer: Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          ID: {chunk.document_id.substring(0, 8)}...
        </div>
        <button
          onClick={handleViewDocument}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
        >
          View Document
        </button>
      </div>

      {/* Debug: Distance (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Distance: {chunk.distance.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResultCard;
