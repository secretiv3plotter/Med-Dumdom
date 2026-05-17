// A reusable dialog box component for confirmation prompts, form inputs, and error messages.
import { StyleSheet, Text, TextInput, View } from 'react-native';
import ActionButton from './ActionButton';
import { colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

export default function DialogBox({
  title = 'Are you Sure?',
  message = 'You are about to make changes.',
  fields = [],
  errorMessage = '',
  actions = [
    { label: 'Cancel', variant: 'outline' },
    { label: 'Save', variant: 'solid' },
  ],
}) {
  const normalizedActions = actions.map((action) => {
    const variant = action.variant === 'cancel' ? 'outline' : action.variant;
    return {
      ...action,
      variant: variant === 'confirm' ? 'solid' : variant,
    };
  });

  return (
    <View
      style={[
        styles.card,
        {
          paddingHorizontal: scaleLayoutValue(spacing.md),
          paddingVertical: scaleLayoutValue(spacing.md),
          gap: scaleLayoutValue(spacing.xs),
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={[styles.fieldsContainer, { gap: scaleLayoutValue(spacing.sm) }]}>
        {fields.map((field, index) => (
          <TextInput
            key={`${field.label || 'field'}-${index}`}
            value={field.value}
            onChangeText={field.onChangeText}
            placeholder={field.placeholder || ''}
            secureTextEntry={field.secureTextEntry || false}
            keyboardType={field.keyboardType || 'default'}
            style={[
              styles.input,
              {
                paddingHorizontal: scaleLayoutValue(spacing.sm),
                paddingVertical: scaleLayoutValue(spacing.sm),
              },
            ]}
            placeholderTextColor={colors.placeholder}
          />
        ))}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={[styles.actionsRow, { gap: scaleLayoutValue(spacing.sm) }]}>
        {normalizedActions.map((action, index) => (
          <View key={`${action.label || 'action'}-${index}`} style={styles.actionSlot}>
            <ActionButton
              label={action.label}
              onPress={action.onPress}
              variant={action.variant || 'solid'}
              disabled={action.disabled}
              style={[styles.actionButton, action.style]}
              pressedStyle={action.pressedStyle}
              textStyle={[
                styles.actionButtonText,
                action.variant === 'outline'
                  ? styles.outlineActionButtonText
                  : styles.solidActionButtonText,
                action.textStyle,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8EFF1',
    borderRadius: moderateScale(16),
  },
  title: {
    ...typography.titleSmall,
    color: colors.title,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    fontWeight: '400',
    color: colors.body,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  fieldsContainer: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    color: colors.body,
    outlineStyle: 'none',
  },
  errorText: {
    color: colors.error,
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  actionSlot: {
    flex: 1,
  },
  actionButton: {
    flex: 0,
    borderRadius: moderateScale(18),
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  outlineActionButtonText: {
    color: colors.brand,
  },
  solidActionButtonText: {
    color: colors.surface,
  },
});
