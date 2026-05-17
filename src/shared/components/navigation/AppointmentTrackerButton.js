import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';

const APPOINTMENT_ACCENT = '#52B788';
const APPOINTMENT_ACCENT_TEXT = '#1B6B4A';
const APPOINTMENT_ACCENT_PRESSED = '#B7E4C7';

export default function AppointmentTrackerButton({ onPress, variant = 'outline', disabled = false }) {
  const isSolid = variant === 'solid';
  const iconColor = disabled ? colors.bodyMuted : APPOINTMENT_ACCENT;
  const textColor = disabled ? colors.bodyMuted : APPOINTMENT_ACCENT_TEXT;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={0}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Appointments"
      accessibilityHint="Opens appointment tracker section"
      accessibilityState={{ disabled, selected: isSolid }}
      style={({ pressed }) => [
        styles.button,
        isSolid ? styles.solidButton : styles.outlineButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons
        name={isSolid ? 'calendar' : 'calendar-outline'}
        size={moderateScale(30)}
        color={iconColor}
      />
      <Text style={[styles.text, { color: textColor }]}>Appts</Text>
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
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderWidth: 1,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
});
