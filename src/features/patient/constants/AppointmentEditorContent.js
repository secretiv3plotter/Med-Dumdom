import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { APPOINTMENT_EDITOR_STEPS } from '../constants/apptTrackerEditorSteps';
import { startOfToday } from '../utils/apptTrackerUtils';

export function AppointmentEditorContent({
  editorStep,
  formState,
  setFormState,
  formError,
  onCancel,
  onPreviousStep,
  onNextStep,
  onSaveAppointment,
}) {
  const isDetailsStep = editorStep === APPOINTMENT_EDITOR_STEPS.DETAILS;
  const stepTitle = isDetailsStep ? 'Appointment Details' : 'Date and Time';

  return (
    <>
      <Text style={styles.stepTitle}>{stepTitle}</Text>

      {isDetailsStep ? (
        <View style={styles.formColumn}>
          <InputBar
            placeholder="Concern"
            value={formState.concern}
            onChangeText={(value) => setFormState((current) => ({ ...current, concern: value }))}
          />
          <InputBar
            placeholder="Address"
            value={formState.address}
            onChangeText={(value) => setFormState((current) => ({ ...current, address: value }))}
          />
          <InputBar
            placeholder="Doctor name (optional)"
            value={formState.doctorName}
            onChangeText={(value) => setFormState((current) => ({ ...current, doctorName: value }))}
          />
          <InputBar
            placeholder="Contact number (optional)"
            value={formState.contactNumber}
            onChangeText={(value) => setFormState((current) => ({ ...current, contactNumber: value }))}
          />
          <InputBar
            placeholder="Note (optional)"
            value={formState.note}
            onChangeText={(value) => setFormState((current) => ({ ...current, note: value }))}
            multiline
            numberOfLines={4}
          />
        </View>
      ) : (
        <View style={styles.scheduleBuilder}>
          <NativeDateTimeField
            label="Date scheduled"
            placeholder="Select appointment date"
            accessibilityLabel="Date scheduled"
            value={formState.dateSched}
            onChange={(value) => setFormState((current) => ({ ...current, dateSched: value }))}
            minimumDate={startOfToday()}
          />
          <NativeDateTimeField
            mode="time"
            label="Time scheduled"
            placeholder="Select appointment time"
            accessibilityLabel="Time scheduled"
            value={formState.timeSched}
            onChange={(value) => setFormState((current) => ({ ...current, timeSched: value }))}
          />
        </View>
      )}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <View style={styles.footerActionsRow}>
        <ActionButton label="Cancel" variant="outline" onPress={onCancel} style={styles.footerButton} />
        {isDetailsStep ? (
          <ActionButton label="Next" variant="solid" onPress={onNextStep} style={styles.footerButton} />
        ) : (
          <>
            <ActionButton label="Back" variant="outline" onPress={onPreviousStep} style={styles.footerButton} />
            <ActionButton
              label="Add Appointment"
              variant="solid"
              onPress={onSaveAppointment}
              style={styles.footerButton}
              preserveFontSize
            />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  stepTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  formColumn: {
    gap: spacing.sm,
  },
  scheduleBuilder: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.sm,
  },
  formError: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minWidth: 100,
  },
});
