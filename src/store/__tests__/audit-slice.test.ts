/**
 * Unit tests for audit slice store
 * Tests state management, filtering, pagination, and actions
 */

import '@testing-library/jest-dom';
import { createAuditSlice } from '../audit-slice';
import { mockAuditLogs } from '../__mocks__/store';

// Mock fetch globally
global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock audit API responses
const mockApiResponse = {
  logs: mockAuditLogs,
  total: mockAuditLogs.length,
};

describe('Audit Slice Store', () => {
  let mockSet: ReturnType<typeof vi.fn>;
  let mockGet: ReturnType<typeof vi.fn>;
  let auditSlice: ReturnType<typeof createAuditSlice>;

  beforeEach(() => {
    mockFetch.mockClear();

    // Create a proper Response mock that satisfies the interface
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: '',
      type: 'basic' as ResponseType,
      redirected: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      body: null,
      bodyUsed: false,
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
      json: vi.fn().mockResolvedValue(mockApiResponse),
      bytes: vi.fn(),
    };

    mockFetch.mockResolvedValue(mockResponse);

    // Clear all mocks
    vi.clearAllMocks();

    // Create mock Zustand set/get functions
    let state = {
      // Mock accessToken for API calls
      accessToken: 'mock-token',
      // Audit slice initial state
      auditLogs: [],
      isLoading: false,
      error: '',
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
      filters: {},
      sortConfig: { field: 'timestamp', direction: 'desc' },
      expandedRows: new Set(),
      selectedLogs: new Set(),
      actionTypes: [],
      users: [],
      auditStats: null,
      isLoadingStats: false,
      isExporting: false,
      lastRefresh: null,
      autoRefresh: false,
      refreshInterval: 30,
      // Mock function to avoid undefined errors in action handlers
      fetchAuditLogs: vi.fn().mockResolvedValue(undefined),
    };

    mockSet = vi.fn(update => {
      if (typeof update === 'function') {
        state = { ...state, ...update(state) };
      } else {
        state = { ...state, ...update };
      }
    });

    mockGet = vi.fn(() => state);

    // Create the audit slice with mocked functions
    auditSlice = createAuditSlice(mockSet, mockGet);
  });

  test('initializes with default state', () => {
    expect(auditSlice.auditLogs).toEqual([]);
    expect(auditSlice.isLoading).toBe(false);
    expect(auditSlice.error).toBe('');
    expect(auditSlice.pagination.page).toBe(1);
    expect(auditSlice.pagination.pageSize).toBe(25);
  });

  test('fetches audit logs successfully', async () => {
    await auditSlice.fetchAuditLogs();

    // Check that set was called with loading state first
    expect(mockSet).toHaveBeenCalledWith({ isLoading: true, error: '' });

    // Check the final success state
    expect(mockSet).toHaveBeenCalledWith({
      auditLogs: mockAuditLogs,
      pagination: expect.objectContaining({
        total: mockAuditLogs.length,
        totalPages: 1,
      }),
      lastRefresh: expect.any(Date),
      isLoading: false,
    });
  });

  test('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await auditSlice.fetchAuditLogs();

    // Check that set was called with loading state first
    expect(mockSet).toHaveBeenCalledWith({ isLoading: true, error: '' });

    // The API catches errors and returns empty results as fallback behavior
    expect(mockSet).toHaveBeenCalledWith({
      auditLogs: [],
      pagination: expect.objectContaining({
        total: 0,
        totalPages: 0,
      }),
      lastRefresh: expect.any(Date),
      isLoading: false,
    });
  });

  test('applies filters correctly', async () => {
    await auditSlice.setFilters({
      userEmail: 'test@example.com',
      actionType: 'login_success',
      status: 'success',
    });

    expect(mockSet).toHaveBeenCalledWith({
      filters: expect.objectContaining({
        userEmail: 'test@example.com',
        actionType: 'login_success',
        status: 'success',
      }),
      pagination: expect.objectContaining({ page: 1 }),
    });

    // Verify fetchAuditLogs was called automatically
    expect(mockGet().fetchAuditLogs).toHaveBeenCalled();
  });

  test('clears filters correctly', async () => {
    await auditSlice.clearFilters();

    expect(mockSet).toHaveBeenCalledWith({
      filters: {},
      pagination: expect.objectContaining({ page: 1 }),
    });

    // Verify fetchAuditLogs was called automatically
    expect(mockGet().fetchAuditLogs).toHaveBeenCalled();
  });

  test('manages pagination state', async () => {
    await auditSlice.goToPage(2);
    expect(mockSet).toHaveBeenCalledWith({
      pagination: expect.objectContaining({ page: 2 }),
    });

    await auditSlice.changePageSize(50);
    expect(mockSet).toHaveBeenCalledWith({
      pagination: expect.objectContaining({ pageSize: 50, page: 1 }),
    });

    // Verify fetchAuditLogs was called for both actions
    expect(mockGet().fetchAuditLogs).toHaveBeenCalledTimes(2);
  });

  test('handles row selection', () => {
    auditSlice.toggleLogSelection('audit-1');
    expect(mockSet).toHaveBeenCalledWith({
      selectedLogs: expect.any(Set),
    });

    // Check that the set contains the expected item
    const lastCall = mockSet.mock.calls[mockSet.mock.calls.length - 1][0];
    expect(lastCall.selectedLogs.has('audit-1')).toBe(true);
  });

  test('selects all logs', () => {
    // Set up some audit logs in the mock state
    mockGet.mockReturnValue({
      ...mockGet(),
      auditLogs: mockAuditLogs,
    });

    auditSlice.selectAllLogs();

    expect(mockSet).toHaveBeenCalledWith({
      selectedLogs: expect.any(Set),
    });

    // Check that the set has the correct size
    const lastCall = mockSet.mock.calls[mockSet.mock.calls.length - 1][0];
    expect(lastCall.selectedLogs.size).toBe(mockAuditLogs.length);
  });

  test('clears selection', () => {
    auditSlice.clearSelection();

    expect(mockSet).toHaveBeenCalledWith({
      selectedLogs: expect.any(Set),
    });

    // Check that the set is empty
    const lastCall = mockSet.mock.calls[mockSet.mock.calls.length - 1][0];
    expect(lastCall.selectedLogs.size).toBe(0);
  });

  test('handles row expansion', () => {
    auditSlice.toggleRowExpansion('audit-1');

    expect(mockSet).toHaveBeenCalledWith({
      expandedRows: expect.any(Set),
    });

    // Check the set manipulation
    const lastCall = mockSet.mock.calls[mockSet.mock.calls.length - 1][0];
    expect(lastCall.expandedRows.has('audit-1')).toBe(true);
  });

  test('sets sort configuration', async () => {
    await auditSlice.setSortConfig({
      field: 'timestamp',
      direction: 'asc',
    });

    expect(mockSet).toHaveBeenCalledWith({
      sortConfig: {
        field: 'timestamp',
        direction: 'asc',
      },
    });

    // Verify fetchAuditLogs was called automatically
    expect(mockGet().fetchAuditLogs).toHaveBeenCalled();
  });

  test('handles sort configuration changes', async () => {
    await auditSlice.setSortConfig({
      field: 'user_email',
      direction: 'asc',
    });

    expect(mockSet).toHaveBeenCalledWith({
      sortConfig: {
        field: 'user_email',
        direction: 'asc',
      },
    });

    // Verify fetchAuditLogs was called automatically
    expect(mockGet().fetchAuditLogs).toHaveBeenCalled();
  });

  test('handles concurrent fetch requests', async () => {
    // Test that multiple concurrent calls don't break the state
    const promises = [
      auditSlice.fetchAuditLogs(),
      auditSlice.fetchAuditLogs(),
      auditSlice.fetchAuditLogs(),
    ];

    await Promise.all(promises);

    // Should have called set multiple times with loading states
    expect(mockSet).toHaveBeenCalledWith({ isLoading: true, error: '' });
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false }));
  });
});
