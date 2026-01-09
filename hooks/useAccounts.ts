import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import {
  getAllAccounts,
  getAccountsWithBalances,
  getAccountsByType,
  createAccount,
  archiveAccount,
  unarchiveAccount,
  updateAccount,
} from '../db/queries';
import type {
  Account,
  AccountWithBalance,
  CreateAccountInput,
  UpdateAccountInput,
  AccountType,
} from '../types';

export function useAccounts(options: { includeArchived?: boolean; type?: AccountType } = {}) {
  const { db, isReady } = useDatabase();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      const data = options.type
        ? await getAccountsByType(db, options.type, options.includeArchived)
        : await getAllAccounts(db, options.includeArchived);
      setAccounts(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load accounts'));
    } finally {
      setLoading(false);
    }
  }, [db, options.includeArchived, options.type]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  const add = useCallback(
    async (input: CreateAccountInput): Promise<Account | null> => {
      if (!db) {
        setError(new Error('Database not ready'));
        return null;
      }
      try {
        const account = await createAccount(db, input);
        await refresh();
        return account;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to create account');
        setError(err);
        console.error('Failed to create account:', e);
        return null;
      }
    },
    [db, refresh]
  );

  const archive = useCallback(
    async (id: string): Promise<void> => {
      if (!db) return;
      try {
        await archiveAccount(db, id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to archive account'));
      }
    },
    [db, refresh]
  );

  const unarchive = useCallback(
    async (id: string): Promise<void> => {
      if (!db) return;
      try {
        await unarchiveAccount(db, id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to unarchive account'));
      }
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: string, input: UpdateAccountInput): Promise<Account | null> => {
      if (!db) {
        setError(new Error('Database not ready'));
        return null;
      }
      try {
        const account = await updateAccount(db, id, input);
        await refresh();
        return account;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to update account');
        setError(err);
        console.error('Failed to update account:', e);
        return null;
      }
    },
    [db, refresh]
  );

  return { accounts, loading, error, refresh, add, update, archive, unarchive, isReady };
}

export function useAccountsWithBalances(includeArchived: boolean = false) {
  const { db, isReady } = useDatabase();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      const data = await getAccountsWithBalances(db, includeArchived);
      setAccounts(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load accounts'));
    } finally {
      setLoading(false);
    }
  }, [db, includeArchived]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  return { accounts, loading, error, refresh };
}
