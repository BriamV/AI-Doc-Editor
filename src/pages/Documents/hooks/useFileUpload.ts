/**
 * File Upload Hook
 * T-49-ST2: File upload logic and state management
 */

import { useState, useCallback, useRef } from 'react';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.md'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UseFileUploadProps {
  onUploadSuccess?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

const validateFile = (file: File): string | null => {
  if (
    !ALLOWED_FILE_TYPES.includes(file.type) &&
    !ALLOWED_EXTENSIONS.some(ext => file.name.endsWith(ext))
  ) {
    return `Invalid file type. Only PDF, DOCX, and MD files are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`;
  }
  return null;
};

const simulateUpload = (
  setProgress: (fn: (prev: number) => number) => void,
  setUploading: (val: boolean) => void,
  setError: (msg: string) => void,
  onError?: (msg: string) => void
) => {
  const interval = setInterval(() => {
    setProgress(prev => {
      if (prev >= 100) {
        clearInterval(interval);
        return 100;
      }
      return prev + 10;
    });
  }, 200);

  setTimeout(() => {
    clearInterval(interval);
    setUploading(false);
    setProgress(() => 100);
    setError('Upload endpoint not implemented yet. Backend POST /api/upload is pending.');
    onError?.('Upload endpoint not implemented');
  }, 2000);
};

// eslint-disable-next-line max-lines-per-function
export const useFileUpload = ({ onUploadSuccess, onUploadError }: UseFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log props to avoid TypeScript unused warning (backend integration pending)
  if (onUploadSuccess || onUploadError) {
    console.debug('Upload callbacks ready for backend integration');
  }

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    // TODO: Implement actual upload to POST /api/upload endpoint
    simulateUpload(setUploadProgress, setIsUploading, setError, onUploadError);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
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
  };
};
