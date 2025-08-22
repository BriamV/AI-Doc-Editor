/**
 * Unit tests for audit slice store
 * Tests state management, filtering, pagination, and actions
 */

import { act, renderHook } from '@testing-library/react';
import useStore from '../store';
import { AuditLogEntry } from '../audit-slice';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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
    user_agent: 'Mozilla/5.0',
    session_id: 'session-123',
    description: 'User logged in successfully',
    details: '{"method": "oauth"}',
    status: 'success',
    timestamp: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
  },
];

const mockApiResponse = {
  logs: mockAuditLogs,
  total_count: 1,
  page: 1,
  page_size: 50,
  total_pages: 1,
  has_next: false,
  has_previous: false,
};

describe('Audit Slice Store', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useStore());

    expect(result.current.auditLogs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.pageSize).toBe(25);
  });

  test('fetches audit logs successfully', async () => {
    const { result } = renderHook(() => useStore());

    await act(async () => {
      await result.current.fetchAuditLogs();
    });

    expect(result.current.auditLogs).toEqual(mockAuditLogs);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('handles fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useStore());

    await act(async () => {
      await result.current.fetchAuditLogs();
    });

    expect(result.current.auditLogs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch audit logs');
  });

  test('applies filters correctly', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setFilters({
        userEmail: 'test@example.com',
        actionType: 'login_success',
        status: 'success',
      });
    });

    expect(result.current.filters.userEmail).toBe('test@example.com');
    expect(result.current.filters.actionType).toBe('login_success');
    expect(result.current.filters.status).toBe('success');
  });

  test('manages pagination state', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.goToPage(2);
      result.current.changePageSize(25);
    });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.pageSize).toBe(25);
  });

  test('handles row selection', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.toggleLogSelection('audit-1');
    });

    expect(result.current.selectedLogs.has('audit-1')).toBe(true);

    act(() => {
      result.current.toggleLogSelection('audit-1');
    });

    expect(result.current.selectedLogs.has('audit-1')).toBe(false);
  });

  test('clears selection', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.toggleLogSelection('audit-1');
      result.current.clearSelection();
    });

    expect(result.current.selectedLogs.size).toBe(0);
  });

  test('handles row expansion', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.toggleRowExpansion('audit-1');
    });

    expect(result.current.expandedRows.has('audit-1')).toBe(true);

    act(() => {
      result.current.toggleRowExpansion('audit-1');
    });

    expect(result.current.expandedRows.has('audit-1')).toBe(false);
  });

  test('sets sort configuration', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setSortConfig({
        field: 'timestamp',
        direction: 'asc',
      });
    });

    expect(result.current.sortConfig.field).toBe('timestamp');
    expect(result.current.sortConfig.direction).toBe('asc');
  });
});
