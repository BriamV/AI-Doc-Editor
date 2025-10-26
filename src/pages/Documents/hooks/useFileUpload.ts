/**
 * File Upload Hook
 * T-49-ST2: File upload logic and state management
 */

import { useState, useRef } from 'react';
import { useAuth } from '@hooks/useAuth';
import { validateFile, uploadWithRetry } from './useFileUpload.helpers';

interface UseFileUploadProps {
  onUploadSuccess?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
  consentGiven?: boolean;
}

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

interface FileHandlersOptions {
  setError: (value: string | null) => void;
  setSelectedFile: (value: File | null) => void;
  setUploadProgress: (value: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Create file management handlers (select, clear, browse, file input)
 */
const createFileHandlers = (options: FileHandlersOptions) => {
  const { setError, setSelectedFile, setUploadProgress, fileInputRef } = options;

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

interface UploadHandlerOptions {
  file: File | null;
  token: string | null;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (value: number | ((prev: number) => number)) => void;
  setError: (value: string | null) => void;
  refreshAccessToken: () => Promise<string | null>;
  onSuccess: (documentId: string) => void;
  onError: (errorMsg: string) => void;
  consentGiven: boolean;
}

/**
 * Validate upload preconditions
 */
const validateUploadPreconditions = (
  file: File | null,
  token: string | null,
  consentGiven: boolean
): string | null => {
  if (!token) return 'Please login to upload files.';
  if (!file) return 'No file selected.';
  if (!consentGiven) return 'You must provide consent to upload documents for AI processing.';
  return null;
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
      consentGiven,
    } = options;

    const validationError = validateUploadPreconditions(file, token, consentGiven);
    if (validationError) {
      setError(validationError);
      onError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const data = await uploadWithRetry({
        file: file!,
        token: token!,
        refreshAccessToken,
        setProgress: setUploadProgress,
        consentGiven,
      });
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

interface HookState {
  isDragging: boolean;
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  token: string | undefined;
  refreshAccessToken: () => Promise<string | null>;
  setIsDragging: (value: boolean) => void;
  setSelectedFile: (value: File | null) => void;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (value: number | ((prev: number) => number)) => void;
  setError: (value: string | null) => void;
}

/**
 * Create all handlers for the upload hook
 */
const createAllHandlers = (state: HookState, props: UseFileUploadProps) => {
  const fileHandlers = createFileHandlers({
    setError: state.setError,
    setSelectedFile: state.setSelectedFile,
    setUploadProgress: state.setUploadProgress,
    fileInputRef: state.fileInputRef,
  });

  const uploadCallbacks = createUploadCallbacks({
    setUploadProgress: state.setUploadProgress,
    setSelectedFile: state.setSelectedFile,
    setIsUploading: state.setIsUploading,
    setError: state.setError,
    fileInputRef: state.fileInputRef,
    onUploadSuccess: props.onUploadSuccess,
    onUploadError: props.onUploadError,
  });

  const handleUpload = createUploadHandler({
    file: state.selectedFile,
    token: state.token ?? null,
    setIsUploading: state.setIsUploading,
    setUploadProgress: state.setUploadProgress,
    setError: state.setError,
    refreshAccessToken: state.refreshAccessToken,
    onSuccess: uploadCallbacks.handleSuccess,
    onError: uploadCallbacks.handleError,
    consentGiven: props.consentGiven ?? false,
  });

  const dragHandlers = createDragHandlers(state.setIsDragging, fileHandlers.handleFileSelect);

  return { fileHandlers, dragHandlers, handleUpload };
};

export const useFileUpload = ({
  onUploadSuccess,
  onUploadError,
  consentGiven = false,
}: UseFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, refreshAccessToken } = useAuth();

  const { fileHandlers, dragHandlers, handleUpload } = createAllHandlers(
    {
      isDragging,
      selectedFile,
      isUploading,
      uploadProgress,
      error,
      fileInputRef,
      token,
      refreshAccessToken,
      setIsDragging,
      setSelectedFile,
      setIsUploading,
      setUploadProgress,
      setError,
    },
    { onUploadSuccess, onUploadError, consentGiven }
  );

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
