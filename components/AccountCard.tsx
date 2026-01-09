import { StyleSheet, Pressable } from 'react-native';
import { Text, View, useThemeColor } from './Themed';
import { formatMoney } from '../utils/money';
import type { AccountWithBalance } from '../types';

interface AccountCardProps {
  account: AccountWithBalance;
  onPress?: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const positiveColor = useThemeColor({}, 'positive');
  const negativeColor = useThemeColor({}, 'negative');

  const balanceColor = account.balance >= 0 ? positiveColor : negativeColor;

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.card,
          { backgroundColor: cardBackground, borderColor },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.name}>{account.name}</Text>
          <View style={[styles.badge, { borderColor: secondaryText }]}>
            <Text style={[styles.badgeText, { color: secondaryText }]}>
              {account.type}
            </Text>
          </View>
        </View>
        <Text style={[styles.balance, { color: balanceColor }]}>
          {formatMoney(account.balance, account.currency)}
        </Text>
        {account.archived && (
          <Text style={[styles.archived, { color: secondaryText }]}>Archived</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  balance: {
    fontSize: 24,
    fontWeight: '700',
  },
  archived: {
    fontSize: 12,
    marginTop: 4,
  },
});
