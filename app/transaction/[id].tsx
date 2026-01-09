import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useDatabase } from '@/hooks/useDatabase';
import { useTransactions } from '@/hooks/useTransactions';
import { getTransaction, getAccount } from '@/db/queries';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/date';
import type { Transaction, Account } from '@/types';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db } = useDatabase();

  const secondaryText = useThemeColor({}, 'secondaryText');
  const positiveColor = useThemeColor({}, 'positive');
  const negativeColor = useThemeColor({}, 'negative');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { reverse } = useTransactions();

  const loadTransaction = useCallback(async () => {
    if (!db || !id) return;
    const data = await getTransaction(db, id);
    setTransaction(data);

    if (data) {
      const from = await getAccount(db, data.fromAccountId);
      const to = await getAccount(db, data.toAccountId);
      setFromAccount(from);
      setToAccount(to);
    }
  }, [db, id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransaction();
    setRefreshing(false);
  }, [loadTransaction]);

  const handleReverse = () => {
    Alert.alert(
      'Reverse Transaction',
      'This will create a new transaction that reverses this one. The original transaction will remain in history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reverse',
          style: 'destructive',
          onPress: async () => {
            if (!transaction) return;
            const reversal = await reverse(transaction.id, 'Reversal');
            if (reversal) {
              Alert.alert('Success', 'Transaction has been reversed');
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: secondaryText }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Transaction' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <Text style={[styles.amount, { color: positiveColor }]}>
            {formatMoney(transaction.amount)}
          </Text>
          <Text style={[styles.date, { color: secondaryText }]}>
            {formatDateTime(transaction.date)}
          </Text>
        </View>

        <View style={[styles.row, { borderBottomColor: borderColor }]}>
          <Text style={[styles.rowLabel, { color: secondaryText }]}>From</Text>
          <Text style={styles.rowValue}>{fromAccount?.name ?? 'Unknown'}</Text>
        </View>

        <View style={[styles.row, { borderBottomColor: borderColor }]}>
          <Text style={[styles.rowLabel, { color: secondaryText }]}>To</Text>
          <Text style={styles.rowValue}>{toAccount?.name ?? 'Unknown'}</Text>
        </View>

        {transaction.note && (
          <View style={[styles.row, { borderBottomColor: borderColor }]}>
            <Text style={[styles.rowLabel, { color: secondaryText }]}>Note</Text>
            <Text style={styles.rowValue}>{transaction.note}</Text>
          </View>
        )}

        {transaction.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: secondaryText }]}>Tags</Text>
            <View style={styles.tags}>
              {transaction.tags.map((tag, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: tintColor }]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.row, { borderBottomColor: borderColor }]}>
          <Text style={[styles.rowLabel, { color: secondaryText }]}>Created</Text>
          <Text style={[styles.rowValue, { color: secondaryText }]}>
            {formatDateTime(transaction.createdAt)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { borderColor: negativeColor, borderWidth: 1 }]}
            onPress={handleReverse}
          >
            <Text style={[styles.actionButtonText, { color: negativeColor }]}>
              Reverse Transaction
            </Text>
          </Pressable>
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
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  rowLabel: {
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  section: {
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  sectionLabel: {
    fontSize: 15,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 32,
    backgroundColor: 'transparent',
  },
  actionButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
