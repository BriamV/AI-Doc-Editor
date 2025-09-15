import { Link } from 'react-router-dom';
import { Security } from '@carbon/icons-react';
import { useAuth } from '@hooks/useAuth';

/** Links displayed only for admins to access admin pages */
const AdminSettingsLink = () => {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return null;

  return (
    <div className="space-y-1">
      <Link
        to="/admin/audit-logs"
        className="flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white text-sm"
      >
        <Security className="w-4 h-4" /> Audit Logs
      </Link>
    </div>
  );
};

export default AdminSettingsLink;
