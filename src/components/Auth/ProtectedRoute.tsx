/**
 * Protected Route component for role-based route protection
 * T-02: RBAC frontend integration
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useRoles, Permission } from '@hooks/useRoles';
import { UserRole } from '@type/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true = ALL permissions required, false = ANY permission required
  redirectTo?: string;
  fallbackComponent?: React.ComponentType;
}

// Loading component for authentication check
const AuthLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin">
        <svg fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
      </div>
      <p className="text-gray-600">Verifying authentication...</p>
    </div>
  </div>
);

// Unauthorized access component
const UnauthorizedAccess: React.FC<{ onRedirect?: () => void }> = ({ onRedirect }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-6 text-red-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-6">
        You don&apos;t have the required permissions to access this page.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={onRedirect || (() => (window.location.href = '/'))}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * ProtectedRoute component that handles authentication and authorization
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  redirectTo = '/login',
  fallbackComponent: FallbackComponent = UnauthorizedAccess,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole, hasAnyPermission, hasAllPermissions, canAccessRoute } = useRoles();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <AuthLoading />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check route-based access
  const hasRouteAccess = canAccessRoute(location.pathname);

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
  const hasAccess = hasRouteAccess && hasRequiredRole && hasRequiredPermissions;

  // Render unauthorized component if no access
  if (!hasAccess) {
    return <FallbackComponent />;
  }

  // Render children if authorized
  return <>{children}</>;
};

// Convenience components for common protection patterns
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin']}>{children}</ProtectedRoute>
);

const EditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['editor', 'admin']}>{children}</ProtectedRoute>
);

const PermissionRoute: React.FC<{
  children: React.ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
}> = ({ children, permissions, requireAll = false }) => (
  <ProtectedRoute requiredPermissions={permissions} requireAll={requireAll}>
    {children}
  </ProtectedRoute>
);

// Named exports
export { ProtectedRoute, AdminRoute, EditorRoute, PermissionRoute };

// Default export
export default ProtectedRoute;
