/**
 * Page Title Component for Audit Logs
 * Contains the back button and title section
 */
import React from 'react';
import { Security, ChevronLeft } from '@carbon/icons-react';

const PageTitle: React.FC = () => {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back
      </button>
      <div className="flex items-center space-x-3">
        <Security className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Security and compliance monitoring
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageTitle;
