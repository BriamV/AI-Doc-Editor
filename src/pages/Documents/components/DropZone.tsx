/**
 * Drop Zone Component
 * T-49-ST2: Drag & drop file upload area
 */

import React from 'react';

interface DropZoneProps {
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onBrowseClick,
}) => {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600'
      }`}
    >
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
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Drag and drop your file here, or{' '}
        <button
          onClick={onBrowseClick}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          browse
        </button>
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
        PDF, DOCX, MD files up to 10MB
      </p>
    </div>
  );
};

export default DropZone;
