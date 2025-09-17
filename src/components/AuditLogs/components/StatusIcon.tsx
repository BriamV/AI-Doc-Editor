/**
 * Status Icon Component
 * Renders appropriate icon based on audit log status
 */
import React from 'react';
import { Checkmark, Error, Warning, Information } from '@carbon/icons-react';

interface StatusIconProps {
  status: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  switch (status) {
    case 'success':
      return <Checkmark className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'failure':
      return <Warning className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    case 'error':
      return <Error className="h-4 w-4 text-red-600 dark:text-red-400" />;
    default:
      return <Information className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
  }
};

export default StatusIcon;
