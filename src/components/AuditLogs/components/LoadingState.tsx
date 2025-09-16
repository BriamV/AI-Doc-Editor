/**
 * Loading State Component
 * Displays skeleton loading state for audit log table
 */
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex space-x-4">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
