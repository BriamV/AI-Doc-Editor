import { Security, UserMultiple, Settings } from '@carbon/icons-react';
import { useRoles } from '@hooks/useRoles';
import { RoleBasedMenuItem } from '@components/Auth/RoleBasedMenu';

/** Enhanced admin links with role-based access control */
const AdminSettingsLink = () => {
  const { isAdmin } = useRoles();

  if (!isAdmin()) return null;

  return (
    <div className="space-y-1 border-t border-gray-600 pt-2 mt-2">
      <div className="text-xs font-semibold text-gray-400 px-2 mb-1">ADMIN TOOLS</div>

      <RoleBasedMenuItem
        to="/admin/audit-logs"
        icon={<Security className="w-4 h-4" />}
        requiredRoles={['admin']}
        className="text-white text-sm"
      >
        Audit Logs
      </RoleBasedMenuItem>

      <RoleBasedMenuItem
        to="/admin/users"
        icon={<UserMultiple className="w-4 h-4" />}
        requiredRoles={['admin']}
        className="text-white text-sm"
      >
        User Management
      </RoleBasedMenuItem>

      <RoleBasedMenuItem
        to="/admin/settings"
        icon={<Settings className="w-4 h-4" />}
        requiredRoles={['admin']}
        className="text-white text-sm"
      >
        System Settings
      </RoleBasedMenuItem>
    </div>
  );
};

export default AdminSettingsLink;
