//non-clickable card with text content
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

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
    <View
      style={[
        styles.card,
        {
          padding: scaleLayoutValue(spacing.md),
          gap: scaleLayoutValue(spacing.xs),
        },
        cardStyle,
      ]}
    >
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
    borderWidth: 1.5, // Crisp 1.5px border for maximum boundary definition
    borderColor: colors.border,
    borderRadius: radius.lg,
    // Soft shadow for premium visual depth
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
