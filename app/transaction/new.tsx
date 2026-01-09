import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { AmountInput } from '@/components/AmountInput';
import { TagInput } from '@/components/TagInput';
import { AccountPicker } from '@/components/AccountPicker';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { now } from '@/utils/date';

export default function NewTransactionScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const tintColor = useThemeColor({}, 'tint');

  const { accounts } = useAccounts();
  const { add } = useTransactions();

  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fromAccountId) {
      Alert.alert('Error', 'Please select a "From" account');
      return;
    }
    if (!toAccountId) {
      Alert.alert('Error', 'Please select a "To" account');
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert('Error', 'From and To accounts must be different');
      return;
    }
    if (amount <= 0) {
      Alert.alert('Error', 'Please enter an amount greater than zero');
      return;
    }

    setSubmitting(true);
    const transaction = await add({
      date: now(),
      fromAccountId,
      toAccountId,
      amount,
      tags: tags.length > 0 ? tags : undefined,
      note: note.trim() || undefined,
    });
    setSubmitting(false);

    if (transaction) {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <AccountPicker
            accounts={accounts}
            selectedId={fromAccountId}
            onSelect={setFromAccountId}
            label="From"
            placeholder="Select source account"
          />
        </View>

        <View style={styles.field}>
          <AccountPicker
            accounts={accounts}
            selectedId={toAccountId}
            onSelect={setToAccountId}
            label="To"
            placeholder="Select destination account"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: secondaryText }]}>Amount</Text>
          <AmountInput value={amount} onChange={setAmount} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: secondaryText }]}>Tags (optional)</Text>
          <TagInput tags={tags} onChange={setTags} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: secondaryText }]}>Note (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.noteInput,
              { color: textColor, borderColor, backgroundColor: cardBackground },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={secondaryText}
            multiline
            numberOfLines={3}
          />
        </View>

        <Pressable
          style={[styles.submitButton, { backgroundColor: tintColor }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Adding...' : 'Add Transaction'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  noteInput: {
    height: 80,
    paddingVertical: 12,
    textAlignVertical: 'top',
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
