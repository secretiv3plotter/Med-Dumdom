//text based button (currently only solid and outline variants)
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/Themes';

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
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        outline ? styles.outlineButton : styles.solidButton,
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
    fontWeight: '600',
  },
  solidText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.brand,
  },
  disabled: {
    opacity: 0.6,
  },
});
