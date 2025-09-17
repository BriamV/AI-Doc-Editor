/**
 * Higher-Order Component for role-based component protection
 * T-02: RBAC frontend integration
 */
import React, { ComponentType } from 'react';
import { useRoles, Permission } from '@hooks/useRoles';
import { UserRole } from '@type/auth';
import DefaultUnauthorized from './DefaultUnauthorized';

// Protection configuration options
interface ProtectionConfig {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true = ALL permissions required, false = ANY permission required
  fallbackComponent?: ComponentType<Record<string, unknown>>;
  showFallback?: boolean;
  redirectTo?: string;
}

/**
 * HOC that wraps components with role-based access control
 */
function withRoleProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
  config: ProtectionConfig = {}
) {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    requireAll = false,
    fallbackComponent: FallbackComponent = DefaultUnauthorized,
    showFallback = true,
    redirectTo,
  } = config;

  const ProtectedComponent: React.FC<P> = props => {
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

    // Combined access check
    const hasAccess = hasRequiredRole && hasRequiredPermissions;

    // Handle redirect
    if (!hasAccess && redirectTo) {
      // Note: In a real app, you'd use your router's navigation here
      // This is a placeholder that could be enhanced with react-router
      console.warn(`Access denied. Should redirect to: ${redirectTo}`);
    }

    // Render unauthorized component if no access
    if (!hasAccess) {
      if (!showFallback) {
        return null;
      }
      return <FallbackComponent {...props} />;
    }

    // Render the wrapped component if authorized
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  ProtectedComponent.displayName = `withRoleProtection(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
}

// Utility HOCs for common protection patterns
const withAdminOnly = <P extends object>(Component: ComponentType<P>) =>
  withRoleProtection(Component, {
    requiredRoles: ['admin'],
  });

const withEditorOrAdmin = <P extends object>(Component: ComponentType<P>) =>
  withRoleProtection(Component, {
    requiredRoles: ['editor', 'admin'],
  });

const withPermissions = <P extends object>(
  Component: ComponentType<P>,
  permissions: Permission[],
  requireAll = false
) =>
  withRoleProtection(Component, {
    requiredPermissions: permissions,
    requireAll,
  });

// Named exports
export { withRoleProtection, withAdminOnly, withEditorOrAdmin, withPermissions };

// Default export
export default withRoleProtection;
