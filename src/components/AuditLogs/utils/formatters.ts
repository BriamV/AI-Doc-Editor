/**
 * Formatting utilities for audit log data
 */

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatActionType = (actionType: string): string => {
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'failure':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};
