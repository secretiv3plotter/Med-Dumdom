import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, moderateScale, radius, spacing } from '../../theme';

export default function SearchBar({
  placeholder = 'Search',
  value = '',
  onChangeText = () => {},
  style,
  inputStyle,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, style]}>
      <Ionicons name="search" size={moderateScale(18)} color={colors.bodyMuted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[styles.input, inputStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: moderateScale(48),
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  containerFocused: {
    borderColor: colors.focusRing,
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
    paddingVertical: spacing.sm,
    fontSize: moderateScale(16),
  },
});
