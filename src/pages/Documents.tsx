/**
 * Documents Library Page
 * T-49-ST1: Document listing with filters and pagination
 */

import React from 'react';
import { useAuth } from '@hooks/useAuth';
import { useDocuments } from './Documents/hooks/useDocuments';
import DocumentCard from './Documents/components/DocumentCard';
import DocumentFilters from './Documents/components/DocumentFilters';
import DocumentPagination from './Documents/components/DocumentPagination';

const Documents: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const documentsState = useDocuments(token || null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Authentication Required</h2>
          <p>Please sign in to view your documents</p>
        </div>
      </div>
    );
  }

  const handleFilterChange = (filters: { fileType?: string; status?: string }) => {
    documentsState.setFilters(filters);
  };

  const handleClearFilters = () => {
    documentsState.setFilters({});
  };

  const handleViewDocument = (id: string) => {
    console.log('View document:', id);
    // TODO: Implement document detail view
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Library</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your uploaded documents for the knowledge base
              </p>
            </div>
            <button
              onClick={documentsState.refresh}
              disabled={documentsState.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {documentsState.isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error banner */}
        {documentsState.error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
            <span className="block sm:inline">{documentsState.error}</span>
            <button
              onClick={documentsState.clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {/* Filters */}
        <DocumentFilters
          fileType={documentsState.filters.fileType}
          status={documentsState.filters.status}
          onFileTypeChange={fileType => handleFilterChange({ ...documentsState.filters, fileType })}
          onStatusChange={status => handleFilterChange({ ...documentsState.filters, status })}
          onClearFilters={handleClearFilters}
        />

        {/* Loading state */}
        {documentsState.isLoading && documentsState.documents.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading documents...</p>
          </div>
        )}

        {/* Empty state */}
        {!documentsState.isLoading && documentsState.documents.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No documents found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {documentsState.filters.fileType || documentsState.filters.status
                ? 'Try adjusting your filters'
                : 'Get started by uploading your first document'}
            </p>
          </div>
        )}

        {/* Documents grid */}
        {documentsState.documents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentsState.documents.map(doc => (
                <DocumentCard key={doc.id} document={doc} onView={handleViewDocument} />
              ))}
            </div>

            {/* Pagination */}
            <DocumentPagination
              currentPage={documentsState.currentPage}
              pageSize={documentsState.pageSize}
              total={documentsState.total}
              onPageChange={documentsState.setPage}
              onPageSizeChange={documentsState.setPageSize}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Documents;
