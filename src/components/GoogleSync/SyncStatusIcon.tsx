import { Checkmark as TickIcon } from '@carbon/icons-react';
import { Renew as RefreshIcon } from '@carbon/icons-react';
import { SyncStatus } from '@type/google-api';

interface SyncStatusIconProps {
  status: SyncStatus;
}

export const SyncStatusIcon = ({ status }: SyncStatusIconProps) => {
  const statusToIcon = {
    unauthenticated: (
      <div className="bg-red-600/80 rounded-full w-4 h-4 text-xs flex justify-center items-center">
        !
      </div>
    ),
    syncing: (
      <div className="bg-gray-600/80 rounded-full p-1 animate-spin">
        <RefreshIcon className="h-2 w-2" />
      </div>
    ),
    synced: (
      <div className="bg-gray-600/80 rounded-full p-1">
        <TickIcon className="h-2 w-2" />
      </div>
    ),
  };

  return statusToIcon[status] || null;
};

export default SyncStatusIcon;
