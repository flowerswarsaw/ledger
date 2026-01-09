import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import {
  getTransactions,
  getRecentTransactions,
  createTransaction,
  getTransaction,
  reverseTransaction,
} from '../db/queries';
import type { Transaction, CreateTransactionInput, TransactionFilter } from '../types';

export function useTransactions(filter: TransactionFilter = {}) {
  const { db, isReady } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      const data = await getTransactions(db, filter);
      setTransactions(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  }, [db, filter.accountId, filter.startDate, filter.endDate, filter.limit, filter.offset]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  const add = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction | null> => {
      if (!db) return null;
      try {
        const transaction = await createTransaction(db, input);
        await refresh();
        return transaction;
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to create transaction'));
        return null;
      }
    },
    [db, refresh]
  );

  const reverse = useCallback(
    async (id: string, note?: string): Promise<Transaction | null> => {
      if (!db) return null;
      try {
        const transaction = await reverseTransaction(db, id, note);
        await refresh();
        return transaction;
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to reverse transaction'));
        return null;
      }
    },
    [db, refresh]
  );

  return { transactions, loading, error, refresh, add, reverse };
}

export function useRecentTransactions(limit: number = 10) {
  const { db, isReady } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      const data = await getRecentTransactions(db, limit);
      setTransactions(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  }, [db, limit]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  return { transactions, loading, error, refresh };
}

export function useTransaction(id: string | null) {
  const { db, isReady } = useDatabase();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db || !id) {
      setTransaction(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getTransaction(db, id);
      setTransaction(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load transaction'));
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  return { transaction, loading, error, refresh };
}
