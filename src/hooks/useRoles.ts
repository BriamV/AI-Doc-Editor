/**
 * Role-based access control hook
 * T-02: RBAC frontend integration
 */
import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { DEFAULT_PERMISSIONS, UserRole } from '../types/auth';

export type Permission =
  | 'document:read'
  | 'document:write'
  | 'document:create'
  | 'document:delete'
  | 'profile:read'
  | 'profile:update'
  | 'user:read'
  | 'user:update'
  | 'settings:read'
  | 'settings:update';

export interface UseRolesReturn {
  // Role checks
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isEditor: () => boolean;

  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Current state
  currentRole: UserRole | null;
  permissions: Permission[];

  // Utility functions
  canAccessRoute: (routePath: string) => boolean;
  canViewComponent: (componentName: string) => boolean;
}

/**
 * Enhanced roles hook for RBAC frontend integration
 */
export const useRoles = (): UseRolesReturn => {
  const { user, hasRole, isAdmin } = useAuth();

  // Get current user role
  const currentRole = useMemo<UserRole | null>(() => {
    if (user?.role) return user.role;

    // Fallback for test/dev environments
    if (typeof window !== 'undefined') {
      const storedRole = window.localStorage.getItem('user_role') as UserRole;
      if (storedRole === 'admin' || storedRole === 'editor') {
        return storedRole;
      }
    }

    return null;
  }, [user]);

  // Get permissions for current role
  const permissions = useMemo<Permission[]>(() => {
    if (!currentRole) return [];
    return DEFAULT_PERMISSIONS[currentRole] as Permission[];
  }, [currentRole]);

  // Enhanced role checking
  const isEditor = useCallback((): boolean => {
    return hasRole('editor');
  }, [hasRole]);

  // Permission checking
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.some(permission => permissions.includes(permission));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every(permission => permissions.includes(permission));
    },
    [permissions]
  );

  // Route-based access control
  const canAccessRoute = useCallback(
    (routePath: string): boolean => {
      // Public routes (accessible to all authenticated users)
      const publicRoutes = ['/', '/documents', '/profile'];
      if (publicRoutes.includes(routePath)) {
        return true;
      }

      // Admin-only routes
      const adminRoutes = ['/admin', '/users', '/settings'];
      if (adminRoutes.some(route => routePath.startsWith(route))) {
        return isAdmin();
      }

      // Editor routes (editors and admins)
      const editorRoutes = ['/create', '/edit'];
      if (editorRoutes.some(route => routePath.startsWith(route))) {
        return hasRole('editor');
      }

      // Default: require at least editor role
      return hasRole('editor');
    },
    [hasRole, isAdmin]
  );

  // Component-based access control
  const canViewComponent = useCallback(
    (componentName: string): boolean => {
      switch (componentName.toLowerCase()) {
        // Admin components
        case 'usermanagement':
        case 'adminsettings':
        case 'systemsettings':
          return isAdmin();

        // Editor components
        case 'documentcreate':
        case 'documentedit':
        case 'advancededitor':
          return hasRole('editor');

        // Read-only components (all authenticated users)
        case 'documentview':
        case 'profile':
        case 'dashboard':
          return true;

        default:
          // Default: require editor role for unknown components
          return hasRole('editor');
      }
    },
    [hasRole, isAdmin]
  );

  return {
    // Role checks
    hasRole,
    isAdmin,
    isEditor,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Current state
    currentRole,
    permissions,

    // Utility functions
    canAccessRoute,
    canViewComponent,
  };
};

export default useRoles;
