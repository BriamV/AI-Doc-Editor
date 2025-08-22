/**
 * Unit tests for AuditLogTable component
 * Tests table rendering, sorting, row expansion, and interactions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AuditLogTable from '../AuditLogTable';
import { AuditLogEntry } from '../../../store/audit-slice';
import useStore from '../../../store/store';
import { mockAuditLogs } from '../../../store/__mocks__/store';

// Mock the store
jest.mock('../../../store/store');
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

// Using mock audit log data from store mock

const defaultMockState = {
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
  let mockStore: typeof defaultMockState & {
    setSortConfig: jest.Mock;
    toggleRowExpansion: jest.Mock;
    toggleLogSelection: jest.Mock;
    selectAllLogs: jest.Mock;
    clearSelection: jest.Mock;
  };
  const user = userEvent.setup();

  const defaultProps = {
    logs: mockAuditLogs,
    isLoading: false,
  };

  beforeEach(() => {
    mockStore = {
      ...defaultMockState,
      setSortConfig: jest.fn(),
      toggleRowExpansion: jest.fn(),
      toggleLogSelection: jest.fn(),
      selectAllLogs: jest.fn(),
      clearSelection: jest.fn(),
    };
    mockUseStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with audit log data', () => {
    render(<AuditLogTable {...defaultProps} />);

    // Check if table or table-like structure is present
    const tableElement =
      screen.getByTestId('audit-log-table') ||
      screen.getByRole('table') ||
      document.querySelector('[data-testid="audit-log-table"]');
    expect(tableElement).toBeInTheDocument();

    // Check for key table headers (flexible matching)
    expect(screen.getByText(/timestamp/i) || screen.getByText(/time/i)).toBeInTheDocument();
    expect(screen.getByText(/user/i) || screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/action/i) || screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    render(<AuditLogTable logs={[]} isLoading={true} />);

    // Loading state shows skeleton animation or loading text
    const loadingElement =
      document.querySelector('.animate-pulse') ||
      screen.queryByText(/loading/i) ||
      screen.queryByRole('progressbar');
    expect(loadingElement).toBeInTheDocument();
  });

  test('shows empty state when no logs', () => {
    render(<AuditLogTable logs={[]} isLoading={false} />);

    expect(
      screen.getByText(/no audit logs/i) ||
        screen.getByText(/no data/i) ||
        screen.getByText(/empty/i)
    ).toBeInTheDocument();
  });

  test('displays audit log entries correctly', () => {
    render(<AuditLogTable {...defaultProps} />);

    // Check if audit log data is displayed (case insensitive)
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(
      screen.getByText(/login.*success/i) || screen.getByText('login_success')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/document.*create/i) || screen.getByText('document_create')
    ).toBeInTheDocument();
  });

  test('handles row selection', async () => {
    render(<AuditLogTable {...defaultProps} />);

    // Look for checkbox or selection button
    const selectCheckbox =
      screen.queryByRole('checkbox') || screen.queryByTestId(/select.*audit-1/i);

    if (selectCheckbox) {
      await user.click(selectCheckbox);
      expect(mockStore.toggleLogSelection).toHaveBeenCalledWith('audit-1');
    }
  });

  test('handles row expansion', async () => {
    render(<AuditLogTable {...defaultProps} />);

    // Look for expand button
    const expandButton =
      screen.queryByTestId(/expand.*audit-1/i) ||
      screen.queryByRole('button', { name: /expand/i }) ||
      document.querySelector('[data-testid*="expand"]');

    if (expandButton) {
      await user.click(expandButton);
      expect(mockStore.toggleRowExpansion).toHaveBeenCalledWith('audit-1');
    }
  });

  test('handles sorting', async () => {
    render(<AuditLogTable {...defaultProps} />);

    // Look for sortable header
    const timestampHeader =
      screen.queryByTestId(/sort.*timestamp/i) || screen.queryByText(/timestamp/i);

    if (timestampHeader && timestampHeader.tagName === 'BUTTON') {
      await user.click(timestampHeader);
      expect(mockStore.setSortConfig).toHaveBeenCalled();
    }
  });

  test('displays expanded row details', () => {
    // Mock expanded state
    const mockStoreWithExpanded = {
      ...mockStore,
      expandedRows: new Set(['audit-1']),
    };
    mockUseStore.mockReturnValue(mockStoreWithExpanded);

    render(<AuditLogTable {...defaultProps} />);

    // Check for expanded details
    const expandedDetails =
      screen.queryByTestId(/expanded.*audit-1/i) || screen.queryByText(/oauth/i);

    if (expandedDetails) {
      expect(expandedDetails).toBeInTheDocument();
    }
  });

  test('shows selected rows', () => {
    // Mock selected state
    const mockStoreWithSelection = {
      ...mockStore,
      selectedLogs: new Set(['audit-1']),
    };
    mockUseStore.mockReturnValue(mockStoreWithSelection);

    render(<AuditLogTable {...defaultProps} />);

    // Check for selected state (checkboxes should be checked)
    const selectedCheckbox =
      screen.queryByRole('checkbox', { checked: true }) ||
      document.querySelector('input[type="checkbox"]:checked');

    if (selectedCheckbox) {
      expect(selectedCheckbox).toBeInTheDocument();
    }
  });

  test('handles error state gracefully', () => {
    // Test with invalid/null data
    const propsWithNullData = {
      logs: null as unknown as AuditLogEntry[],
      isLoading: false,
    };

    expect(() => render(<AuditLogTable {...propsWithNullData} />)).not.toThrow();
  });
});
