/**
 * Document Filters Component
 * T-49-ST1: Filtering and search controls
 */

import React from 'react';
import FilterSelect from './FilterSelect';

interface DocumentFiltersProps {
  fileType?: string;
  status?: string;
  onFileTypeChange: (fileType: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

const fileTypeOptions = [
  { value: '', label: 'All' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'md', label: 'Markdown' },
];

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

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

        <FilterSelect
          id="file-type-filter"
          label="File Type"
          value={fileType}
          onChange={onFileTypeChange}
          options={fileTypeOptions}
        />

        <FilterSelect
          id="status-filter"
          label="Status"
          value={status}
          onChange={onStatusChange}
          options={statusOptions}
        />

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
