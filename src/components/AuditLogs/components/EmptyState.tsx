/**
 * Empty State Component
 * Displays message when no audit logs are found
 */
import React from 'react';
import { Activity } from '@carbon/icons-react';

const EmptyState: React.FC = () => {
  return (
    <div className="p-12 text-center">
      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No audit logs found
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Try adjusting your filters or check back later for new logs.
      </p>
    </div>
  );
};

export default EmptyState;
