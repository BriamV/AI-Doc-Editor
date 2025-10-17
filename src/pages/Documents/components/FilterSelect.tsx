/**
 * Filter Select Component
 * T-49-ST1: Reusable select dropdown for filters
 */

import React from 'react';

interface FilterSelectProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ id, label, value, onChange, options }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400">
        {label}:
      </label>
      <select
        id={id}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
