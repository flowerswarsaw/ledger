import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import { getAccountBalance, getNetWorth } from '../db/queries';

export function useAccountBalance(accountId: string | null) {
  const { db, isReady } = useDatabase();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db || !accountId) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAccountBalance(db, accountId);
      setBalance(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load balance'));
    } finally {
      setLoading(false);
    }
  }, [db, accountId]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  return { balance, loading, error, refresh };
}

export function useNetWorth() {
  const { db, isReady } = useDatabase();
  const [netWorth, setNetWorth] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      const data = await getNetWorth(db);
      setNetWorth(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load net worth'));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isReady) {
      refresh();
    }
  }, [isReady, refresh]);

  return { netWorth, loading, error, refresh };
}
