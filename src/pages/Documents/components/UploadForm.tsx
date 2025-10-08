/**
 * Upload Form Component
 * T-49-ST2: File upload with drag & drop, validation, progress
 */

import React from 'react';
import { useFileUpload } from '../hooks/useFileUpload';
import DropZone from './DropZone';
import FilePreview from './FilePreview';

interface UploadFormProps {
  onUploadSuccess?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

// eslint-disable-next-line max-lines-per-function
const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess, onUploadError }) => {
  const {
    isDragging,
    selectedFile,
    isUploading,
    uploadProgress,
    error,
    fileInputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
    handleUpload,
    handleBrowseClick,
    handleClearFile,
  } = useFileUpload({ onUploadSuccess, onUploadError });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Document</h2>

      {/* Drag & Drop Zone */}
      <DropZone
        isDragging={isDragging}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onBrowseClick={handleBrowseClick}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.md"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Selected File Preview */}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onClear={handleClearFile}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* TODO Notice */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> Upload functionality requires backend endpoint POST /api/upload
          (T-04 ST1). Currently showing UI preview only.
        </p>
      </div>
    </div>
  );
};

export default UploadForm;
