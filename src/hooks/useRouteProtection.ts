import { useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useRoles, Permission } from '@hooks/useRoles';
import { UserRole } from '@type/auth';

// Hook for imperative route protection (useful in useEffect or event handlers)
export const useRouteProtection = () => {
  const { isAuthenticated } = useAuth();
  const { canAccessRoute, hasRole, hasPermission } = useRoles();
  const location = useLocation();

  const requireAuth = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  const requireRole = (role: UserRole) => {
    if (!requireAuth()) return false;
    if (!hasRole(role)) {
      console.warn(`Access denied: Required role '${role}' not found`);
      return false;
    }
    return true;
  };

  const requirePermission = (permission: Permission) => {
    if (!requireAuth()) return false;
    if (!hasPermission(permission)) {
      console.warn(`Access denied: Required permission '${permission}' not found`);
      return false;
    }
    return true;
  };

  const checkCurrentRoute = () => {
    if (!requireAuth()) return false;
    return canAccessRoute(location.pathname);
  };

  return {
    requireAuth,
    requireRole,
    requirePermission,
    checkCurrentRoute,
    isProtectedRoute: !canAccessRoute(location.pathname),
  };
};

export default useRouteProtection;
