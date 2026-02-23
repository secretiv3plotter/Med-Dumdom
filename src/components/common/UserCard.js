import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, radius, spacing } from '../../constants/Themes';

function getInitials(name = '') {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function UserCard({
  name = 'Unknown User',
  subtitle = '',
  details = '',
  primaryActionLabel = 'View',
  secondaryActionLabel = 'Message',
  onPrimaryAction = () => {},
  onSecondaryAction = () => {},
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.name}>{name}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {!!details && <Text style={styles.details}>{details}</Text>}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={onSecondaryAction}
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>{secondaryActionLabel}</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={onPrimaryAction}
          accessibilityRole="button"
          accessibilityLabel={primaryActionLabel}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>{primaryActionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.brandText,
    fontWeight: '700',
    fontSize: 16,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    color: colors.title,
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    color: colors.body,
    fontSize: 14,
    marginTop: 2,
  },
  details: {
    color: colors.bodyMuted,
    fontSize: 13,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: accessibility.minTouchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.surface,
  },
  secondaryButtonText: {
    color: colors.body,
  },
});
