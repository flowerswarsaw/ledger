import {
  createAccount,
  getAccount,
  getAllAccounts,
  updateAccount,
  archiveAccount,
  unarchiveAccount,
  hasTransactions,
  createTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  reverseTransaction,
} from '../../db/queries';

// Mock utilities
jest.mock('../../utils/id', () => ({
  generateId: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

jest.mock('../../utils/date', () => ({
  now: jest.fn(() => 1234567890000),
}));

// Helper to create a mock database
const createMockDb = () => ({
  runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn().mockResolvedValue([]),
});

describe('Account Queries', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create account with required fields', async () => {
      const account = await createAccount(mockDb as any, {
        name: 'Test Account',
        type: 'internal',
      });

      expect(account.name).toBe('Test Account');
      expect(account.type).toBe('internal');
      expect(account.currency).toBe('USD');
      expect(account.archived).toBe(false);
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });

    it('should create account with custom currency', async () => {
      const account = await createAccount(mockDb as any, {
        name: 'Euro Account',
        type: 'internal',
        currency: 'EUR',
      });

      expect(account.currency).toBe('EUR');
    });

    it('should create external account', async () => {
      const account = await createAccount(mockDb as any, {
        name: 'Vendor',
        type: 'external',
      });

      expect(account.type).toBe('external');
    });
  });

  describe('getAccount', () => {
    it('should return account when found', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        name: 'Test',
        type: 'internal',
        currency: 'USD',
        created_at: 1234567890,
        archived: 0,
      });

      const account = await getAccount(mockDb as any, 'test-id');

      expect(account).not.toBeNull();
      expect(account?.id).toBe('test-id');
      expect(account?.archived).toBe(false);
    });

    it('should return null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const account = await getAccount(mockDb as any, 'nonexistent');

      expect(account).toBeNull();
    });

    it('should convert archived flag correctly', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        name: 'Test',
        type: 'internal',
        currency: 'USD',
        created_at: 1234567890,
        archived: 1,
      });

      const account = await getAccount(mockDb as any, 'test-id');

      expect(account?.archived).toBe(true);
    });
  });

  describe('getAllAccounts', () => {
    it('should return all non-archived accounts by default', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: '1', name: 'Account 1', type: 'internal', currency: 'USD', created_at: 1234567890, archived: 0 },
        { id: '2', name: 'Account 2', type: 'external', currency: 'EUR', created_at: 1234567890, archived: 0 },
      ]);

      const accounts = await getAllAccounts(mockDb as any);

      expect(accounts).toHaveLength(2);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM accounts WHERE archived = 0 ORDER BY name'
      );
    });

    it('should include archived when requested', async () => {
      await getAllAccounts(mockDb as any, true);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM accounts ORDER BY name'
      );
    });
  });

  describe('updateAccount', () => {
    beforeEach(() => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        name: 'Updated Name',
        type: 'internal',
        currency: 'USD',
        created_at: 1234567890,
        archived: 0,
      });
    });

    it('should update only name when provided', async () => {
      await updateAccount(mockDb as any, 'test-id', { name: 'Updated Name' });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE accounts SET name = ? WHERE id = ?',
        'Updated Name',
        'test-id'
      );
    });

    it('should update only type when provided', async () => {
      await updateAccount(mockDb as any, 'test-id', { type: 'external' });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE accounts SET type = ? WHERE id = ?',
        'external',
        'test-id'
      );
    });

    it('should update multiple fields', async () => {
      await updateAccount(mockDb as any, 'test-id', {
        name: 'New Name',
        type: 'external',
        currency: 'EUR',
      });

      expect(mockDb.runAsync).toHaveBeenCalled();
      const call = mockDb.runAsync.mock.calls[0];
      expect(call[0]).toContain('name = ?');
      expect(call[0]).toContain('type = ?');
      expect(call[0]).toContain('currency = ?');
    });

    it('should not run update if no fields provided', async () => {
      await updateAccount(mockDb as any, 'test-id', {});

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should return updated account', async () => {
      const account = await updateAccount(mockDb as any, 'test-id', { name: 'Updated' });

      expect(account?.name).toBe('Updated Name');
    });
  });

  describe('archiveAccount', () => {
    it('should set archived to 1', async () => {
      await archiveAccount(mockDb as any, 'test-id');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE accounts SET archived = 1 WHERE id = ?',
        'test-id'
      );
    });
  });

  describe('unarchiveAccount', () => {
    it('should set archived to 0', async () => {
      await unarchiveAccount(mockDb as any, 'test-id');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE accounts SET archived = 0 WHERE id = ?',
        'test-id'
      );
    });
  });

  describe('hasTransactions', () => {
    it('should return true when account has transactions', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 5 });

      const result = await hasTransactions(mockDb as any, 'account-id');

      expect(result).toBe(true);
    });

    it('should return false when account has no transactions', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await hasTransactions(mockDb as any, 'account-id');

      expect(result).toBe(false);
    });

    it('should return false when result is null', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await hasTransactions(mockDb as any, 'account-id');

      expect(result).toBe(false);
    });
  });
});

describe('Transaction Queries', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create transaction with required fields', async () => {
      const transaction = await createTransaction(mockDb as any, {
        date: 1234567890,
        fromAccountId: 'from-id',
        toAccountId: 'to-id',
        amount: 1000,
      });

      expect(transaction.fromAccountId).toBe('from-id');
      expect(transaction.toAccountId).toBe('to-id');
      expect(transaction.amount).toBe(1000);
      expect(transaction.tags).toEqual([]);
      expect(transaction.note).toBeNull();
    });

    it('should create transaction with optional fields', async () => {
      const transaction = await createTransaction(mockDb as any, {
        date: 1234567890,
        fromAccountId: 'from-id',
        toAccountId: 'to-id',
        amount: 1000,
        tags: ['food', 'groceries'],
        note: 'Weekly shopping',
      });

      expect(transaction.tags).toEqual(['food', 'groceries']);
      expect(transaction.note).toBe('Weekly shopping');
    });
  });

  describe('getTransaction', () => {
    it('should return transaction when found', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'tx-id',
        date: 1234567890,
        from_account_id: 'from-id',
        to_account_id: 'to-id',
        amount: 1000,
        tags: '["tag1", "tag2"]',
        note: 'Test note',
        created_at: 1234567890,
      });

      const transaction = await getTransaction(mockDb as any, 'tx-id');

      expect(transaction).not.toBeNull();
      expect(transaction?.id).toBe('tx-id');
      expect(transaction?.tags).toEqual(['tag1', 'tag2']);
    });

    it('should return null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const transaction = await getTransaction(mockDb as any, 'nonexistent');

      expect(transaction).toBeNull();
    });
  });

  describe('getTransactions', () => {
    it('should return all transactions without filter', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: '1', date: 1234567890, from_account_id: 'a', to_account_id: 'b', amount: 100, tags: '[]', note: null, created_at: 1234567890 },
      ]);

      const transactions = await getTransactions(mockDb as any);

      expect(transactions).toHaveLength(1);
    });

    it('should filter by accountId', async () => {
      await getTransactions(mockDb as any, { accountId: 'account-123' });

      const call = mockDb.getAllAsync.mock.calls[0];
      expect(call[0]).toContain('from_account_id = ? OR to_account_id = ?');
      expect(call[1]).toBe('account-123');
      expect(call[2]).toBe('account-123');
    });

    it('should filter by date range', async () => {
      await getTransactions(mockDb as any, { startDate: 1000, endDate: 2000 });

      const call = mockDb.getAllAsync.mock.calls[0];
      expect(call[0]).toContain('date >= ?');
      expect(call[0]).toContain('date <= ?');
    });

    it('should apply limit and offset', async () => {
      await getTransactions(mockDb as any, { limit: 10, offset: 20 });

      const call = mockDb.getAllAsync.mock.calls[0];
      expect(call[0]).toContain('LIMIT ?');
      expect(call[0]).toContain('OFFSET ?');
    });
  });

  describe('updateTransaction', () => {
    beforeEach(() => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'tx-id',
        date: 1234567890,
        from_account_id: 'from-id',
        to_account_id: 'to-id',
        amount: 2000,
        tags: '[]',
        note: 'Updated',
        created_at: 1234567890,
      });
    });

    it('should update amount', async () => {
      await updateTransaction(mockDb as any, 'tx-id', { amount: 2000 });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE transactions SET amount = ? WHERE id = ?',
        2000,
        'tx-id'
      );
    });

    it('should update tags as JSON', async () => {
      await updateTransaction(mockDb as any, 'tx-id', { tags: ['new-tag'] });

      const call = mockDb.runAsync.mock.calls[0];
      expect(call[1]).toBe('["new-tag"]');
    });

    it('should update note', async () => {
      await updateTransaction(mockDb as any, 'tx-id', { note: 'Updated note' });

      const call = mockDb.runAsync.mock.calls[0];
      expect(call[0]).toContain('note = ?');
    });

    it('should update from and to accounts', async () => {
      await updateTransaction(mockDb as any, 'tx-id', {
        fromAccountId: 'new-from',
        toAccountId: 'new-to',
      });

      const call = mockDb.runAsync.mock.calls[0];
      expect(call[0]).toContain('from_account_id = ?');
      expect(call[0]).toContain('to_account_id = ?');
    });

    it('should not run update if no fields provided', async () => {
      await updateTransaction(mockDb as any, 'tx-id', {});

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction and return true', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await deleteTransaction(mockDb as any, 'tx-id');

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM transactions WHERE id = ?',
        'tx-id'
      );
    });

    it('should return false if transaction not found', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await deleteTransaction(mockDb as any, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('reverseTransaction', () => {
    it('should create reverse transaction', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'original-id',
        date: 1234567890,
        from_account_id: 'from-id',
        to_account_id: 'to-id',
        amount: 1000,
        tags: '["tag1"]',
        note: 'Original',
        created_at: 1234567890,
      });

      const reversal = await reverseTransaction(mockDb as any, 'original-id');

      expect(reversal.fromAccountId).toBe('to-id');
      expect(reversal.toAccountId).toBe('from-id');
      expect(reversal.amount).toBe(1000);
    });

    it('should use custom note when provided', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'original-id',
        date: 1234567890,
        from_account_id: 'from-id',
        to_account_id: 'to-id',
        amount: 1000,
        tags: '[]',
        note: null,
        created_at: 1234567890,
      });

      const reversal = await reverseTransaction(mockDb as any, 'original-id', 'Custom reversal');

      expect(reversal.note).toBe('Custom reversal');
    });

    it('should throw error if original not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(
        reverseTransaction(mockDb as any, 'nonexistent')
      ).rejects.toThrow('Transaction nonexistent not found');
    });
  });
});
