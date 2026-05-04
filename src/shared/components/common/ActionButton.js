//text based button (currently only solid and outline variants)
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default function ActionButton({
  label,
  onPress,
  variant = 'solid',
  style,
  textStyle,
  disabled = false,
}) {
  const outline = variant === 'outline';

  return (
    <Pressable
      disabled={disabled}
      unstable_pressDelay={0}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        outline ? styles.outlineButton : styles.solidButton,
        pressed && !disabled && (outline ? styles.outlinePressed : styles.solidPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, outline ? styles.outlineText : styles.solidText, textStyle]}>{label}</Text>
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
    ...typography.button,
    fontWeight: '600',
  },
  solidText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.brand,
  },
  solidPressed: {
    backgroundColor: colors.brandText,
  },
  outlinePressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  disabled: {
    opacity: 0.6,
  },
});
