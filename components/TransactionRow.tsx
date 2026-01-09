import { StyleSheet, Pressable } from 'react-native';
import { Text, View, useThemeColor } from './Themed';
import { formatMoney } from '../utils/money';
import { formatRelativeDate } from '../utils/date';
import type { Transaction, Account } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
  fromAccount?: Account;
  toAccount?: Account;
  perspective?: 'from' | 'to' | 'neutral';
  onPress?: () => void;
}

export function TransactionRow({
  transaction,
  fromAccount,
  toAccount,
  perspective = 'neutral',
  onPress,
}: TransactionRowProps) {
  const borderColor = useThemeColor({}, 'border');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const positiveColor = useThemeColor({}, 'positive');
  const negativeColor = useThemeColor({}, 'negative');

  const isIncome = perspective === 'to';
  const isExpense = perspective === 'from';
  const amountColor = isIncome ? positiveColor : isExpense ? negativeColor : undefined;
  const amountPrefix = isIncome ? '+' : isExpense ? '-' : '';

  const fromName = fromAccount?.name ?? 'Unknown';
  const toName = toAccount?.name ?? 'Unknown';

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.row, { borderBottomColor: borderColor }]}>
        <View style={styles.left}>
          <Text style={styles.accounts} numberOfLines={1}>
            {fromName} → {toName}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.date, { color: secondaryText }]}>
              {formatRelativeDate(transaction.date)}
            </Text>
            {transaction.note && (
              <Text style={[styles.note, { color: secondaryText }]} numberOfLines={1}>
                {transaction.note}
              </Text>
            )}
          </View>
          {transaction.tags.length > 0 && (
            <View style={styles.tags}>
              {transaction.tags.slice(0, 3).map((tag, i) => (
                <View
                  key={i}
                  style={[styles.tag, { borderColor: secondaryText }]}
                >
                  <Text style={[styles.tagText, { color: secondaryText }]}>
                    {tag}
                  </Text>
                </View>
              ))}
              {transaction.tags.length > 3 && (
                <Text style={[styles.moreTags, { color: secondaryText }]}>
                  +{transaction.tags.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
        <Text style={[styles.amount, amountColor && { color: amountColor }]}>
          {amountPrefix}{formatMoney(transaction.amount)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  left: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  accounts: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  date: {
    fontSize: 13,
  },
  note: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 4,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 11,
  },
  moreTags: {
    fontSize: 11,
    marginLeft: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
