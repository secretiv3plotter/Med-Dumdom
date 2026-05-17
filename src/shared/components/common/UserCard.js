// A reusable user card component for displaying user information with primary and secondary actions.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, getFontSize, getLineHeight, moderateScale, radius, spacing } from '../../theme';

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
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          unstable_pressDelay={0}
          onPress={onSecondaryAction}
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>{secondaryActionLabel}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
          unstable_pressDelay={0}
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
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.brandText,
    fontWeight: '700',
    fontSize: getFontSize(16),
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.title,
    fontWeight: '700',
    fontSize: getFontSize(16),
  },
  subtitle: {
    color: colors.body,
    fontSize: getFontSize(14),
    marginTop: 2,
  },
  details: {
    color: colors.bodyMuted,
    fontSize: getFontSize(13),
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: moderateScale(120),
    minHeight: accessibility.minTouchTarget,
    minWidth: 0,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
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
    fontSize: getFontSize(14),
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
  },
  secondaryButtonText: {
    color: colors.body,
  },
  primaryButtonPressed: {
    backgroundColor: colors.brandText,
    borderColor: colors.brandText,
  },
  secondaryButtonPressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
});
