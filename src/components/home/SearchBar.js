import { StyleSheet, TextInput } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export default function SearchBar({ placeholder }) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
