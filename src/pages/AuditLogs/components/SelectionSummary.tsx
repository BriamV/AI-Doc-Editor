/**
 * Selection Summary Component for Audit Logs
 * Shows selected items count and clear action
 */
import React from 'react';
import { Information } from '@carbon/icons-react';

interface SelectionSummaryProps {
  selectedCount: number;
  onClearSelection: () => void;
}

const SelectionSummary: React.FC<SelectionSummaryProps> = ({ selectedCount, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Information className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-800 dark:text-blue-300">
            {selectedCount} log{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
};

export default SelectionSummary;
