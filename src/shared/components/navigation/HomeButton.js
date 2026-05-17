import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';

const HOME_NAV_COLOR = '#64748B';
const HOME_NAV_PRESSED = '#E5E7EB';
const HOME_NAV_PRESSED_BORDER = '#475569';

export default function HomeButton({ onPress, variant = 'outline' }) {
  const isSolid = variant === 'solid';
  const iconAndTextColor = HOME_NAV_COLOR;

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
        isSolid ? styles.solidButton : styles.outlineButton,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={isSolid ? 'home' : 'home-outline'}
        size={moderateScale(30)}
        color={iconAndTextColor}
      />
      <Text style={[styles.text, { color: iconAndTextColor }]}>Home</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget,
    flex: 1,
    minWidth: moderateScale(62),
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
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
