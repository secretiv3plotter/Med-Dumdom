import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, radius, spacing, typography } from '../../constants/Themes';

export default function BackButton({
  onPress = () => {},
  label = 'Back',
  showLabel = true,
  disabled = false,
  style,
  iconStyle,
  labelStyle,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, iconStyle]}>{'\u2039'}</Text>
        {showLabel && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget,
    minWidth: accessibility.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    color: colors.body,
    fontSize: 24,
    lineHeight: 24,
  },
  label: {
    ...typography.button,
    color: colors.body,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});
