import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useState, useCallback } from 'react';

import { Text, View, useThemeColor } from '@/components/Themed';
import { AccountCard } from '@/components/AccountCard';
import { useAccountsWithBalances } from '@/hooks/useAccounts';

export default function AccountsScreen() {
  const secondaryText = useThemeColor({}, 'secondaryText');

  const { accounts, loading, refresh } = useAccountsWithBalances();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const internalAccounts = accounts.filter((a) => a.type === 'internal');
  const externalAccounts = accounts.filter((a) => a.type === 'external');

  if (loading && accounts.length === 0) {
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
      {accounts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: secondaryText }]}>
            No accounts yet
          </Text>
          <Text style={[styles.emptyText, { color: secondaryText }]}>
            Tap + to create your first account
          </Text>
        </View>
      ) : (
        <>
          {internalAccounts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: secondaryText }]}>
                Your Accounts
              </Text>
              {internalAccounts.map((account) => (
                <Link key={account.id} href={`/account/${account.id}`} asChild>
                  <View>
                    <AccountCard account={account} />
                  </View>
                </Link>
              ))}
            </View>
          )}

          {externalAccounts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: secondaryText }]}>
                External Accounts
              </Text>
              {externalAccounts.map((account) => (
                <Link key={account.id} href={`/account/${account.id}`} asChild>
                  <View>
                    <AccountCard account={account} />
                  </View>
                </Link>
              ))}
            </View>
          )}
        </>
      )}
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
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});
