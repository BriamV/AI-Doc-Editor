/**
 * Unit tests for audit slice store
 * Tests state management, filtering, pagination, and actions
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import useStore from '../store';
import { mockAuditLogs } from '../__mocks__/store';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Using mock audit log data from store mock

const mockApiResponse = {
  logs: mockAuditLogs,
  total_count: mockAuditLogs.length,
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
    // Reset store state between tests
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.clearFilters();
      result.current.clearSelection();
    });
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

    // Allow time for async operations
    await waitFor(() => {
      expect(result.current.auditLogs).toEqual(mockAuditLogs);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  test('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useStore());

    await act(async () => {
      try {
        await result.current.fetchAuditLogs();
      } catch {
        // Expected to fail
      }
    });

    await waitFor(() => {
      expect(result.current.auditLogs).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toContain('Failed to fetch audit logs');
    });
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

  test('clears filters correctly', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setFilters({
        userEmail: 'test@example.com',
        actionType: 'login_success',
      });
      result.current.clearFilters();
    });

    expect(Object.keys(result.current.filters)).toHaveLength(0);
  });

  test('manages pagination state', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.goToPage(2);
      result.current.changePageSize(50);
    });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.pageSize).toBe(50);
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

  test('selects all logs', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.selectAllLogs();
    });

    expect(result.current.selectedLogs.has('audit-1')).toBe(true);
    expect(result.current.selectedLogs.has('audit-2')).toBe(true);
  });

  test('clears selection', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.toggleLogSelection('audit-1');
      result.current.toggleLogSelection('audit-2');
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

  test('toggles sort direction on same field', () => {
    const { result } = renderHook(() => useStore());

    // Set initial sort
    act(() => {
      result.current.setSortConfig({
        field: 'timestamp',
        direction: 'desc',
      });
    });

    // Toggle sort direction
    act(() => {
      result.current.setSortConfig({
        field: 'timestamp',
        direction: 'asc',
      });
    });

    expect(result.current.sortConfig.field).toBe('timestamp');
    expect(result.current.sortConfig.direction).toBe('asc');
  });

  test('handles concurrent fetch requests', async () => {
    const { result } = renderHook(() => useStore());
    
    // Start multiple requests
    const promises = [
      result.current.fetchAuditLogs(),
      result.current.fetchAuditLogs(),
      result.current.fetchAuditLogs(),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    // Should handle gracefully without errors
    expect(result.current.error).toBeNull();
  });
});
