import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      unstable_pressDelay={0}
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
        <Ionicons
          name="chevron-back"
          size={ICON_SIZE}
          color={colors.brandText}
          style={[styles.icon, iconStyle]}
        />
        {showLabel ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      </View>
    </Pressable>
  );
}

const ICON_SIZE = moderateScale(30);
const BUTTON_HEIGHT = accessibility.minTouchTarget;

const styles = StyleSheet.create({
  button: {
    minHeight: BUTTON_HEIGHT,
    minWidth: BUTTON_HEIGHT,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    minHeight: BUTTON_HEIGHT,
  },
  icon: {
    marginLeft: moderateScale(-5),
  },
  label: {
    ...typography.button,
    color: colors.brandText,
    marginLeft: 0,
    includeFontPadding: false,
  },
  pressed: {
    backgroundColor: '#C7DBFF',
  },
  disabled: {
    opacity: 0.45,
  },
});
