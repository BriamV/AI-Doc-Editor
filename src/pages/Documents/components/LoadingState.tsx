/**
 * Loading State Component
 * T-49-ST1: Loading spinner
 */

import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading documents...</p>
    </div>
  );
};

export default LoadingState;
