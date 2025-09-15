/**
 * Audit Log Pagination Component
 * Handles pagination controls for audit logs in T-13 security audit system
 */
import React, { useCallback } from 'react';
import useStore from '@store/store';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from '@carbon/icons-react';

const AuditLogPagination: React.FC = () => {
  const { pagination, goToPage, changePageSize } = useStore();

  const { page, pageSize, total, totalPages } = pagination;

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        goToPage(newPage);
      }
    },
    [totalPages, goToPage]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      changePageSize(newPageSize);
    },
    [changePageSize]
  );

  // Calculate the range of items being displayed
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];

    // Calculate start and end of range
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    // Add first page
    if (start > 1) {
      range.push(1);
      if (start > 2) {
        range.push('...');
      }
    }

    // Add current range
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        range.push('...');
      }
      range.push(totalPages);
    }

    return range;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return (
      <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {total} {total === 1 ? 'result' : 'results'}
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Show:</label>
            <select
              id="audit-log-page-size"
              name="audit-log-page-size"
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              data-testid="page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700"
      data-testid="pagination"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        {/* Results info */}
        <div className="text-sm text-gray-700 dark:text-gray-300" data-testid="page-info">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </div>

        {/* Pagination controls */}
        <div className="flex items-center space-x-4">
          {/* Page size selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Show:</label>
            <select
              id="audit-log-page-size"
              name="audit-log-page-size"
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              data-testid="page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
          </div>

          {/* Page navigation */}
          <nav className="flex items-center space-x-1">
            {/* First page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
              data-testid="first-page"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Previous page */}
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
              data-testid="prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Go to page input */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Go to:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                defaultValue={page}
                className="w-16 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="goto-page-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newPage = parseInt((e.target as HTMLInputElement).value);
                    if (newPage >= 1 && newPage <= totalPages) {
                      handlePageChange(newPage);
                    }
                  }
                }}
              />
            </div>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {pageNumbers.map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(pageNum as number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next page */}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
              data-testid="next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
              data-testid="last-page"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile-friendly pagination info */}
      <div className="sm:hidden mt-4">
        <div className="text-center">
          <span className="text-sm text-gray-700 dark:text-gray-300" data-testid="page-info">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPagination;
