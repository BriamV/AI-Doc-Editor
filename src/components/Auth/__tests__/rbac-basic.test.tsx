/**
 * Basic RBAC Tests
 * T-02: Essential RBAC functionality validation
 */
import { render, screen } from '@testing-library/react';
import { useRoles } from '@hooks/useRoles';
import { RoleBasedContent, RoleIndicator } from '../index';

// Mock the hooks
jest.mock('@hooks/useRoles');
const mockUseRoles = useRoles as jest.MockedFunction<typeof useRoles>;

describe('RBAC Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RoleBasedContent', () => {
    it('should render content for admin user', () => {
      mockUseRoles.mockReturnValue({
        hasRole: jest.fn(() => true),
        isAdmin: jest.fn(() => true),
        isEditor: jest.fn(() => true),
        hasPermission: jest.fn(() => true),
        hasAnyPermission: jest.fn(() => true),
        hasAllPermissions: jest.fn(() => true),
        currentRole: 'admin',
        permissions: [],
        canAccessRoute: jest.fn(() => true),
        canViewComponent: jest.fn(() => true),
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
        hasRole: jest.fn(() => false),
        isAdmin: jest.fn(() => false),
        isEditor: jest.fn(() => true),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        currentRole: 'editor',
        permissions: [],
        canAccessRoute: jest.fn(() => false),
        canViewComponent: jest.fn(() => false),
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
        hasRole: jest.fn(() => true),
        isAdmin: jest.fn(() => true),
        isEditor: jest.fn(() => true),
        hasPermission: jest.fn(() => true),
        hasAnyPermission: jest.fn(() => true),
        hasAllPermissions: jest.fn(() => true),
        currentRole: 'admin',
        permissions: [],
        canAccessRoute: jest.fn(() => true),
        canViewComponent: jest.fn(() => true),
      });

      render(<RoleIndicator />);

      expect(screen.getByText(/ADMIN/)).toBeInTheDocument();
      expect(screen.getByText(/👑/)).toBeInTheDocument();
    });

    it('should display editor role correctly', () => {
      mockUseRoles.mockReturnValue({
        hasRole: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
        isEditor: jest.fn(() => true),
        hasPermission: jest.fn(() => true),
        hasAnyPermission: jest.fn(() => true),
        hasAllPermissions: jest.fn(() => true),
        currentRole: 'editor',
        permissions: [],
        canAccessRoute: jest.fn(() => true),
        canViewComponent: jest.fn(() => true),
      });

      render(<RoleIndicator />);

      expect(screen.getByText(/EDITOR/)).toBeInTheDocument();
      expect(screen.getByText(/✏️/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', () => {
      mockUseRoles.mockReturnValue({
        hasRole: jest.fn(() => false),
        isAdmin: jest.fn(() => false),
        isEditor: jest.fn(() => false),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        currentRole: null,
        permissions: [],
        canAccessRoute: jest.fn(() => false),
        canViewComponent: jest.fn(() => false),
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
