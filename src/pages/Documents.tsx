/**
 * Documents Page
 * T-49-ST1: Document listing with filters and pagination
 * T-49-ST2: Upload form integration
 */

import React from 'react';
import { useAuth } from '@hooks/useAuth';
import { useDocuments } from './Documents/hooks/useDocuments';
import PageHeader from './Documents/components/PageHeader';
import ErrorBanner from './Documents/components/ErrorBanner';
import DocumentFilters from './Documents/components/DocumentFilters';
import DocumentCard from './Documents/components/DocumentCard';
import DocumentPagination from './Documents/components/DocumentPagination';
import LoadingState from './Documents/components/LoadingState';
import EmptyState from './Documents/components/EmptyState';
import UploadForm from './Documents/components/UploadForm';

// eslint-disable-next-line max-lines-per-function
const Documents: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const documentsState = useDocuments(token || null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to view your documents</p>
        </div>
      </div>
    );
  }

  const handleFileTypeChange = (fileType: string) => {
    documentsState.setFilters({
      ...documentsState.filters,
      fileType: fileType || undefined,
    });
  };

  const handleStatusChange = (status: string) => {
    documentsState.setFilters({
      ...documentsState.filters,
      status: status || undefined,
    });
  };

  const handleClearFilters = () => {
    documentsState.setFilters({});
  };

  const handleUploadSuccess = (documentId: string) => {
    console.log('Document uploaded successfully:', documentId);
    documentsState.refresh();
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
  };

  const hasFilters = Boolean(documentsState.filters.fileType || documentsState.filters.status);
  const showLoading = documentsState.isLoading && documentsState.documents.length === 0;
  const showEmpty =
    !documentsState.isLoading && documentsState.documents.length === 0 && !documentsState.error;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader isLoading={documentsState.isLoading} onRefresh={documentsState.refresh} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upload Form Section */}
        <UploadForm onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />

        {/* Error Banner */}
        <ErrorBanner error={documentsState.error} onDismiss={documentsState.clearError} />

        {/* Filters */}
        <DocumentFilters
          fileType={documentsState.filters.fileType}
          status={documentsState.filters.status}
          onFileTypeChange={handleFileTypeChange}
          onStatusChange={handleStatusChange}
          onClearFilters={handleClearFilters}
        />

        {/* Loading State */}
        {showLoading && <LoadingState />}

        {/* Empty State */}
        {showEmpty && <EmptyState hasFilters={hasFilters} />}

        {/* Documents Grid */}
        {documentsState.documents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentsState.documents.map(doc => (
                <DocumentCard key={doc.id} document={doc} />
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
