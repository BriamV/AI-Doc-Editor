/**
 * File Preview Component
 * T-49-ST2: Selected file display with progress indicator
 */

import React from 'react';
import ProgressBar from './ProgressBar';

interface FilePreviewProps {
  file: File;
  isUploading: boolean;
  uploadProgress: number;
  onClear: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isUploading,
  uploadProgress,
  onClear,
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            className="h-8 w-8 text-blue-600 dark:text-blue-400"
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
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {isUploading && <ProgressBar progress={uploadProgress} />}
    </div>
  );
};

export default FilePreview;
