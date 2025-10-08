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
import PageHeader from './Documents/components/PageHeader';
import ErrorBanner from './Documents/components/ErrorBanner';
import EmptyState from './Documents/components/EmptyState';
import LoadingState from './Documents/components/LoadingState';

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

  const hasFilters = Boolean(documentsState.filters.fileType || documentsState.filters.status);
  const showLoading = documentsState.isLoading && documentsState.documents.length === 0;
  const showEmpty = !documentsState.isLoading && documentsState.documents.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader isLoading={documentsState.isLoading} onRefresh={documentsState.refresh} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ErrorBanner error={documentsState.error} onDismiss={documentsState.clearError} />

        <DocumentFilters
          fileType={documentsState.filters.fileType}
          status={documentsState.filters.status}
          onFileTypeChange={fileType => handleFilterChange({ ...documentsState.filters, fileType })}
          onStatusChange={status => handleFilterChange({ ...documentsState.filters, status })}
          onClearFilters={handleClearFilters}
        />

        {showLoading && <LoadingState />}
        {showEmpty && <EmptyState hasFilters={hasFilters} />}

        {documentsState.documents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentsState.documents.map(doc => (
                <DocumentCard key={doc.id} document={doc} onView={handleViewDocument} />
              ))}
            </div>

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
