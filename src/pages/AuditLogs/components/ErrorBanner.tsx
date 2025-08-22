/**
 * Error Banner Component for Audit Logs
 * Displays error messages with dismiss functionality
 */
import React from 'react';
import { WarningAlt } from '@carbon/icons-react';

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
      <div className="flex items-center">
        <WarningAlt className="h-5 w-5 text-red-400 mr-3" />
        <div className="flex-1">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
