import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, radius, spacing, typography } from '../../constants/Themes';

export default function HomeButton({ onPress, variant = 'outline' }) {
  const isSolid = variant === 'solid';
  const iconAndTextColor = colors.brand;

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Home"
      accessibilityHint="Opens the home section"
      accessibilityState={{ selected: isSolid }}
      style={[styles.button, isSolid ? styles.solidButton : styles.outlineButton]}
    >
      <Ionicons
        name={isSolid ? 'home' : 'home-outline'}
        size={30}
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
