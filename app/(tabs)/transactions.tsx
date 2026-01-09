import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';

import { Text, View, useThemeColor } from '@/components/Themed';
import { TransactionRow } from '@/components/TransactionRow';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';

export default function TransactionsScreen() {
  const secondaryText = useThemeColor({}, 'secondaryText');

  const { transactions, loading, refresh } = useTransactions();
  const { accounts } = useAccounts({ includeArchived: true });
  const [refreshing, setRefreshing] = useState(false);

  const accountMap = useMemo(() => {
    const map = new Map<string, (typeof accounts)[0]>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof transactions>();

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const existing = groups.get(key) ?? [];
      groups.set(key, [...existing, t]);
    });

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      label: formatGroupDate(date),
      transactions: items,
    }));
  }, [transactions]);

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: secondaryText }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: secondaryText }]}>
            No transactions yet
          </Text>
          <Text style={[styles.emptyText, { color: secondaryText }]}>
            Tap + to add your first transaction
          </Text>
        </View>
      ) : (
        groupedTransactions.map((group) => (
          <View key={group.date} style={styles.group}>
            <Text style={[styles.groupLabel, { color: secondaryText }]}>
              {group.label}
            </Text>
            {group.transactions.map((transaction) => (
              <Link key={transaction.id} href={`/transaction/${transaction.id}`} asChild>
                <View>
                  <TransactionRow
                    transaction={transaction}
                    fromAccount={accountMap.get(transaction.fromAccountId)}
                    toAccount={accountMap.get(transaction.toAccountId)}
                  />
                </View>
              </Link>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function formatGroupDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  group: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});
