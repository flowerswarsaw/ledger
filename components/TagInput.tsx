import { useState } from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';
import { View, Text, useThemeColor } from './Themed';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
}: TagInputProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const tintColor = useThemeColor({}, 'tint');

  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    handleAddTag();
  };

  return (
    <View style={styles.container}>
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Pressable key={tag} onPress={() => handleRemoveTag(tag)}>
              <View style={[styles.tag, { backgroundColor: tintColor }]}>
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.removeIcon}>×</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <View style={[styles.inputContainer, { borderColor, backgroundColor: cardBackground }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={secondaryText}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCapitalize="none"
        />
        {inputValue.trim() && (
          <Pressable onPress={handleAddTag} style={styles.addButton}>
            <Text style={[styles.addButtonText, { color: tintColor }]}>Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  removeIcon: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 6,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
