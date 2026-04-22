import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';

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
      hitSlop={spacing.xs}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, iconStyle]}>{'\u2039'}</Text>
        {showLabel && (
          <View style={styles.labelWrap}>
            <Text
              style={[styles.label, labelStyle]}
              onPress={disabled ? undefined : onPress}
              suppressHighlighting
            >
              {label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const ICON_SIZE = moderateScale(40);

const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget,
    minWidth: accessibility.minTouchTarget,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginLeft: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  icon: {
    color: colors.brandText,
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE,
  },
  labelWrap: {
    height: ICON_SIZE,
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    color: colors.brandText,
    marginLeft: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});
