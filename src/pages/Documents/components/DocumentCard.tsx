/**
 * Document Card Component
 * T-49-ST3: Document card with metadata display
 */

import React from 'react';
import { DocumentResponse } from '@api/documents-api';

interface DocumentCardProps {
  document: DocumentResponse;
  onView?: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: string): React.ReactNode => {
  const statusConfig = {
    processing: {
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-800 dark:text-yellow-200',
      label: 'Processing',
    },
    completed: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-200',
      label: 'Completed',
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-800 dark:text-red-200',
      label: 'Failed',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const getFileTypeIcon = (fileType: string): string => {
  const icons = {
    pdf: '📄',
    docx: '📝',
    md: '📋',
  };
  return icons[fileType as keyof typeof icons] || '📄';
};

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onView }) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer"
      onClick={() => onView?.(document.id)}
      data-testid="document-card"
    >
      {/* Header with icon and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getFileTypeIcon(document.file_type)}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {document.title || document.original_filename}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {document.file_type.toUpperCase()} • {formatFileSize(document.file_size_bytes)}
            </p>
          </div>
        </div>
        {getStatusBadge(document.status)}
      </div>

      {/* Description */}
      {document.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {document.description}
        </p>
      )}

      {/* Metadata footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span>Uploaded {formatDate(document.uploaded_at)}</span>
        <span className="truncate ml-2">{document.user_email}</span>
      </div>
    </div>
  );
};

export default DocumentCard;
