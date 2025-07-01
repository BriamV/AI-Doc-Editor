import { Link } from 'react-router-dom';
import { Settings } from '@carbon/icons-react';
import { useAuth } from '@hooks/useAuth';

/** Link displayed only for admins to access settings page */
const AdminSettingsLink = () => {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return null;

  return (
    <Link
      to="/settings"
      className="flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white text-sm"
    >
      <Settings className="w-4 h-4" /> Settings
    </Link>
  );
};

export default AdminSettingsLink;
