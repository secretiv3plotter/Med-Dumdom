import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';

export default function NotificationButton({ onPress, variant = 'outline', showDot = true }) {
  const isSolid = variant === 'solid';
  const iconAndTextColor = colors.brand;

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Alerts"
      accessibilityHint="Opens alerts and notifications"
      accessibilityState={{ selected: isSolid }}
      style={[styles.button, isSolid ? styles.solidButton : styles.outlineButton]}
    >
      <Ionicons
        name={isSolid ? 'notifications' : 'notifications-outline'}
        size={moderateScale(30)}
        color={iconAndTextColor}
      />
      <Text style={[styles.text, { color: iconAndTextColor }]}>Alerts</Text>
      {showDot ? <View style={styles.dot} accessible={false} importantForAccessibility="no" /> : null}
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
    position: 'relative',
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
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: colors.error,
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
});
