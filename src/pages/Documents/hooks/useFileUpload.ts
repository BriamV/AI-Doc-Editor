/**
 * File Upload Hook
 * T-49-ST2: File upload logic and state management
 */

import { useState, useRef } from 'react';
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
  onProgress: (progress: number) => void,
  retryWithNewToken?: (newToken: string) => Promise<UploadResponse>
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

      // Handle 401 with automatic retry if callback provided
      if (response.status === 401 && retryWithNewToken) {
        throw { status: 401, needsRetry: true };
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

/**
 * Create drag event handlers for file upload
 */
const createDragHandlers = (
  setIsDragging: (value: boolean) => void,
  onFileSelect: (file: File) => void
) => ({
  handleDragEnter: (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  },
  handleDragLeave: (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  },
  handleDragOver: (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  },
  handleDrop: (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  },
});

/**
 * Create file management handlers (select, clear, browse, file input)
 */
const createFileHandlers = (
  setError: (value: string | null) => void,
  setSelectedFile: (value: File | null) => void,
  setUploadProgress: (value: number) => void,
  fileInputRef: React.RefObject<HTMLInputElement>
) => {
  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  return {
    handleFileSelect,
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFileSelect(files[0]);
    },
    handleBrowseClick: () => fileInputRef.current?.click(),
    handleClearFile: () => {
      setSelectedFile(null);
      setError(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  };
};

interface UploadCallbacksOptions {
  setUploadProgress: (value: number) => void;
  setSelectedFile: (value: File | null) => void;
  setIsUploading: (value: boolean) => void;
  setError: (value: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadSuccess?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Create upload callback handlers (success and error)
 */
const createUploadCallbacks = (options: UploadCallbacksOptions) => ({
  handleSuccess: (documentId: string) => {
    options.setUploadProgress(100);
    options.onUploadSuccess?.(documentId);
    setTimeout(() => {
      options.setSelectedFile(null);
      options.setUploadProgress(0);
      options.setIsUploading(false);
      if (options.fileInputRef.current) options.fileInputRef.current.value = '';
    }, 1000);
  },
  handleError: (errorMsg: string) => {
    options.setError(errorMsg);
    options.onUploadError?.(errorMsg);
  },
});

/**
 * Type guard for 401 retry error
 */
const is401RetryError = (error: unknown): error is { status: number; needsRetry: boolean } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  'needsRetry' in error &&
  (error as { status: number }).status === 401;

interface UploadHandlerOptions {
  file: File | null;
  token: string | null;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (value: number | ((prev: number) => number)) => void;
  setError: (value: string | null) => void;
  refreshAccessToken: () => Promise<string | null>;
  onSuccess: (documentId: string) => void;
  onError: (errorMsg: string) => void;
}

/**
 * Upload file with automatic token refresh retry on 401
 */
const uploadWithRetry = async (
  file: File,
  token: string,
  refreshAccessToken: () => Promise<string | null>,
  setProgress: (value: number | ((prev: number) => number)) => void
): Promise<UploadResponse> => {
  try {
    return await uploadToBackend(file, token, progress => {
      setProgress(prev => Math.max(prev, progress));
    });
  } catch (err: unknown) {
    if (!is401RetryError(err)) throw err;

    console.log('🔄 Token expired, attempting refresh...');
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error('Session expired. Please login again.');

    console.log('✅ Token refreshed, retrying upload...');
    return await uploadToBackend(file, newToken, progress => {
      setProgress(prev => Math.max(prev, progress));
    });
  }
};

/**
 * Create upload handler with retry logic
 */
const createUploadHandler = (options: UploadHandlerOptions) => {
  return async () => {
    const {
      file,
      token,
      setIsUploading,
      setUploadProgress,
      setError,
      refreshAccessToken,
      onSuccess,
      onError,
    } = options;

    if (!file || !token) {
      const errorMsg = !token ? 'Please login to upload files.' : 'No file selected.';
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const data = await uploadWithRetry(file, token, refreshAccessToken, setUploadProgress);
      onSuccess(data.document_id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
};

export const useFileUpload = ({ onUploadSuccess, onUploadError }: UseFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, refreshAccessToken } = useAuth();

  const fileHandlers = createFileHandlers(
    setError,
    setSelectedFile,
    setUploadProgress,
    fileInputRef
  );
  const uploadCallbacks = createUploadCallbacks({
    setUploadProgress,
    setSelectedFile,
    setIsUploading,
    setError,
    fileInputRef,
    onUploadSuccess,
    onUploadError,
  });
  const dragHandlers = createDragHandlers(setIsDragging, fileHandlers.handleFileSelect);

  const handleUpload = createUploadHandler({
    file: selectedFile,
    token: token ?? null,
    setIsUploading,
    setUploadProgress,
    setError,
    refreshAccessToken,
    onSuccess: uploadCallbacks.handleSuccess,
    onError: uploadCallbacks.handleError,
  });

  return {
    isDragging,
    selectedFile,
    isUploading,
    uploadProgress,
    error,
    fileInputRef,
    ...dragHandlers,
    handleFileInputChange: fileHandlers.handleFileInputChange,
    handleUpload,
    handleBrowseClick: fileHandlers.handleBrowseClick,
    handleClearFile: fileHandlers.handleClearFile,
  };
};
