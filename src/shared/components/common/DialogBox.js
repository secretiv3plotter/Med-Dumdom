// A reusable dialog box component for confirmation prompts, form inputs, and error messages.
import { StyleSheet, Text, TextInput, View } from 'react-native';
import ActionButton from './ActionButton';
import { colors, moderateScale, radius, spacing, typography } from '../../theme';

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
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.fieldsContainer}>
        {fields.map((field, index) => (
          <TextInput
            key={`${field.label || 'field'}-${index}`}
            value={field.value}
            onChangeText={field.onChangeText}
            placeholder={field.placeholder || ''}
            secureTextEntry={field.secureTextEntry || false}
            keyboardType={field.keyboardType || 'default'}
            style={styles.input}
            placeholderTextColor={colors.placeholder}
          />
        ))}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.actionsRow}>
        {normalizedActions.map((action, index) => (
          <View key={`${action.label || 'action'}-${index}`} style={styles.actionSlot}>
            <ActionButton
              label={action.label}
              onPress={action.onPress}
              variant={action.variant || 'solid'}
              disabled={action.disabled}
              style={styles.actionButton}
              textStyle={[
                styles.actionButtonText,
                action.variant === 'outline'
                  ? styles.outlineActionButtonText
                  : styles.solidActionButtonText,
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
    borderRadius: moderateScale(22),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'center',
  },
  message: {
    ...typography.titleSmall,
    fontWeight: '400',
    color: colors.body,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  fieldsContainer: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.body,
  },
  errorText: {
    color: colors.error,
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionSlot: {
    flex: 1,
  },
  actionButton: {
    flex: 0,
    borderRadius: moderateScale(26),
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  outlineActionButtonText: {
    color: colors.brand,
  },
  solidActionButtonText: {
    color: colors.surface,
  },
});
