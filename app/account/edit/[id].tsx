import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useAccounts } from '@/hooks/useAccounts';
import { useDatabase } from '@/hooks/useDatabase';
import { getAccount, hasTransactions } from '@/db/queries';
import type { Account, AccountType } from '@/types';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db } = useDatabase();

  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const tintColor = useThemeColor({}, 'tint');

  const { update, isReady, error } = useAccounts();

  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('internal');
  const [currency, setCurrency] = useState('USD');
  const [accountHasTransactions, setAccountHasTransactions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!db || !id) return;

    try {
      setLoading(true);
      const data = await getAccount(db, id);
      if (data) {
        setAccount(data);
        setName(data.name);
        setType(data.type);
        setCurrency(data.currency);

        const hasTxns = await hasTransactions(db, id);
        setAccountHasTransactions(hasTxns);
      }
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    if (!id || !isReady) {
      Alert.alert('Error', 'Database is not ready');
      return;
    }

    setSubmitting(true);
    try {
      const updateInput = accountHasTransactions
        ? { name: name.trim() }
        : { name: name.trim(), type, currency: currency.trim() || 'USD' };

      const updated = await update(id, updateInput);
      setSubmitting(false);

      if (updated) {
        router.back();
      } else {
        Alert.alert('Error', error?.message || 'Failed to update account.');
      }
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: secondaryText }}>Account not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: secondaryText }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: textColor, borderColor, backgroundColor: cardBackground }]}
          value={name}
          onChangeText={setName}
          placeholder="Account name"
          placeholderTextColor={secondaryText}
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: secondaryText }]}>
          Type
          {accountHasTransactions && (
            <Text style={[styles.lockedLabel, { color: secondaryText }]}> (locked)</Text>
          )}
        </Text>
        <View style={styles.typeButtons}>
          <Pressable
            style={[
              styles.typeButton,
              { borderColor },
              type === 'internal' && { backgroundColor: tintColor, borderColor: tintColor },
              accountHasTransactions && styles.disabledButton,
            ]}
            onPress={() => !accountHasTransactions && setType('internal')}
            disabled={accountHasTransactions}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'internal' && styles.typeButtonTextSelected,
                accountHasTransactions && styles.disabledText,
              ]}
            >
              Internal
            </Text>
            <Text
              style={[
                styles.typeButtonSubtext,
                { color: type === 'internal' ? '#fff' : secondaryText },
                accountHasTransactions && styles.disabledText,
              ]}
            >
              Your accounts
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeButton,
              { borderColor },
              type === 'external' && { backgroundColor: tintColor, borderColor: tintColor },
              accountHasTransactions && styles.disabledButton,
            ]}
            onPress={() => !accountHasTransactions && setType('external')}
            disabled={accountHasTransactions}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'external' && styles.typeButtonTextSelected,
                accountHasTransactions && styles.disabledText,
              ]}
            >
              External
            </Text>
            <Text
              style={[
                styles.typeButtonSubtext,
                { color: type === 'external' ? '#fff' : secondaryText },
                accountHasTransactions && styles.disabledText,
              ]}
            >
              Others
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: secondaryText }]}>
          Currency
          {accountHasTransactions && (
            <Text style={[styles.lockedLabel, { color: secondaryText }]}> (locked)</Text>
          )}
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: textColor, borderColor, backgroundColor: cardBackground },
            accountHasTransactions && styles.disabledInput,
          ]}
          value={currency}
          onChangeText={setCurrency}
          placeholder="USD"
          placeholderTextColor={secondaryText}
          editable={!accountHasTransactions}
          autoCapitalize="characters"
        />
      </View>

      {accountHasTransactions && (
        <View style={[styles.infoBox, { borderColor, backgroundColor: cardBackground }]}>
          <Text style={[styles.infoText, { color: secondaryText }]}>
            Type and currency cannot be changed because this account has transactions.
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.submitButton, { backgroundColor: tintColor }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Text>
      </Pressable>
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
  field: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  lockedLabel: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.5,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  disabledText: {
    opacity: 0.7,
  },
  typeButtonSubtext: {
    fontSize: 13,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
