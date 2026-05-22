import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { APPOINTMENT_EDITOR_STEPS } from '../constants/apptTrackerEditorSteps';
import { startOfToday } from '../utils/apptTrackerUtils';

const APPOINTMENT_ACCENT = '#52B788';
const APPOINTMENT_ACCENT_SOFT = '#E9F8F1';
const APPOINTMENT_ACCENT_TEXT = '#1B6B4A';

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
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
          />
          <InputBar
            placeholder="Address"
            value={formState.address}
            onChangeText={(value) => setFormState((current) => ({ ...current, address: value }))}
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
          />
          <InputBar
            placeholder="Doctor name (optional)"
            value={formState.doctorName}
            onChangeText={(value) => setFormState((current) => ({ ...current, doctorName: value }))}
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
          />
          <InputBar
            placeholder="Contact number (optional)"
            value={formState.contactNumber}
            onChangeText={(value) => setFormState((current) => ({ ...current, contactNumber: value }))}
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
          />
          <InputBar
            placeholder="Notes"
            value={formState.note}
            onChangeText={(value) => setFormState((current) => ({ ...current, note: value }))}
            multiline
            numberOfLines={4}
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
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
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
            focusTextColor={APPOINTMENT_ACCENT_TEXT}
          />
          <NativeDateTimeField
            mode="time"
            label="Time scheduled"
            placeholder="Select appointment time"
            accessibilityLabel="Time scheduled"
            value={formState.timeSched}
            onChange={(value) => setFormState((current) => ({ ...current, timeSched: value }))}
            focusBorderColor={APPOINTMENT_ACCENT}
            focusBackgroundColor={APPOINTMENT_ACCENT_SOFT}
            focusTextColor={APPOINTMENT_ACCENT_TEXT}
          />
        </View>
      )}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <View style={styles.footerActionsRow}>
        <ActionButton
          label="Cancel"
          accessibilityLabel="Cancel adding appointment"
          variant="outline"
          onPress={onCancel}
          style={[styles.footerButton, styles.appointmentOutlineButton]}
          textStyle={styles.appointmentOutlineButtonText}
          pressedStyle={styles.appointmentOutlineButtonPressed}
        />
        {isDetailsStep ? (
          <ActionButton
            label="Next"
            accessibilityLabel="Go to appointment schedule step"
            variant="solid"
            onPress={onNextStep}
            style={[styles.footerButton, styles.appointmentSolidButton]}
            pressedStyle={styles.appointmentSolidButtonPressed}
          />
        ) : (
          <>
            <ActionButton
              label="Back"
              variant="outline"
              onPress={onPreviousStep}
              style={[styles.footerButton, styles.appointmentOutlineButton]}
              textStyle={styles.appointmentOutlineButtonText}
              pressedStyle={styles.appointmentOutlineButtonPressed}
            />
            <ActionButton
              label="Add Appointment"
              variant="solid"
              onPress={onSaveAppointment}
              style={[styles.footerButton, styles.appointmentSolidButton]}
              pressedStyle={styles.appointmentSolidButtonPressed}
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
  appointmentOutlineButton: {
    borderColor: APPOINTMENT_ACCENT,
  },
  appointmentOutlineButtonText: {
    color: '#1B6B4A',
  },
  appointmentOutlineButtonPressed: {
    backgroundColor: '#B7E4C7',
    borderColor: '#1B6B4A',
  },
  appointmentSolidButton: {
    backgroundColor: APPOINTMENT_ACCENT,
    borderColor: APPOINTMENT_ACCENT,
  },
  appointmentSolidButtonPressed: {
    backgroundColor: '#1B6B4A',
    borderColor: '#1B6B4A',
  },
});
