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
  const stepTitle = isDetailsStep
    ? 'Medicine Details'
    : isScheduleTypeStep
      ? 'Schedule Type'
      : 'Daily Schedule';

  return (
    <>
      <Text style={styles.stepTitle}>{stepTitle}</Text>

      {isDetailsStep ? (
        <MedicineDetailsStep formState={formState} setFormState={setFormState} units={units} onAddUnit={onAddUnit} onDeleteUnit={onDeleteUnit} />
      ) : isScheduleTypeStep ? (
        <MedicineScheduleTypeStep
          selectedScheduleType={selectedScheduleType}
          onSelectScheduleType={onSelectScheduleType}
        />
      ) : (
        <MedicineScheduleStep
          editorMode={editorMode}
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
        <ActionButton label="Cancel" variant="outline" onPress={onCancel} style={styles.footerButton} />
        {isDetailsStep ? (
          <ActionButton label="Next" variant="solid" onPress={onNextStep} style={styles.footerButton} />
        ) : isScheduleTypeStep ? (
          <>
            <ActionButton label="Back" variant="outline" onPress={onPreviousStep} style={styles.footerButton} />
            <ActionButton label="Next" variant="solid" onPress={onNextStep} style={styles.footerButton} />
          </>
        ) : (
          <>
            <ActionButton label="Back" variant="outline" onPress={onPreviousStep} style={styles.footerButton} />
            <ActionButton
              label={editorMode === 'edit' ? 'Save Medicine' : 'Add Medicine'}
              variant="solid"
              onPress={onSaveMedicine}
              style={styles.footerButton}
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
  footerButton: {
    flex: 1,
    minWidth: 100,
  },
});
