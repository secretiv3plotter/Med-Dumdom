import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { colors, spacing, typography } from '../../../shared/theme';
import { MedicineDetailsStep, MedicineScheduleStep, MedicineScheduleTypeStep } from './MedTrackerEditorSteps';
import { MEDICINE_EDITOR_STEPS } from '../constants/medTrackerEditorSteps';

export function MedTrackerEditorContent({
  editorMode,
  editorStep,
  selectedScheduleType,
  formState,
  units,
  onAddUnit,
  onDeleteUnit,
  scheduleDraft,
  scheduleEntries,
  editingScheduleIndex,
  formError,
  originalScheduleType,
  setFormState,
  setScheduleDraft,
  onSelectScheduleType,
  onCancelScheduleEdit,
  onSaveScheduleEntry,
  onSaveInlineScheduleEntry,
  onEditScheduleEntry,
  onDeleteScheduleEntry,
  onCancel,
  onPreviousStep,
  onNextStep,
  onSaveMedicine,
}) {
  const isDetailsStep = editorStep === MEDICINE_EDITOR_STEPS.DETAILS;
  const isScheduleTypeStep = editorStep === MEDICINE_EDITOR_STEPS.SCHEDULE_TYPE;
  const isHourly = selectedScheduleType === 'regular_hourly';
  const isWeeklyInterval = selectedScheduleType === 'regular_weekly';
  const isEveryWeeksInterval = selectedScheduleType === 'regular_every_weeks';
  const isMonthlyInterval = selectedScheduleType === 'regular_monthly';
  const isWeekly = selectedScheduleType === 'weekly';
  const isMonthly = selectedScheduleType === 'monthly';
  const stepTitle = isDetailsStep
    ? 'Medicine Details'
    : isScheduleTypeStep
      ? 'Schedule Type'
      : isHourly
        ? 'Hourly Schedule'
      : isWeeklyInterval
        ? 'Every Few Days Schedule'
      : isEveryWeeksInterval
        ? 'Weekly Interval Schedule'
      : isMonthlyInterval
        ? 'Monthly Interval Schedule'
      : isWeekly
        ? 'Weekly Schedule'
        : isMonthly
          ? 'Monthly Schedule'
          : 'Daily Schedule';

  return (
    <>
      <Text style={styles.stepTitle}>{stepTitle}</Text>

      {isDetailsStep ? (
        <MedicineDetailsStep formState={formState} setFormState={setFormState} units={units} onAddUnit={onAddUnit} onDeleteUnit={onDeleteUnit} />
      ) : isScheduleTypeStep ? (
        <MedicineScheduleTypeStep
          selectedScheduleType={selectedScheduleType}
          originalScheduleType={editorMode === 'edit' ? originalScheduleType : null}
          onSelectScheduleType={onSelectScheduleType}
        />
      ) : (
        <MedicineScheduleStep
          editorMode={editorMode}
          selectedScheduleType={selectedScheduleType}
          formState={formState}
          scheduleDraft={scheduleDraft}
          scheduleEntries={scheduleEntries}
          editingScheduleIndex={editingScheduleIndex}
          setFormState={setFormState}
          setScheduleDraft={setScheduleDraft}
          onCancelScheduleEdit={onCancelScheduleEdit}
          onSaveScheduleEntry={onSaveScheduleEntry}
          onSaveInlineScheduleEntry={onSaveInlineScheduleEntry}
          onEditScheduleEntry={onEditScheduleEntry}
          onDeleteScheduleEntry={onDeleteScheduleEntry}
        />
      )}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <View style={styles.footerActionsRow}>
        <ActionButton
          label="Cancel"
          accessibilityLabel={editorMode === 'edit' ? 'Cancel editing medicine' : 'Cancel adding medicine'}
          variant="outline"
          onPress={onCancel}
          style={styles.footerSecondaryButton}
        />
        {isDetailsStep ? (
          <ActionButton
            label="Next"
            accessibilityLabel="Go to medicine schedule type step"
            variant="solid"
            onPress={onNextStep}
            style={styles.footerPrimaryButton}
          />
        ) : isScheduleTypeStep ? (
          <>
            <ActionButton
              label="Back"
              accessibilityLabel="Go back to medicine details step"
              variant="outline"
              onPress={onPreviousStep}
              style={styles.footerSecondaryButton}
            />
            <ActionButton
              label="Next"
              accessibilityLabel="Go to medicine schedule entry step"
              variant="solid"
              onPress={onNextStep}
              style={styles.footerPrimaryButton}
            />
          </>
        ) : (
          <>
            <ActionButton
              label="Back"
              accessibilityLabel="Go back to medicine schedule type step"
              variant="outline"
              onPress={onPreviousStep}
              style={styles.footerSecondaryButton}
            />
            <ActionButton
              label={editorMode === 'edit' ? 'Save Medicine' : 'Add Medicine'}
              accessibilityLabel={editorMode === 'edit' ? 'Save medicine changes' : 'Add medicine to tracker'}
              variant="solid"
              onPress={onSaveMedicine}
              style={styles.footerPrimaryButton}
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
  footerSecondaryButton: {
    flex: 1,
    minWidth: 100,
  },
  footerPrimaryButton: {
    flex: 1.6,
    minWidth: 140,
  },
});
