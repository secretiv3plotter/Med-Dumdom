// A reusable user card component for displaying user information across screens.
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
  variant = 'dashboard',
  avatarContent,
  rightAccessory,
  showActions = false,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction = () => {},
  onSecondaryAction = () => {},
  cardStyle,
  rowStyle,
  leftStyle,
  textBlockStyle,
  nameStyle,
  subtitleStyle,
  detailsStyle,
}) {
  const variantStyles = VARIANT_STYLES[variant] || VARIANT_STYLES.dashboard;
  const showActionsRow = showActions && (primaryActionLabel || secondaryActionLabel);
  const resolvedAvatar =
    avatarContent ||
    (variant === 'dashboard' ? (
      <View style={variantStyles.avatar}>
        <Text style={variantStyles.avatarText}>{getInitials(name)}</Text>
      </View>
    ) : null);

  return (
    <View style={[variantStyles.card, cardStyle]}>
      <View style={[styles.row, rowStyle]}>
        <View style={[variantStyles.left, leftStyle]}>
          {resolvedAvatar}
          <View style={[variantStyles.textBlock, textBlockStyle]}>
            <Text style={[variantStyles.name, nameStyle]}>{name}</Text>
            {!!subtitle && <Text style={[variantStyles.subtitle, subtitleStyle]}>{subtitle}</Text>}
            {!!details && <Text style={[variantStyles.details, detailsStyle]}>{details}</Text>}
          </View>
        </View>
        {rightAccessory ? <View style={styles.right}>{rightAccessory}</View> : null}
      </View>

      {showActionsRow ? (
        <View style={styles.actionsRow}>
          {secondaryActionLabel ? (
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={onSecondaryAction}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {secondaryActionLabel}
              </Text>
            </Pressable>
          ) : null}

          {primaryActionLabel ? (
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={onPrimaryAction}
              accessibilityRole="button"
              accessibilityLabel={primaryActionLabel}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {primaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  right: {
    marginLeft: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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

const DASHBOARD_STYLES = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.brandText,
    fontWeight: '700',
    fontSize: 18,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: colors.brandText,
    fontWeight: '700',
    fontSize: 19,
  },
  subtitle: {
    color: colors.body,
    fontSize: 15,
    marginTop: 1,
  },
  details: {
    color: colors.bodyMuted,
    fontSize: 14,
    marginTop: 1,
  },
});

const LINK_STYLES = StyleSheet.create({
  card: {
    backgroundColor: '#F2F6FB',
    borderColor: '#0B5FFF',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.brandText,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.bodyMuted,
  },
  details: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.bodyMuted,
  },
});

const VARIANT_STYLES = {
  dashboard: DASHBOARD_STYLES,
  link: LINK_STYLES,
};
