/**
 * File Upload Hook
 * T-49-ST2: File upload logic and state management
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@hooks/useAuth';
import { getEnvVar } from '@utils/env';

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

interface UploadResponse {
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
}

/**
 * Maps backend error status codes to user-friendly messages
 */
const getErrorMessage = (status: number, defaultMessage: string): string => {
  switch (status) {
    case 400:
      return 'Invalid file type. Please upload PDF, DOCX, or MD files.';
    case 401:
    case 403:
      return 'Session expired. Please login again.';
    case 413:
      return 'File is too large. Maximum size is 10MB.';
    case 500:
      return 'Upload failed. Please try again.';
    default:
      return defaultMessage;
  }
};

/**
 * Upload file to backend API
 */
const uploadToBackend = async (
  file: File,
  token: string,
  onProgress: (progress: number) => void
): Promise<UploadResponse> => {
  const API_BASE_URL = getEnvVar('VITE_API_BASE_URL');
  if (!API_BASE_URL) {
    throw new Error('API base URL not configured');
  }

  // Prepare FormData
  const formData = new FormData();
  formData.append('file', file);

  // Start progress simulation for better UX
  const progressInterval = setInterval(() => {
    onProgress(90); // Cap at 90% until response
  }, 200);

  try {
    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }

      const errorMsg = getErrorMessage(
        response.status,
        errorData.detail || 'Upload failed. Please try again.'
      );
      throw new Error(errorMsg);
    }

    return await response.json();
  } finally {
    clearInterval(progressInterval);
  }
};

// eslint-disable-next-line max-lines-per-function
export const useFileUpload = ({ onUploadSuccess, onUploadError }: UseFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

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

    // Check authentication
    if (!token) {
      const errorMsg = 'Please login to upload files.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload file with progress updates
      const data = await uploadToBackend(selectedFile, token, progress => {
        setUploadProgress(prev => Math.max(prev, progress));
      });

      setUploadProgress(100);

      // Success callback
      onUploadSuccess?.(data.document_id);

      // Clear state after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
    }
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
