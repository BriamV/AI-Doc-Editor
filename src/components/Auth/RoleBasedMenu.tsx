/**
 * Role-based menu components for navigation
 * T-02: RBAC frontend integration
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Security, UserMultiple, Settings, DocumentAdd } from '@carbon/icons-react';
import { useRoles, Permission } from '@hooks/useRoles';
import { UserRole } from '../../types/auth';

// Base interface for menu items
interface MenuItemProps {
  to?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

// Role-based menu item wrapper
interface RoleBasedMenuItemProps extends MenuItemProps {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean;
}

// Base menu item component
const MenuItemBase: React.FC<MenuItemProps> = ({
  to,
  icon,
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  const baseClasses = `
    flex py-2 px-2 items-center gap-3 rounded-md transition-colors duration-200 text-sm
    ${disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-gray-500/10 text-white'}
    ${className}
  `.trim();

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {icon && <span className="w-4 h-4">{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClasses} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

// Role-based menu item that only renders if user has access
export const RoleBasedMenuItem: React.FC<RoleBasedMenuItemProps> = ({
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  ...props
}) => {
  const { hasRole, hasAnyPermission, hasAllPermissions } = useRoles();

  // Check role requirements
  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));

  // Check permission requirements
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  // Only render if user has required access
  if (!hasRequiredRole || !hasRequiredPermissions) {
    return null;
  }

  return <MenuItemBase {...props} />;
};

// Admin-only menu section
export const AdminMenuSection: React.FC = () => (
  <div className="space-y-1">
    <RoleBasedMenuItem to="/admin/users" icon={<UserMultiple />} requiredRoles={['admin']}>
      User Management
    </RoleBasedMenuItem>

    <RoleBasedMenuItem to="/admin/audit-logs" icon={<Security />} requiredRoles={['admin']}>
      Audit Logs
    </RoleBasedMenuItem>

    <RoleBasedMenuItem to="/admin/settings" icon={<Settings />} requiredRoles={['admin']}>
      System Settings
    </RoleBasedMenuItem>
  </div>
);

// Editor menu section (visible to editors and admins)
export const EditorMenuSection: React.FC = () => (
  <div className="space-y-1">
    <RoleBasedMenuItem
      to="/documents/create"
      icon={<DocumentAdd />}
      requiredRoles={['editor', 'admin']}
    >
      Create Document
    </RoleBasedMenuItem>

    <RoleBasedMenuItem
      to="/documents/templates"
      icon={<DocumentAdd />}
      requiredPermissions={['document:create', 'document:write']}
    >
      Manage Templates
    </RoleBasedMenuItem>
  </div>
);

// Permission-based menu item (using specific permissions)
export const PermissionBasedMenuItem: React.FC<{
  permissions: Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
  to?: string;
  icon?: React.ReactNode;
}> = ({ permissions, requireAll = false, children, to, icon }) => (
  <RoleBasedMenuItem to={to} icon={icon} requiredPermissions={permissions} requireAll={requireAll}>
    {children}
  </RoleBasedMenuItem>
);

// Enhanced admin settings link with additional admin features
export const EnhancedAdminSettingsLink: React.FC = () => {
  const { isAdmin } = useRoles();

  if (!isAdmin()) return null;

  return (
    <div className="space-y-1 border-t border-gray-600 pt-2 mt-2">
      <div className="text-xs font-semibold text-gray-400 px-2 mb-1">ADMIN TOOLS</div>
      <AdminMenuSection />
    </div>
  );
};

// Role indicator badge
export const RoleIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentRole } = useRoles();

  if (!currentRole) return null;

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    editor: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
      ${roleColors[currentRole]}
      ${className}
    `}
    >
      {currentRole === 'admin' ? '👑' : '✏️'} {currentRole.toUpperCase()}
    </span>
  );
};

// Conditional wrapper for role-based content
export const RoleBasedContent: React.FC<{
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasRole, hasAnyPermission, hasAllPermissions } = useRoles();

  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));

  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  if (!hasRequiredRole || !hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Context menu for role-based actions
export const RoleBasedContextMenu: React.FC<{
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    requiredRoles?: UserRole[];
    requiredPermissions?: Permission[];
    destructive?: boolean;
  }>;
}> = ({ actions }) => {
  const { hasRole, hasAnyPermission } = useRoles();

  const visibleActions = actions.filter(action => {
    const hasRequiredRole =
      !action.requiredRoles || action.requiredRoles.some(role => hasRole(role));
    const hasRequiredPermissions =
      !action.requiredPermissions || hasAnyPermission(action.requiredPermissions);
    return hasRequiredRole && hasRequiredPermissions;
  });

  if (visibleActions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
      {visibleActions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`
            w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2
            ${action.destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
          `}
        >
          {action.icon && <span className="w-4 h-4">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default {
  RoleBasedMenuItem,
  AdminMenuSection,
  EditorMenuSection,
  PermissionBasedMenuItem,
  EnhancedAdminSettingsLink,
  RoleIndicator,
  RoleBasedContent,
  RoleBasedContextMenu,
};
