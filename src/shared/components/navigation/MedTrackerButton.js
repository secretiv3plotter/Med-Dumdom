import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

export default function MedTrackerButton({ onPress, variant = 'outline', disabled = false }) {
  const isSolid = variant === 'solid';
  const iconColor = disabled ? colors.bodyMuted : colors.brand;
  const textColor = disabled ? colors.bodyMuted : colors.brand;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={0}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Med tracker"
      accessibilityHint="Opens medication tracker section"
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
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons
        name={isSolid ? 'medkit' : 'medkit-outline'}
        size={scaleLayoutValue(moderateScale(30))}
        color={iconColor}
      />
      <Text style={[styles.text, { color: textColor }]}>Med</Text>
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
    backgroundColor: '#C7DBFF',
    borderWidth: 1,
    borderColor: colors.brandText,
  },
});
