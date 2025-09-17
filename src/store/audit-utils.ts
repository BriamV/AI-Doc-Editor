/**
 * Audit log utility functions for T-13 security audit system
 */
import { AuditLogEntry } from './audit-types';

export const generateCSVContent = (logs: AuditLogEntry[]): string => {
  const headers = [
    'ID',
    'Timestamp',
    'Action Type',
    'User Email',
    'User Role',
    'IP Address',
    'Status',
    'Description',
    'Resource Type',
    'Resource ID',
  ];

  const csvRows = [
    headers.join(','),
    ...logs.map(log =>
      [
        log.id,
        log.timestamp,
        log.action_type,
        log.user_email || '',
        log.user_role || '',
        log.ip_address || '',
        log.status,
        `"${log.description.replace(/"/g, '""')}"`,
        log.resource_type || '',
        log.resource_id || '',
      ].join(',')
    ),
  ];

  return csvRows.join('\n');
};

export const generateJSONContent = (logs: AuditLogEntry[]): string => {
  return JSON.stringify(logs, null, 2);
};

export const createDownloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateFilename = (format: 'csv' | 'json'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `audit-logs-${date}.${format}`;
};
