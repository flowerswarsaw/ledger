import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';

import { Text, View, useThemeColor } from '@/components/Themed';
import { TransactionRow } from '@/components/TransactionRow';
import { useNetWorth } from '@/hooks/useBalance';
import { useRecentTransactions } from '@/hooks/useTransactions';
import { useAccountsWithBalances } from '@/hooks/useAccounts';
import { formatMoney } from '@/utils/money';

export default function DashboardScreen() {
  const secondaryText = useThemeColor({}, 'secondaryText');
  const positiveColor = useThemeColor({}, 'positive');
  const negativeColor = useThemeColor({}, 'negative');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  const { netWorth, refresh: refreshNetWorth } = useNetWorth();
  const { transactions, refresh: refreshTransactions } = useRecentTransactions(10);
  const { accounts, refresh: refreshAccounts } = useAccountsWithBalances();

  const [refreshing, setRefreshing] = useState(false);

  const accountMap = useMemo(() => {
    const map = new Map<string, (typeof accounts)[0]>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshNetWorth(), refreshTransactions(), refreshAccounts()]);
    setRefreshing(false);
  }, [refreshNetWorth, refreshTransactions, refreshAccounts]);

  const netWorthColor = netWorth >= 0 ? positiveColor : negativeColor;

  const internalAccounts = accounts.filter((a) => a.type === 'internal');
  const totalIncome = transactions.reduce((sum, t) => {
    const toAccount = accountMap.get(t.toAccountId);
    if (toAccount?.type === 'internal') return sum + t.amount;
    return sum;
  }, 0);
  const totalExpenses = transactions.reduce((sum, t) => {
    const fromAccount = accountMap.get(t.fromAccountId);
    if (fromAccount?.type === 'internal') return sum + t.amount;
    return sum;
  }, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <Text style={[styles.cardLabel, { color: secondaryText }]}>Net Worth</Text>
        <Text style={[styles.netWorth, { color: netWorthColor }]}>
          {formatMoney(netWorth)}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
          <Text style={[styles.summaryLabel, { color: secondaryText }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: positiveColor }]}>
            +{formatMoney(totalIncome)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
          <Text style={[styles.summaryLabel, { color: secondaryText }]}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: negativeColor }]}>
            -{formatMoney(totalExpenses)}
          </Text>
        </View>
      </View>

      {internalAccounts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <Link href="/(tabs)/accounts">
              <Text style={[styles.seeAll, { color: secondaryText }]}>See all</Text>
            </Link>
          </View>
          {internalAccounts.slice(0, 3).map((account) => (
            <Link key={account.id} href={`/account/${account.id}`} asChild>
              <View style={[styles.accountRow, { borderBottomColor: borderColor }]}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text
                  style={[
                    styles.accountBalance,
                    { color: account.balance >= 0 ? positiveColor : negativeColor },
                  ]}
                >
                  {formatMoney(account.balance, account.currency)}
                </Text>
              </View>
            </Link>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Link href="/(tabs)/transactions">
            <Text style={[styles.seeAll, { color: secondaryText }]}>See all</Text>
          </Link>
        </View>
        {transactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: secondaryText }]}>
            No transactions yet. Tap + to add one.
          </Text>
        ) : (
          transactions.map((transaction) => (
            <Link key={transaction.id} href={`/transaction/${transaction.id}`} asChild>
              <View>
                <TransactionRow
                  transaction={transaction}
                  fromAccount={accountMap.get(transaction.fromAccountId)}
                  toAccount={accountMap.get(transaction.toAccountId)}
                />
              </View>
            </Link>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  netWorth: {
    fontSize: 36,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  accountName: {
    fontSize: 16,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
