/**
 * Examples of RBAC implementation usage
 * T-02: RBAC frontend integration examples
 *
 * This file demonstrates how to use the RBAC components in practice
 * Remove this file after integration is complete if not needed
 */
import {
  ProtectedRoute,
  AdminRoute,
  EditorRoute,
  withRoleProtection,
  withAdminOnly,
  withEditorOrAdmin,
  RoleBasedContent,
  RoleIndicator,
  UserProfile,
  RoleBadge,
  PermissionsList,
} from '@components/Auth';
import { useRoles, Permission } from '@hooks/useRoles';

// Example 1: Protected Routes Usage
export const RouteExamples = () => (
  <>
    {/* Admin-only route */}
    <AdminRoute>
      <div>This content is only visible to admins</div>
    </AdminRoute>

    {/* Editor or Admin route */}
    <EditorRoute>
      <div>This content is visible to editors and admins</div>
    </EditorRoute>

    {/* Custom permission-based route */}
    <ProtectedRoute requiredPermissions={['document:create', 'document:write']} requireAll={true}>
      <div>This content requires document creation AND write permissions</div>
    </ProtectedRoute>
  </>
);

// Example 2: HOC Usage
const SensitiveComponent = () => <div>Sensitive admin data</div>;
const ProtectedSensitiveComponent = withAdminOnly(SensitiveComponent);

const EditorComponent = () => <div>Editor tools</div>;
const ProtectedEditorComponent = withEditorOrAdmin(EditorComponent);

const CustomProtectedComponent = withRoleProtection(() => <div>Custom protected content</div>, {
  requiredPermissions: ['settings:read', 'settings:update'],
  requireAll: false, // ANY of the permissions required
  showFallback: false, // Hide completely if no access
});

// Example 3: Conditional Rendering
export const ConditionalRenderingExample = () => {
  const { hasRole, hasPermission, isAdmin } = useRoles();

  return (
    <div className="space-y-4">
      {/* Using role-based content wrapper */}
      <RoleBasedContent requiredRoles={['admin']}>
        <div className="p-4 bg-red-50 border border-red-200 rounded">🔒 Admin-only content</div>
      </RoleBasedContent>

      {/* Using hooks directly */}
      {hasRole('editor') && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">✏️ Editor content</div>
      )}

      {hasPermission('document:delete') && (
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Delete Document
        </button>
      )}

      {isAdmin() && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          👑 Administrative controls
        </div>
      )}
    </div>
  );
};

// Example 4: UI Components with Role Indicators
export const UIComponentsExample = () => (
  <div className="space-y-6">
    {/* User profile component */}
    <div className="flex items-center justify-between p-4 border rounded">
      <h2>User Profile Component</h2>
      <UserProfile showDropdown={true} />
    </div>

    {/* Role indicators */}
    <div className="space-y-2">
      <h3>Role Indicators:</h3>
      <div className="flex gap-2">
        <RoleIndicator />
        <RoleBadge role="admin" />
        <RoleBadge role="editor" />
      </div>
    </div>

    {/* Permissions list (admin only) */}
    <div>
      <h3>Current Permissions:</h3>
      <PermissionsList />
    </div>
  </div>
);

// Form field components for role-based form
const DocumentTitleField = () => (
  <div>
    <label className="block text-sm font-medium mb-1">Document Title</label>
    <input
      type="text"
      className="w-full px-3 py-2 border rounded-md"
      placeholder="Enter title..."
    />
  </div>
);

const DocumentContentField = () => (
  <div>
    <label className="block text-sm font-medium mb-1">Content</label>
    <textarea
      className="w-full px-3 py-2 border rounded-md"
      rows={4}
      placeholder="Enter content..."
    />
  </div>
);

const AdminSystemSettingsField = () => (
  <RoleBasedContent requiredRoles={['admin']}>
    <div>
      <label className="block text-sm font-medium mb-1">System Settings (Admin Only)</label>
      <select className="w-full px-3 py-2 border rounded-md">
        <option>Public</option>
        <option>Private</option>
        <option>System</option>
      </select>
    </div>
  </RoleBasedContent>
);

const DeletePermissionField = ({
  hasPermission,
}: {
  hasPermission: (permission: Permission) => boolean;
}) =>
  hasPermission('document:delete') ? (
    <div className="flex items-center gap-2">
      <input type="checkbox" id="allowDelete" />
      <label htmlFor="allowDelete" className="text-sm">
        Allow others to delete this document
      </label>
    </div>
  ) : null;

const FormActionButtons = () => (
  <div className="flex gap-2">
    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Save
    </button>

    <RoleBasedContent requiredPermissions={['document:delete']}>
      <button type="button" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Delete
      </button>
    </RoleBasedContent>
  </div>
);

// Example 5: Form with Role-based Fields
export const RoleBasedFormExample = () => {
  const { hasPermission } = useRoles();

  return (
    <form className="space-y-4 max-w-md">
      <DocumentTitleField />
      <DocumentContentField />
      <AdminSystemSettingsField />
      <DeletePermissionField hasPermission={hasPermission} />
      <FormActionButtons />
    </form>
  );
};

// Example 6: Navigation Menu with Role-based Items
export const NavigationExample = () => {
  const { canAccessRoute } = useRoles();

  const menuItems = [
    { path: '/', label: 'Dashboard', public: true },
    { path: '/documents', label: 'Documents', public: true },
    { path: '/create', label: 'Create', public: false },
    { path: '/admin', label: 'Admin Panel', public: false },
    { path: '/settings', label: 'Settings', public: false },
  ];

  return (
    <nav className="space-y-1">
      {menuItems.map(item => {
        if (!item.public && !canAccessRoute(item.path)) {
          return null;
        }

        return (
          <a
            key={item.path}
            href={item.path}
            className="block px-3 py-2 text-sm rounded hover:bg-gray-100"
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
};

// Dashboard components for AdminDashboardExample
const DashboardHeader = () => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-600">Manage users and system settings</p>
    </div>
    <UserProfile />
  </div>
);

const UserManagementCard = () => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">User Management</h3>
    <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
    <a
      href="/admin/users"
      className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Manage Users
    </a>
  </div>
);

const SystemSettingsCard = () => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">System Settings</h3>
    <p className="text-gray-600 mb-4">Configure application settings</p>
    <a
      href="/admin/settings"
      className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      System Config
    </a>
  </div>
);

const AuditLogsCard = () => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">Audit Logs</h3>
    <p className="text-gray-600 mb-4">View system activity and security logs</p>
    <a
      href="/admin/audit-logs"
      className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      View Logs
    </a>
  </div>
);

const DebugPermissionsInfo = () => (
  <div className="mt-8 p-4 bg-gray-50 rounded">
    <h3 className="font-semibold mb-2">Current User Permissions:</h3>
    <PermissionsList />
  </div>
);

// Example 7: Complete Page Component with RBAC
export const AdminDashboardExample = () => (
  <AdminRoute>
    <div className="max-w-6xl mx-auto p-6">
      <DashboardHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UserManagementCard />
        <SystemSettingsCard />
        <AuditLogsCard />
      </div>
      <DebugPermissionsInfo />
    </div>
  </AdminRoute>
);

export default {
  RouteExamples,
  ConditionalRenderingExample,
  UIComponentsExample,
  RoleBasedFormExample,
  NavigationExample,
  AdminDashboardExample,
  ProtectedSensitiveComponent,
  ProtectedEditorComponent,
  CustomProtectedComponent,
};
