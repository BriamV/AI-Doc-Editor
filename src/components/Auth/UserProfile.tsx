/**
 * User profile component with role indicators
 * T-02: RBAC frontend integration
 */
import React, { useState } from 'react';
import { User, ChevronDown, Settings, Edit, Logout } from '@carbon/icons-react';
import { useAuth } from '@hooks/useAuth';
import { useRoles } from '@hooks/useRoles';
import { RoleIndicator, RoleBasedContent } from './RoleBasedMenu';

interface UserProfileProps {
  className?: string;
  showFullProfile?: boolean;
  showDropdown?: boolean;
}

// User avatar component
const UserAvatar: React.FC<{
  user: { name?: string; role?: string };
  size?: 'sm' | 'md' | 'lg';
}> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  // Generate background color based on user role
  const getBgColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

  return (
    <div
      className={`
      ${sizeClasses[size]}
      ${getBgColor(user?.role || '')}
      rounded-full flex items-center justify-center font-semibold
    `}
    >
      {initials}
    </div>
  );
};

// Role icon component
const RoleIcon: React.FC<{ role: string; className?: string }> = ({
  role,
  className = 'w-4 h-4',
}) => {
  switch (role) {
    case 'admin':
      return <Settings className={`${className} text-red-600`} />;
    case 'editor':
      return <Edit className={`${className} text-blue-600`} />;
    default:
      return <User className={`${className} text-gray-600`} />;
  }
};

// User profile dropdown
const UserProfileDropdown: React.FC<{
  user: { name?: string; email?: string; role?: string };
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const { currentRole, permissions } = useRoles();

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
      {/* User info section */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <UserAvatar user={user} size="lg" />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{user?.name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="mt-1">
              <RoleIndicator className="text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Role and permissions info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Access Level
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <RoleIcon role={currentRole || ''} />
          <span className="text-sm font-medium text-gray-900">
            {currentRole?.toUpperCase()} User
          </span>
        </div>
        <div className="text-xs text-gray-500">{permissions.length} permissions granted</div>
      </div>

      {/* Quick access menu */}
      <div className="py-1">
        <RoleBasedContent requiredRoles={['admin']}>
          <a
            href="/admin"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-4 h-4 mr-3 text-red-600" />
            Admin Panel
          </a>
        </RoleBasedContent>

        <a
          href="/profile"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <User className="w-4 h-4 mr-3 text-gray-500" />
          Profile Settings
        </a>

        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Logout className="w-4 h-4 mr-3 text-gray-500" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

// Mini user profile (for compact spaces)
const MiniUserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { currentRole } = useRoles();

  if (!user) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <UserAvatar user={user} size="sm" />
      <RoleIcon role={currentRole || ''} className="w-3 h-3" />
    </div>
  );
};

// Full user profile component
export const UserProfile: React.FC<UserProfileProps> = ({
  className = '',
  showFullProfile = true,
  showDropdown = true,
}) => {
  const { user, logout } = useAuth();
  const { currentRole } = useRoles();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  if (!showFullProfile) {
    return <MiniUserProfile className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <UserAvatar user={user} />
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="flex items-center space-x-2">
            <RoleIcon role={currentRole || ''} className="w-3 h-3" />
            <span className="text-xs text-gray-500">{currentRole}</span>
          </div>
        </div>
        {showDropdown && (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {showDropdown && isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
          <UserProfileDropdown
            user={user}
            onLogout={() => {
              logout();
              setIsDropdownOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
};

// Role badge component (standalone)
export const RoleBadge: React.FC<{ role?: string; className?: string }> = ({
  role,
  className = '',
}) => {
  const { currentRole } = useRoles();
  const displayRole = role || currentRole;

  if (!displayRole) return null;

  const badgeStyles = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    editor: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
      ${badgeStyles[displayRole as keyof typeof badgeStyles] || 'bg-gray-100 text-gray-800 border-gray-200'}
      ${className}
    `}
    >
      <RoleIcon role={displayRole} className="w-3 h-3 mr-1" />
      {displayRole.toUpperCase()}
    </span>
  );
};

// Permission list component (for admin/debug)
export const PermissionsList: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { permissions, currentRole } = useRoles();

  return (
    <RoleBasedContent requiredRoles={['admin']}>
      <div className={`text-xs ${className}`}>
        <div className="font-semibold text-gray-700 mb-1">Current Permissions ({currentRole}):</div>
        <div className="space-y-1">
          {permissions.map(permission => (
            <div key={permission} className="text-gray-600">
              • {permission}
            </div>
          ))}
        </div>
      </div>
    </RoleBasedContent>
  );
};

export default UserProfile;
