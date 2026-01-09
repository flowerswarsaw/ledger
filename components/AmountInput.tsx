import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { View, Text, useThemeColor } from './Themed';
import { centsToDollars, dollarsToCents } from '../utils/money';

interface AmountInputProps {
  value: number;
  onChange: (cents: number) => void;
  currency?: string;
  placeholder?: string;
}

export function AmountInput({
  value,
  onChange,
  currency = 'USD',
  placeholder = '0.00',
}: AmountInputProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondaryText = useThemeColor({}, 'secondaryText');

  const [displayValue, setDisplayValue] = useState(
    value > 0 ? centsToDollars(value).toFixed(2) : ''
  );

  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setDisplayValue(cleaned);

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(dollarsToCents(parsed));
    } else if (cleaned === '' || cleaned === '.') {
      onChange(0);
    }
  };

  const getCurrencySymbol = (code: string): string => {
    switch (code) {
      case 'USD':
        return '$';
      case 'EUR':
        return '\u20AC';
      case 'GBP':
        return '\u00A3';
      default:
        return code;
    }
  };

  return (
    <View style={[styles.container, { borderColor, backgroundColor: cardBackground }]}>
      <Text style={[styles.symbol, { color: secondaryText }]}>
        {getCurrencySymbol(currency)}
      </Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={displayValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={secondaryText}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '500',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
  },
});
