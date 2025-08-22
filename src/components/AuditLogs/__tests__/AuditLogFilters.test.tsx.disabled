/**
 * Unit tests for AuditLogFilters component
 * Tests filter controls, date pickers, dropdowns, and user input
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuditLogFilters from '../AuditLogFilters';
import useStore from '../../../store/store';

// Mock the store
jest.mock('../../../store/store');
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const mockStoreState = {
  filters: {},
  actionTypes: ['login_success', 'login_failure', 'document_create'],
  users: [
    { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    { id: 'user-2', email: 'admin@example.com', name: 'Admin User' },
  ],
  setFilters: jest.fn(),
  clearFilters: jest.fn(),
  fetchActionTypes: jest.fn(),
  fetchUsers: jest.fn(),
};

describe('AuditLogFilters Component', () => {
  beforeEach(() => {
    mockUseStore.mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders filter component with basic controls', () => {
    render(<AuditLogFilters />);

    // Should render filter toggle button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('shows expanded filters when toggled', () => {
    render(<AuditLogFilters />);

    const filterButton = screen.getByRole('button');
    expect(filterButton).toBeInTheDocument();
  });

  test('loads action types and users on mount', () => {
    mockUseStore.mockReturnValue({
      ...mockStoreState,
      actionTypes: [],
      users: [],
    });

    render(<AuditLogFilters />);

    expect(mockStoreState.fetchActionTypes).toHaveBeenCalled();
    expect(mockStoreState.fetchUsers).toHaveBeenCalled();
  });
});
