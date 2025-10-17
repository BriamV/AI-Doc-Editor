/**
 * Document Pagination Component
 * T-49-ST1: Pagination controls
 */

import React from 'react';
import PaginationControls from './PaginationControls';

interface DocumentPaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const pageSizeOptions = [10, 20, 50, 100];

const DocumentPagination: React.FC<DocumentPaginationProps> = ({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {total > 0 ? startIndex : 0} - {endIndex} of {total} documents
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="page-size" className="text-sm text-gray-600 dark:text-gray-400">
            Per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default DocumentPagination;
