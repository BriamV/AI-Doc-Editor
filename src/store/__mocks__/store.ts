/**
 * Mock store for testing
 * Provides jest-compatible Zustand store mocking
 */

import {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogSortConfig,
  AuditLogPagination,
} from '../audit-slice';

// Mock audit log data for tests
export const mockAuditLogs: AuditLogEntry[] = [
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

// Mock store state
const mockStoreState = {
  // Audit log state
  auditLogs: [] as AuditLogEntry[],
  isLoading: false,
  error: null as string | null,
  filters: {} as AuditLogFilters,
  sortConfig: {
    field: 'timestamp' as keyof AuditLogEntry,
    direction: 'desc' as const,
  } as AuditLogSortConfig,
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  } as AuditLogPagination,

  // UI state
  expandedRows: new Set<string>(),
  selectedLogs: new Set<string>(),

  // Reference data
  actionTypes: ['login_success', 'login_failure', 'document_create'],
  users: [
    { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    { id: 'user-2', email: 'admin@example.com', name: 'Admin User' },
  ],
  auditStats: {
    total_events: 150,
    events_today: 25,
    events_this_week: 85,
    events_this_month: 120,
    top_actions: [
      { action_type: 'login_success', count: 50 },
      { action_type: 'document_create', count: 30 },
    ],
    top_users: [
      { user_email: 'test@example.com', count: 45 },
      { user_email: 'admin@example.com', count: 35 },
    ],
    security_events: 15,
    failed_logins: 8,
  },

  // Actions
  fetchAuditLogs: jest.fn().mockResolvedValue(undefined),
  setFilters: jest.fn(),
  clearFilters: jest.fn(),
  setSortConfig: jest.fn(),
  goToPage: jest.fn(),
  changePageSize: jest.fn(),
  toggleRowExpansion: jest.fn(),
  toggleLogSelection: jest.fn(),
  selectAllLogs: jest.fn(),
  clearSelection: jest.fn(),
  fetchActionTypes: jest.fn().mockResolvedValue(undefined),
  fetchUsers: jest.fn().mockResolvedValue(undefined),
  fetchAuditStats: jest.fn().mockResolvedValue(undefined),
  exportLogs: jest.fn().mockResolvedValue(undefined),
};

// Create store mock that can be updated by tests
const createStoreMock = (initialState = {}) => {
  const state = { ...mockStoreState, ...initialState };

  return jest.fn(() => state);
};

// Default export for jest.mock
const useStore = createStoreMock();

export default useStore;
export { createStoreMock, mockStoreState };
