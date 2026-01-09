import { StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import { View, Text, useThemeColor } from './Themed';
import type { Account } from '../types';

interface AccountPickerProps {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder?: string;
  label?: string;
}

export function AccountPicker({
  accounts,
  selectedId,
  onSelect,
  placeholder = 'Select account',
  label,
}: AccountPickerProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const [modalVisible, setModalVisible] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  const handleSelect = (id: string) => {
    onSelect(id);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: secondaryText }]}>{label}</Text>}
      <Pressable onPress={() => setModalVisible(true)}>
        <View style={[styles.selector, { borderColor, backgroundColor: cardBackground }]}>
          <Text
            style={[
              styles.selectorText,
              !selectedAccount && { color: secondaryText },
            ]}
          >
            {selectedAccount?.name ?? placeholder}
          </Text>
          <Text style={[styles.chevron, { color: secondaryText }]}>▼</Text>
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modal, { backgroundColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={styles.modalTitle}>{label ?? 'Select Account'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: tintColor }]}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.list}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => handleSelect(account.id)}
                  style={[
                    styles.option,
                    { borderBottomColor: borderColor },
                    selectedId === account.id && { backgroundColor: cardBackground },
                  ]}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionName}>{account.name}</Text>
                    <Text style={[styles.optionType, { color: secondaryText }]}>
                      {account.type}
                    </Text>
                  </View>
                  {selectedId === account.id && (
                    <Text style={[styles.checkmark, { color: tintColor }]}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  selectorText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionType: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
});
