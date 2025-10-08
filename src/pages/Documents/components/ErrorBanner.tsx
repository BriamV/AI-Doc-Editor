/**
 * Error Banner Component
 * T-49-ST1: Error message display
 */

import React from 'react';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
      <span className="block sm:inline">{error}</span>
      <button onClick={onDismiss} className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <span className="text-2xl">&times;</span>
      </button>
    </div>
  );
};

export default ErrorBanner;
