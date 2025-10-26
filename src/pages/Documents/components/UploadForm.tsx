/**
 * Upload Form Component
 * T-49-ST2: File upload with drag & drop, validation, progress
 * T-24-ST1: Consent checkbox for AI processing
 */

import React, { useState } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';
import DropZone from './DropZone';
import FilePreview from './FilePreview';

interface UploadFormProps {
  onUploadSuccess?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

// eslint-disable-next-line max-lines-per-function
const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess, onUploadError }) => {
  const [consentGiven, setConsentGiven] = useState(false);

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
  } = useFileUpload({ onUploadSuccess, onUploadError, consentGiven });

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

      {/* Consent Checkbox (T-24-ST1) */}
      {selectedFile && (
        <div className="mt-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I consent to send this document to AI services for analysis and processing
            </span>
          </label>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || !consentGiven}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
};

export default UploadForm;
