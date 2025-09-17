import { useRoles, Permission } from '@hooks/useRoles';
import { UserRole } from '@type/auth';

export interface ProtectionConfig {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true = ALL permissions required, false = ANY permission required
}

// Component-level role protection hook (alternative to HOC)
export const useComponentProtection = (config: ProtectionConfig) => {
  const { hasRole, hasAnyPermission, hasAllPermissions } = useRoles();

  const { requiredRoles = [], requiredPermissions = [], requireAll = false } = config;

  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));

  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  return {
    hasAccess: hasRequiredRole && hasRequiredPermissions,
    hasRequiredRole,
    hasRequiredPermissions,
  };
};

export default useComponentProtection;
