import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue, useTextScale } from '../../theme/textScale';

const HOME_NAV_PRESSED = '#E5E7EB';
const HOME_NAV_PRESSED_BORDER = '#475569';

export default function HomeButton({ onPress, variant = 'outline' }) {
  const isSolid = variant === 'solid';
  const { darkModeEnabled } = useTextScale();
  const iconAndTextColor = colors.bodyMuted;
  const pressedBackgroundColor = darkModeEnabled ? 'rgba(148, 163, 184, 0.16)' : '#E5E7EB';
  const pressedBorderColor = darkModeEnabled ? colors.border : '#475569';

  return (
    <Pressable
      onPress={onPress}
      unstable_pressDelay={0}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Home"
      accessibilityHint="Opens the home section"
      accessibilityState={{ selected: isSolid }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: scaleLayoutValue(accessibility.minTouchTarget),
          minWidth: scaleLayoutValue(moderateScale(62)),
          gap: scaleLayoutValue(spacing.xxs),
          paddingVertical: scaleLayoutValue(spacing.xs),
        },
        isSolid ? styles.solidButton : styles.outlineButton,
        { backgroundColor: isSolid ? colors.pageBg : colors.surface },
        pressed && styles.pressed,
        pressed && {
          backgroundColor: pressedBackgroundColor,
          borderWidth: 1,
          borderColor: pressedBorderColor,
        },
      ]}
    >
      <Ionicons
        name={isSolid ? 'home' : 'home-outline'}
        size={scaleLayoutValue(moderateScale(30))}
        color={iconAndTextColor}
      />
      <Text style={[styles.text, { color: iconAndTextColor }]}>Home</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidButton: {
    backgroundColor: colors.pageBg,
  },
  outlineButton: {
    backgroundColor: colors.surface,
  },
  text: {
    ...typography.bodySmall,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  pressed: {
    backgroundColor: HOME_NAV_PRESSED,
    borderWidth: 1,
    borderColor: HOME_NAV_PRESSED_BORDER,
  },
});
