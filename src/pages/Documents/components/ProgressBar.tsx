/**
 * Progress Bar Component
 * T-49-ST2: Upload progress indicator
 */

import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="mt-3">
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{progress}%</p>
    </div>
  );
};

export default ProgressBar;
