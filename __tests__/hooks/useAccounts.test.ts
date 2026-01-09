import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAccounts } from '../../hooks/useAccounts';

const mockDb = { id: 'mock-db' };

// Mock the database module
jest.mock('../../hooks/useDatabase', () => ({
  useDatabase: () => ({
    db: mockDb,
    isReady: true,
    error: null,
  }),
}));

// Mock query functions
jest.mock('../../db/queries', () => ({
  getAllAccounts: jest.fn(),
  getAccountsByType: jest.fn(),
  getAccountsWithBalances: jest.fn(),
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
  archiveAccount: jest.fn(),
  unarchiveAccount: jest.fn(),
}));

import * as queries from '../../db/queries';

describe('useAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (queries.getAllAccounts as jest.Mock).mockResolvedValue([]);
  });

  it('should load accounts on mount', async () => {
    const mockAccounts = [
      { id: '1', name: 'Account 1', type: 'internal', currency: 'USD', createdAt: 1234567890, archived: false },
    ];
    (queries.getAllAccounts as jest.Mock).mockResolvedValue(mockAccounts);

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.accounts).toEqual(mockAccounts);
    expect(result.current.error).toBeNull();
  });

  it('should filter by type when option provided', async () => {
    const mockAccounts = [
      { id: '1', name: 'Internal Account', type: 'internal', currency: 'USD', createdAt: 1234567890, archived: false },
    ];
    (queries.getAccountsByType as jest.Mock).mockResolvedValue(mockAccounts);

    const { result } = renderHook(() => useAccounts({ type: 'internal' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(queries.getAccountsByType).toHaveBeenCalledWith(mockDb, 'internal', undefined);
  });

  it('should add account', async () => {
    const newAccount = { id: '2', name: 'New Account', type: 'internal', currency: 'USD', createdAt: 1234567890, archived: false };
    (queries.createAccount as jest.Mock).mockResolvedValue(newAccount);
    (queries.getAllAccounts as jest.Mock).mockResolvedValue([newAccount]);

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let account: any;
    await act(async () => {
      account = await result.current.add({ name: 'New Account', type: 'internal' });
    });

    expect(account).toEqual(newAccount);
    expect(queries.createAccount).toHaveBeenCalledWith(mockDb, { name: 'New Account', type: 'internal' });
  });

  it('should update account', async () => {
    const existingAccount = { id: '1', name: 'Old Name', type: 'internal', currency: 'USD', createdAt: 1234567890, archived: false };
    const updatedAccount = { ...existingAccount, name: 'New Name' };

    (queries.getAllAccounts as jest.Mock).mockResolvedValue([existingAccount]);
    (queries.updateAccount as jest.Mock).mockResolvedValue(updatedAccount);

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let account: any;
    await act(async () => {
      account = await result.current.update('1', { name: 'New Name' });
    });

    expect(account?.name).toBe('New Name');
    expect(queries.updateAccount).toHaveBeenCalledWith(mockDb, '1', { name: 'New Name' });
  });

  it('should archive account', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.archive('1');
    });

    expect(queries.archiveAccount).toHaveBeenCalledWith(mockDb, '1');
  });

  it('should unarchive account', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.unarchive('1');
    });

    expect(queries.unarchiveAccount).toHaveBeenCalledWith(mockDb, '1');
  });

  it('should handle add error', async () => {
    (queries.createAccount as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let account: any;
    await act(async () => {
      account = await result.current.add({ name: 'Test', type: 'internal' });
    });

    expect(account).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it('should handle add error with non-Error rejection', async () => {
    (queries.createAccount as jest.Mock).mockRejectedValue('string error');

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let account: any;
    await act(async () => {
      account = await result.current.add({ name: 'Test', type: 'internal' });
    });

    expect(account).toBeNull();
    expect(result.current.error?.message).toBe('Failed to create account');
  });

  it('should handle update error', async () => {
    (queries.updateAccount as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let account: any;
    await act(async () => {
      account = await result.current.update('1', { name: 'Test' });
    });

    expect(account).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it('should refresh accounts list after operations', async () => {
    const initialAccounts = [{ id: '1', name: 'Account 1', type: 'internal', currency: 'USD', createdAt: 1234567890, archived: false }];
    const newAccount = { id: '2', name: 'Account 2', type: 'internal', currency: 'USD', createdAt: 1234567890, archived: false };

    (queries.getAllAccounts as jest.Mock)
      .mockResolvedValueOnce(initialAccounts)
      .mockResolvedValueOnce([...initialAccounts, newAccount]);
    (queries.createAccount as jest.Mock).mockResolvedValue(newAccount);

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.accounts).toHaveLength(1);

    await act(async () => {
      await result.current.add({ name: 'Account 2', type: 'internal' });
    });

    // getAllAccounts should have been called twice (initial + after add)
    expect(queries.getAllAccounts).toHaveBeenCalledTimes(2);
  });

  it('should indicate isReady status', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isReady).toBe(true);
  });
});
