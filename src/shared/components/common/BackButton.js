import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue, useTextScale } from '../../theme/textScale';

export default function BackButton({
  onPress = () => {},
  label = 'Back',
  showLabel = true,
  disabled = false,
  style,
  iconStyle,
  labelStyle,
}) {
  const { darkModeEnabled } = useTextScale();

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
        {
          minHeight: scaleLayoutValue(BUTTON_HEIGHT),
          minWidth: scaleLayoutValue(BUTTON_HEIGHT),
        },
        pressed && !disabled && styles.pressed,
        pressed && !disabled && {
          backgroundColor: darkModeEnabled ? 'rgba(148, 163, 184, 0.16)' : '#C7DBFF',
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        style={[
          styles.content,
          {
            minHeight: scaleLayoutValue(BUTTON_HEIGHT),
            gap: scaleLayoutValue(spacing.xxs),
          },
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={scaleLayoutValue(ICON_SIZE)}
          color={colors.brandText}
          style={[styles.icon, { marginLeft: scaleLayoutValue(-5) }, iconStyle]}
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
