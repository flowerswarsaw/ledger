import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useAccounts } from '@/hooks/useAccounts';
import type { AccountType } from '@/types';

export default function NewAccountScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const tintColor = useThemeColor({}, 'tint');

  const { add } = useAccounts();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('internal');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setSubmitting(true);
    const account = await add({ name: name.trim(), type });
    setSubmitting(false);

    if (account) {
      router.back();
    }
  };

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
        <Text style={[styles.label, { color: secondaryText }]}>Type</Text>
        <View style={styles.typeButtons}>
          <Pressable
            style={[
              styles.typeButton,
              { borderColor },
              type === 'internal' && { backgroundColor: tintColor, borderColor: tintColor },
            ]}
            onPress={() => setType('internal')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'internal' && styles.typeButtonTextSelected,
              ]}
            >
              Internal
            </Text>
            <Text
              style={[
                styles.typeButtonSubtext,
                { color: type === 'internal' ? '#fff' : secondaryText },
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
            ]}
            onPress={() => setType('external')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'external' && styles.typeButtonTextSelected,
              ]}
            >
              External
            </Text>
            <Text
              style={[
                styles.typeButtonSubtext,
                { color: type === 'external' ? '#fff' : secondaryText },
              ]}
            >
              Others
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, { backgroundColor: tintColor }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Creating...' : 'Create Account'}
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
    height: 48,
    fontSize: 16,
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
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  typeButtonSubtext: {
    fontSize: 13,
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
