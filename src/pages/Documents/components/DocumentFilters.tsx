/**
 * Document Filters Component
 * T-49-ST1: Filtering and search controls
 */

import React from 'react';

interface DocumentFiltersProps {
  fileType?: string;
  status?: string;
  onFileTypeChange: (fileType: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  fileType,
  status,
  onFileTypeChange,
  onStatusChange,
  onClearFilters,
}) => {
  const hasActiveFilters = fileType || status;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center gap-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters:</h3>

        {/* File Type Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="file-type-filter" className="text-sm text-gray-600 dark:text-gray-400">
            File Type:
          </label>
          <select
            id="file-type-filter"
            value={fileType || ''}
            onChange={e => onFileTypeChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="md">Markdown</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm text-gray-600 dark:text-gray-400">
            Status:
          </label>
          <select
            id="status-filter"
            value={status || ''}
            onChange={e => onStatusChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentFilters;
