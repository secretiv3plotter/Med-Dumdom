import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue, useTextScale } from '../../theme/textScale';

const APPOINTMENT_ACCENT = '#52B788';
const APPOINTMENT_ACCENT_PRESSED = '#B7E4C7';

export default function AppointmentTrackerButton({ onPress, variant = 'outline', disabled = false }) {
  const isSolid = variant === 'solid';
  const { darkModeEnabled } = useTextScale();
  const iconColor = disabled ? colors.bodyMuted : APPOINTMENT_ACCENT;
  const textColor = disabled ? colors.bodyMuted : APPOINTMENT_ACCENT;
  const pressedBackgroundColor = darkModeEnabled ? 'rgba(148, 163, 184, 0.16)' : APPOINTMENT_ACCENT_PRESSED;

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
        {
          minHeight: scaleLayoutValue(accessibility.minTouchTarget),
          minWidth: scaleLayoutValue(moderateScale(62)),
          gap: scaleLayoutValue(spacing.xxs),
          paddingVertical: scaleLayoutValue(spacing.xs),
        },
        isSolid ? styles.solidButton : styles.outlineButton,
        { backgroundColor: isSolid ? colors.pageBg : colors.surface },
        pressed && !disabled && styles.pressed,
        pressed && !disabled && { backgroundColor: pressedBackgroundColor },
      ]}
    >
      <Ionicons
        name={isSolid ? 'calendar' : 'calendar-outline'}
        size={scaleLayoutValue(moderateScale(30))}
        color={iconColor}
      />
      <Text style={[styles.text, { color: textColor }]}>Appts</Text>
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
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderWidth: 1,
    borderColor: APPOINTMENT_ACCENT,
  },
});
