import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTransactions } from '../../hooks/useTransactions';

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
  getTransactions: jest.fn(),
  getRecentTransactions: jest.fn(),
  createTransaction: jest.fn(),
  getTransaction: jest.fn(),
  reverseTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
}));

import * as queries from '../../db/queries';

describe('useTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (queries.getTransactions as jest.Mock).mockResolvedValue([]);
  });

  it('should load transactions on mount', async () => {
    const mockTransactions = [
      { id: '1', date: 1234567890, fromAccountId: 'a', toAccountId: 'b', amount: 1000, tags: [], note: null, createdAt: 1234567890 },
    ];
    (queries.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.error).toBeNull();
  });

  it('should filter transactions by accountId', async () => {
    const { result } = renderHook(() => useTransactions({ accountId: 'account-123' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(queries.getTransactions).toHaveBeenCalledWith(mockDb, { accountId: 'account-123' });
  });

  it('should add transaction', async () => {
    const newTransaction = {
      id: '2',
      date: 1234567890,
      fromAccountId: 'a',
      toAccountId: 'b',
      amount: 500,
      tags: [],
      note: null,
      createdAt: 1234567890,
    };
    (queries.createTransaction as jest.Mock).mockResolvedValue(newTransaction);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let transaction: any;
    await act(async () => {
      transaction = await result.current.add({
        date: 1234567890,
        fromAccountId: 'a',
        toAccountId: 'b',
        amount: 500,
      });
    });

    expect(transaction).toEqual(newTransaction);
    expect(queries.createTransaction).toHaveBeenCalled();
  });

  it('should update transaction', async () => {
    const updatedTransaction = {
      id: '1',
      date: 1234567890,
      fromAccountId: 'a',
      toAccountId: 'b',
      amount: 2000,
      tags: [],
      note: 'Updated',
      createdAt: 1234567890,
    };
    (queries.updateTransaction as jest.Mock).mockResolvedValue(updatedTransaction);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let transaction: any;
    await act(async () => {
      transaction = await result.current.update('1', { amount: 2000, note: 'Updated' });
    });

    expect(transaction?.amount).toBe(2000);
    expect(transaction?.note).toBe('Updated');
    expect(queries.updateTransaction).toHaveBeenCalledWith(mockDb, '1', { amount: 2000, note: 'Updated' });
  });

  it('should delete transaction', async () => {
    (queries.deleteTransaction as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean = false;
    await act(async () => {
      success = await result.current.remove('1');
    });

    expect(success).toBe(true);
    expect(queries.deleteTransaction).toHaveBeenCalledWith(mockDb, '1');
  });

  it('should reverse transaction', async () => {
    const reversalTransaction = {
      id: '3',
      date: 1234567890,
      fromAccountId: 'b',
      toAccountId: 'a',
      amount: 1000,
      tags: [],
      note: 'Reversal',
      createdAt: 1234567890,
    };
    (queries.reverseTransaction as jest.Mock).mockResolvedValue(reversalTransaction);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let transaction: any;
    await act(async () => {
      transaction = await result.current.reverse('1', 'Reversal');
    });

    expect(transaction?.fromAccountId).toBe('b');
    expect(transaction?.toAccountId).toBe('a');
    expect(queries.reverseTransaction).toHaveBeenCalledWith(mockDb, '1', 'Reversal');
  });

  it('should handle delete failure', async () => {
    (queries.deleteTransaction as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.remove('nonexistent');
    });

    expect(success).toBe(false);
  });

  it('should handle update error', async () => {
    (queries.updateTransaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let transaction: any;
    await act(async () => {
      transaction = await result.current.update('1', { amount: 2000 });
    });

    expect(transaction).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it('should handle delete error', async () => {
    (queries.deleteTransaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.remove('1');
    });

    expect(success).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('should refresh transactions after add', async () => {
    const initialTransactions = [{ id: '1', date: 1234567890, fromAccountId: 'a', toAccountId: 'b', amount: 1000, tags: [], note: null, createdAt: 1234567890 }];
    const newTransaction = { id: '2', date: 1234567890, fromAccountId: 'a', toAccountId: 'b', amount: 500, tags: [], note: null, createdAt: 1234567890 };

    (queries.getTransactions as jest.Mock)
      .mockResolvedValueOnce(initialTransactions)
      .mockResolvedValueOnce([...initialTransactions, newTransaction]);
    (queries.createTransaction as jest.Mock).mockResolvedValue(newTransaction);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(1);

    await act(async () => {
      await result.current.add({
        date: 1234567890,
        fromAccountId: 'a',
        toAccountId: 'b',
        amount: 500,
      });
    });

    expect(queries.getTransactions).toHaveBeenCalledTimes(2);
  });

  it('should refresh transactions after successful delete', async () => {
    (queries.deleteTransaction as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (queries.getTransactions as jest.Mock).mock.calls.length;

    await act(async () => {
      await result.current.remove('1');
    });

    expect(queries.getTransactions).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  it('should not refresh transactions after failed delete', async () => {
    (queries.deleteTransaction as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (queries.getTransactions as jest.Mock).mock.calls.length;

    await act(async () => {
      await result.current.remove('nonexistent');
    });

    // Should not have refreshed since delete returned false
    expect(queries.getTransactions).toHaveBeenCalledTimes(initialCallCount);
  });
});
