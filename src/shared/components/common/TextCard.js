//non-clickable card with text content

import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default function TextCard({
  title = '',
  body = '',
  footer = '',
  children,
  numberOfBodyLines = 0, // 0 = unlimited
  cardStyle,
  titleStyle,
  bodyStyle,
  footerStyle,
}) {
  return (
    <View style={[styles.card, cardStyle]}>
      {!!title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {!!body && (
        <Text style={[styles.body, bodyStyle]} numberOfLines={numberOfBodyLines || undefined}>
          {body}
        </Text>
      )}
      {!!footer && <Text style={[styles.footer, footerStyle]}>{footer}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
  },
  body: {
    ...typography.bodySmall,
    color: colors.body,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
});
