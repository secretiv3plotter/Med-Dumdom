import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getFontSize, moderateScale, radius, spacing } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

export default function SearchBar({
  placeholder = 'Search',
  value = '',
  onChangeText = () => {},
  style,
  inputStyle,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: scaleLayoutValue(moderateScale(48)),
          paddingHorizontal: scaleLayoutValue(spacing.sm),
          gap: scaleLayoutValue(spacing.xs),
        },
        isFocused && styles.containerFocused,
        style,
      ]}
    >
      <Ionicons name="search" size={scaleLayoutValue(moderateScale(18))} color={colors.bodyMuted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[styles.input, { paddingVertical: scaleLayoutValue(spacing.sm) }, inputStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5, // Crisp 1.5px border for highly defined input boundaries
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerFocused: {
    borderColor: colors.focusRing,
    borderWidth: 2,
    shadowColor: colors.focusRing,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.title,
    fontSize: getFontSize(16),
    outlineStyle: 'none',
  },
});
