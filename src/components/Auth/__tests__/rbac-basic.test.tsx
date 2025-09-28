/**
 * Basic RBAC Tests
 * T-02: Essential RBAC functionality validation
 */
import { render, screen } from '@testing-library/react';
import { useRoles } from '@hooks/useRoles';
import { RoleBasedContent, RoleIndicator } from '../index';

// Mock the hooks
vi.mock('@hooks/useRoles');
const mockUseRoles = useRoles as unknown as ReturnType<typeof vi.fn>;

describe('RBAC Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RoleBasedContent', () => {
    it('should render content for admin user', () => {
      mockUseRoles.mockReturnValue({
        hasRole: vi.fn(() => true),
        isAdmin: vi.fn(() => true),
        isEditor: vi.fn(() => true),
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        currentRole: 'admin',
        permissions: [],
        canAccessRoute: vi.fn(() => true),
        canViewComponent: vi.fn(() => true),
      });

      render(
        <RoleBasedContent requiredRoles={['admin']}>
          <div data-testid="admin-content">Admin Only Content</div>
        </RoleBasedContent>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    it('should not render content for non-admin user', () => {
      mockUseRoles.mockReturnValue({
        hasRole: vi.fn(() => false),
        isAdmin: vi.fn(() => false),
        isEditor: vi.fn(() => true),
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        currentRole: 'editor',
        permissions: [],
        canAccessRoute: vi.fn(() => false),
        canViewComponent: vi.fn(() => false),
      });

      render(
        <RoleBasedContent requiredRoles={['admin']}>
          <div data-testid="admin-content">Admin Only Content</div>
        </RoleBasedContent>
      );

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

  describe('RoleIndicator', () => {
    it('should display admin role correctly', () => {
      mockUseRoles.mockReturnValue({
        hasRole: vi.fn(() => true),
        isAdmin: vi.fn(() => true),
        isEditor: vi.fn(() => true),
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        currentRole: 'admin',
        permissions: [],
        canAccessRoute: vi.fn(() => true),
        canViewComponent: vi.fn(() => true),
      });

      render(<RoleIndicator />);

      expect(screen.getByText(/ADMIN/)).toBeInTheDocument();
      expect(screen.getByText(/👑/)).toBeInTheDocument();
    });

    it('should display editor role correctly', () => {
      mockUseRoles.mockReturnValue({
        hasRole: vi.fn(() => true),
        isAdmin: vi.fn(() => false),
        isEditor: vi.fn(() => true),
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        currentRole: 'editor',
        permissions: [],
        canAccessRoute: vi.fn(() => true),
        canViewComponent: vi.fn(() => true),
      });

      render(<RoleIndicator />);

      expect(screen.getByText(/EDITOR/)).toBeInTheDocument();
      expect(screen.getByText(/✏️/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', () => {
      mockUseRoles.mockReturnValue({
        hasRole: vi.fn(() => false),
        isAdmin: vi.fn(() => false),
        isEditor: vi.fn(() => false),
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        currentRole: null,
        permissions: [],
        canAccessRoute: vi.fn(() => false),
        canViewComponent: vi.fn(() => false),
      });

      render(
        <RoleBasedContent requiredRoles={['admin']}>
          <div data-testid="protected-content">Should not render</div>
        </RoleBasedContent>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
