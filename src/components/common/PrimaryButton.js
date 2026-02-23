import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export default function PrimaryButton({ label, onPress, variant = 'solid' }) {
  const outline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, outline ? styles.outlineButton : styles.solidButton]}
    >
      <Text style={[styles.text, outline ? styles.outlineText : styles.solidText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  solidButton: {
    backgroundColor: colors.brand,
  },
  outlineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  text: {
    fontWeight: '600',
  },
  solidText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.brand,
  },
});
