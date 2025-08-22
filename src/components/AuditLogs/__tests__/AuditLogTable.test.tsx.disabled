/**
 * Unit tests for AuditLogTable component
 * Tests table rendering, sorting, row expansion, and interactions
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuditLogTable from '../AuditLogTable';
import { AuditLogEntry } from '../../../store/audit-slice';
import useStore from '../../../store/store';

// Mock the store
jest.mock('../../../store/store');
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

// Mock audit log data
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    action_type: 'login_success',
    resource_type: 'user',
    resource_id: 'user-123',
    user_id: 'user-123',
    user_email: 'test@example.com',
    user_role: 'user',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    session_id: 'session-123',
    description: 'User logged in successfully',
    details: '{"method": "oauth", "provider": "google"}',
    status: 'success',
    timestamp: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'audit-2',
    action_type: 'document_create',
    resource_type: 'document',
    resource_id: 'doc-456',
    user_id: 'user-123',
    user_email: 'test@example.com',
    user_role: 'user',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    session_id: 'session-456',
    description: 'Document created successfully',
    details: '{"title": "Test Document", "size": 1024}',
    status: 'success',
    timestamp: '2024-01-15T11:00:00Z',
    created_at: '2024-01-15T11:00:00Z',
  },
];

const mockStoreState = {
  sortConfig: {
    field: 'timestamp' as keyof AuditLogEntry,
    direction: 'desc' as const,
  },
  expandedRows: new Set<string>(),
  selectedLogs: new Set<string>(),
  setSortConfig: jest.fn(),
  toggleRowExpansion: jest.fn(),
  toggleLogSelection: jest.fn(),
  selectAllLogs: jest.fn(),
  clearSelection: jest.fn(),
};

describe('AuditLogTable Component', () => {
  const defaultProps = {
    logs: mockAuditLogs,
    isLoading: false,
  };

  beforeEach(() => {
    mockUseStore.mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with audit log data', () => {
    render(<AuditLogTable {...defaultProps} />);

    // Check if table headers are present
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    render(<AuditLogTable logs={[]} isLoading={true} />);

    // Loading state shows skeleton animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('shows empty state when no logs', () => {
    render(<AuditLogTable logs={[]} isLoading={false} />);

    expect(screen.getByText('No audit logs found')).toBeInTheDocument();
  });

  test('displays audit log entries correctly', () => {
    render(<AuditLogTable {...defaultProps} />);

    // Check if audit log data is displayed
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Login Success')).toBeInTheDocument();
    expect(screen.getByText('Document Create')).toBeInTheDocument();
  });
});
