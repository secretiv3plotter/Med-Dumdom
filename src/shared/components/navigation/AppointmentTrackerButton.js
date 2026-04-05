import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, radius, spacing, typography } from '../../theme';

export default function AppointmentTrackerButton({ onPress, variant = 'outline', disabled = false }) {
  const isSolid = variant === 'solid';
  const iconColor = disabled ? colors.bodyMuted : colors.brand;
  const textColor = disabled ? colors.bodyMuted : colors.brand;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Appointments"
      accessibilityHint="Opens appointment tracker section"
      accessibilityState={{ disabled, selected: isSolid }}
      style={[styles.button, isSolid ? styles.solidButton : styles.outlineButton]}
    >
      <Ionicons
        name={isSolid ? 'calendar' : 'calendar-outline'}
        size={30}
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
    minWidth: 62,
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
  },
});
