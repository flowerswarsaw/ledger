import { useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link, Stack } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { TransactionRow } from '@/components/TransactionRow';
import { useDatabase } from '@/hooks/useDatabase';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccountBalance } from '@/hooks/useBalance';
import { getAccount } from '@/db/queries';
import { formatMoney } from '@/utils/money';
import { getTransactionPerspective } from '@/utils/transaction';
import type { Account } from '@/types';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db } = useDatabase();

  const secondaryText = useThemeColor({}, 'secondaryText');
  const positiveColor = useThemeColor({}, 'positive');
  const negativeColor = useThemeColor({}, 'negative');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  const [account, setAccount] = useState<Account | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { balance, refresh: refreshBalance } = useAccountBalance(id ?? null);
  const { transactions, refresh: refreshTransactions } = useTransactions({
    accountId: id ?? undefined,
  });
  const { accounts, archive, unarchive } = useAccounts({ includeArchived: true });

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const loadAccount = useCallback(async () => {
    if (!db || !id) return;
    const data = await getAccount(db, id);
    setAccount(data);
  }, [db, id]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAccount(), refreshBalance(), refreshTransactions()]);
    setRefreshing(false);
  }, [loadAccount, refreshBalance, refreshTransactions]);

  const handleArchive = () => {
    if (!account) return;

    Alert.alert(
      account.archived ? 'Unarchive Account' : 'Archive Account',
      account.archived
        ? 'This will show the account in your lists again.'
        : 'This will hide the account from your lists. You can unarchive it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: account.archived ? 'Unarchive' : 'Archive',
          style: account.archived ? 'default' : 'destructive',
          onPress: async () => {
            if (account.archived) {
              await unarchive(account.id);
            } else {
              await archive(account.id);
            }
            await loadAccount();
          },
        },
      ]
    );
  };

  if (!account) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: secondaryText }}>Loading...</Text>
      </View>
    );
  }

  const balanceColor = balance >= 0 ? positiveColor : negativeColor;
  const isInternal = account.type === 'internal';

  return (
    <>
      <Stack.Screen options={{ title: account.name }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <Text style={[styles.cardLabel, { color: secondaryText }]}>
            {isInternal ? 'Balance' : 'Total Activity'}
          </Text>
          <Text style={[styles.balance, { color: balanceColor }]}>
            {formatMoney(balance, account.currency)}
          </Text>
          <View style={[styles.badge, { borderColor: secondaryText }]}>
            <Text style={[styles.badgeText, { color: secondaryText }]}>
              {account.type}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Link href={`/account/edit/${id}`} asChild>
            <Pressable style={[styles.actionButton, { backgroundColor: tintColor }]}>
              <Text style={styles.actionButtonText}>Edit Account</Text>
            </Pressable>
          </Link>
          <Link href="/transaction/new" asChild>
            <Pressable style={[styles.actionButton, { borderColor, borderWidth: 1 }]}>
              <Text style={[styles.actionButtonTextOutline, { color: tintColor }]}>
                Add Transaction
              </Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { borderColor, borderWidth: 1 }]}
            onPress={handleArchive}
          >
            <Text style={[styles.actionButtonTextOutline, { color: tintColor }]}>
              {account.archived ? 'Unarchive' : 'Archive'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondaryText }]}>
              No transactions for this account yet.
            </Text>
          ) : (
            transactions.map((transaction) => {
              const fromAcc = accountMap.get(transaction.fromAccountId);
              const toAcc = accountMap.get(transaction.toAccountId);
              const perspective =
                fromAcc && toAcc && id
                  ? getTransactionPerspective(
                      id,
                      account.type,
                      transaction.fromAccountId,
                      fromAcc.type,
                      toAcc.type
                    )
                  : 'neutral';

              return (
                <Link key={transaction.id} href={`/transaction/${transaction.id}`} asChild>
                  <View>
                    <TransactionRow
                      transaction={transaction}
                      fromAccount={accountMap.get(transaction.fromAccountId)}
                      toAccount={accountMap.get(transaction.toAccountId)}
                      perspective={perspective}
                    />
                  </View>
                </Link>
              );
            })
          )}
        </View>
      </ScrollView>
    </>
  );
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
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balance: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextOutline: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
