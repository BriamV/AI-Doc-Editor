/**
 * Audit Log Export Component
 * Handles CSV and JSON export functionality for audit logs in T-13 security audit system
 */
import React, { useState, useCallback } from 'react';
import useStore from '@store/store';
import {
  Download,
  DocumentDownload,
  Export,
  CheckmarkOutline,
  WarningAlt,
} from '@carbon/icons-react';

const AuditLogExport: React.FC = () => {
  const { selectedLogs, auditLogs, isExporting, exportLogs } = useStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastExportFormat, setLastExportFormat] = useState<'csv' | 'json' | null>(null);

  const handleExport = useCallback(
    async (format: 'csv' | 'json', selectedOnly: boolean = false) => {
      try {
        await exportLogs(format, selectedOnly);
        setLastExportFormat(format);
        setShowExportMenu(false);

        // Auto-hide success indicator after 3 seconds
        setTimeout(() => {
          setLastExportFormat(null);
        }, 3000);
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [exportLogs]
  );

  const exportOptions = [
    {
      id: 'csv-all',
      label: 'Export All as CSV',
      description: `Export all ${auditLogs.length} logs as CSV`,
      format: 'csv' as const,
      selectedOnly: false,
      icon: DocumentDownload,
    },
    {
      id: 'json-all',
      label: 'Export All as JSON',
      description: `Export all ${auditLogs.length} logs as JSON`,
      format: 'json' as const,
      selectedOnly: false,
      icon: Export,
    },
  ];

  // Add selected-only options if there are selected logs
  if (selectedLogs.size > 0) {
    exportOptions.unshift(
      {
        id: 'csv-selected',
        label: 'Export Selected as CSV',
        description: `Export ${selectedLogs.size} selected logs as CSV`,
        format: 'csv' as const,
        selectedOnly: true,
        icon: DocumentDownload,
      },
      {
        id: 'json-selected',
        label: 'Export Selected as JSON',
        description: `Export ${selectedLogs.size} selected logs as JSON`,
        format: 'json' as const,
        selectedOnly: true,
        icon: Export,
      }
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="relative">
        <button
          disabled
          className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Export button */}
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        disabled={isExporting}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          lastExportFormat ? 'bg-green-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="hidden sm:inline">Exporting...</span>
          </>
        ) : lastExportFormat ? (
          <>
            <CheckmarkOutline className="h-4 w-4" />
            <span className="hidden sm:inline">Exported</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </>
        )}
      </button>

      {/* Export dropdown menu */}
      {showExportMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Export Audit Logs
              </h3>

              {/* Warning about data sensitivity */}
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start">
                  <WarningAlt className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium mb-1">Sensitive Data Warning</p>
                    <p>
                      Audit logs contain sensitive security information. Handle exported files
                      securely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export options */}
              <div className="space-y-2">
                {exportOptions.map(option => {
                  const IconComponent = option.icon;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleExport(option.format, option.selectedOnly)}
                      disabled={isExporting}
                      className="w-full flex items-start p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <IconComponent className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Format information */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Export Formats
                </h4>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">CSV:</span> Spreadsheet-compatible format,
                    suitable for analysis in Excel or similar tools
                  </div>
                  <div>
                    <span className="font-medium">JSON:</span> Machine-readable format, includes all
                    log fields and metadata
                  </div>
                </div>
              </div>

              {/* Close button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowExportMenu(false)}
                  className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogExport;
