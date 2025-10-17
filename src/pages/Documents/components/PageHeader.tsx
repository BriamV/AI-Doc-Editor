/**
 * Document Library Page Header
 * T-49-ST1: Header with title and refresh button
 */

import React from 'react';

interface PageHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ isLoading, onRefresh }) => {
  return (
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
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
